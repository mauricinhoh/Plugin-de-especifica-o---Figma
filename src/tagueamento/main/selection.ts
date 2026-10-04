/// <reference types="@figma/plugin-typings" />

/**
 * Acompanhamento da seleção para o TAGUEAMENTO (tela "Selecione uma tela").
 *
 * Listener PRÓPRIO, separado do da acessibilidade (que continua registrado
 * e enviando as mensagens dela). Só fica ligado enquanto a UI do tagueamento
 * pede (tag:watch-selection), e é desligado ao sair da tela.
 */

import { TagSelectionState } from "../shared/types";
import { postToTagUi } from "./messaging";
import { isScreenNode } from "./mapping/runMapping";
import { countTaggedCards, frameIdOfOutput } from "./generation/existingOutput";

let listening = false;

async function currentState(): Promise<TagSelectionState> {
  const selection = figma.currentPage.selection;
  const element = selection.length === 1 ? { id: selection[0].id, name: selection[0].name, type: selection[0].type } : null;
  // Clicou no grupo/card/marcador de tagueamento → trata como a tela dele.
  let screen: SceneNode | null = selection.length === 1 ? selection[0] : null;
  const ownerId = screen ? frameIdOfOutput(screen) : null;
  if (ownerId) {
    const owner = (await figma.getNodeByIdAsync(ownerId)) as SceneNode | null;
    screen = owner && !owner.removed && isScreenNode(owner) ? owner : null;
  }
  if (screen && isScreenNode(screen)) {
    const node = screen;
    return {
      valid: true,
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      width: Math.round(node.width),
      height: Math.round(node.height),
      element,
      taggedCards: countTaggedCards(node)
    };
  }
  return { valid: false, nodeId: null, nodeName: null, element };
}

let sequence = 0;
function sendState(): void {
  const mine = ++sequence;
  void currentState().then((state) => {
    if (mine === sequence) postToTagUi({ type: "tag:selection-state", state });
  });
}

export function watchSelection(enabled: boolean): void {
  if (enabled && !listening) {
    figma.on("selectionchange", sendState);
    listening = true;
  } else if (!enabled && listening) {
    figma.off("selectionchange", sendState);
    listening = false;
  }
  if (enabled) sendState();
}
