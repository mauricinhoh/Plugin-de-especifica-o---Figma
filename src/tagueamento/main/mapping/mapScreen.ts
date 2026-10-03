/// <reference types="@figma/plugin-typings" />

/**
 * Mapeamento de um frame (spec 4 e 5): card de tela + um item por componente,
 * com os parâmetros que dá para tirar do Figma.
 *
 *  - Nome da tela = duas primeiras palavras do nome do frame, normalizadas.
 *  - Card de tela: screen_view (APP) ou page_view (WEB), pelo CANAL do setup.
 *    A largura do frame só serve de checagem (> 1000 px = web).
 *  - select_content: content_type = [label (2 palavras) ou ação]_[nome da tela];
 *    local_name = nome da tela; local_type = Modal (dentro de Modal/Drawer) ou
 *    Screen; action = Click (editável na revisão).
 *  - modal_view: modal_name = título do modal normalizado.
 *  - Tela anterior / alvo: setas do protótipo (ver prototype.ts). Várias
 *    origens → usa a primeira e avisa. Vários destinos → deixa o placeholder
 *    e avisa. Sem seta → placeholder do card.
 *  - Parâmetros de tempo de execução (feedback_name, search_term, result…)
 *    ficam para o PD na revisão (spec 5.1).
 */

import { MappedItem, MappedScreen, Plataforma, SetupSelection } from "../../shared/types";
import { ActionSource, EVENT_BY_CLASS, findClassification } from "../../shared/classification";
import { normalizeParam } from "../../shared/naming";
import { discoverItems, DiscoveredItem, firstVisibleText } from "../traversal/discovery";
import { sortByReadingOrder } from "../traversal/readingOrder";
import { PrototypeGraph } from "./prototype";

/** Largura acima da qual o frame é considerado web (spec 4.3). */
export const WEB_WIDTH_THRESHOLD = 1000;

/** Placeholders iguais aos do card (quando o plugin não tem o valor). */
export const PLACEHOLDER_PREVIOUS = "<Tela_anterior_apresentada>";

interface ScreenKeys {
  screen: string;
  previous: string;
  target: string;
}

function keysFor(plataforma: Plataforma): ScreenKeys {
  return plataforma === "APP"
    ? { screen: "firebase_screen", previous: "firebase_previous_screen", target: "target_screen" }
    : { screen: "page_name", previous: "previous_page", target: "target_page" };
}

/** As duas primeiras palavras (com letra ou número) de um texto. */
export function firstTwoWords(text: string): string {
  return text
    .split(/\s+/)
    // Sem \p{L}: o main thread compila para ES2017, que não tem classes Unicode em regex.
    .filter((word) => /[A-Za-z0-9\u00C0-\u024F]/.test(word))
    .slice(0, 2)
    .join(" ");
}

export function screenNameOf(frameName: string): string {
  return normalizeParam(firstTwoWords(frameName));
}

/** Base do content_type: label (2 palavras) ou a ação da tabela. */
function contentBase(acao: ActionSource | undefined, label: string | null): { base: string | null; pendencia?: string } {
  if (acao && typeof acao === "object" && acao.kind === "pd") {
    return { base: null, pendencia: "Ação preenchida pelo PD (Button Icon)" };
  }
  if (label) return { base: firstTwoWords(label) };
  if (typeof acao === "string") return { base: acao };
  return { base: null, pendencia: "Componente sem texto: preencha a ação" };
}

