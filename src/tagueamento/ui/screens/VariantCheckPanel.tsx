import React, { useState } from "react";
import { AllVariantsCheck, VariantCheck } from "../../shared/types";
import { GA_CARD_SET_NAME, GA_CARD_SHOW_TOGGLE, groupKey } from "../../shared/gaCard";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";

/**
 * Fase 2.1 — resultado de "Verificar todas as variantes".
 * Feito para ser lido e transcrito à mão: cada linha diz ✓ ou o que falta.
 */

interface VariantCheckPanelProps {
  result: AllVariantsCheck | null;
  checking: boolean;
  onCheck: () => void;
}

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 12, wordBreak: "break-all" };

function StatusLine({ ok, label, detail }: { ok: boolean; label: string; detail?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "5px 0", alignItems: "flex-start" }}>
      <span style={{ marginTop: 2 }}>
        <Icon name={ok ? "check" : "x-circle"} size={14} color={ok ? "var(--color-primary)" : "var(--color-danger)"} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>{label}</div>
        {detail && <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{detail}</div>}
      </div>
    </div>
  );
}

function EventLine({ check }: { check: VariantCheck }) {
  const [open, setOpen] = useState(false);
  const color = check.ok ? "var(--color-primary)" : "var(--color-danger)";
  return (
    <div style={{ borderTop: "1px solid var(--color-border)", padding: "8px 0" }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        style={{
          display: "flex",
          width: "100%",
          gap: 8,
          alignItems: "center",
          border: "none",
          background: "transparent",
          padding: 0,
          textAlign: "left"
        }}
      >
        <Icon name={check.ok ? "check" : "x-circle"} size={14} color={color} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 800 }}>{check.eventKey}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>
          {check.foundCount}/{check.expectedCount}
        </span>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={13} color="var(--color-text-subtle)" />
      </button>

      {check.error && <div style={{ fontSize: 12, color: "var(--color-danger)", marginTop: 4, marginLeft: 22 }}>{check.error}</div>}
      {check.missing.length > 0 && (
        <div style={{ fontSize: 12, marginTop: 4, marginLeft: 22 }}>
          <strong style={{ color: "var(--color-danger)" }}>Falta:</strong> <span style={mono}>{check.missing.join(", ")}</span>
        </div>
      )}
      {check.extra.length > 0 && (
        <div style={{ fontSize: 12, marginTop: 4, marginLeft: 22, color: "var(--color-text-muted)" }}>
          <strong>A mais no card:</strong> <span style={mono}>{check.extra.join(", ")}</span>
        </div>
      )}

      {open && (
        <div style={{ marginTop: 8, marginLeft: 22, fontSize: 12 }}>
          <div style={{ color: "var(--color-text-muted)" }}>
            Variante: <span style={mono}>{check.variantName ?? "—"}</span>
            {check.typeText !== undefined && (
              <>
                {" "}
                · título: <span style={mono}>{check.typeText}</span>
              </>
            )}
            {" "}· número: {check.hasNumber ? "sim" : "não"}
          </div>
          {check.rows.map((row, index) => (
            <div key={index} style={{ display: "flex", gap: 6, marginTop: 4, color: row.visible ? undefined : "var(--color-text-disabled)" }}>
              <span style={{ ...mono, fontWeight: 700 }}>{row.label}</span>
              <span style={{ ...mono, color: "var(--color-text-muted)" }}>{row.value}</span>
              {row.toggle && <span style={{ ...mono, color: "var(--color-primary-ink)" }}>⇄ {row.toggle}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function VariantCheckPanel({ result, checking, onCheck }: VariantCheckPanelProps) {
  const okCount = result ? result.checks.filter((check) => check.ok).length : 0;
  return (
    <div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--color-text-muted)" }}>
        Importa o card pela chave e confere os 10 eventos com a lista de parâmetros da spec. Não precisa selecionar
        nada. Me conte só as linhas que não tiverem ✓.
      </p>
      <div style={{ marginTop: 12 }}>
        <Button fullWidth onClick={onCheck} disabled={checking} icon={<Icon name="sparkle" size={15} />}>
          {checking ? "Verificando…" : result ? "Verificar de novo" : "Verificar todas as variantes"}
        </Button>
      </div>

      {result && (
        <div
          style={{
            marginTop: 12,
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "6px 12px 4px"
          }}
        >
          <StatusLine
            ok={result.importOk}
            label={result.importOk ? "Chave do card confere (importação funcionou)" : "A importação pela chave falhou"}
            detail={
              result.importOk ? undefined : (
                <>
                  {result.importError && <div>{result.importError}</div>}
                  <div style={{ marginTop: 4 }}>
                    Chave no código: <span style={mono}>{groupKey(result.keyUsed)}</span>
                  </div>
                  {result.actualSetKey && (
                    <div style={{ marginTop: 2 }}>
                      Chave do card selecionado: <span style={mono}>{groupKey(result.actualSetKey)}</span>
                    </div>
                  )}
                </>
              )
            }
          />
          {result.setName !== undefined && (
            <StatusLine
              ok={result.setNameOk}
              label={result.setNameOk ? `Nome: ${GA_CARD_SET_NAME}` : "Nome do conjunto diferente"}
              detail={result.setNameOk ? undefined : <span style={mono}>{result.setName}</span>}
            />
          )}
          {result.setName !== undefined && (
            <StatusLine ok={result.showToggleFound} label={`Toggle "${GA_CARD_SHOW_TOGGLE}"`} />
          )}
          {result.toggles.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", padding: "4px 0 6px 22px" }}>
              Toggles ({result.toggles.length}): <span style={mono}>{result.toggles.join(", ")}</span>
            </div>
          )}
          {result.unmatchedVariants.length > 0 && (
            <StatusLine
              ok={false}
              label="Variantes sem evento correspondente"
              detail={<span style={mono}>{result.unmatchedVariants.join(", ")}</span>}
            />
          )}
          {result.warnings.map((warning, index) => (
            <div key={index} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--color-warning)", fontWeight: 700, padding: "4px 0" }}>
              <Icon name="alert-triangle" size={13} color="var(--color-warning)" />
              <span>{warning}</span>
            </div>
          ))}

          {result.checks.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 900, padding: "8px 0 6px", color: "var(--color-text-dark)" }}>
                Eventos: {okCount} de {result.checks.length} conferem
              </div>
              {result.checks.map((check) => (
                <EventLine key={check.eventKey} check={check} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
