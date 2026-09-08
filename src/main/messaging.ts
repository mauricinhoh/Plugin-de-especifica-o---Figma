/// <reference types="@figma/plugin-typings" />

import { MainToUiMessage } from "../shared/messages";

export function postToUi(message: MainToUiMessage): void {
  figma.ui.postMessage(message);
}