export function mapScreen(
  frame: SceneNode,
  discovered: DiscoveredItem[],
  setup: SetupSelection,
  graph: PrototypeGraph,
  nomeTelaById: Map<string, string>
): MappedScreen {
  const keys = keysFor(setup.plataforma);
  const nomeTela = screenNameOf(frame.name);
  const nomeTelaPalavras = firstTwoWords(frame.name);
  const largura = Math.round(frame.width);
  const plataformaPelaLargura: Plataforma = frame.width > WEB_WIDTH_THRESHOLD ? "WEB" : "APP";
  const avisos: string[] = [];

  if (!nomeTela) avisos.push("O nome do frame não tem palavras para formar o nome da tela.");

  const divergeDoCanal = plataformaPelaLargura !== setup.plataforma;
  if (divergeDoCanal) {
    avisos.push(
      `A largura do frame (${largura} px) parece ${plataformaPelaLargura === "WEB" ? "web" : "app"}, mas o canal "${setup.canal}" é ${setup.plataforma === "WEB" ? "web" : "app"}. Você pode seguir assim.`
    );
  }

  const origens = (graph.incoming.get(frame.id) ?? []).map((id) => nomeTelaById.get(id) ?? id);
  const destinos = (graph.outgoing.get(frame.id) ?? []).map((id) => nomeTelaById.get(id) ?? id);
  const telaAnterior = origens[0] ?? null;
  if (origens.length > 1) {
    avisos.push(`Mais de uma tela leva até esta (${origens.join(", ")}). Usei "${origens[0]}" como tela anterior — confira.`);
  }
  if (destinos.length > 1) {
    avisos.push(`Esta tela leva a mais de uma tela (${destinos.join(", ")}). A tela alvo ficou para você escolher.`);
  }
  const previousValue = telaAnterior ?? PLACEHOLDER_PREVIOUS;

  const base = { region: setup.region, subregion: setup.subregion };
  const items: MappedItem[] = [];

  // 1. Card de tela
  const screenParams: Record<string, string> = {
    [keys.screen]: nomeTela,
    ...base,
    [keys.previous]: previousValue
  };
  if (destinos.length === 1) screenParams[keys.target] = destinos[0];
  items.push({
    numero: 1,
    nodeId: frame.id,
    componente: frame.name,
    evento: setup.plataforma === "APP" ? "screen_view" : "page_view",
    origem: "tela",
    label: null,
    params: screenParams,
    pendencias: [],
    paraPd: []
  });

  // 2. Componentes, na ordem espacial
  const ordered = sortByReadingOrder(discovered.map((item) => item.node));
  const byId = new Map(discovered.map((item) => [item.node.id, item]));

  for (const node of ordered) {
    const found = byId.get(node.id);
    if (!found) continue;
    const label = firstVisibleText(found.node);
    const evento = found.classe === "nao_reconhecido" ? "select_content" : EVENT_BY_CLASS[found.classe];
    if (!evento) continue;

    const item: MappedItem = {
      numero: items.length + 1,
      nodeId: found.node.id,
      componente: found.componentName,
      evento,
      origem: "componente",
      label,
      params: {},
      pendencias: [],
      paraPd: []
    };
    if (found.classe === "nao_reconhecido") {
      item.pendencias.push("Componente não reconhecido: confirme se é mesmo um select_content");
    }

    switch (evento) {
      case "select_content": {
        const rule = found.ruleName ? findClassification([found.ruleName])?.rule : undefined;
        const { base: contentText, pendencia } = contentBase(rule?.acao, label);
        if (pendencia) item.pendencias.push(pendencia);
        item.params = {
          content_type: contentText ? normalizeParam(`${contentText} ${nomeTelaPalavras}`) : "",
          ...base,
          action: "Click",
          local_name: nomeTela,
          local_type: found.insideModal ? "Modal" : "Screen",
          previous_page: previousValue
        };
        if (!contentText) delete item.params.content_type;
        break;
      }
      case "modal_view": {
        const modalName = label ? normalizeParam(label) : "";
        if (!modalName) item.pendencias.push("Modal sem título: preencha o modal_name");
        item.params = { ...base };
        if (modalName) item.params.modal_name = modalName;
        // Card: APP firebase_screen = tela em que a modal foi acionada; WEB page_name = <Nome_da_modal>.
        if (setup.plataforma === "APP") item.params.firebase_screen = nomeTela;
        else if (modalName) item.params.page_name = modalName;
        break;
      }
      case "feedback":
        item.params = { ...base, [keys.screen]: nomeTela, [keys.previous]: previousValue };
        item.paraPd.push("feedback_name");
        break;
      case "search":
        item.params = { ...base, [keys.screen]: nomeTela, [keys.previous]: previousValue };
        item.paraPd.push("search_term", "result");
        break;
    }
    items.push(item);
  }

  return {
    frameId: frame.id,
    frameName: frame.name,
    nomeTela,
    largura,
    altura: Math.round(frame.height),
    plataformaPelaLargura,
    divergeDoCanal,
    origens,
    destinos,
    items,
    avisos
  };
}

export { discoverItems };
