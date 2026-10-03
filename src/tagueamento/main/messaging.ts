/// <reference types="@figma/plugin-typings" />

/**
 * CÓPIA adaptada de src/main/messaging.ts — envia mensagens do main thread
 * para a UI usando o protocolo próprio do tagueamento.
 */

import { TagMainToUiMessage } from "../shared/messages";

export function postToTagUi(message: TagMainToUiMessage): void {
  figma.ui.postMessage(message);
}
