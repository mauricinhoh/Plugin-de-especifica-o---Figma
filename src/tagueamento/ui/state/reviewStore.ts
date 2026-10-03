/**
 * Estado da revisão do tagueamento (Fase 6). Fica só na memória enquanto o
 * plugin está aberto; a geração (Fase 7) grava o resultado no arquivo.
 */

import { GenerationRequest, MappingResult, Plataforma, SetupSelection } from "../../shared/types";
import { describeReport, normalizeWithReport } from "../../shared/naming";
import { changeEvent, defaultsFor, fieldsFor, pendenciasOf, ReviewItem, ScreenContext, SETUP_FIELDS } from "../../shared/review";

export interface ReviewScreen {
  frameId: string;
  frameName: string;
  nomeTela: string;
  telaAnterior: string | null;
  origens: string[];
  destinos: string[];
  avisos: string[];
  items: ReviewItem[];
}

export interface ReviewState {
  plataforma: Plataforma;
  region: string;
  subregion: string;
  screens: ReviewScreen[];
}

let keyCounter = 0;
const nextKey = () => `r${++keyCounter}`;

/** Campo onde a nota do dicionário vinda do mapeamento se aplica. */
function noteFieldFor(evento: string, plataforma: Plataforma): string {
  if (evento === "select_content") return "content_type";
  if (evento === "modal_view") return "modal_name";
  return plataforma === "APP" ? "firebase_screen" : "page_name";
}

const TEXT_FIELDS_TO_CHECK = ["content_type", "modal_name", "firebase_screen", "page_name"];

export function initialReviewState(result: MappingResult, setup: SetupSelection): ReviewState {
  return {
    plataforma: setup.plataforma,
    region: setup.region,
    subregion: setup.subregion,
    screens: result.screens.map((screen) => {
      const telaAnterior = screen.origens[0] ?? null;
      return {
        frameId: screen.frameId,
        frameName: screen.frameName,
        nomeTela: screen.nomeTela,
        telaAnterior,
        origens: screen.origens,
        destinos: screen.destinos,
        avisos: screen.avisos,
        items: screen.items.map((item) => {
          const flags: ReviewItem["flags"] = {};
          for (const field of TEXT_FIELDS_TO_CHECK) {
            const value = item.params[field];
            if (!value) continue;
            const report = normalizeWithReport(value, "param");
            if (report.sinalizados.length > 0) flags[field] = { sinalizados: report.sinalizados, cortado: false };
          }
          const noteField = noteFieldFor(item.evento, setup.plataforma);
          return {
            key: nextKey(),
            nodeId: item.nodeId,
            componente: item.componente,
            label: item.label,
            evento: item.evento,
            origem: item.origem,
            values: { ...item.params },
            notes: item.notas.length > 0 ? { [noteField]: item.notas } : {},
            flags,
            naoReconhecido: item.naoReconhecido,
            confirmado: false,
            insideModal: item.params.local_type === "Modal"
          };
        })
      };
    })
  };
}

export type ReviewAction =
  | { type: "init"; state: ReviewState }
  | { type: "commit-value"; screen: number; key: string; field: string; raw: string }
  | { type: "accept-flag"; screen: number; key: string; field: string }
  | { type: "confirm"; screen: number; key: string }
  | { type: "change-event"; screen: number; key: string; evento: string }
  | { type: "remove"; screen: number; key: string }
  | { type: "add-manual"; screen: number; nodeId: string; componente: string; label: string | null; evento: string };

function contextFor(state: ReviewState, screen: ReviewScreen, insideModal = false): ScreenContext {
  return {
    plataforma: state.plataforma,
    nomeTela: screen.nomeTela,
    telaAnterior: screen.telaAnterior,
    region: state.region,
    subregion: state.subregion,
    insideModal
  };
}

