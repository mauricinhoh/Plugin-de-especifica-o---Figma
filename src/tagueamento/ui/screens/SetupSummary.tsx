import React from "react";
import { SetupSelection } from "../../shared/types";
import { FORMS_GUIDANCE } from "../../shared/forms";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";

/**
 * Fase 3 — resumo do setup. As próximas etapas (mapeamento, revisão e
 * geração) entram nas Fases 4 a 7; por enquanto esta tela confirma o que
 * vai para os cards.
 */

export type FormsStatus = "opened" | "not-configured" | null;

interface SetupSummaryProps {
  setup: SetupSelection;
  formsStatus: FormsStatus;
  onEdit: () => void;
  onExit: () => void;
  onClose: () => void;
}

function Row({ label, value, code, note }: { label: string; value: string; code?: string; note?: string }) {
  return (
    <div style={{ padding: "10px 0", borderTop: "1px solid var(--color-border)" }}>
      <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--color-text-subtle)" }}>
        {label}
      </div>
      <div style={{ marginTop: 3, fontSize: 14, fontWeight: 800 }}>{value}</div>
      {code && (
        <div style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--color-primary-ink)" }}>{code}</div>
      )}
      {note && <div style={{ marginTop: 2, fontSize: 11.5, color: "var(--color-text-muted)" }}>{note}</div>}
    </div>
  );
}

export function SetupSummary({ setup, formsStatus, onEdit, onExit, onClose }: SetupSummaryProps) {
  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onEdit} onClose={onClose} />
      <Stepper current={1} progress={1} />
      <div className="scroll-area" style={{ padding: "18px 24px 20px" }}>
        <h2 style={{ margin: 0, fontSize: 21, lineHeight: 1.2, fontWeight: 900, letterSpacing: "-.025em" }}>Setup pronto</h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.45, color: "var(--color-text-muted)" }}>
          É isso que vai para os cards desta sessão.
        </p>

        {formsStatus === "opened" && (
          <div
            role="status"
            style={{
              marginTop: 14,
              display: "flex",
              gap: 8,
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-primary-tint)",
              color: "var(--color-primary-ink)",
              fontSize: 12.5,
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
              marginTop: 14,
              display: "flex",
              gap: 8,
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-warning-bg)",
              border: "1px solid var(--color-warning-border)",
              color: "var(--color-warning)",
              fontSize: 12.5,
              fontWeight: 700,
              lineHeight: 1.4
            }}
          >
            <Icon name="alert-triangle" size={14} color="var(--color-warning)" />
            <span>
              O link do Forms ainda não está configurado. O valor digitado vai ser usado nos cards, mas não foi enviado para a
              planilha de pendentes.
            </span>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <Row
            label="Canal"
            value={setup.canal}
            note={setup.plataforma === "APP" ? "Aplicativo — cards de tela: screen_view" : "Web — cards de tela: page_view"}
          />
          <Row
            label="Produto"
            value={setup.produto}
            code={`region: ${setup.region}`}
            note={setup.produtoOutro ? "Digitado em “Outro”" : undefined}
          />
          <Row
            label="Fluxo"
            value={setup.fluxo}
            code={`subregion: ${setup.subregion}`}
            note={setup.fluxoOutro ? "Digitado em “Outro”" : undefined}
          />
          <Row label="Modo" value={setup.modo === "tela" ? "Tela por tela" : "Página inteira"} />
        </div>

        <div
          style={{
            marginTop: 18,
            padding: "12px 14px",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--color-border-strong)",
            background: "var(--color-surface-subtle)",
            fontSize: 12.5,
            lineHeight: 1.45,
            color: "var(--color-text-muted)"
          }}
        >
          A próxima etapa (mapear as telas e gerar os cards) chega nas próximas fases do desenvolvimento.
        </div>
      </div>
      <div style={{ padding: "12px 24px 18px", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 8 }}>
        <Button variant="secondary" fullWidth onClick={onEdit} icon={<Icon name="chevron-left" size={15} />}>
          Alterar setup
        </Button>
        <Button variant="ghost" fullWidth onClick={onExit}>
          Voltar ao início
        </Button>
      </div>
    </>
  );
}
