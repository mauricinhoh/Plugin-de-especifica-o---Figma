/**
 * Link pré-preenchido do Microsoft Forms "Tagueamento: Nova region/subregion"
 * (TAGUEAMENTO_SPEC.md, seção 9). Usado quando o PD escolhe "Outro" no
 * Produto ou no Fluxo do setup.
 *
 * Link modelo enviado pelo Mau em 03/10/2026. Cada pergunta do Forms tem um
 * código (parâmetro "r…" na URL); o plugin troca o valor de cada um, com
 * encodeURIComponent.
 *
 * ATENÇÃO — A CONFIRMAR NO TESTE: a ligação código → pergunta abaixo segue a
 * ORDEM dos parâmetros no link (que se supõe ser a ordem das perguntas do
 * formulário: Canal, Produto, Tarefa do usuário, Region, Subregion, Arquivo
 * Figma). Se no teste algum valor cair na pergunta errada, basta trocar os
 * códigos de lugar em FORMS_FIELDS.
 */

export const FORMS_BASE_URL =
  "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=TJYjMh9uuki3BUlzUSgajG227yoCw7RAhsNy6TP6BKRUMzNDODIKRkEzRFJGMU5KUENIUTU1STk2RS4u";

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

/** Monta o link pré-preenchido, ou null quando o Forms não está configurado. */
export function buildFormsUrl(payload: FormsPayload): string | null {
  if (!isFormsConfigured()) return null;
  const params = FIELD_ORDER.map((field) => `${FORMS_FIELDS[field]}=${encodeURIComponent(payload[field])}`).join("&");
  return `${FORMS_BASE_URL}&${params}`;
}

export const FORMS_GUIDANCE =
  "Confira e clique em Enviar no formulário. Se aparecer o aviso de rascunho, escolha Novo rascunho.";
