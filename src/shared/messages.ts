import {
  ComponentTypeOption,
  GenerationStage,
  GenerationSummary,
  ScreenAnalysisResult,
  ScreenContext,
  SpecificationItem
} from "./types";

/**
 * Protocolo de mensagens entre a UI (iframe) e o main thread.
 * A comunicação Figma plugin usa figma.ui.postMessage / window.onmessage,
 * então tudo aqui precisa ser serializável em JSON.
 */

// ---------- UI -> Main ----------

export type UiToMainMessage =
  | { type: "ui-ready" }
  | { type: "request-selection-state" }
  | { type: "start-analysis" }
  | { type: "resolve-context-choice"; context: ScreenContext }
  | { type: "toggle-manual-selection"; enabled: boolean }
  /** Enviado sempre que a lista de cards muda na UI, para que o main
   * thread saiba quais nodeIds já estão na especificação e evite
   * duplicações ao adicionar via seleção manual (seção 23). */
  | { type: "sync-known-node-ids"; nodeIds: string[] }
  | { type: "generate-specifications"; items: SpecificationItem[] }
  /** Seleciona e enquadra um node incompatível no canvas ("Ir para"). */
  | { type: "focus-node"; nodeId: string }
  /** Seleciona e enquadra o painel de especificações recém-gerado. */
  | { type: "focus-generation-output" }
  /** Volta ao estado inicial: limpa seleção manual, item list etc. */
  | { type: "reset-flow" }
  | { type: "close-plugin" }
  | { type: "cancel" };

// ---------- Main -> UI ----------

export type MainToUiMessage =
  | { type: "designer-name"; name: string }
  | {
      type: "selection-state";
      valid: boolean;
      nodeId: string | null;
      nodeName: string | null;
      /** Dados extras para o card da Etapa 1 — omitidos quando indisponíveis. */
      nodeType?: string;
      width?: number;
      height?: number;
      /** Contagem recursiva de descendentes, cortada em 5000 nós por segurança. */
      layerCount?: number;
    }
  | { type: "component-type-options"; domain: "accessibility"; options: ComponentTypeOption[] }
  | { type: "analysis-result"; result: ScreenAnalysisResult }
  | { type: "analysis-error"; message: string }
  | {
      type: "manual-item-added";
      item: SpecificationItem;
    }
  | { type: "manual-item-duplicate"; nodeId: string }
  | { type: "generation-progress"; stage: GenerationStage; done: number; total: number }
  | { type: "generation-error"; message: string }
  | { type: "generation-complete"; summary: GenerationSummary };
