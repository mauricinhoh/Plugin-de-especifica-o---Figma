import React, { useEffect, useState } from "react";
import { onTagMessage, postToTagMain } from "./bridge";
import { CardDiagnosis, TestCardResult } from "../shared/types";
import { TitleBar } from "./components/TitleBar";
import { Stepper } from "./components/Stepper";
import { EmptyState } from "./components/EmptyState";
import { Button, ChoiceCard } from "./components/Button";
import { Icon } from "./components/Icon";
import { CardDiagnostic } from "./screens/CardDiagnostic";

/**
 * Raiz do fluxo de TAGUEAMENTO.
 *
 * Único ponto de contato com a acessibilidade: o App.tsx renderiza este
 * componente quando o PD escolhe "Tagueamento" na tela inicial, e passa
 * `onExit` para voltar a ela. Todo o resto (telas, estado, mensagens)
 * vive dentro de src/tagueamento/.
 *
 * Fase 1: base isolada + canal próprio com o main thread (tag:ui-ready → tag:ready).
 * Fase 2: ferramenta temporária "Diagnóstico do card".
 * As etapas de setup (Canal, Produto, Fluxo, Modo) entram na Fase 3.
 */

type TagScreen = "home" | "diagnostic";

interface TagueamentoAppProps {
  /** Volta para a tela inicial (escolha Acessibilidade / Tagueamento). */
  onExit: () => void;
}

export function TagueamentoApp({ onExit }: TagueamentoAppProps) {
  const [screen, setScreen] = useState<TagScreen>("home");
  const [fileName, setFileName] = useState<string | null>(null);

  const [diagnosis, setDiagnosis] = useState<CardDiagnosis | null>(null);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [testCard, setTestCard] = useState<TestCardResult | null>(null);
  const [creatingTestCard, setCreatingTestCard] = useState(false);

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
        default:
          break;
      }
    });
    postToTagMain({ type: "tag:ui-ready" });
    return stop;
  }, []);

  const closePlugin = () => postToTagMain({ type: "tag:close-plugin" });

  if (screen === "diagnostic") {
    return (
      <CardDiagnostic
        diagnosis={diagnosis}
        diagnosisError={diagnosisError}
        reading={reading}
        testCard={testCard}
        creatingTestCard={creatingTestCard}
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
        onBack={() => setScreen("home")}
        onClose={closePlugin}
      />
    );
  }

  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onExit} onClose={closePlugin} />
      <Stepper current={1} progress={0} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: 24 }}>
        <EmptyState
          iconName="tag"
          title="Tagueamento em construção"
          description="O fluxo de Google Analytics está sendo desenvolvido por etapas. A especificação de acessibilidade continua disponível na tela inicial."
          maxWidth={290}
        >
          <div style={{ marginTop: 22, width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
            <ChoiceCard
              icon={<Icon name="components" size={20} />}
              title="Diagnóstico do card"
              description="Ferramenta de desenvolvimento: lê o card de GA selecionado"
              onClick={() => setScreen("diagnostic")}
            />
            <Button variant="secondary" fullWidth onClick={onExit} icon={<Icon name="chevron-left" size={15} />}>
              Voltar ao início
            </Button>
          </div>
        </EmptyState>
      </div>

      <div
        role="status"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "0 24px 20px",
          fontSize: 11.5,
          fontWeight: 700,
          color: fileName ? "var(--color-text-subtle)" : "var(--color-text-disabled)"
        }}
      >
        <Icon
          name={fileName ? "check" : "info"}
          size={12}
          color={fileName ? "var(--color-primary)" : "var(--color-text-disabled)"}
        />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {fileName ? `Conectado ao arquivo ${fileName}` : "Conectando ao arquivo…"}
        </span>
      </div>
    </>
  );
}
