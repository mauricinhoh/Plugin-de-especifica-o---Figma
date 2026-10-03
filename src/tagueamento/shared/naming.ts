/**
 * Normalização de nomenclatura do TAGUEAMENTO (TAGUEAMENTO_SPEC.md, seção 6).
 *
 * Fase 3: passos 1 a 8 do algoritmo da seção 6.2 — usados no "Outro" do
 * setup. A Fase 5 acrescenta o passo 9 (dicionário de termos em inglês e
 * sinalizações) e aplica a normalização aos demais parâmetros.
 *
 * Regras (6.1):
 *  - Region: tudo maiúsculo, sem acento, underscore (AREA_NAO_LOGADA).
 *  - Subregion: primeira letra maiúscula, sem acento, underscore (Login_condicional); aceita N/A.
 *  - Demais parâmetros: primeira letra maiúscula, sem acento, underscore.
 *  - Números por extenso e sem acento, nunca dígitos (3 → Tres).
 *  - Máximo de 100 caracteres; nenhum caractere especial além de "_".
 *
 * Funções puras (sem `figma`, sem DOM): podem rodar na UI e no main thread.
 */

export const MAX_VALUE_LENGTH = 100;

const UNITS = ["zero", "um", "dois", "tres", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const TEENS = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const HUNDREDS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos"
];

function belowThousand(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) parts.push(HUNDREDS[hundreds]);
  if (rest > 0) {
    if (rest < 10) parts.push(UNITS[rest]);
    else if (rest < 20) parts.push(TEENS[rest - 10]);
    else {
      const tens = Math.floor(rest / 10);
      const units = rest % 10;
      parts.push(units > 0 ? `${TENS[tens]} e ${UNITS[units]}` : TENS[tens]);
    }
  }
  return parts.join(" e ");
}

/**
 * Número inteiro por extenso, em português e sem acento (0 a 999.999.999).
 * Fora disso, devolve os dígitos (o passo 5 do algoritmo não os remove, e a
 * revisão da Fase 5 sinaliza).
 */
export function numberToWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999_999_999) return String(n);
  if (n === 0) return UNITS[0];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const groups: string[] = [];
  if (millions > 0) groups.push(millions === 1 ? "um milhao" : `${belowThousand(millions)} milhoes`);
  if (thousands > 0) groups.push(thousands === 1 ? "mil" : `${belowThousand(thousands)} mil`);
  if (rest > 0) groups.push(belowThousand(rest));
  // "mil e cem", "dois mil e trinta": usa "e" antes do último grupo quando ele é < 100 ou centena exata.
  if (groups.length > 1 && rest > 0 && (rest < 100 || rest % 100 === 0)) {
    const last = groups.pop() as string;
    return `${groups.join(" ")} e ${last}`;
  }
  return groups.join(" ");
}

function removeAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Corta em `max` caracteres, preferindo cortar logo antes de um underscore. */
function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastUnderscore = cut.lastIndexOf("_");
  return (lastUnderscore > 0 ? cut.slice(0, lastUnderscore) : cut).replace(/_+$/, "");
}

/** Passos 1 a 6 da seção 6.2 (sem a caixa e sem o corte). */
function baseNormalize(text: string): string {
  let value = text.trim(); // 1
  value = value.replace(/\d+/g, (digits) => ` ${numberToWords(Number(digits))} `); // 2
  value = removeAccents(value); // 3 (ç → c também sai aqui)
  value = value.replace(/[\s-]+/g, "_"); // 4
  value = value.replace(/[^A-Za-z0-9_]/g, ""); // 5
  value = value.replace(/_+/g, "_").replace(/^_+|_+$/g, ""); // 6
  return value;
}

/** Region: tudo maiúsculo. "Área não logada" → "AREA_NAO_LOGADA". */
export function normalizeRegion(text: string): string {
  return truncate(baseNormalize(text).toUpperCase(), MAX_VALUE_LENGTH);
}

/** Demais parâmetros: primeira letra maiúscula, resto minúsculo. "Tentar novamente" → "Tentar_novamente". */
export function normalizeParam(text: string): string {
  const value = baseNormalize(text).toLowerCase();
  const cased = value.charAt(0).toUpperCase() + value.slice(1);
  return truncate(cased, MAX_VALUE_LENGTH);
}

/** Subregion: como os demais parâmetros, mas aceita "N/A" (em qualquer caixa). */
export function normalizeSubregion(text: string): string {
  if (text.trim().toUpperCase() === "N/A") return "N/A";
  return normalizeParam(text);
}
