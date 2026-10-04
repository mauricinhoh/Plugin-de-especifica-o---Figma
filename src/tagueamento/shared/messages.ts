/**
 * Protocolo de mensagens UI ↔ main thread do TAGUEAMENTO.
 *
 * Totalmente separado do protocolo da acessibilidade (src/shared/messages.ts).
 * Toda mensagem do tagueamento começa com o prefixo "tag:" — é por esse
 * prefixo que o roteador em src/main/code.ts desvia a mensagem para
 * src/tagueamento/main/router.ts, sem que ela passe por nenhuma lógica da
 * acessibilidade. Do lado da UI, o App da acessibilidade ignora qualquer
 * tipo que não conhece, então as mensagens "tag:" também não o afetam.
 *
 * Tudo aqui precisa ser serializável em JSON (figma.ui.postMessage).
 */

import {
  ElementInfo,
  GenerationRequest,
  GenerationResult,
  MappingResult,
  GenerationStage,
  MappingPlanItem,
  PageTagStatus,
  SetupSelection,
  TagSelectionState
} from "./types";

export const TAG_MESSAGE_PREFIX = "tag:";

// ---------- UI -> Main ----------

export type TagUiToMainMessage =
  /** A tela do tagueamento abriu e está pronta para receber mensagens. */
  | { type: "tag:ui-ready" }
  /** Fecha o plugin a partir do fluxo de tagueamento. */
  | { type: "tag:close-plugin" }
  /** Fase 3: pede a última escolha do setup (guardada em figma.clientStorage, chave própria). */
  | { type: "tag:get-last-setup" }
  /** Fase 3: guarda a escolha do setup para o próximo uso. */
  | { type: "tag:save-setup"; setup: SetupSelection }
  /** Fase 3: abre um link no navegador (Forms do "Outro") com figma.openExternal. */
  | { type: "tag:open-external"; url: string }
  /** Fase 4: liga/desliga o acompanhamento da seleção (listener próprio do tagueamento). */
  | { type: "tag:watch-selection"; enabled: boolean }
  /** Fase 4: mapeia o frame selecionado ("tela") ou a página inteira ("pagina"), conforme setup.modo. */
  | {
      type: "tag:run-mapping";
      requestId: number;
      setup: SetupSelection;
      /** Pula todas as telas já tagueadas (página inteira). */
      skipTagged?: boolean;
      /** Pula só estas telas (página inteira, lista com checkbox). */
      skipFrameIds?: string[];
    }
  /** Fase 4: seleciona e enquadra um node no canvas. */
  | { type: "tag:focus-node"; nodeId: string }
  /** Fase 6: pede os dados do elemento escolhido para um evento manual. */
  | { type: "tag:element-info"; nodeId: string }
  /** Fase 7: gera os cards e marcadores no canvas. */
  | { type: "tag:generate"; request: GenerationRequest }
  /** Fase 7: exclui o tagueamento gerado de uma tela ("Excluir marcadores"). */
  | { type: "tag:delete-output"; frameId: string }
  /** Fase 7: quantos frames da página já têm tagueamento (antes da página inteira). */
  | { type: "tag:page-tag-status" }
  /** Fase 7: enquadra vários nodes (ex.: os grupos gerados). */
  | { type: "tag:focus-nodes"; nodeIds: string[] };

// ---------- Main -> UI ----------

export type TagMainToUiMessage =
  /**
   * Resposta ao "tag:ui-ready" — confirma que o canal próprio do
   * tagueamento funciona nos dois sentidos. `fileName` = figma.root.name
   * (o mesmo valor que depois vai para o campo "Arquivo Figma" do Forms).
   */
  | { type: "tag:ready"; fileName: string }
  | { type: "tag:last-setup"; setup: SetupSelection | null }
  | { type: "tag:selection-state"; state: TagSelectionState }
  | {
      type: "tag:mapping-progress";
      requestId: number;
      done: number;
      total: number;
      /** Lista de telas (enviada no início, na página inteira), com as puladas. */
      plan?: MappingPlanItem[];
      /** Tela sendo mapeada agora. */
      currentFrameId?: string;
      /** Tela que acabou de ser mapeada e quantos cards ela teve. */
      finished?: { frameId: string; cards: number };
      /** Componentes encontrados na tela atual. */
      componentsFound?: number;
    }
  | { type: "tag:mapping-result"; requestId: number; result: MappingResult }
  | { type: "tag:mapping-error"; requestId: number; message: string }
  | { type: "tag:element-info-result"; info: ElementInfo | null }
  | {
      type: "tag:generation-progress";
      /** Telas concluídas / total de telas. */
      done: number;
      total: number;
      /** Etapa atual e o contador dela (cards criados e preenchidos, por exemplo). */
      stage?: GenerationStage;
      stageDone?: number;
      stageTotal?: number;
    }
  | { type: "tag:generation-result"; result: GenerationResult }
  | { type: "tag:generation-error"; message: string; /** "biblioteca" = card da biblioteca indisponível. */ code?: "biblioteca" | "desconhecido" }
  | { type: "tag:output-deleted"; frameId?: string; frameName: string; cards: number }
  | { type: "tag:page-tag-status-result"; status: PageTagStatus };

/** true quando a mensagem pertence ao tagueamento (prefixo "tag:"). */
export function isTagMessageType(type: unknown): boolean {
  return typeof type === "string" && type.startsWith(TAG_MESSAGE_PREFIX);
}
