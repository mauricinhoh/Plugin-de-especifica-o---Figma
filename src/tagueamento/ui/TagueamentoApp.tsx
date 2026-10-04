import React, { useEffect, useReducer, useState, useRef } from "react";
import { onTagMessage, postToTagMain } from "./bridge";
import {
  ElementInfo,
  GenerationResult,
  MappingResult,
  PageTagStatus,
  SetupSelection,
  TagSelectionState
} from "../shared/types";
import { buildFormsUrl } from "../shared/forms";
import { REGIONS } from "./regionsData";
import { SetupScreen } from "./screens/SetupScreen";
import { FrameSelect } from "./screens/FrameSelect";
import { MappingProgress } from "./screens/MappingProgress";
import { Review } from "./screens/Review";
import { ReviewSummary } from "./screens/ReviewSummary";
import { buildGenerationRequest, initialReviewState, reviewReducer } from "./state/reviewStore";
import { Done, Generating } from "./screens/Generation";
import { PageTaggedChoice } from "./screens/PageTaggedChoice";
import { FormsStatus } from "./components/SetupBar";

/**
 * Raiz do fluxo de TAGUEAMENTO.
 *
 * Único ponto de contato com a acessibilidade: o App.tsx renderiza este
 * componente quando o PD escolhe "Tagueamento" na tela inicial, e passa
 * `onExit` para voltar a ela. Todo o resto (telas, estado, mensagens)
 * vive dentro de src/tagueamento/.
 *
 * Fase 1: base isolada + canal próprio com o main thread (tag:ui-ready → tag:ready).
 * Fase 2: ferramenta temporária "Diagnóstico do card" (2.1: verificação de todas as variantes).
 * Fase 3: setup (Canal, Produto, Fluxo, Modo), "Outro" + Forms, memória da última escolha.
 * Fase 4: seleção de frame (tela por tela) ou página inteira → mapeamento.
 * Fase 6: revisão editável (Tela X de N, Pular revisão, evento manual) → resumo,
 *         com a geração bloqueada enquanto houver pendência.
 * Fase 7: geração dos cards e marcadores, tela já tagueada (refazer/excluir),
 *         pergunta única na página inteira, telas de geração e de sucesso.
 */

type TagScreen =
  | "setup"
  | "frame"
  | "pageChoice"
  | "mapping"
  | "review"
  | "summary"
  | "generating"
  | "done";

/** Se o main thread não responder com a última escolha, abre o setup vazio depois deste tempo. */
const LAST_SETUP_TIMEOUT_MS = 2000;

const NO_SELECTION: TagSelectionState = { valid: false, nodeId: null, nodeName: null };

interface TagueamentoAppProps {
  /** Volta para a tela inicial (escolha Acessibilidade / Tagueamento). */
  onExit: () => void;
}

