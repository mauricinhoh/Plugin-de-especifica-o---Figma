import React from "react";
import { FORMS_GUIDANCE } from "../../shared/forms";
import { Icon } from "./Icon";

/**
 * Faixa compacta com o setup escolhido (canal, region, subregion), com
 * "Alterar" — mostrada nas telas depois do setup. Também mostra o aviso do
 * Forms do "Outro", quando houver.
 */

export type FormsStatus = "opened" | "not-configured" | null;

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
