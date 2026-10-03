/**
 * Normalização de nomenclatura do TAGUEAMENTO (TAGUEAMENTO_SPEC.md, seção 6).
 *
 * Fase 3: passos 1 a 8 do algoritmo da seção 6.2.
 * Fase 5: passo 9 — dicionário de termos em inglês (ver dicionario.ts):
 * troca os conhecidos e sinaliza os da lista SINALIZAR. `normalizeWithReport`
 * devolve o valor e o que foi trocado/sinalizado, para a revisão mostrar ao PD.
 *
 * Só vale para textos da tela e digitados pelo PD — nunca para os valores do
 * Excel de regions (já validados; decisão do Mau, 03/10/2026).
 *
 * Regras (6.1):
 *  - Region: tudo maiúsculo, sem acento, underscore (AREA_NAO_LOGADA).
 *  - Subregion: primeira letra maiúscula, sem acento, underscore (Login_condicional); aceita N/A.
 *  - Demais parâmetros: primeira letra maiúscula, sem acento, underscore.
 *  - Números por extenso e sem acento, nunca dígitos (3 → Tres).
 *  - Máximo de 100 caracteres; nenhum caractere especial além de "_".
 *  - Sem termos em inglês: troca pelo dicionário; desconhecidos da lista SINALIZAR viram pendência.
 *
 * Funções puras (sem `figma`, sem DOM): podem rodar na UI e no main thread.
 */

import { MANTER, SINALIZAR, TRADUCOES } from "./dicionario";

export const MAX_VALUE_LENGTH = 100;

export type NamingKind = "region" | "subregion" | "param";

export interface NamingReport {
  value: string;
  /** Termos em inglês trocados pelo dicionário (ex.: { de: "Search", para: "Buscar" }). */
  trocas: { de: string; para: string }[];
  /** Termos da lista SINALIZAR encontrados (não trocados). */
  sinalizados: string[];
  /** true quando o valor passou de 100 caracteres e foi cortado. */
  cortado: boolean;
}

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
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Padrão de palavra inteira, sem diferenciar caixa; os espaços da expressão aceitam espaço, "_" ou "-". */
function wordPattern(term: string): RegExp {
  const body = removeAccents(term).trim().split(/\s+/).map(escapeRegExp).join("[\\s_-]+");
  return new RegExp("(^|[^A-Za-z0-9])(" + body + ")(?=$|[^A-Za-z0-9])", "gi");
}

const MANTER_KEYS = new Set(MANTER.map((term) => removeAccents(term).toLowerCase()));

// Expressões mais longas primeiro ("Sign in" antes de "Sign"); termos de MANTER nunca são trocados.
const TRANSLATIONS = TRADUCOES.filter(([en]) => !MANTER_KEYS.has(removeAccents(en).toLowerCase()))
  .sort((a, b) => b[0].length - a[0].length)
  .map(([en, pt]) => ({ en, pt, pattern: wordPattern(en) }));

const FLAGS = SINALIZAR.filter((term) => !MANTER_KEYS.has(removeAccents(term).toLowerCase())).map((term) => ({
  term,
  pattern: wordPattern(term)
}));

/** Passo 9, aplicado sobre o texto ainda legível (antes da formatação). */
function applyDictionary(text: string): { text: string; trocas: NamingReport["trocas"]; sinalizados: string[] } {
  let result = removeAccents(text);
  const trocas: NamingReport["trocas"] = [];
  for (const { pt, pattern } of TRANSLATIONS) {
    pattern.lastIndex = 0;
    result = result.replace(pattern, (_match: string, before: string, found: string) => {
      trocas.push({ de: found, para: pt });
      return before + pt;
    });
  }
  const sinalizados: string[] = [];
  for (const { term, pattern } of FLAGS) {
    pattern.lastIndex = 0;
    if (pattern.test(result)) sinalizados.push(term);
  }
  return { text: result, trocas, sinalizados };
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

/**
 * Normaliza com relatório (passos 1 a 9). Region: tudo maiúsculo; Subregion:
 * aceita "N/A"; demais: primeira letra maiúscula, resto minúsculo (passo 7);
 * máximo de 100 caracteres (passo 8).
 */
export function normalizeWithReport(text: string, kind: NamingKind): NamingReport {
  if (kind === "subregion" && text.trim().toUpperCase() === "N/A") {
    return { value: "N/A", trocas: [], sinalizados: [], cortado: false };
  }
  const dictionary = applyDictionary(text);
  const base = baseNormalize(dictionary.text);
  let cased: string;
  if (kind === "region") {
    cased = base.toUpperCase();
  } else {
    const lower = base.toLowerCase();
    cased = lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  const value = truncate(cased, MAX_VALUE_LENGTH);
  return { value, trocas: dictionary.trocas, sinalizados: dictionary.sinalizados, cortado: value.length < cased.length };
}

/** Region: tudo maiúsculo. "Área não logada" → "AREA_NAO_LOGADA". */
export function normalizeRegion(text: string): string {
  return normalizeWithReport(text, "region").value;
}

/** Demais parâmetros: primeira letra maiúscula, resto minúsculo. "Tentar novamente" → "Tentar_novamente". */
export function normalizeParam(text: string): string {
  return normalizeWithReport(text, "param").value;
}

/** Subregion: como os demais parâmetros, mas aceita "N/A" (em qualquer caixa). */
export function normalizeSubregion(text: string): string {
  return normalizeWithReport(text, "subregion").value;
}

/** Textos curtos para o PD: notas (trocas feitas) e pendências (sinalizados, corte). */
export function describeReport(report: NamingReport): { notas: string[]; pendencias: string[] } {
  const notas = report.trocas.map((troca) => `Termo em inglês trocado: "${troca.de}" → ${troca.para.replace(/ /g, "_")}`);
  const pendencias = report.sinalizados.map((term) => `Termo em inglês sem tradução: "${term}" — revise`);
  if (report.cortado) pendencias.push(`Valor cortado em ${MAX_VALUE_LENGTH} caracteres — revise`);
  return { notas, pendencias };
}
