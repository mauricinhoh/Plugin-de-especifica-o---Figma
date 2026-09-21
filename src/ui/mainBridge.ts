import { UiToMainMessage } from "../shared/messages";

/** Envia uma mensagem da UI (iframe) para o main thread do plugin. */
export function postToMain(message: UiToMainMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}
