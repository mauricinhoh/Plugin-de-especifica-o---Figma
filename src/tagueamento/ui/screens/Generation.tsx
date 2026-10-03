import React from "react";
import { GenerationResult } from "../../shared/types";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { usePrefersReducedMotionCopy } from "../hooks";

/**
 * Fase 7 — telas de geração e de resultado.
 * CÓPIAS adaptadas de src/ui/components/Generating.tsx e Done.tsx
 * (acessibilidade): mesmo visual, textos e dados do tagueamento.
 */

export function Generating({ done, total }: { done: number; total: number }) {
  const reduced = usePrefersReducedMotionCopy();
  const text = total > 1 ? `Gerando tela ${Math.min(done + 1, total)} de ${total}` : "Gerando os cards…";
  return (
    <>
      <TitleBar title="Tagueamento" showLogo showClose={false} />
      <Stepper current={3} progress={total > 0 ? done / total : 0} />
      <div
        role="status"
        aria-live="polite"
        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            border: "4px solid var(--color-border)",
            borderTopColor: "var(--color-primary)",
            animation: reduced ? "pulse-opacity 1.1s ease-in-out infinite" : "spin .9s linear infinite"
          }}
        />
        <h2 style={{ fontSize: 19, fontWeight: 900, margin: "20px 0 0" }}>{text}</h2>
        <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5, color: "var(--color-text-muted)", maxWidth: 260 }}>
          Criando os cards, preenchendo os valores e posicionando os marcadores no canvas.
        </p>
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
      <div style={{ fontSize: 19, fontWeight: 900, fontVariantNumeric: "tabular-nums", color: warning ? "var(--color-warning)" : "var(--color-text-dark)" }}>
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

interface DoneProps {
  /** Resultado da geração, ou null quando a tela é de "Marcadores excluídos". */
  result: GenerationResult | null;
  deleted?: { frameName: string; cards: number } | null;
  error?: string | null;
  onShow: () => void;
  onNew: () => void;
  onExit: () => void;
  onClose: () => void;
}

export function Done({ result, deleted, error, onShow, onNew, onExit, onClose }: DoneProps) {
  const reduced = usePrefersReducedMotionCopy();
  const cards = result ? result.screens.reduce((sum, screen) => sum + screen.cards, 0) : 0;
  const avisos = result ? [...result.avisos, ...result.screens.flatMap((screen) => screen.avisos.map((aviso) => `${screen.nomeTela}: ${aviso}`))] : [];
  const failed = !!error;

  return (
    <>
      <TitleBar title="Tagueamento" showLogo onClose={onClose} />
      <div className="scroll-area" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px 24px", textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            minHeight: 64,
            borderRadius: 20,
            background: failed ? "var(--color-danger)" : "var(--color-primary)",
            boxShadow: failed ? "none" : "0 10px 26px rgba(51,130,13,.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: reduced ? undefined : "pop-in 220ms cubic-bezier(.2,.8,.3,1)"
          }}
        >
          <Icon name={failed ? "x" : "check"} size={32} color="#fff" strokeWidth={2.8} />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-.025em", margin: "22px 0 0" }}>
          {failed ? "Não deu para gerar" : deleted ? "Marcadores excluídos" : "Tagueamento pronto"}
        </h2>
        <p style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.5, color: "var(--color-text-muted)", maxWidth: 280 }}>
          {failed
            ? error
            : deleted
              ? `${deleted.cards} ${deleted.cards === 1 ? "card excluído" : "cards excluídos"} de `
              : `${cards} cards gerados ao lado de ${result && result.screens.length === 1 ? "" : `${result?.screens.length ?? 0} telas`}`}
          {!failed && deleted && <strong style={{ fontWeight: 800, color: "var(--color-text-dark)" }}>{deleted.frameName}</strong>}
          {!failed && !deleted && result && result.screens.length === 1 && (
            <strong style={{ fontWeight: 800, color: "var(--color-text-dark)" }}>{result.screens[0].nomeTela}</strong>
          )}
          {!failed ? "." : ""}
        </p>

        {!failed && !deleted && result && (
          <div style={{ marginTop: 22, display: "flex", gap: 8 }}>
            <StatBlock label="Telas" value={result.screens.length} />
            <StatBlock label="Cards" value={cards} />
            {avisos.length > 0 && <StatBlock label="Avisos" value={avisos.length} warning />}
          </div>
        )}

        {avisos.length > 0 && (
          <div style={{ marginTop: 16, width: "100%", textAlign: "left" }}>
            {avisos.map((aviso, index) => (
              <div key={index} style={{ marginTop: 6, display: "flex", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--color-warning)" }}>
                <Icon name="alert-triangle" size={13} color="var(--color-warning)" />
                <span style={{ overflowWrap: "anywhere", minWidth: 0 }}>{aviso}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid var(--color-border)", padding: "14px 24px 18px", display: "flex", flexDirection: "column", gap: 9 }}>
        {!failed && (
          <Button variant="primary" fullWidth onClick={onShow}>
            Mostrar na tela
          </Button>
        )}
        <Button variant="secondary" fullWidth onClick={onNew}>
          {failed ? "Voltar à revisão" : "Novo tagueamento"}
        </Button>
        <Button variant="ghost" fullWidth onClick={onExit}>
          Voltar ao início
        </Button>
      </div>
    </>
  );
}
