/**
 * CÓPIA adaptada de src/ui/mainBridge.ts — envia mensagens da UI para o
 * main thread usando o protocolo próprio do tagueamento.
 */

import { TagMainToUiMessage, TagUiToMainMessage, isTagMessageType } from "../shared/messages";

export function postToTagMain(message: TagUiToMainMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

/**
 * Escuta só as mensagens do tagueamento vindas do main thread (prefixo
 * "tag:"); as da acessibilidade são ignoradas aqui. Devolve a função que
 * remove o listener.
 */
export function onTagMessage(handler: (message: TagMainToUiMessage) => void): () => void {
  function listener(event: MessageEvent) {
    const message = event.data?.pluginMessage as { type?: unknown } | undefined;
    if (!message || !isTagMessageType(message.type)) return;
    handler(message as TagMainToUiMessage);
  }
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}
