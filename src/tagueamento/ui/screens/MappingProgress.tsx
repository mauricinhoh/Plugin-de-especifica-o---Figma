import React from "react";
import { SetupSelection } from "../../shared/types";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { FormsStatus, SetupBar } from "../components/SetupBar";
import { usePrefersReducedMotionCopy } from "../hooks";

/** Fase 4/6 — "Mapeando tela X de N", e o erro do mapeamento, se houver. */

interface MappingProgressProps {
  setup: SetupSelection;
  formsStatus: FormsStatus;
  progress: { done: number; total: number } | null;
  error: string | null;
  avisos: string[];
  onRetry: () => void;
  onEditSetup: () => void;
  onClose: () => void;
}

export function MappingProgress({ setup, formsStatus, progress, error, avisos, onRetry, onEditSetup, onClose }: MappingProgressProps) {
  const reduced = usePrefersReducedMotionCopy();
  const finishedEmpty = !error && avisos.length > 0;
  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onEditSetup} onClose={onClose} />
      <Stepper current={2} progress={0.1} />
      <div className="scroll-area" style={{ padding: "18px 24px 24px" }}>
        <SetupBar setup={setup} formsStatus={formsStatus} onEdit={onEditSetup} />
        {!error && !finishedEmpty && (
          <div role="status" style={{ marginTop: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <span
              aria-hidden="true"
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                border: "3px solid var(--color-primary-tint)",
                borderTopColor: "var(--color-primary)",
                display: "inline-block",
                animation: reduced ? undefined : "spin .8s linear infinite"
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 800 }}>
              {progress && progress.total > 1
                ? `Mapeando tela ${Math.min(progress.done + 1, progress.total)} de ${progress.total}`
                : "Mapeando a tela…"}
            </span>
          </div>
        )}
        {(error || finishedEmpty) && (
          <div
            role="alert"
            style={{
              marginTop: 20,
              display: "flex",
              gap: 8,
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-danger-bg)",
              border: "1px solid var(--color-danger-border)",
              color: "var(--color-danger)",
              fontSize: 12.5,
              fontWeight: 700
            }}
          >
            <Icon name="alert-circle" size={14} color="var(--color-danger)" />
            <span>{error ?? avisos.join(" ")}</span>
          </div>
        )}
      </div>
      {(error || finishedEmpty) && (
        <div style={{ borderTop: "1px solid var(--color-border)", padding: "12px 24px 18px" }}>
          <Button variant="secondary" fullWidth onClick={onRetry} icon={<Icon name="refresh" size={15} />}>
            Tentar de novo
          </Button>
        </div>
      )}
    </>
  );
}
