import React from "react";
import { TitleBar } from "./TitleBar";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { GenerationSummary } from "../../shared/types";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

interface DoneProps {
  summary: GenerationSummary;
  onViewOnCanvas: () => void;
  onNewSpecification: () => void;
  onClose: () => void;
}

export function Done({ summary, onViewOnCanvas, onNewSpecification, onClose }: DoneProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <>
      <TitleBar title="Especificação de Handoff" showLogo onClose={onClose} />
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
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: "var(--color-primary)",
            boxShadow: "0 10px 26px rgba(51,130,13,.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: reducedMotion ? undefined : "pop-in 220ms cubic-bezier(.2,.8,.3,1)"
          }}
        >
          <Icon name="check" size={32} color="#fff" strokeWidth={2.8} />
        </div>

        <h2 style={{ marginTop: 22, fontSize: 22, fontWeight: 900, letterSpacing: "-.025em", margin: "22px 0 0" }}>
          Especificação pronta
        </h2>
        <p style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.5, color: "var(--color-text-muted)", maxWidth: 270 }}>
          {summary.componentCount} componentes especificados ao lado de{" "}
          <strong style={{ fontWeight: 800, color: "var(--color-text-dark)" }}>{summary.screenName}</strong>.
        </p>

        <div style={{ marginTop: 22, display: "flex", gap: 8 }}>
          <StatBlock label="Componentes" value={summary.componentCount} />
          <StatBlock label="Verbalizações" value={summary.verbalizationCount} />
          {summary.warningCount > 0 && <StatBlock label="Alertas" value={summary.warningCount} warning />}
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "14px 24px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 9
        }}
      >
        <Button variant="primary" fullWidth onClick={onViewOnCanvas}>
          Ver no canvas
        </Button>
        <Button variant="secondary" fullWidth onClick={onNewSpecification}>
          Nova especificação
        </Button>
      </div>
    </>
  );
}

function StatBlock({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) {
  return (
    <div
      style={{
        padding: "11px 14px",
        borderRadius: 11,
        background: warning ? "var(--color-warning-bg)" : "var(--color-surface-muted)",
        border: `1px solid ${warning ? "var(--color-warning-border)" : "var(--color-border)"}`,
        textAlign: "left"
      }}
    >
      <div
        style={{
          fontSize: 19,
          fontWeight: 900,
          fontVariantNumeric: "tabular-nums",
          color: warning ? "var(--color-warning)" : "var(--color-text-dark)"
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "10.5px",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: ".05em",
          color: warning ? "var(--color-warning)" : "var(--color-text-subtle)",
          marginTop: 2
        }}
      >
        {label}
      </div>
    </div>
  );
}
