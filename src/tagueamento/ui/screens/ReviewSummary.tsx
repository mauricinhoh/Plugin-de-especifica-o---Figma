import React from "react";
import { SetupSelection } from "../../shared/types";
import { ReviewState, screenPendencias, totalPendencias } from "../state/reviewStore";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";

/**
 * Fase 6/7 — resumo da revisão. Pendência BLOQUEIA a geração (decisão do Mau,
 * 03/10/2026): "Gerar cards" só habilita com zero pendências.
 */

interface ReviewSummaryProps {
  setup: SetupSelection;
  state: ReviewState;
  onGoToScreen: (index: number) => void;
  onGenerate: () => void;
  onBack: () => void;
  onClose: () => void;
}

export function ReviewSummary({ setup, state, onGoToScreen, onGenerate, onBack, onClose }: ReviewSummaryProps) {
  const pending = totalPendencias(state);
  const cards = state.screens.reduce((sum, screen) => sum + screen.items.length, 0);

  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onBack} onClose={onClose} />
      <Stepper current={3} progress={0} />
      <div className="scroll-area" style={{ padding: "18px 24px 20px" }}>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 900, letterSpacing: "-.025em" }}>
          {pending > 0 ? "Ainda há pendências" : "Revisão concluída"}
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.45, color: "var(--color-text-muted)" }}>
          {state.screens.length} {state.screens.length === 1 ? "tela" : "telas"} · {cards} cards · {setup.region} · {setup.subregion}
        </p>

        <div
          role="status"
          style={{
            marginTop: 14,
            display: "flex",
            gap: 8,
            padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            background: pending > 0 ? "var(--color-warning-bg)" : "var(--color-primary-tint)",
            border: `1px solid ${pending > 0 ? "var(--color-warning-border)" : "transparent"}`,
            color: pending > 0 ? "var(--color-warning)" : "var(--color-primary-ink)",
            fontSize: 12.5,
            fontWeight: 700,
            lineHeight: 1.4
          }}
        >
          <Icon name={pending > 0 ? "alert-triangle" : "check"} size={14} color={pending > 0 ? "var(--color-warning)" : "var(--color-primary)"} />
          <span>
            {pending > 0
              ? `Resolva as ${pending} ${pending === 1 ? "pendência" : "pendências"} para gerar os cards.`
              : "Tudo revisado. Os cards e marcadores vão ser criados ao lado de cada tela."}
          </span>
        </div>

        <div style={{ marginTop: 14 }}>
          {state.screens.map((screen, index) => {
            const count = screenPendencias(state, screen);
            return (
              <div key={screen.frameId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--color-border)" }}>
                <Icon name={count > 0 ? "alert-triangle" : "check"} size={14} color={count > 0 ? "var(--color-warning)" : "var(--color-primary)"} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, overflowWrap: "anywhere" }}>{screen.nomeTela || screen.frameName}</div>
                  <div style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>
                    {screen.items.length} cards{count > 0 ? ` · ${count} ${count === 1 ? "pendência" : "pendências"}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onGoToScreen(index)}
                  style={{ border: "1px solid var(--color-border-strong)", background: "var(--color-surface)", borderRadius: 8, padding: "5px 10px", fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap" }}
                >
                  Revisar
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--color-border)", padding: "12px 24px 18px" }}>
        <Button fullWidth disabled={pending > 0} onClick={onGenerate} iconRight={pending > 0 ? undefined : <Icon name="arrow-right" size={15} color="#fff" />}>
          {pending > 0 ? `Gerar cards (${pending} ${pending === 1 ? "pendência" : "pendências"})` : "Gerar cards"}
        </Button>
      </div>
    </>
  );
}
