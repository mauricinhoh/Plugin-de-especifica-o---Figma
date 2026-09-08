import React from "react";
import { TitleBar } from "./TitleBar";
import { Stepper } from "./Stepper";
import { Icon } from "./Icon";
import { GenerationStage } from "../../shared/types";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

interface GeneratingProps {
  stage: GenerationStage | null;
  done: number;
  total: number;
}

const STAGE_ORDER: GenerationStage[] = ["reading-order", "markers", "table"];

const STAGE_LABELS: Record<GenerationStage, string> = {
  "reading-order": "Ordem de leitura calculada",
  markers: "Marcadores posicionados",
  table: "Tabela do parecer"
};

function stageIndex(stage: GenerationStage | null): number {
  if (!stage) return -1;
  return STAGE_ORDER.indexOf(stage);
}

export function Generating({ stage, done, total }: GeneratingProps) {
  const reducedMotion = usePrefersReducedMotion();
  const currentIndex = stageIndex(stage);
  const progress = currentIndex < 0 ? 0 : (currentIndex + (total > 0 ? done / total : 0)) / STAGE_ORDER.length;

  const liveText =
    stage && total > 0 ? `${STAGE_LABELS[stage]} (${done}/${total})` : stage ? STAGE_LABELS[stage] : "Preparando…";

  return (
    <>
      <TitleBar title="Especificação de Handoff" showLogo showClose={false} />
      <Stepper current={3} progress={progress} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center"
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            border: "4px solid var(--color-border)",
            borderTopColor: "var(--color-primary)",
            animation: reducedMotion ? "pulse-opacity 1.1s ease-in-out infinite" : "spin .9s linear infinite"
          }}
        />

        <h2 style={{ marginTop: 20, fontSize: 19, fontWeight: 900, margin: "20px 0 0" }}>
          Gerando especificações…
        </h2>
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--color-text-muted)",
            maxWidth: 250
          }}
        >
          Desenhando marcadores e escrevendo o parecer no canvas.
        </p>

        <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          {liveText}
        </span>

        <div style={{ marginTop: 24, maxWidth: 280, textAlign: "left", display: "flex", flexDirection: "column", gap: 9 }}>
          {STAGE_ORDER.map((s, i) => {
            const isDone = i < currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <div
                key={s}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "var(--color-text-muted)"
                }}
              >
                {isDone ? (
                  <Icon name="check" size={15} color="var(--color-primary)" />
                ) : isCurrent ? (
                  <Icon name="check" size={15} color="var(--color-border-strong)" />
                ) : (
                  <span
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: "50%",
                      border: "2px dashed #C8D0BF",
                      display: "inline-block"
                    }}
                  />
                )}
                <span style={{ color: isCurrent || isDone ? "var(--color-text-muted)" : "#B0B8A6" }}>
                  {STAGE_LABELS[s]}
                  {isCurrent && total > 0 ? ` (${done}/${total})` : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