function updateItem(state: ReviewState, screenIndex: number, key: string, update: (item: ReviewItem, screen: ReviewScreen) => ReviewItem | null): ReviewState {
  return {
    ...state,
    screens: state.screens.map((screen, index) => {
      if (index !== screenIndex) return screen;
      const items: ReviewItem[] = [];
      for (const item of screen.items) {
        if (item.key !== key) {
          items.push(item);
          continue;
        }
        const next = update(item, screen);
        if (next) items.push(next);
      }
      return { ...screen, items };
    })
  };
}

export function reviewReducer(state: ReviewState | null, action: ReviewAction): ReviewState | null {
  if (action.type === "init") return action.state;
  if (!state) return state;
  switch (action.type) {
    case "commit-value":
      return updateItem(state, action.screen, action.key, (item) => {
        const values = { ...item.values };
        const notes = { ...item.notes };
        const flags = { ...item.flags };
        delete notes[action.field];
        delete flags[action.field];
        if (action.raw.trim() === "") {
          delete values[action.field];
        } else if (action.field === "local_type") {
          values[action.field] = action.raw; // seletor: Modal ou Screen
        } else {
          const report = normalizeWithReport(action.raw, "param");
          values[action.field] = report.value;
          const info = describeReport(report);
          if (info.notas.length > 0) notes[action.field] = info.notas;
          if (report.sinalizados.length > 0 || report.cortado) {
            flags[action.field] = { sinalizados: report.sinalizados, cortado: report.cortado };
          }
        }
        return { ...item, values, notes, flags };
      });
    case "accept-flag":
      return updateItem(state, action.screen, action.key, (item) => {
        const flags = { ...item.flags };
        delete flags[action.field];
        return { ...item, flags };
      });
    case "confirm":
      return updateItem(state, action.screen, action.key, (item) => ({ ...item, confirmado: true }));
    case "change-event":
      return updateItem(state, action.screen, action.key, (item, screen) =>
        changeEvent(item, action.evento, contextFor(state, screen, item.insideModal))
      );
    case "remove":
      return updateItem(state, action.screen, action.key, (item) => (item.origem === "tela" ? item : null));
    case "add-manual":
      return {
        ...state,
        screens: state.screens.map((screen, index) => {
          if (index !== action.screen) return screen;
          const item: ReviewItem = {
            key: nextKey(),
            nodeId: action.nodeId,
            componente: action.componente,
            label: action.label,
            evento: action.evento,
            origem: "manual",
            values: defaultsFor(action.evento, contextFor(state, screen)),
            notes: {},
            flags: {},
            naoReconhecido: false,
            confirmado: false,
            insideModal: false
          };
          return { ...screen, items: [...screen.items, item] };
        })
      };
    default:
      return state;
  }
}

export function screenPendencias(state: ReviewState, screen: ReviewScreen): number {
  return screen.items.reduce((sum, item) => sum + pendenciasOf(item, state.plataforma).length, 0);
}

export function totalPendencias(state: ReviewState): number {
  return state.screens.reduce((sum, screen) => sum + screenPendencias(state, screen), 0);
}

/** Monta o pedido de geração (Fase 7): só os campos do evento/canal de cada item, já revisados. */
export function buildGenerationRequest(state: ReviewState): GenerationRequest {
  return {
    plataforma: state.plataforma,
    screens: state.screens.map((screen) => ({
      frameId: screen.frameId,
      nomeTela: screen.nomeTela,
      items: screen.items.map((item, index) => {
        const { required, optional } = fieldsFor(item.evento, state.plataforma);
        const allowed = new Set([...required, ...optional, ...SETUP_FIELDS]);
        const values: Record<string, string> = {};
        for (const [field, value] of Object.entries(item.values)) {
          if (allowed.has(field) && value) values[field] = value;
        }
        values.region = state.region;
        values.subregion = state.subregion;
        return { numero: index + 1, nodeId: item.nodeId, componente: item.componente, evento: item.evento, origem: item.origem, values };
      })
    }))
  };
}
