/**
 * Regras da REVISÃO do tagueamento (Fase 6; spec seções 5, 7.2 e 8).
 * Funções puras, usadas pela UI.
 *
 * Decisões do Mau (03/10/2026):
 *  - Region e subregion vêm do setup e são só leitura na revisão.
 *  - Pendência BLOQUEIA a geração: enquanto houver pendência, os cards não são gerados.
 *  - Toggle de parâmetro opcional: liga se o campo for preenchido (inclusive a do grupo message).
 *  - Evento manual: selecionar o elemento → escolher o evento → Adicionar (entra no fim).
 *  - Numeração: card de tela = 1, componentes na ordem espacial, manuais no fim.
 *
 * O que conta como pendência:
 *  - campo obrigatório do evento (sem "*" no card) vazio ou com placeholder "<…>";
 *  - componente não reconhecido ainda não confirmado;
 *  - termo em inglês sinalizado ou valor cortado em 100 caracteres, até editar ou "Manter assim".
 */

import { GA_EVENTS, GaEventKey } from "./gaCard";
import { NamingReport, normalizeWithReport } from "./naming";
import { Plataforma } from "./types";

/** Campos que vêm do setup (só leitura na revisão). */
export const SETUP_FIELDS = ["region", "subregion"];

const APP_ONLY = ["firebase_screen", "firebase_previous_screen", "target_screen"];
const WEB_ONLY = ["page_name", "previous_page", "target_page"];

export interface EventFields {
  /** Obrigatórios (sem "*"), na ordem do card. */
  required: string[];
  /** Opcionais ("*" no card), na ordem do card. */
  optional: string[];
}

/** Eventos que o PD pode escolher num item de componente (o card de tela é fixo). */
export const COMPONENT_EVENTS: GaEventKey[] = [
  "select_content",
  "modal_view",
  "feedback",
  "search",
  "login",
  "transaction",
  "refresh",
  "conversion"
];

/** Eventos sugeridos no "Adicionar evento manual" (spec 4.4), na ordem. */
export const MANUAL_EVENTS: GaEventKey[] = ["login", "transaction", "refresh", "conversion", "select_content", "modal_view", "feedback", "search"];

/**
 * Campos do evento para o canal escolhido. Nos eventos compartilhados, a
 * linha do outro canal sai (ela fica oculta no card). Exceção: select_content
 * só tem "previous_page" no card, nos dois canais.
 */
export function fieldsFor(evento: string, plataforma: Plataforma): EventFields {
  const schema = GA_EVENTS.find((event) => event.key === evento);
  if (!schema) return { required: [], optional: [] };
  const hidden = plataforma === "APP" ? WEB_ONLY : APP_ONLY;
  const fields: EventFields = { required: [], optional: [] };
  for (const param of schema.params) {
    const optional = param.endsWith("*");
    const name = param.replace(/\*/g, "");
    const keep = evento === "select_content" && name === "previous_page" ? true : !hidden.includes(name);
    if (!keep) continue;
    (optional ? fields.optional : fields.required).push(name);
  }
  return fields;
}

export function isEmptyValue(value: string | undefined): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  return trimmed === "" || (trimmed.startsWith("<") && trimmed.endsWith(">"));
}

/** Estado de um item na revisão. */
export interface ReviewItem {
  /** Identificador estável dentro da revisão. */
  key: string;
  nodeId: string;
  componente: string;
  label: string | null;
  evento: string;
  origem: "tela" | "componente" | "manual";
  values: Record<string, string>;
  /** Notas do dicionário por campo (ex.: "Search" → Buscar). */
  notes: Record<string, string[]>;
  /** Termos sinalizados / corte por campo, ainda não aceitos. */
  flags: Record<string, { sinalizados: string[]; cortado: boolean }>;
  naoReconhecido: boolean;
  /** PD confirmou o evento de um componente não reconhecido. */
  confirmado: boolean;
  /** Componente dentro de Modal/Drawer (local_type padrão = Modal). */
  insideModal: boolean;
}

