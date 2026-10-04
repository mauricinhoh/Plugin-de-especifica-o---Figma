import React from "react";
import { SetupSelection } from "../../shared/types";
import { FORMS_GUIDANCE } from "../../shared/forms";
import { Icon } from "./Icon";

/**
 * Faixa compacta com o setup escolhido (canal, region, subregion), com
 * "Alterar" — mostrada nas telas depois do setup. Também mostra o aviso do
 * Forms do "Outro", quando houver.
 */

export type FormsStatus = "opened" | "not-configured" | null;

interface SetupBarProps {
  setup: SetupSelection;
  formsStatus?: FormsStatus;
  /** Nome da tela em revisão, mostrado pequeno no topo do card (opcional). */
  screenName?: string;
  onEdit: () => void;
}

function ContextLine({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ fontSize: 12, lineHeight: 1.45, overflowWrap: "anywhere" }}>
      <span style={{ fontWeight: 800, color: "var(--color-text-dark)" }}>{label}: </span>
      <span style={{ fontFamily: mono ? "var(--font-mono)" : undefined, fontSize: mono ? 11.5 : 12, color: mono ? "var(--color-primary-ink)" : "var(--color-text-dark)" }}>
        {value}
      </span>
    </div>
  );
}

export function SetupBar({ setup, formsStatus, screenName, onEdit }: SetupBarProps) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "10px 12px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-surface-muted)",
          border: "1px solid var(--color-border)"
        }}
      >
        <div style={{ paddingTop: 2 }}>
          <Icon name={setup.plataforma === "APP" ? "smartphone" : "monitor"} size={15} color="var(--color-text-muted)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {screenName && (
            <div
              title={screenName}
              style={{ fontSize: 11, fontWeight: 800, color: "var(--color-text-muted)", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              Tela: {screenName}
            </div>
          )}
          <ContextLine label="Canal" value={setup.canal} />
          <ContextLine label="Region" value={setup.region} mono />
          <ContextLine label="Subregion" value={setup.subregion} mono />
        </div>
        <button
          type="button"
          onClick={onEdit}
          style={{ alignSelf: "center", border: "none", background: "transparent", fontSize: 12, fontWeight: 800, color: "var(--color-primary)", padding: 4 }}
        >
          Alterar
        </button>
      </div>
      <FormsNotice formsStatus={formsStatus} />
    </>
  );
}

/** Aviso do Forms do "Outro" (formulário aberto / link não configurado). */
export function FormsNotice({ formsStatus }: { formsStatus?: FormsStatus }) {
  return (
    <>
      {formsStatus === "opened" && (
        <div
          role="status"
          style={{
            marginTop: 10,
            display: "flex",
            gap: 8,
            padding: "9px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-primary-tint)",
            color: "var(--color-primary-ink)",
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.4
          }}
        >
          <Icon name="info" size={14} color="var(--color-primary)" />
          <span>Formulário aberto no navegador. {FORMS_GUIDANCE}</span>
        </div>
      )}
      {formsStatus === "not-configured" && (
        <div
          role="status"
          style={{
            marginTop: 10,
            display: "flex",
            gap: 8,
            padding: "9px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-warning-bg)",
            border: "1px solid var(--color-warning-border)",
            color: "var(--color-warning)",
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.4
          }}
        >
          <Icon name="alert-triangle" size={14} color="var(--color-warning)" />
          <span>Link do Forms ainda não configurado: o valor digitado vai para os cards, mas não para a planilha de pendentes.</span>
        </div>
      )}
    </>
  );
}
