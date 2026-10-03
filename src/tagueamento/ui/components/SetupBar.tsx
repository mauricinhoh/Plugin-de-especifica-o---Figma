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
  onEdit: () => void;
}

export function SetupBar({ setup, formsStatus, onEdit }: SetupBarProps) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-surface-muted)",
          border: "1px solid var(--color-border)"
        }}
      >
        <Icon name={setup.plataforma === "APP" ? "smartphone" : "monitor"} size={15} color="var(--color-text-muted)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {setup.canal} · {setup.produto}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--color-primary-ink)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {setup.region} · {setup.subregion}
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          style={{ border: "none", background: "transparent", fontSize: 12, fontWeight: 800, color: "var(--color-primary)", padding: 4 }}
        >
          Alterar
        </button>
      </div>

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
