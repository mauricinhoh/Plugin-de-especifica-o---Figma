/// <reference types="@figma/plugin-typings" />

/**
 * Roteador do main thread do TAGUEAMENTO.
 *
 * O Figma só aceita um `figma.ui.onmessage` por plugin, e ele está em
 * src/main/code.ts. Lá existe uma única linha que, ao ver uma mensagem
 * com prefixo "tag:", chama `handleTagueamentoMessage` e encerra — a
 * mensagem não passa por nenhuma lógica da acessibilidade. Daqui para
 * frente, tudo do tagueamento (setup, travessia, mapeamento, cards,
 * persistência com chaves próprias) é chamado a partir deste arquivo.
 */

import { TagUiToMainMessage, isTagMessageType } from "../shared/messages";
import { postToTagUi } from "./messaging";

/** true quando a mensagem vinda da UI pertence ao tagueamento. */
export function isTagueamentoMessage(message: unknown): message is TagUiToMainMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    isTagMessageType((message as { type?: unknown }).type)
  );
}

export function handleTagueamentoMessage(message: TagUiToMainMessage): void {
  switch (message.type) {
    case "tag:ui-ready":
      postToTagUi({ type: "tag:ready", fileName: figma.root.name });
      break;
    case "tag:close-plugin":
      figma.closePlugin();
      break;
    default:
      break;
  }
}
