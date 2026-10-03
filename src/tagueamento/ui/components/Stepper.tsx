/**
 * CÓPIA de src/ui/components/Stepper.tsx (fluxo de Acessibilidade), feita na
 * Fase 1 do Tagueamento. Pertence só ao tagueamento: pode ser adaptada à
 * vontade sem afetar a acessibilidade — e a original NUNCA deve ser editada
 * por causa do tagueamento (ver TAGUEAMENTO_SPEC.md, seção 0).
 */
import React from "react";

interface StepperProps {
  current: 1 | 2 | 3;
  progress?: number;
  gutter?: number;
}

// Adaptado ao tagueamento: a etapa 1 é o setup (canal, produto, fluxo e modo).
const LABELS = ["1 · Setup", "2 · Revisar", "3 · Gerar"];

export function Stepper({ current, progress, gutter = 24 }: StepperProps) {
  return (
    <div
      style={{ display: "flex", gap: 6, padding: `16px ${gutter}px 0` }}
      aria-label={`Etapa ${current} de 3: ${LABELS[current - 1].split(" · ")[1]}`}
    >
      {[1, 2, 3].map((step) => {
        const isCompleted = step < current;
        const isCurrent = step === current;
        const barBackground =
          isCurrent && typeof progress === "number"
            ? `linear-gradient(90deg, var(--color-primary) ${Math.round(progress * 100)}%, var(--color-border) ${Math.round(
                progress * 100
              )}%)`
            : isCompleted || isCurrent
              ? "var(--color-primary)"
              : "var(--color-border)";

        const labelColor = isCurrent ? "var(--color-primary)" : isCompleted ? "var(--color-text-subtle)" : "#B0B8A6";

        return (
          <div key={step} style={{ flex: 1 }} aria-current={isCurrent ? "step" : undefined}>
            <div style={{ height: 4, borderRadius: 999, background: barBackground }} />
            <div
              style={{
                marginTop: 8,
                fontSize: "10.5px",
                fontWeight: 900,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                color: labelColor
              }}
            >
              {LABELS[step - 1]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
