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

import { AllVariantsCheck, CardDiagnosis, SetupSelection, TestCardResult } from "./types";

export const TAG_MESSAGE_PREFIX = "tag:";

// ---------- UI -> Main ----------

export type TagUiToMainMessage =
  /** A tela do tagueamento abriu e está pronta para receber mensagens. */
  | { type: "tag:ui-ready" }
  /** Fecha o plugin a partir do fluxo de tagueamento. */
  | { type: "tag:close-plugin" }
  /** Fase 2: lê o card selecionado no canvas (chave, variantes, propriedades, camadas). */
  | { type: "tag:diagnose-selection" }
  /**
   * Fase 2: cria um card de teste ao lado do card diagnosticado, aplicando
   * os valores de variante escolhidos (ex.: { Evento: "[App] screen_view" }).
   */
  | { type: "tag:create-test-card"; sourceNodeId: string; variantValues: Record<string, string> }
  /** Fase 2.1: importa o card pela chave e confere todas as variantes com a spec 7.2. */
  | { type: "tag:check-all-variants" }
  /** Fase 3: pede a última escolha do setup (guardada em figma.clientStorage, chave própria). */
  | { type: "tag:get-last-setup" }
  /** Fase 3: guarda a escolha do setup para o próximo uso. */
  | { type: "tag:save-setup"; setup: SetupSelection }
  /** Fase 3: abre um link no navegador (Forms do "Outro") com figma.openExternal. */
  | { type: "tag:open-external"; url: string };

// ---------- Main -> UI ----------

export type TagMainToUiMessage =
  /**
   * Resposta ao "tag:ui-ready" — confirma que o canal próprio do
   * tagueamento funciona nos dois sentidos. `fileName` = figma.root.name
   * (o mesmo valor que depois vai para o campo "Arquivo Figma" do Forms).
   */
  | { type: "tag:ready"; fileName: string }
  | { type: "tag:diagnosis-result"; diagnosis: CardDiagnosis }
  | { type: "tag:diagnosis-error"; message: string }
  | { type: "tag:test-card-result"; result: TestCardResult }
  | { type: "tag:all-variants-result"; result: AllVariantsCheck }
  | { type: "tag:last-setup"; setup: SetupSelection | null };

/** true quando a mensagem pertence ao tagueamento (prefixo "tag:"). */
export function isTagMessageType(type: unknown): boolean {
  return typeof type === "string" && type.startsWith(TAG_MESSAGE_PREFIX);
}
