/// <reference types="@figma/plugin-typings" />

/**
 * Execução do mapeamento (Fase 4):
 *  - "tela": o frame selecionado.
 *  - "pagina": todos os frames de primeiro nível da página atual (inclusive os
 *    que estão dentro de Seções), um por vez, cedendo o controle entre um e
 *    outro para não travar o arquivo (spec 10).
 * As setas do protótipo são lidas de todos os frames da página nos dois modos
 * (a tela anterior pode estar em outro frame).
 */

import { MappingResult, SetupSelection } from "../../shared/types";
import { buildPrototypeGraph } from "./prototype";
import { discoverItems, mapScreen, screenNameOf } from "./mapScreen";

type ScreenNode = FrameNode | GroupNode;

export function isScreenNode(node: SceneNode): node is ScreenNode {
  return node.type === "FRAME" || node.type === "GROUP";
}

/** Frames de primeiro nível da página atual, entrando em Seções. Só visíveis. */
export function topLevelFrames(): ScreenNode[] {
  const frames: ScreenNode[] = [];
  function collect(children: readonly SceneNode[]): void {
    for (const child of children) {
      if (!child.visible) continue;
      if (child.type === "SECTION") collect(child.children);
      else if (child.type === "FRAME") frames.push(child);
    }
  }
  collect(figma.currentPage.children);
  return frames;
}

const yieldToFigma = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export async function runMapping(
  setup: SetupSelection,
  onProgress: (done: number, total: number) => void
): Promise<MappingResult> {
  const pageFrames = topLevelFrames();
  const result: MappingResult = { modo: setup.modo, screens: [], avisos: [] };

  let targets: ScreenNode[];
  if (setup.modo === "tela") {
    const selection = figma.currentPage.selection;
    if (selection.length !== 1 || !isScreenNode(selection[0])) {
      throw new Error("Selecione um único frame para mapear.");
    }
    targets = [selection[0]];
  } else {
    targets = pageFrames;
    if (targets.length === 0) {
      result.avisos.push("Esta página não tem frames de primeiro nível.");
      return result;
    }
  }

  // O frame selecionado pode não ser de primeiro nível; entra no grafo mesmo assim.
  const graphFrames: SceneNode[] = [...pageFrames];
  for (const target of targets) if (!graphFrames.includes(target)) graphFrames.push(target);
  const graph = await buildPrototypeGraph(graphFrames);
  const nomeTelaById = new Map(graphFrames.map((frame) => [frame.id, screenNameOf(frame.name)]));

  onProgress(0, targets.length);
  for (let index = 0; index < targets.length; index++) {
    const frame = targets[index];
    const discovered = await discoverItems(frame);
    result.screens.push(mapScreen(frame, discovered, setup, graph, nomeTelaById));
    onProgress(index + 1, targets.length);
    await yieldToFigma();
  }
  return result;
}
