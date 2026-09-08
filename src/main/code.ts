/// <reference types="@figma/plugin-typings" />

import { UiToMainMessage } from "../shared/messages";
import { postToUi } from "./messaging";
import { ComponentTypeOption, GenerationSummary, ScreenAnalysisResult, SpecificationItem } from "../shared/types";
import { UNSPECIFIED_TYPE_KEY, UNSPECIFIED_TYPE_LABEL } from "../rules/engine";
import { MARKUP_TYPES } from "../rules/markupTypes";
import {
  countDescendants,
  focusNode,
  getCurrentSelection,
  getCurrentUserName,
  isValidScreenNode,
  onSelectionChange
} from "./figma-api";
import { analyzeScreen, buildManualItem } from "./analysis/analyzer";
import { generateMarkers } from "./generation/markers";
import { generatePanel } from "./generation/panel";

const UI_WIDTH = 420;
const UI_HEIGHT = 700;

figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT, themeColors: false });

// ---------- Estado da execução atual (não persistido — seção 37) ----------

let lastAnalyzedScreenId: string | null = null;
let manualSelectionEnabled = false;
let knownNodeIds = new Set<string>();
let stopManualSelectionListener: (() => void) | null = null;
let lastGeneratedOutputNodeId: string | null = null;

// ---------- Utilitários ----------

function buildComponentTypeOptions(): ComponentTypeOption[] {
  // Antes, cada regra de acessibilidade virava sua própria opção no
  // dropdown. Agora o dropdown ("Tipo de marcação") sempre mostra as
  // 9 categorias fixas exigidas pela especificação de Handoff — a
  // regra específica que identificou o componente continua existindo
  // internamente (SpecificationItem.ruleKey), só não aparece mais
  // diretamente no SELECT.
  const fromMarkupTypes: ComponentTypeOption[] = MARKUP_TYPES.map((type) => ({
    key: type.key,
    label: type.label,
    hasVerbalization: true
  }));
  // "Não especificado" (seção 15 do briefing de Handoff): a
  // verbalização não é gerada automaticamente, mas o campo continua
  // EDITÁVEL para o designer preencher manualmente.
  return [...fromMarkupTypes, { key: UNSPECIFIED_TYPE_KEY, label: UNSPECIFIED_TYPE_LABEL, hasVerbalization: true }];
}

function resetFlowState(): void {
  lastAnalyzedScreenId = null;
  knownNodeIds = new Set();
  lastGeneratedOutputNodeId = null;
  setManualSelectionEnabled(false);
}

function sendSelectionState(): void {
  const selection = getCurrentSelection();
  if (selection.length === 1 && isValidScreenNode(selection[0])) {
    const node = selection[0];
    const bounds = "absoluteBoundingBox" in node ? node.absoluteBoundingBox : null;
    postToUi({
      type: "selection-state",
      valid: true,
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      width: bounds ? bounds.width : undefined,
      height: bounds ? bounds.height : undefined,
      layerCount: countDescendants(node)
    });
  } else {
    postToUi({ type: "selection-state", valid: false, nodeId: null, nodeName: null });
  }
}

async function runAnalysis(): Promise<void> {
  const selection = getCurrentSelection();
  if (selection.length !== 1 || !isValidScreenNode(selection[0])) {
    postToUi({ type: "analysis-error", message: "Selecione um único frame, grupo ou auto layout." });
    return;
  }

  const screenNode = selection[0];
  lastAnalyzedScreenId = screenNode.id;

  const result = await analyzeScreen(screenNode);
  emitAnalysisResult(result);
}

function emitAnalysisResult(result: ScreenAnalysisResult): void {
  knownNodeIds = new Set(result.items.map((item) => item.nodeId));
  postToUi({ type: "analysis-result", result });
}

async function resolveContextChoice(context: "WEB" | "APLICATIVO"): Promise<void> {
  if (!lastAnalyzedScreenId) {
    postToUi({ type: "analysis-error", message: "Nenhuma tela analisada. Selecione uma tela novamente." });
    return;
  }
  const node = await figma.getNodeByIdAsync(lastAnalyzedScreenId);
  if (!node || !isValidScreenNode(node as SceneNode)) {
    postToUi({ type: "analysis-error", message: "A tela selecionada não existe mais no arquivo." });
    return;
  }
  const result = await analyzeScreen(node as SceneNode, context);
  emitAnalysisResult(result);
}

function setManualSelectionEnabled(enabled: boolean): void {
  manualSelectionEnabled = enabled;

  if (stopManualSelectionListener) {
    stopManualSelectionListener();
    stopManualSelectionListener = null;
  }

  if (!enabled) {
    return;
  }

  stopManualSelectionListener = onSelectionChange(() => {
    void handleManualSelectionChange();
  });
}

async function handleManualSelectionChange(): Promise<void> {
  if (!manualSelectionEnabled) {
    return;
  }
  const selection = getCurrentSelection();
  for (const node of selection) {
    if (knownNodeIds.has(node.id)) {
      postToUi({ type: "manual-item-duplicate", nodeId: node.id });
      continue;
    }
    const item = await buildManualItem(node, knownNodeIds.size);
    knownNodeIds.add(node.id);
    postToUi({ type: "manual-item-added", item });
  }
}

