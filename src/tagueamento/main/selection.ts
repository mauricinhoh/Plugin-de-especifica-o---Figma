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

let listening = false;

function currentState(): TagSelectionState {
  const selection = figma.currentPage.selection;
  if (selection.length === 1 && isScreenNode(selection[0])) {
    const node = selection[0];
    return {
      valid: true,
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      width: Math.round(node.width),
      height: Math.round(node.height)
    };
  }
  return { valid: false, nodeId: null, nodeName: null };
}

function sendState(): void {
  postToTagUi({ type: "tag:selection-state", state: currentState() });
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