export interface Pendencia {
  /** Campo relacionado (para destacar), quando houver. */
  field?: string;
  texto: string;
  /** "confirmar" = botão Confirmar; "manter" = botão Manter assim. */
  acao?: "confirmar" | "manter";
}

export function pendenciasOf(item: ReviewItem, plataforma: Plataforma): Pendencia[] {
  const list: Pendencia[] = [];
  if (item.naoReconhecido && !item.confirmado) {
    list.push({ texto: `Componente não reconhecido: confirme se é mesmo ${item.evento}`, acao: "confirmar" });
  }
  const { required } = fieldsFor(item.evento, plataforma);
  for (const field of required) {
    if (SETUP_FIELDS.includes(field)) continue;
    if (isEmptyValue(item.values[field])) list.push({ field, texto: `Preencha ${field}` });
  }
  for (const [field, flag] of Object.entries(item.flags)) {
    for (const term of flag.sinalizados) {
      list.push({ field, texto: `${field}: termo em inglês sem tradução ("${term}")`, acao: "manter" });
    }
    if (flag.cortado) list.push({ field, texto: `${field}: valor cortado em 100 caracteres`, acao: "manter" });
  }
  return list;
}

/** Normaliza um valor digitado pelo PD (ao sair do campo). */
export function normalizeTyped(value: string): NamingReport {
  return normalizeWithReport(value, "param");
}

export interface ScreenContext {
  plataforma: Plataforma;
  nomeTela: string;
  /** Tela anterior (seta do protótipo) ou null. */
  telaAnterior: string | null;
  region: string;
  subregion: string;
  /** Item dentro de Modal/Drawer (só para select_content). */
  insideModal?: boolean;
}

/**
 * Valores que o plugin já sabe para um evento, a partir do contexto da tela.
 * Usado ao trocar o evento e ao adicionar um evento manual.
 */
export function defaultsFor(evento: string, context: ScreenContext): Record<string, string> {
  const values: Record<string, string> = { region: context.region, subregion: context.subregion };
  const screenKey = context.plataforma === "APP" ? "firebase_screen" : "page_name";
  const previousKey = context.plataforma === "APP" ? "firebase_previous_screen" : "previous_page";
  const { required, optional } = fieldsFor(evento, context.plataforma);
  const all = [...required, ...optional];
  if (all.includes(screenKey) && evento !== "modal_view") values[screenKey] = context.nomeTela;
  if (evento === "modal_view" && context.plataforma === "APP") values.firebase_screen = context.nomeTela;
  if (all.includes(previousKey) && context.telaAnterior) values[previousKey] = context.telaAnterior;
  if (evento === "select_content") {
    values.action = "Click";
    values.local_name = context.nomeTela;
    values.local_type = context.insideModal ? "Modal" : "Screen";
    if (context.telaAnterior) values.previous_page = context.telaAnterior;
  }
  return values;
}

/**
 * Troca o evento de um item: mantém os valores dos campos que continuam
 * existindo e completa com os defaults do novo evento.
 */
export function changeEvent(item: ReviewItem, evento: string, context: ScreenContext): ReviewItem {
  const { required, optional } = fieldsFor(evento, context.plataforma);
  const allowed = new Set([...required, ...optional]);
  const defaults = defaultsFor(evento, context);
  const values: Record<string, string> = {};
  for (const field of allowed) {
    const kept = item.values[field];
    if (kept !== undefined && !isEmptyValue(kept)) values[field] = kept;
    else if (defaults[field] !== undefined) values[field] = defaults[field];
  }
  const notes: ReviewItem["notes"] = {};
  const flags: ReviewItem["flags"] = {};
  for (const field of Object.keys(values)) {
    if (item.notes[field]) notes[field] = item.notes[field];
    if (item.flags[field]) flags[field] = item.flags[field];
  }
  // Trocar o evento conta como decisão do PD sobre um componente não reconhecido.
  return { ...item, evento, values, notes, flags, confirmado: item.naoReconhecido ? true : item.confirmado };
}
