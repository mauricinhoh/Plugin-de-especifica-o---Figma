import React, { useState } from "react";
import { describeReport, NamingKind, normalizeWithReport } from "../../shared/naming";
import { Icon } from "../components/Icon";

/**
 * Fase 5 — "Testar nomenclatura": digita um texto, escolhe o tipo e vê o
 * valor normalizado, as trocas do dicionário e as sinalizações. Ferramenta
 * de desenvolvimento para validar as regras da seção 6 antes da revisão.
 */

const KINDS: { value: NamingKind; label: string }[] = [
  { value: "param", label: "Parâmetro" },
  { value: "subregion", label: "Subregion" },
  { value: "region", label: "Region" }
];

export function NamingTester() {
  const [text, setText] = useState("");
  const [kind, setKind] = useState<NamingKind>("param");
  const report = text.trim() ? normalizeWithReport(text, kind) : null;
  const info = report ? describeReport(report) : null;

  return (
    <div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--color-text-muted)" }}>
        Digite um texto como ele aparece na tela ou como o PD digitaria. O plugin aplica as regras de nomenclatura e o
        dicionário de termos em inglês.
      </p>
      <div role="radiogroup" aria-label="Tipo de valor" style={{ marginTop: 10, display: "flex", gap: 6 }}>
        {KINDS.map((option) => {
          const selected = option.value === kind;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setKind(option.value)}
              style={{
                flex: 1,
                height: 32,
                borderRadius: 999,
                border: `1px solid ${selected ? "var(--color-primary)" : "var(--color-border-strong)"}`,
                background: selected ? "var(--color-primary-tint)" : "var(--color-surface)",
                color: selected ? "var(--color-primary-ink)" : "var(--color-text-dark)",
                fontSize: 12,
                fontWeight: 800
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <input
        aria-label="Texto para testar"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Ex.: Try again 2 vezes"
        style={{
          marginTop: 10,
          width: "100%",
          height: 40,
          padding: "0 12px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border-strong)",
          fontSize: 13.5,
          outline: "none"
        }}
      />
      {report && info && (
        <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--color-text-subtle)" }}>
            Resultado
          </div>
          <div
            data-testid="naming-result"
            style={{ marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 800, color: "var(--color-primary-ink)", overflowWrap: "anywhere" }}
          >
            {report.value || "—"}
          </div>
          <div style={{ marginTop: 4, fontSize: 11.5, color: "var(--color-text-muted)" }}>{report.value.length} de 100 caracteres</div>
          {info.notas.map((nota, index) => (
            <div key={`n${index}`} style={{ marginTop: 6, display: "flex", gap: 6, fontSize: 12, color: "var(--color-text-muted)" }}>
              <Icon name="info" size={12} color="var(--color-text-subtle)" />
              <span>{nota}</span>
            </div>
          ))}
          {info.pendencias.map((pendencia, index) => (
            <div key={`p${index}`} style={{ marginTop: 6, display: "flex", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--color-warning)" }}>
              <Icon name="alert-triangle" size={12} color="var(--color-warning)" />
              <span>{pendencia}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
