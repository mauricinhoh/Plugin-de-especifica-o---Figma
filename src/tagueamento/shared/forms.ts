/**
 * Link pré-preenchido do Microsoft Forms "Tagueamento: Nova region/subregion"
 * (TAGUEAMENTO_SPEC.md, seção 9). Usado quando o PD escolhe "Outro" no
 * Produto ou no Fluxo do setup.
 *
 * Link modelo enviado pelo Mau em 03/10/2026 e corrigido em 04/10/2026 (duas
 * letras I/l trocadas no id). Cada pergunta do Forms tem um
 * código (parâmetro "r…" na URL); o plugin troca o valor de cada um, só com
 * texto (ver toFormsText).
 *
 * Ordem confirmada pelo Mau em 04/10/2026 (placeholders do link modelo):
 * Canal ("Teste_onze"), Produto ("Teste_tres"), Tarefa do usuário
 * ("Teste_quarto"), Region ("Teste_cinco"), Subregion ("Teste_seis"),
 * Arquivo Figma ("Teste_sete").
 */

export const FORMS_BASE_URL =
  "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=TJYjMh9uuki3BUIzUSgajG227yoCw7RAhsNy6TP6BKRUMzNDODlKRkEzRFJGMU5KUENIUTU1STk2RS4u";

export interface FormsPayload {
  canal: string;
  produto: string;
  tarefa: string;
  region: string;
  subregion: string;
  /** figma.root.name */
  arquivoFigma: string;
}

/** Código de cada pergunta do Forms (ordem do link modelo). */
export const FORMS_FIELDS: Record<keyof FormsPayload, string> = {
  canal: "r6b4cceb9e8b84253a08f0119800fc2ad",
  produto: "r15f0c237c63e4ac7976d5b28cb5493e2",
  tarefa: "r96e7b82031334078b4a86ef1c0b182a4",
  region: "r9f84909f1e41481f8f6629dffc4500ac",
  subregion: "r1d48e7b031cf491184a8bf8d490eec11",
  arquivoFigma: "r194c6f98f52b454d8d04bc2cc0c243ce"
};

const FIELD_ORDER: (keyof FormsPayload)[] = ["canal", "produto", "tarefa", "region", "subregion", "arquivoFigma"];

export function isFormsConfigured(): boolean {
  return FORMS_BASE_URL.trim().length > 0 && FIELD_ORDER.every((field) => FORMS_FIELDS[field]);
}

/**
 * Valor do link "só texto" (decisão do Mau, 04/10/2026): sem acento, sem
 * espaço e sem símbolo, para o link não ter códigos como %20. Espaço e
 * qualquer símbolo viram "_" ("App Sicredi" → "App_Sicredi").
 */
export function toFormsText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Monta o link pré-preenchido, ou null quando o Forms não está configurado.
 * Formato igual ao link modelo do Forms (corrigido pelo Mau em 04/10/2026):
 * código=valor, sem aspas.
 */
export function buildFormsUrl(payload: FormsPayload): string | null {
  if (!isFormsConfigured()) return null;
  const params = FIELD_ORDER.map((field) => `${FORMS_FIELDS[field]}=${toFormsText(payload[field])}`).join("&");
  return `${FORMS_BASE_URL}&${params}`;
}

export const FORMS_GUIDANCE =
  "Confira e clique em Enviar no formulário. Se aparecer o aviso de rascunho, escolha Novo rascunho.";
