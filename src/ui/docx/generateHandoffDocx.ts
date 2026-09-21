import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { UsageLogEntry } from "../../shared/types";
import { HANDOFF_TEMPLATE_BASE64 } from "./placeholderTemplateBase64";

/**
 * Gera o .docx de handoff a partir do histórico acumulado da página
 * (todas as execuções de "Gerar especificações" feitas até agora, não
 * só a última) e dispara o download no navegador.
 *
 * Roda inteiramente na UI (iframe do plugin) porque é aqui que existe
 * acesso a Blob/URL.createObjectURL/download — a sandbox do main
 * thread (code.ts) não tem essas APIs de navegador.
 *
 * `docx_geracao`/`hora_geracao`/`nome_designer` representam quando
 * ESTE arquivo foi exportado e por quem clicou em exportar — não a
 * data de cada execução individual (essa vai por linha, em
 * `data_execucao`). Ver a conversa com o usuário para essa decisão.
 */

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDatePtBr(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function formatTimePtBr(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function dateStampForFilename(date: Date): string {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}-${pad2(date.getHours())}${pad2(
    date.getMinutes()
  )}`;
}

/**
 * HYPERLINK DE VERDADE NO .DOCX
 * -----------------------------
 * O módulo de hyperlink da comunidade para docxtemplater
 * ("docxtemplater-link-module") só funciona na versão 2 da biblioteca
 * — quebra na v3 (a que este projeto usa; confirmado em issue oficial
 * do próprio docxtemplater). Em vez disso, usamos um recurso NATIVO e
 * GRATUITO do docxtemplater v3: a tag "raw XML" (`{@campo}`, módulo
 * "rawxml", incluído no core — não é um módulo pago), que insere XML
 * literal no lugar da tag, em vez de texto escapado.
 *
 * Isso resolve metade do problema (colocar o `<w:hyperlink>` no
 * texto) — a outra metade é que um hyperlink em .docx também precisa
 * de uma entrada em `word/_rels/document.xml.rels` (é ali que o Word
 * associa o "r:id" do link com a URL de verdade). O docxtemplater não
 * mexe nesse arquivo sozinho, então fazemos isso manualmente depois
 * do render, direto no PizZip (ver `injectHyperlinkRelationships`).
 */

function escapeXmlText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function runXml(text: string): string {
  return `<w:r><w:t xml:space="preserve">${escapeXmlText(text)}</w:t></w:r>`;
}

function hyperlinkRunXml(relationshipId: string, text: string): string {
  return (
    `<w:hyperlink r:id="${relationshipId}" w:history="1">` +
    `<w:r><w:rPr><w:rStyle w:val="Hyperlink"/><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr>` +
    `<w:t xml:space="preserve">${escapeXmlText(text)}</w:t></w:r></w:hyperlink>`
  );
}

/**
 * Monta o XML de um parágrafo de verbalização, trocando cada trecho
 * de `links` (que precisa aparecer EXATAMENTE dentro do texto) por um
 * hyperlink de verdade — o resto do texto vira runs normais,
 * devidamente escapados. `registerLink` é chamado pra cada link
 * realmente usado, e devolve o "r:id" que deve referenciar.
 */
function buildVerbalizacaoRunsXml(
  text: string,
  links: Array<{ text: string; url: string }> | undefined,
  registerLink: (url: string) => string
): string {
  if (!links || links.length === 0) {
    return runXml(text);
  }

  // Localiza, na string, todas as ocorrências dos textos de link
  // configurados, na ordem em que aparecem — para poder intercalar
  // texto normal e hyperlink corretamente.
  type Match = { start: number; end: number; url: string; text: string };
  const matches: Match[] = [];
  for (const link of links) {
    const index = text.indexOf(link.text);
    if (index !== -1) {
      matches.push({ start: index, end: index + link.text.length, url: link.url, text: link.text });
    }
  }
  if (matches.length === 0) {
    return runXml(text);
  }
  matches.sort((a, b) => a.start - b.start);

  let xml = "";
  let cursor = 0;
  for (const match of matches) {
    if (match.start > cursor) {
      xml += runXml(text.slice(cursor, match.start));
    }
    const relationshipId = registerLink(match.url);
    xml += hyperlinkRunXml(relationshipId, match.text);
    cursor = match.end;
  }
  if (cursor < text.length) {
    xml += runXml(text.slice(cursor));
  }
  return xml;
}

/**
 * Depois que o docxtemplater já renderizou o documento (com os
 * `<w:hyperlink r:id="rIdX">` já no texto), adiciona as entradas de
 * relacionamento correspondentes em `word/_rels/document.xml.rels` —
 * sem isso, o Word não sabe pra qual URL cada "r:id" aponta, e o link
 * não funciona (ou o arquivo fica corrompido aos olhos do Word).
 */
function injectHyperlinkRelationships(zip: PizZip, relationships: Map<string, string>): void {
  if (relationships.size === 0) return;

  const relsPath = "word/_rels/document.xml.rels";
  const existing = zip.file(relsPath);
  const entries = Array.from(relationships.entries())
    .map(
      ([url, id]) =>
        `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXmlText(
          url
        )}" TargetMode="External"/>`
    )
    .join("");

  if (existing) {
    const currentXml = existing.asText();
    const updatedXml = currentXml.replace("</Relationships>", `${entries}</Relationships>`);
    zip.file(relsPath, updatedXml);
  } else {
    // Raro (a maioria dos .docx já tem esse arquivo, nem que seja só
    // com a relação dos estilos) — mas criamos do zero se faltar.
    const freshXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${entries}</Relationships>`;
    zip.file(relsPath, freshXml);
  }
}

export interface DocxGenerationResult {
  ok: boolean;
  errorMessage?: string;
}

export function downloadHandoffDocx(entries: UsageLogEntry[], designerName: string): DocxGenerationResult {
  try {
    const zip = new PizZip(base64ToUint8Array(HANDOFF_TEMPLATE_BASE64));
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    const now = new Date();

    // Registro de relações de hyperlink: uma por URL única usada,
    // reaproveitando o mesmo r:id se a mesma URL aparecer em mais de
    // um componente. IDs começam em 9000 pra reduzir a chance de
    // colidir com relações que já existem no template (fontes,
    // imagens, estilos etc.).
    const relationshipIdByUrl = new Map<string, string>();
    let nextRelationshipNumber = 9000;
    function registerLink(url: string): string {
      const existingId = relationshipIdByUrl.get(url);
      if (existingId) return existingId;
      const id = `rIdHandoff${nextRelationshipNumber}`;
      nextRelationshipNumber += 1;
      relationshipIdByUrl.set(url, id);
      return id;
    }

    const componentes = entries.flatMap((entry) =>
      entry.items.map((item) => {
        const verbalizacaoText = item.verbalization.length > 0 ? item.verbalization : "—";
        return {
          tela: entry.screenName,
          componente: item.nodeName,
          tipo_marcacao: item.markupTypeLabel,
          verbalizacao: buildVerbalizacaoRunsXml(verbalizacaoText, item.links, registerLink),
          data_execucao: `${formatDatePtBr(new Date(entry.dateIso))} ${formatTimePtBr(new Date(entry.dateIso))}`
        };
      })
    );

    doc.render({
      data_geracao: formatDatePtBr(now),
      hora_geracao: formatTimePtBr(now),
      nome_designer: designerName || "Designer não identificado",
      componentes
    });

    const renderedZip = doc.getZip();
    injectHyperlinkRelationships(renderedZip, relationshipIdByUrl);

    const blob = renderedZip.generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }) as Blob;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `especificacao-handoff-${dateStampForFilename(now)}.docx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    return { ok: true };
  } catch (error) {
    console.error("Falha ao gerar o docx de handoff:", error);
    return {
      ok: false,
      errorMessage: "Não foi possível gerar o documento. Verifique o template e tente de novo."
    };
  }
}
