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
import { createTestCard, diagnoseSelection } from "./cardDiagnostic";
import { checkAllVariants } from "./variantCheck";
import { GA_CARD_SET_KEY } from "../shared/gaCard";
import { loadLastSetup, saveLastSetup } from "./setupStorage";
import { watchSelection } from "./selection";
import { runMapping } from "./mapping/runMapping";
import { SetupSelection } from "../shared/types";
import { elementInfo } from "./elementInfo";

/** true quando a mensagem vinda da UI pertence ao tagueamento. */
export function isTagueamentoMessage(message: unknown): message is TagUiToMainMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    isTagMessageType((message as { type?: unknown }).type)
  );
}

async function runDiagnosis(): Promise<void> {
  try {
    const diagnosis = await diagnoseSelection();
    postToTagUi({ type: "tag:diagnosis-result", diagnosis });
  } catch (error) {
    postToTagUi({
      type: "tag:diagnosis-error",
      message: error instanceof Error ? error.message : "Não foi possível ler o card selecionado."
    });
  }
}

async function runCreateTestCard(sourceNodeId: string, variantValues: Record<string, string>): Promise<void> {
  try {
    const result = await createTestCard(sourceNodeId, variantValues);
    postToTagUi({ type: "tag:test-card-result", result });
  } catch (error) {
    postToTagUi({
      type: "tag:test-card-result",
      result: {
        ok: false,
        message: `Falha inesperada ao criar o card de teste: ${error instanceof Error ? error.message : String(error)}`
      }
    });
  }
}

async function runCheckAllVariants(): Promise<void> {
  try {
    const result = await checkAllVariants();
    postToTagUi({ type: "tag:all-variants-result", result });
  } catch (error) {
    postToTagUi({
      type: "tag:all-variants-result",
      result: {
        keyUsed: GA_CARD_SET_KEY,
        importOk: false,
        source: "none",
        setNameOk: false,
        variantOptions: [],
        unmatchedVariants: [],
        toggles: [],
        showToggleFound: false,
        checks: [],
        warnings: [`Falha inesperada na verificação: ${error instanceof Error ? error.message : String(error)}`]
      }
    });
  }
}

let mappingInProgress = false;

async function runMappingAndReport(setup: SetupSelection): Promise<void> {
  if (mappingInProgress) return;
  mappingInProgress = true;
  try {
    const result = await runMapping(setup, (done, total) => postToTagUi({ type: "tag:mapping-progress", done, total }));
    postToTagUi({ type: "tag:mapping-result", result });
  } catch (error) {
    postToTagUi({
      type: "tag:mapping-error",
      message: error instanceof Error ? error.message : "Não foi possível mapear a tela."
    });
  } finally {
    mappingInProgress = false;
  }
}

async function focusNode(nodeId: string): Promise<void> {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (node && "visible" in node) {
    figma.currentPage.selection = [node as SceneNode];
    figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
  } else {
    figma.notify("Camada não encontrada");
  }
}

export function handleTagueamentoMessage(message: TagUiToMainMessage): void {
  switch (message.type) {
    case "tag:ui-ready":
      postToTagUi({ type: "tag:ready", fileName: figma.root.name });
      break;
    case "tag:close-plugin":
      watchSelection(false);
      figma.closePlugin();
      break;
    case "tag:diagnose-selection":
      void runDiagnosis();
      break;
    case "tag:create-test-card":
      void runCreateTestCard(message.sourceNodeId, message.variantValues);
      break;
    case "tag:check-all-variants":
      void runCheckAllVariants();
      break;
    case "tag:get-last-setup":
      void loadLastSetup().then((setup) => postToTagUi({ type: "tag:last-setup", setup }));
      break;
    case "tag:save-setup":
      void saveLastSetup(message.setup);
      break;
    case "tag:open-external":
      figma.openExternal(message.url);
      break;
    case "tag:watch-selection":
      watchSelection(message.enabled);
      break;
    case "tag:run-mapping":
      void runMappingAndReport(message.setup);
      break;
    case "tag:focus-node":
      void focusNode(message.nodeId);
      break;
    case "tag:element-info":
      void elementInfo(message.nodeId).then((info) => postToTagUi({ type: "tag:element-info-result", info }));
      break;
    default:
      break;
  }
}
