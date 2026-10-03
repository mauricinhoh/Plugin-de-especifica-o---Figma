import React, { useEffect, useState } from "react";
import { onTagMessage, postToTagMain } from "./bridge";
import { AllVariantsCheck, CardDiagnosis, SetupSelection, TestCardResult } from "../shared/types";
import { buildFormsUrl } from "../shared/forms";
import { REGIONS } from "./regionsData";
import { CardDiagnostic } from "./screens/CardDiagnostic";
import { SetupScreen } from "./screens/SetupScreen";
import { FormsStatus, SetupSummary } from "./screens/SetupSummary";

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
 */

type TagScreen = "setup" | "summary" | "diagnostic";

/** Se o main thread não responder com a última escolha, abre o setup vazio depois deste tempo. */
const LAST_SETUP_TIMEOUT_MS = 800;

interface TagueamentoAppProps {
  /** Volta para a tela inicial (escolha Acessibilidade / Tagueamento). */
  onExit: () => void;
}

export function TagueamentoApp({ onExit }: TagueamentoAppProps) {
  const [screen, setScreen] = useState<TagScreen>("setup");
  const [fileName, setFileName] = useState<string | null>(null);

  const [lastSetup, setLastSetup] = useState<SetupSelection | null>(null);
  const [lastSetupLoaded, setLastSetupLoaded] = useState(false);
  const [setup, setSetup] = useState<SetupSelection | null>(null);
  const [formsStatus, setFormsStatus] = useState<FormsStatus>(null);

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
        case "tag:last-setup":
          setLastSetup(message.setup);
          setLastSetupLoaded(true);
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

  const closePlugin = () => postToTagMain({ type: "tag:close-plugin" });

  function handleSetupComplete(selection: SetupSelection) {
    setSetup(selection);
    postToTagMain({ type: "tag:save-setup", setup: selection });

    // "Outro" (spec 2.3): abre o Forms pré-preenchido; o parecer segue sem esperar.
    let status: FormsStatus = null;
    if (selection.produtoOutro || selection.fluxoOutro) {
      const url = buildFormsUrl({
        canal: selection.canal,
        produto: selection.produto,
        tarefa: selection.fluxo,
        region: selection.region,
        subregion: selection.subregion,
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
    setScreen("summary");
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

  if (screen === "summary" && setup) {
    return (
      <SetupSummary
        setup={setup}
        formsStatus={formsStatus}
        onEdit={() => setScreen("setup")}
        onExit={onExit}
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