/**
 * Geração (seção 9 do prompt de redesign): emite progresso real em
 * cada fronteira de etapa, sem inventar etapas que o código não
 * executa. "reading-order" corresponde à ordenação dos itens (rápida,
 * mas real); "markers" ao loop de criação de marcações (progresso por
 * marcador); "table" à criação do painel único. Componentes cujo node
 * não existe mais no arquivo não abortam a geração — entram como
 * "alerta" no resumo final (Done.tsx mostra isso, escondendo o bloco
 * quando warningCount === 0). Só uma falha inesperada aborta e volta
 * para a Etapa 2 preservando os itens da UI.
 */
async function generateSpecifications(items: SpecificationItem[]): Promise<void> {
  try {
    if (!lastAnalyzedScreenId) {
      postToUi({ type: "generation-error", message: "Nenhuma tela associada a esta especificação." });
      return;
    }
    const screenNode = await figma.getNodeByIdAsync(lastAnalyzedScreenId);
    if (!screenNode) {
      postToUi({ type: "generation-error", message: "A tela selecionada não existe mais no arquivo." });
      return;
    }

    postToUi({ type: "generation-progress", stage: "reading-order", done: 0, total: 1 });
    const ordered = [...items].sort((a, b) => a.order - b.order);
    postToUi({ type: "generation-progress", stage: "reading-order", done: 1, total: 1 });

    const { missingNodeErrors } = await generateMarkers(ordered, (done, total) => {
      postToUi({ type: "generation-progress", stage: "markers", done, total });
    });

    postToUi({ type: "generation-progress", stage: "table", done: 0, total: 1 });
    // O total do card "Ordem de leitura" é calculado aqui, a partir
    // de TODOS os itens presentes na especificação no momento da
    // geração (automáticos + adicionados manualmente), na ordem
    // final. Antes, esse total era travado no momento da análise
    // automática e não mudava com adições manuais — mudado a pedido
    // do usuário depois de um caso real em produção em que o total
    // ficava desatualizado.
    const panel = await generatePanel(screenNode as SceneNode, ordered, ordered.length);
    postToUi({ type: "generation-progress", stage: "table", done: 1, total: 1 });

    lastGeneratedOutputNodeId = panel.id;

    const summary: GenerationSummary = {
      componentCount: ordered.length,
      verbalizationCount: ordered.filter((item) => item.verbalization.trim().length > 0).length,
      warningCount: missingNodeErrors.length,
      screenName: (screenNode as SceneNode).name,
      outputNodeId: panel.id
    };

    postToUi({ type: "generation-complete", summary });
  } catch (error) {
    console.error("Falha ao gerar especificações:", error);
    postToUi({
      type: "generation-error",
      message: "Não foi possível concluir a geração. Os itens da lista foram preservados."
    });
  }
}

// ---------- Roteamento de mensagens da UI ----------

let selectionListenerRegistered = false;

/**
 * Executa cada etapa da inicialização de forma isolada: se uma
 * etapa falhar (ex.: uma permissão que ainda não foi concedida), as
 * demais continuam executando normalmente. Antes, uma exceção em
 * qualquer etapa interrompia todo o bloco "ui-ready" — inclusive o
 * registro do listener de seleção, que é o que habilita o botão
 * "Começar especificação" na Etapa 1.
 */
function safely(label: string, fn: () => void): void {
  try {
    fn();
  } catch (error) {
    console.error(`Falha ao inicializar "${label}":`, error);
  }
}

figma.ui.onmessage = (message: UiToMainMessage) => {
  switch (message.type) {
    case "ui-ready":
      // Registrado primeiro e de forma protegida contra duplicação:
      // é a etapa mais crítica para a Etapa 1 funcionar.
      if (!selectionListenerRegistered) {
        safely("listener de seleção", () => {
          onSelectionChange(sendSelectionState);
          selectionListenerRegistered = true;
        });
      }
      safely("estado inicial de seleção", sendSelectionState);
      safely("nome do designer", () =>
        postToUi({ type: "designer-name", name: getCurrentUserName() })
      );
      safely("tipos de componente", () =>
        postToUi({ type: "component-type-options", domain: "accessibility", options: buildComponentTypeOptions() })
      );
      break;
    case "request-selection-state":
      sendSelectionState();
      break;
    case "start-analysis":
      void runAnalysis();
      break;
    case "resolve-context-choice":
      void resolveContextChoice(message.context);
      break;
    case "toggle-manual-selection":
      setManualSelectionEnabled(message.enabled);
      break;
    case "sync-known-node-ids":
      knownNodeIds = new Set(message.nodeIds);
      break;
    case "generate-specifications":
      void generateSpecifications(message.items);
      break;
    case "focus-node":
      void focusNode(message.nodeId).then((found) => {
        if (!found) {
          figma.notify("Componente não encontrado");
        }
      });
      break;
    case "focus-generation-output":
      if (lastGeneratedOutputNodeId) {
        void focusNode(lastGeneratedOutputNodeId).then((found) => {
          if (!found) {
            figma.notify("Painel de especificações não encontrado");
          }
        });
      }
      break;
    case "reset-flow":
      resetFlowState();
      break;
    case "close-plugin":
      figma.closePlugin();
      break;
    case "cancel":
      figma.closePlugin();
      break;
    default:
      break;
  }
};
