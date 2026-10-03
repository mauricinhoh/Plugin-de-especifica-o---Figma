/**
 * Link pré-preenchido do Microsoft Forms "Tagueamento: Nova region/subregion"
 * (TAGUEAMENTO_SPEC.md, seção 9). Usado quando o PD escolhe "Outro" no setup.
 *
 * PENDENTE (Mau): o link modelo com o ID de cada pergunta. Enquanto
 * FORMS_PREFILL_TEMPLATE estiver vazio, o plugin avisa "link do Forms ainda
 * não configurado" e o setup segue normalmente com o valor digitado.
 *
 * Como configurar quando o link chegar:
 *  1. No Forms, gere o link pré-preenchido preenchendo cada campo com o
 *     marcador correspondente abaixo (ex.: no campo Canal, escreva {canal}).
 *  2. Cole o link inteiro em FORMS_PREFILL_TEMPLATE.
 *  O plugin troca cada marcador pelo valor real (com encodeURIComponent).
 */

export const FORMS_PREFILL_TEMPLATE = "";

export interface FormsPayload {
  canal: string;
  produto: string;
  tarefa: string;
  region: string;
  subregion: string;
  /** figma.root.name */
  arquivoFigma: string;
}

const PLACEHOLDERS: Record<keyof FormsPayload, string> = {
  canal: "{canal}",
  produto: "{produto}",
  tarefa: "{tarefa}",
  region: "{region}",
  subregion: "{subregion}",
  arquivoFigma: "{arquivo}"
};

export function isFormsConfigured(): boolean {
  return FORMS_PREFILL_TEMPLATE.trim().length > 0;
}

/** Monta o link pré-preenchido, ou null quando o link modelo ainda não foi configurado. */
export function buildFormsUrl(payload: FormsPayload): string | null {
  if (!isFormsConfigured()) return null;
  let url = FORMS_PREFILL_TEMPLATE;
  for (const [field, placeholder] of Object.entries(PLACEHOLDERS) as [keyof FormsPayload, string][]) {
    // O marcador pode estar cru ({canal}) ou já codificado pelo navegador (%7Bcanal%7D).
    const encodedPlaceholder = encodeURIComponent(placeholder);
    const value = encodeURIComponent(payload[field]);
    url = url.split(placeholder).join(value).split(encodedPlaceholder).join(value);
  }
  return url;
}

export const FORMS_GUIDANCE =
  "Confira e clique em Enviar no formulário. Se aparecer o aviso de rascunho, escolha Novo rascunho.";
