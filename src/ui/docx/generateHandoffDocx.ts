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

export interface DocxGenerationResult {
  ok: boolean;
  errorMessage?: string;
}

export function downloadHandoffDocx(entries: UsageLogEntry[], designerName: string): DocxGenerationResult {
  try {
    const zip = new PizZip(base64ToUint8Array(HANDOFF_TEMPLATE_BASE64));
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    const now = new Date();

    const componentes = entries.flatMap((entry) =>
      entry.items.map((item) => ({
        tela: entry.screenName,
        componente: item.nodeName,
        tipo_marcacao: item.markupTypeLabel,
        verbalizacao: item.verbalization.length > 0 ? item.verbalization : "—",
        data_execucao: `${formatDatePtBr(new Date(entry.dateIso))} ${formatTimePtBr(new Date(entry.dateIso))}`
      }))
    );

    doc.render({
      data_geracao: formatDatePtBr(now),
      hora_geracao: formatTimePtBr(now),
      nome_designer: designerName || "Designer não identificado",
      componentes
    });

    const blob = doc.getZip().generate({
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
