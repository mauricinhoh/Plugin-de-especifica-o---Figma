import React from "react";
import { PageTagStatus } from "../../shared/types";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";

/**
 * Fase 7 — página inteira com telas já tagueadas: pergunta UMA vez antes de
 * mapear (decisão do Mau, 03/10/2026): refazer todas ou pular essas.
 * "Refazer" só apaga o tagueamento antigo na hora de gerar.
 */

interface PageTaggedChoiceProps {
  status: PageTagStatus;
  onRedoAll: () => void;
  onSkip: () => void;
  onBack: () => void;
  onClose: () => void;
}

export function PageTaggedChoice({ status, onRedoAll, onSkip, onBack, onClose }: PageTaggedChoiceProps) {
  const count = status.tagged.length;
  const allTagged = count >= status.total;
  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onBack} onClose={onClose} />
      <Stepper current={1} progress={1} />
      <div className="scroll-area" style={{ padding: "18px 24px 20px" }}>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 900, letterSpacing: "-.025em" }}>
          {count} de {status.total} {status.total === 1 ? "tela já tem" : "telas já têm"} tagueamento
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.45, color: "var(--color-text-muted)" }}>
          Quer refazer essas telas também ou pular e taguear só as que ainda não têm?
        </p>
        <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          {status.tagged.map((name) => (
            <div key={name} style={{ display: "flex", gap: 6, padding: "3px 0", fontSize: 12.5, fontWeight: 700 }}>
              <Icon name="tag" size={13} color="var(--color-text-subtle)" />
              <span style={{ overflowWrap: "anywhere", minWidth: 0 }}>{name}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.45, color: "var(--color-text-muted)" }}>
          Ao refazer, os cards antigos dessas telas só são apagados quando você gerar os novos.
        </p>
      </div>
      <div style={{ borderTop: "1px solid var(--color-border)", padding: "12px 24px 18px", display: "flex", flexDirection: "column", gap: 9 }}>
        <Button fullWidth onClick={onRedoAll}>
          Refazer todas
        </Button>
        <Button variant="secondary" fullWidth onClick={onSkip} disabled={allTagged}>
          {allTagged ? "Pular essas (não sobra nenhuma tela)" : "Pular essas"}
        </Button>
      </div>
    </>
  );
}
