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
import { loadLastSetup, saveLastSetup } from "./setupStorage";
import { watchSelection } from "./selection";
import { pageTagStatus, runMapping } from "./mapping/runMapping";
import { generateCards, GenerationFailure } from "./generation/generate";
import { deleteTagOutput } from "./generation/existingOutput";
import { GenerationRequest, SetupSelection } from "../shared/types";
import { elementInfo } from "./elementInfo";
import { ensurePageOf, errorMessage, pageOf } from "./util";

/** Ação disparada sem esperar (fire-and-forget): falha vira aviso no Figma, nunca rejeição solta. */
function runSafely(task: Promise<unknown>, failure: string): void {
  task.catch((error) => figma.notify(`${failure}: ${errorMessage(error)}`, { error: true }));
}

/** true quando a mensagem vinda da UI pertence ao tagueamento. */
export function isTagueamentoMessage(message: unknown): message is TagUiToMainMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    isTagMessageType((message as { type?: unknown }).type)
  );
}

/**
 * Cada pedido de mapeamento leva um número. A UI só aceita a resposta do
 * pedido mais recente — se o PD voltou ao setup e mapeou de novo, o
 * resultado do pedido antigo é ignorado lá.
 */
async function runMappingAndReport(requestId: number, setup: SetupSelection, skipTagged: boolean, skipFrameIds: string[]): Promise<void> {
  try {
    const result = await runMapping(
      setup,
      (done, total, extra) => postToTagUi({ type: "tag:mapping-progress", requestId, done, total, ...extra }),
      skipTagged,
      skipFrameIds
    );
    postToTagUi({ type: "tag:mapping-result", requestId, result });
  } catch (error) {
    postToTagUi({
      type: "tag:mapping-error",
      requestId,
      message: error instanceof Error ? error.message : "Não foi possível mapear a tela."
    });
  }
}

let generationInProgress = false;

async function runGeneration(request: GenerationRequest): Promise<void> {
  if (generationInProgress) return;
  generationInProgress = true;
  try {
    const result = await generateCards(request, (done, total, stage, stageDone, stageTotal) =>
      postToTagUi({ type: "tag:generation-progress", done, total, stage, stageDone, stageTotal })
    );
    postToTagUi({ type: "tag:generation-result", result });
  } catch (error) {
    const code = (error as GenerationFailure).code === "biblioteca" ? "biblioteca" : "desconhecido";
    postToTagUi({
      type: "tag:generation-error",
      code,
      message: `Não foi possível gerar os cards: ${error instanceof Error ? error.message : String(error)}`
    });
  } finally {
    generationInProgress = false;
  }
}

async function deleteOutput(frameId: string): Promise<void> {
  const frame = await figma.getNodeByIdAsync(frameId);
  if (!frame || !("visible" in frame)) {
    figma.notify("Tela não encontrada");
    return;
  }
  await ensurePageOf(frame);
  // Fecha o passo de histórico antes e depois, para a exclusão ser UM passo
  // só no Ctrl+Z do Figma.
  figma.commitUndo();
  const cards = deleteTagOutput(frame as SceneNode);
  figma.commitUndo();
  postToTagUi({ type: "tag:output-deleted", frameId: frame.id, frameName: frame.name, cards });
}

async function focusNodes(nodeIds: string[]): Promise<void> {
  const nodes: SceneNode[] = [];
  for (const id of nodeIds) {
    const node = await figma.getNodeByIdAsync(id);
    if (node && "visible" in node) nodes.push(node as SceneNode);
  }
  if (nodes.length === 0) {
    figma.notify("Nada encontrado no canvas");
    return;
  }
  await ensurePageOf(nodes[0]);
  const onPage = nodes.filter((node) => pageOf(node)?.id === figma.currentPage.id);
  // Seleciona e enquadra (os cards gerados, ou o card de um aviso).
  figma.currentPage.selection = onPage;
  figma.viewport.scrollAndZoomIntoView(onPage);
}

async function focusNode(nodeId: string): Promise<void> {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (node && "visible" in node) {
    await ensurePageOf(node);
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
    case "tag:get-last-setup":
      loadLastSetup()
        .then((setup) => postToTagUi({ type: "tag:last-setup", setup }))
        .catch(() => postToTagUi({ type: "tag:last-setup", setup: null }));
      break;
    case "tag:save-setup":
      runSafely(saveLastSetup(message.setup), "Não foi possível guardar a escolha");
      break;
    case "tag:open-external":
      figma.openExternal(message.url);
      break;
    case "tag:watch-selection":
      watchSelection(message.enabled);
      break;
    case "tag:run-mapping":
      void runMappingAndReport(message.requestId, message.setup, message.skipTagged === true, message.skipFrameIds ?? []);
      break;
    case "tag:focus-node":
      runSafely(focusNode(message.nodeId), "Não foi possível mostrar a camada");
      break;
    case "tag:generate":
      void runGeneration(message.request);
      break;
    case "tag:delete-output":
      runSafely(deleteOutput(message.frameId), "Não foi possível excluir os marcadores");
      break;
    case "tag:page-tag-status":
      try {
        postToTagUi({ type: "tag:page-tag-status-result", status: pageTagStatus() });
      } catch (error) {
        figma.notify(`Não foi possível ler a página: ${errorMessage(error)}`, { error: true });
        postToTagUi({ type: "tag:page-tag-status-result", status: { total: 0, tagged: [] } });
      }
      break;
    case "tag:focus-nodes":
      runSafely(focusNodes(message.nodeIds), "Não foi possível mostrar no canvas");
      break;
    case "tag:element-info":
      // Responde sempre (null se o elemento sumiu ou deu erro), para a UI não ficar esperando.
      elementInfo(message.nodeId)
        .then((info) => postToTagUi({ type: "tag:element-info-result", info }))
        .catch(() => postToTagUi({ type: "tag:element-info-result", info: null }));
      break;
    default:
      break;
  }
}
