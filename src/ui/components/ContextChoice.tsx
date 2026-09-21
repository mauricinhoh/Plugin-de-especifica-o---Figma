import React from "react";
import { ChoiceCard } from "./Button";
import { Icon } from "./Icon";
import { TitleBar } from "./TitleBar";
import { Stepper } from "./Stepper";
import { ScreenContext } from "../../shared/types";

interface ContextChoiceProps {
  screenName: string | null;
  onChoose: (context: ScreenContext) => void;
  onBack: () => void;
  onClose: () => void;
}

export function ContextChoice({ screenName, onChoose, onBack, onClose }: ContextChoiceProps) {
  return (
    <>
      <TitleBar title="Especificação de Handoff" showBack onBack={onBack} onClose={onClose} />
      <Stepper current={2} progress={0.4} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24 }}>
        <span
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            alignItems: "center",
            gap: 6,
            padding: "6px 11px",
            borderRadius: 999,
            background: "var(--color-warning-bg)",
            border: "1px solid var(--color-warning-border)",
            color: "var(--color-warning)"
          }}
        >
          <Icon name="alert-triangle" size={13} color="var(--color-warning)" />
          <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".05em" }}>
            Preciso da sua ajuda
          </span>
        </span>

        <h2
          style={{
            marginTop: 16,
            fontSize: 22,
            lineHeight: 1.2,
            fontWeight: 900,
            letterSpacing: "-.025em",
            margin: "16px 0 0"
          }}
        >
          Qual contexto você quer fazer o parecer?
        </h2>

        <p style={{ marginTop: 8, fontSize: "13.5px", lineHeight: 1.45, color: "var(--color-text-muted)" }}>
          Não conseguimos identificar automaticamente se{" "}
          <strong style={{ fontWeight: 800, color: "var(--color-text-dark)" }}>{screenName ?? "esta tela"}</strong>{" "}
          é uma tela Web ou de Aplicativo. Isso define quais regras de leitor de tela serão aplicadas.
        </p>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          <ChoiceCard
            icon={<Icon name="monitor" size={20} />}
            title="Web"
            description="Regras WCAG e semântica HTML/ARIA"
            onClick={() => onChoose("WEB")}
          />
          <ChoiceCard
            icon={<Icon name="smartphone" size={20} />}
            title="Aplicativo"
            description="Regras TalkBack e VoiceOver nativos"
            onClick={() => onChoose("APLICATIVO")}
          />
        </div>

        <div style={{ flex: 1 }} />

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--color-text-subtle)",
            paddingTop: 16
          }}
        >
          Você pode voltar e trocar o contexto depois.
        </p>
      </div>
    </>
  );
}
