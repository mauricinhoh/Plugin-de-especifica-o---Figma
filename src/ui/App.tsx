import React, { useEffect, useRef, useState } from "react";
import { postToMain } from "./mainBridge";
import { MainToUiMessage } from "../shared/messages";
import {
  ComponentTypeOption,
  GenerationStage,
  GenerationSummary,
  ScreenAnalysisResult,
  ScreenContext
} from "../shared/types";
import { useSpecificationStore } from "./state/specificationStore";
import { Step0 } from "./components/Step0";
import { Step1 } from "./components/Step1";
import { Step2 } from "./components/Step2";
import { ContextChoice } from "./components/ContextChoice";
import { IncompatibilityBlock } from "./components/IncompatibilityBlock";
import { Generating } from "./components/Generating";
import { Done } from "./components/Done";
import { Icon } from "./components/Icon";

type Screen = "step0" | "step1" | "context-choice" | "incompatibility" | "step2" | "generating" | "done";

interface SelectionMeta {
  nodeType?: string;
  width?: number;
  height?: number;
  layerCount?: number;
}

const CONTEXT_BADGE: Record<ScreenContext, string> = { WEB: "Web", APLICATIVO: "Aplicativo" };

export function App() {
  const [screen, setScreen] = useState<Screen>("step0");
  const [designerName, setDesignerName] = useState("");
  const [typeOptions, setTypeOptions] = useState<ComponentTypeOption[]>([]);
  const [selectionValid, setSelectionValid] = useState(false);
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);
  const [selectionMeta, setSelectionMeta] = useState<SelectionMeta>({});
  const [lastAnalysis, setLastAnalysis] = useState<ScreenAnalysisResult | null>(null);
  const [manualSelectionEnabled, setManualSelectionEnabled] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [generationStage, setGenerationStage] = useState<GenerationStage | null>(null);
  const [generationDone, setGenerationDone] = useState(0);
  const [generationTotal, setGenerationTotal] = useState(0);
  const [generationSummary, setGenerationSummary] = useState<GenerationSummary | null>(null);

  const store = useSpecificationStore();
  const itemsRef = useRef(store.items);
  itemsRef.current = store.items;

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const message = event.data?.pluginMessage as MainToUiMessage | undefined;
      if (!message) return;
      handleMainMessage(message);
    }
    window.addEventListener("message", onMessage);
    postToMain({ type: "ui-ready" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Mantém o main thread informado de quais nodeIds já estão na
  // especificação, para evitar duplicações na seleção manual (seção 23).
  useEffect(() => {
    postToMain({ type: "sync-known-node-ids", nodeIds: store.items.map((item) => item.nodeId) });
  }, [store.items]);

  function handleMainMessage(message: MainToUiMessage) {
    switch (message.type) {
      case "designer-name":
        setDesignerName(message.name);
        break;
      case "component-type-options":
        setTypeOptions(message.options);
        break;
      case "selection-state":
        setSelectionValid(message.valid);
        setSelectedNodeName(message.nodeName);
        setSelectionMeta({
          nodeType: message.nodeType,
          width: message.width,
          height: message.height,
          layerCount: message.layerCount
        });
        break;
      case "analysis-result":
        applyAnalysisResult(message.result);
        break;
      case "analysis-error":
        setErrorBanner(message.message);
        break;
      case "manual-item-added":
        store.addItem(message.item);
        break;
      case "manual-item-duplicate":
        // Já está na lista — nenhuma ação necessária (seção 23).
        break;
      case "generation-progress":
        setGenerationStage(message.stage);
        setGenerationDone(message.done);
        setGenerationTotal(message.total);
        break;
      case "generation-error":
        setErrorBanner(message.message);
        // Falha real na geração: volta para a Etapa 2 preservando os
        // itens (o store nunca foi limpo).
        if (screen === "generating") {
          setScreen("step2");
        }
        break;
      case "generation-complete":
        setGenerationSummary(message.summary);
        setScreen("done");
        break;
      default:
        break;
    }
  }

  function applyAnalysisResult(result: ScreenAnalysisResult) {
    setLastAnalysis(result);
    setErrorBanner(null);

    if (result.requiresContextChoice) {
      setScreen("context-choice");
      return;
    }
    if (result.incompatibilities.length > 0 && result.context) {
      setScreen("incompatibility");
      return;
    }
    store.setItems(result.items);
    setScreen("step2");
  }

  function handleChooseContext(context: ScreenContext) {
    postToMain({ type: "resolve-context-choice", context });
  }

  function handleBackToSelection() {
    setLastAnalysis(null);
    setScreen("step1");
    postToMain({ type: "request-selection-state" });
  }

  function handleToggleManualSelection() {
    const next = !manualSelectionEnabled;
    setManualSelectionEnabled(next);
    postToMain({ type: "toggle-manual-selection", enabled: next });
  }

  function handleGenerate() {
    setGenerationStage(null);
    setGenerationDone(0);
    setGenerationTotal(0);
    setScreen("generating");
    postToMain({ type: "generate-specifications", items: itemsRef.current });
  }

  function handleClose() {
    postToMain({ type: "close-plugin" });
  }

  function handleNewSpecification() {
    postToMain({ type: "reset-flow" });
    store.setItems([]);
    setLastAnalysis(null);
    setGenerationSummary(null);
    setScreen("step0");
  }

  const contextBadge = lastAnalysis?.context ? CONTEXT_BADGE[lastAnalysis.context] : undefined;

  return (
    <div className="app-shell">
      {errorBanner && (
        <div
          role="alert"
          style={{
            padding: "10px 20px",
            background: "#FDECEC",
            borderBottom: "1px solid var(--color-danger-border)",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <Icon name="alert-circle" size={14} color="var(--color-danger)" />
          <span style={{ flex: 1, fontSize: "12.5px", fontWeight: 700, color: "var(--color-danger)" }}>
            {errorBanner}
          </span>
          <button
            type="button"
            aria-label="Dispensar aviso"
            onClick={() => setErrorBanner(null)}
            style={{ border: "none", background: "transparent", padding: 4 }}
          >
            <Icon name="x" size={13} color="var(--color-danger)" />
          </button>
        </div>
      )}

      {screen === "step0" && (
        <Step0
          designerName={designerName}
          onClose={handleClose}
          onSelectAccessibility={() => {
            setScreen("step1");
            // Segunda camada de segurança: pede o estado atual da
            // seleção de novo ao entrar na Etapa 1, independente do
            // listener de "selectionchange" já estar ativo ou não.
            postToMain({ type: "request-selection-state" });
          }}
        />
      )}

      {screen === "step1" && (
        <Step1
          selectionValid={selectionValid}
          selectedNodeName={selectedNodeName}
          selectedNodeType={selectionMeta.nodeType}
          selectedWidth={selectionMeta.width}
          selectedHeight={selectionMeta.height}
          selectedLayerCount={selectionMeta.layerCount}
          onBack={() => setScreen("step0")}
          onClose={handleClose}
          onStartAnalysis={() => postToMain({ type: "start-analysis" })}
        />
      )}

      {screen === "context-choice" && (
        <ContextChoice
          screenName={lastAnalysis?.screenName ?? null}
          onChoose={handleChooseContext}
          onBack={handleBackToSelection}
          onClose={handleClose}
        />
      )}

      {screen === "incompatibility" && lastAnalysis?.context && (
        <IncompatibilityBlock
          context={lastAnalysis.context}
          incompatibilities={lastAnalysis.incompatibilities}
          onBackToSelection={handleBackToSelection}
          onFocusNode={(nodeId) => postToMain({ type: "focus-node", nodeId })}
          onClose={handleClose}
        />
      )}

      {screen === "step2" && (
        <Step2
          items={store.items}
          options={typeOptions}
          detachWarnings={lastAnalysis?.detachWarnings ?? []}
          manualSelectionEnabled={manualSelectionEnabled}
          contextBadge={contextBadge}
          onBack={handleBackToSelection}
          onClose={handleClose}
          onTypeChange={store.setType}
          onVerbalizationChange={store.setVerbalization}
          onRemove={store.remove}
          onReorder={store.reorder}
          onToggleManualSelection={handleToggleManualSelection}
          onGenerate={handleGenerate}
          onRerunAnalysis={() => postToMain({ type: "start-analysis" })}
        />
      )}

      {screen === "generating" && (
        <Generating stage={generationStage} done={generationDone} total={generationTotal} />
      )}

      {screen === "done" && generationSummary && (
        <Done
          summary={generationSummary}
          onViewOnCanvas={() => postToMain({ type: "focus-generation-output" })}
          onNewSpecification={handleNewSpecification}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
