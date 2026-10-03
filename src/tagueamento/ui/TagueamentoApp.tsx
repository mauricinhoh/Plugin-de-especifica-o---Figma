import React, { useEffect, useReducer, useState } from "react";
import { onTagMessage, postToTagMain } from "./bridge";
import {
  AllVariantsCheck,
  CardDiagnosis,
  ElementInfo,
  MappingResult,
  SetupSelection,
  TagSelectionState,
  TestCardResult
} from "../shared/types";
import { buildFormsUrl } from "../shared/forms";
import { REGIONS } from "./regionsData";
import { CardDiagnostic } from "./screens/CardDiagnostic";
import { SetupScreen } from "./screens/SetupScreen";
import { FrameSelect } from "./screens/FrameSelect";
import { MappingProgress } from "./screens/MappingProgress";
import { Review } from "./screens/Review";
import { ReviewSummary } from "./screens/ReviewSummary";
import { initialReviewState, reviewReducer } from "./state/reviewStore";
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
 */

type TagScreen = "setup" | "frame" | "mapping" | "review" | "summary" | "diagnostic";

/** Se o main thread não responder com a última escolha, abre o setup vazio depois deste tempo. */
const LAST_SETUP_TIMEOUT_MS = 800;

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
  const [elementInfo, setElementInfo] = useState<ElementInfo | null>(null);

  // Diagnóstico (Fase 2)
  const [diagnosis, setDiagnosis] = useState<CardDiagnosis | null>(null);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [testCard, setTestCard] = useState<TestCardResult | null>(null);
  const [creatingTestCard, setCreatingTestCard] = useState(false);
  const [allVariants, setAllVariants] = useState<AllVariantsCheck | null>(null);
  const [checkingAllVariants, setCheckingAllVariants] = useState(false);

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
          setMappingProgress({ done: message.done, total: message.total });
          break;
        case "tag:mapping-result":
          setMapping(message.result);
          break;
        case "tag:element-info-result":
          setElementInfo(message.info);
          break;
        case "tag:mapping-error":
          setMappingError(message.message);
          break;
        case "tag:diagnosis-result":
          setReading(false);
          setDiagnosisError(null);
          setDiagnosis(message.diagnosis);
          setTestCard(null);
          break;
        case "tag:diagnosis-error":
          setReading(false);
          setDiagnosisError(message.message);
          break;
        case "tag:test-card-result":
          setCreatingTestCard(false);
          setTestCard(message.result);
          break;
        case "tag:all-variants-result":
          setCheckingAllVariants(false);
          setAllVariants(message.result);
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

  function startMapping(selectionSetup: SetupSelection) {
    setMapping(null);
    setMappingError(null);
    setMappingProgress(null);
    setScreen("mapping");
    postToTagMain({ type: "tag:run-mapping", setup: selectionSetup });
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
    else startMapping(selectionSetup);
  }

  if (screen === "diagnostic") {
    return (
      <CardDiagnostic
        diagnosis={diagnosis}
        diagnosisError={diagnosisError}
        reading={reading}
        testCard={testCard}
        creatingTestCard={creatingTestCard}
        allVariants={allVariants}
        checkingAllVariants={checkingAllVariants}
        onCheckAllVariants={() => {
          setCheckingAllVariants(true);
          postToTagMain({ type: "tag:check-all-variants" });
        }}
        onRead={() => {
          setReading(true);
          setDiagnosisError(null);
          postToTagMain({ type: "tag:diagnose-selection" });
        }}
        onCreateTestCard={(variantValues) => {
          if (!diagnosis) return;
          setCreatingTestCard(true);
          setTestCard(null);
          postToTagMain({ type: "tag:create-test-card", sourceNodeId: diagnosis.nodeId, variantValues });
        }}
        onBack={() => setScreen("setup")}
        onClose={closePlugin}
      />
    );
  }

  if (screen === "frame" && setup) {
    return (
      <FrameSelect
        setup={setup}
        formsStatus={formsStatus}
        selection={selection}
        onMap={() => startMapping(setup)}
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
        onRetry={() => (setup.modo === "tela" ? setScreen("frame") : startMapping(setup))}
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
        elementInfo={elementInfo}
        dispatch={dispatchReview}
        onScreenIndex={setReviewScreen}
        onRequestElementInfo={(nodeId) => postToTagMain({ type: "tag:element-info", nodeId })}
        onClearElementInfo={() => setElementInfo(null)}
        onFocusNode={(nodeId) => postToTagMain({ type: "tag:focus-node", nodeId })}
        onFinish={() => setScreen("summary")}
        onEditSetup={() => setScreen("setup")}
        onRemap={() => (setup.modo === "tela" ? setScreen("frame") : startMapping(setup))}
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
        onBack={() => setScreen("review")}
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
      onOpenDiagnostic={() => setScreen("diagnostic")}
    />
  );
}
