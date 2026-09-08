import React from "react";
import { TitleBar } from "./TitleBar";
import { ChoiceCard } from "./Button";
import { Icon } from "./Icon";

interface Step0Props {
  designerName: string;
  onSelectAccessibility: () => void;
  onClose: () => void;
}

export function Step0({ designerName, onSelectAccessibility, onClose }: Step0Props) {
  return (
    <>
      <TitleBar title="Especificação de Handoff" showLogo onClose={onClose} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 20px" }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: ".1em",
            color: "var(--color-text-subtle)"
          }}
        >
          {designerName ? `Olá, ${designerName}` : "Olá"}
        </span>

        <h1
          style={{
            fontSize: 26,
            lineHeight: 1.15,
            fontWeight: 900,
            letterSpacing: "-.03em",
            marginTop: 10,
            margin: "10px 0 0"
          }}
        >
          Qual especificação vamos fazer hoje?
        </h1>

        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
          <ChoiceCard
            icon={<Icon name="accessibility" size={20} />}
            title="Acessibilidade"
            description="Parecer de leitor de tela para a tela selecionada"
            onClick={onSelectAccessibility}
          />
          <ChoiceCard
            icon={<Icon name="tag" size={20} />}
            title="Tagueamento"
            description="Marcação de eventos de analytics"
            badge="Em breve"
            disabled
          />
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11.5,
            fontWeight: 700,
            color: "#A3AC9B",
            justifyContent: "center",
            paddingTop: 16
          }}
        >
          <span>v1.0.0</span>
          <span style={{ width: 3, height: 3, borderRadius: 999, background: "#C8D0BF" }} />
          <span>Design System Core</span>
        </div>
      </div>
    </>
  );
}