export function TagueamentoApp({ onExit }: TagueamentoAppProps) {
  const [screen, setScreen] = useState<TagScreen>("setup");
  const [fileName, setFileName] = useState<string | null>(null);

  // Setup (Fase 3)
  const [lastSetup, setLastSetup] = useState<SetupSelection | null>(null);
  const [lastSetupLoaded, setLastSetupLoaded] = useState(false);
  const [setup, setSetup] = useState<SetupSelection | null>(null);
  const [formsStatus, setFormsStatus] = useState<FormsStatus>(null);

  // Mapeamento (Fase 4)
  const [selection, setSelection] = useState<TagSelectionState>(NO_SELECTION);
  const [mapping, setMapping] = useState<MappingResult | null>(null);
  const [mappingProgress, setMappingProgress] = useState<{ done: number; total: number } | null>(null);
  const [mappingError, setMappingError] = useState<string | null>(null);

  // Revisão (Fase 6)
  const [review, dispatchReview] = useReducer(reviewReducer, null);
  const [reviewScreen, setReviewScreen] = useState(0);
  // Resposta do "Adicionar evento manual": { info: null } quando o elemento sumiu.
  const [elementReply, setElementReply] = useState<{ info: ElementInfo | null } | null>(null);
  // Só a resposta do pedido de mapeamento mais recente vale.
  const mappingRequest = useRef(0);

  // Geração (Fase 7)
  const [pageStatus, setPageStatus] = useState<PageTagStatus | null>(null);
  const [generationProgress, setGenerationProgress] = useState({ done: 0, total: 0 });
  const [generation, setGeneration] = useState<GenerationResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<{ frameName: string; cards: number } | null>(null);

  // Diagnóstico (Fase 2)

  useEffect(() => {
    const stop = onTagMessage((message) => {
      switch (message.type) {
        case "tag:ready":
          setFileName(message.fileName);
          break;
        case "tag:last-setup":
          setLastSetup(message.setup);
          setLastSetupLoaded(true);
          break;
        case "tag:selection-state":
          setSelection(message.state);
          break;
        case "tag:mapping-progress":
          if (message.requestId !== mappingRequest.current) break;
          setMappingProgress({ done: message.done, total: message.total });
          break;
        case "tag:mapping-result":
          if (message.requestId !== mappingRequest.current) break;
          setMapping(message.result);
          break;
        case "tag:element-info-result":
          setElementReply({ info: message.info });
          break;
        case "tag:mapping-error":
          if (message.requestId !== mappingRequest.current) break;
          setMappingError(message.message);
          break;
        case "tag:page-tag-status-result":
          setPageStatus(message.status);
          break;
        case "tag:generation-progress":
          setGenerationProgress({ done: message.done, total: message.total });
          break;
        case "tag:generation-result":
          setGeneration(message.result);
          setGenerationError(null);
          setDeleted(null);
          setScreen("done");
          break;
        case "tag:generation-error":
          setGenerationError(message.message);
          setGeneration(null);
          setDeleted(null);
          setScreen("done");
          break;
        case "tag:output-deleted":
          setDeleted({ frameName: message.frameName, cards: message.cards });
          setGeneration(null);
          setGenerationError(null);
          setScreen("done");
          break;
        default:
          break;
      }
    });
    postToTagMain({ type: "tag:ui-ready" });
    postToTagMain({ type: "tag:get-last-setup" });
    const fallback = window.setTimeout(() => setLastSetupLoaded(true), LAST_SETUP_TIMEOUT_MS);
    return () => {
      stop();
      window.clearTimeout(fallback);
    };
  }, []);

  // Resultado do mapeamento → abre a revisão (se tiver pelo menos uma tela).
  useEffect(() => {
    if (!mapping || !setup || screen !== "mapping" || mapping.screens.length === 0) return;
    dispatchReview({ type: "init", state: initialReviewState(mapping, setup) });
    setReviewScreen(0);
    setScreen("review");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapping]);

  // O listener de seleção do tagueamento só fica ligado na seleção de tela e na revisão (evento manual).
  useEffect(() => {
    if (screen !== "frame" && screen !== "review") return;
    postToTagMain({ type: "tag:watch-selection", enabled: true });
    return () => postToTagMain({ type: "tag:watch-selection", enabled: false });
  }, [screen]);

  const closePlugin = () => postToTagMain({ type: "tag:close-plugin" });

  function startMapping(selectionSetup: SetupSelection, skipTagged = false) {
    setMapping(null);
    setMappingError(null);
    setMappingProgress(null);
    setScreen("mapping");
    mappingRequest.current += 1;
    postToTagMain({ type: "tag:run-mapping", requestId: mappingRequest.current, setup: selectionSetup, skipTagged });
  }

  // Página inteira: antes de mapear, vê se alguma tela já tem tagueamento (pergunta uma vez).
  function startPageMode() {
    setPageStatus(null);
    setScreen("pageChoice");
    postToTagMain({ type: "tag:page-tag-status" });
  }

  useEffect(() => {
    if (screen !== "pageChoice" || !pageStatus || !setup) return;
    if (pageStatus.tagged.length === 0) startMapping(setup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageStatus, screen]);

  function startGeneration() {
    if (!review) return;
    setGenerationProgress({ done: 0, total: review.screens.length });
    setScreen("generating");
    postToTagMain({ type: "tag:generate", request: buildGenerationRequest(review) });
  }

  function handleSetupComplete(selectionSetup: SetupSelection) {
    setSetup(selectionSetup);
    postToTagMain({ type: "tag:save-setup", setup: selectionSetup });

    // "Outro" (spec 2.3): abre o Forms pré-preenchido; o parecer segue sem esperar.
    let status: FormsStatus = null;
    if (selectionSetup.produtoOutro || selectionSetup.fluxoOutro) {
      const url = buildFormsUrl({
        canal: selectionSetup.canal,
        produto: selectionSetup.produto,
        tarefa: selectionSetup.fluxo,
        region: selectionSetup.region,
        subregion: selectionSetup.subregion,
        arquivoFigma: fileName ?? ""
      });
      if (url) {
        postToTagMain({ type: "tag:open-external", url });
        status = "opened";
      } else {
        status = "not-configured";
      }
    }
    setFormsStatus(status);

    if (selectionSetup.modo === "tela") setScreen("frame");
    else startPageMode();
  }

  if (screen === "frame" && setup) {
    return (
      <FrameSelect
        setup={setup}
        formsStatus={formsStatus}
        selection={selection}
        onMap={() => startMapping(setup)}
        onDeleteOutput={() => selection.nodeId && postToTagMain({ type: "tag:delete-output", frameId: selection.nodeId })}
        onEditSetup={() => setScreen("setup")}
        onExit={onExit}
        onClose={closePlugin}
      />
    );
  }

  if (screen === "mapping" && setup) {
    return (
      <MappingProgress
        setup={setup}
        formsStatus={formsStatus}
        progress={mappingProgress}
        error={mappingError}
        avisos={mapping && mapping.screens.length === 0 ? mapping.avisos : []}
        onRetry={() => (setup.modo === "tela" ? setScreen("frame") : startPageMode())}
        onEditSetup={() => setScreen("setup")}
        onClose={closePlugin}
      />
    );
  }

  if (screen === "review" && setup && review) {
    return (
      <Review
        setup={setup}
        formsStatus={formsStatus}
        state={review}
        screenIndex={reviewScreen}
        selection={selection}
        elementReply={elementReply}
        dispatch={dispatchReview}
        onScreenIndex={setReviewScreen}
        onRequestElementInfo={(nodeId) => postToTagMain({ type: "tag:element-info", nodeId })}
        onClearElementInfo={() => setElementReply(null)}
        onFocusNode={(nodeId) => postToTagMain({ type: "tag:focus-node", nodeId })}
        onFinish={() => setScreen("summary")}
        onEditSetup={() => setScreen("setup")}
        onRemap={() => (setup.modo === "tela" ? setScreen("frame") : startPageMode())}
        remapLabel={setup.modo === "tela" ? "Mapear outra tela" : "Mapear de novo"}
        onClose={closePlugin}
      />
    );
  }

  if (screen === "summary" && setup && review) {
    return (
      <ReviewSummary
        setup={setup}
        state={review}
        onGoToScreen={(index) => {
          setReviewScreen(index);
          setScreen("review");
        }}
        onGenerate={startGeneration}
        onBack={() => setScreen("review")}
        onClose={closePlugin}
      />
    );
  }

  if (screen === "pageChoice" && setup) {
    if (!pageStatus || pageStatus.tagged.length === 0) return null; // consultando, ou segue direto para o mapeamento
    return (
      <PageTaggedChoice
        status={pageStatus}
        onRedoAll={() => startMapping(setup, false)}
        onSkip={() => startMapping(setup, true)}
        onBack={() => setScreen("setup")}
        onClose={closePlugin}
      />
    );
  }

  if (screen === "generating") {
    return <Generating done={generationProgress.done} total={generationProgress.total} />;
  }

  if (screen === "done") {
    return (
      <Done
        result={generation}
        deleted={deleted}
        error={generationError}
        onShow={() => {
          const ids = generation ? generation.screens.map((s) => s.groupId).filter((id): id is string => !!id) : [];
          if (ids.length > 0) postToTagMain({ type: "tag:focus-nodes", nodeIds: ids });
          else if (selection.nodeId) postToTagMain({ type: "tag:focus-nodes", nodeIds: [selection.nodeId] });
        }}
        onNew={() => {
          if (generationError) {
            setScreen("summary");
            return;
          }
          setGeneration(null);
          setDeleted(null);
          if (setup?.modo === "tela") setScreen("frame");
          else setScreen("setup");
        }}
        onClose={closePlugin}
      />
    );
  }

  if (!lastSetupLoaded) {
    // Espera a última escolha chegar do main thread (é rápido) para abrir o setup já preenchido.
    return null;
  }

  return (
    <SetupScreen
      data={REGIONS}
      initial={setup ?? lastSetup}
      onComplete={handleSetupComplete}
      onExit={onExit}
      onClose={closePlugin}
    />
  );
}
