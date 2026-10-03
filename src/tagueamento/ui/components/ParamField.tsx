import React, { useEffect, useId, useState } from "react";
import { Icon } from "./Icon";

/**
 * Campo de parâmetro da revisão (Fase 6). O PD digita livremente; ao sair do
 * campo, o valor é corrigido pelas regras de nomenclatura (quem faz isso é
 * quem recebe `onCommit`). Mostra notas do dicionário e pendências do campo.
 */

interface ParamFieldProps {
  field: string;
  value: string;
  optional?: boolean;
  /** Região/subregion: só leitura (vêm do setup). */
  readOnlyNote?: string;
  /** Seletor em vez de texto livre (ex.: local_type). */
  options?: string[];
  /** Sugestões (ex.: telas de destino do protótipo). */
  suggestions?: string[];
  /** Campo obrigatório vazio ou com termo sinalizado. */
  pending?: boolean;
  notes?: string[];
  /** Pendência do campo com botão "Manter assim". */
  flagText?: string[];
  onCommit: (raw: string) => void;
  onAccept?: () => void;
}

const labelStyle: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 700 };

export function ParamField({
  field,
  value,
  optional,
  readOnlyNote,
  options,
  suggestions,
  pending,
  notes = [],
  flagText = [],
  onCommit,
  onAccept
}: ParamFieldProps) {
  const id = useId();
  const listId = `${id}-sugestoes`;
  const isPlaceholder = value.trim().startsWith("<") && value.trim().endsWith(">");
  const [draft, setDraft] = useState(isPlaceholder ? "" : value);

  // Quando o valor muda por fora (normalização, troca de evento), atualiza o rascunho.
  useEffect(() => {
    setDraft(isPlaceholder ? "" : value);
  }, [value, isPlaceholder]);

  const border = pending ? "var(--color-warning-border)" : "var(--color-border-strong)";
  const background = readOnlyNote ? "var(--color-surface-muted)" : pending ? "var(--color-warning-bg-soft)" : "var(--color-surface)";

  return (
    <div style={{ marginTop: 10 }}>
      <label htmlFor={id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ ...labelStyle, color: pending ? "var(--color-warning)" : "var(--color-text-dark)" }}>
          {field}
          {optional ? "*" : ""}
        </span>
        {readOnlyNote && <span style={{ fontSize: 10.5, color: "var(--color-text-subtle)" }}>{readOnlyNote}</span>}
      </label>

      {options ? (
        <select
          id={id}
          value={value}
          onChange={(event) => onCommit(event.target.value)}
          style={{ marginTop: 4, width: "100%", height: 34, borderRadius: 8, border: `1px solid ${border}`, padding: "0 8px", fontSize: 12.5, background }}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <>
          <input
            id={id}
            value={draft}
            readOnly={!!readOnlyNote}
            list={suggestions && suggestions.length > 0 ? listId : undefined}
            placeholder={isPlaceholder ? value : optional ? "opcional" : "preencha"}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              if (readOnlyNote) return;
              if (draft !== (isPlaceholder ? "" : value)) onCommit(draft);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") (event.target as HTMLInputElement).blur();
            }}
            style={{
              marginTop: 4,
              width: "100%",
              height: 34,
              borderRadius: 8,
              border: `1px solid ${border}`,
              padding: "0 10px",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              background,
              color: readOnlyNote ? "var(--color-text-muted)" : "var(--color-text-dark)",
              outline: "none"
            }}
          />
          {suggestions && suggestions.length > 0 && (
            <datalist id={listId}>
              {suggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          )}
        </>
      )}

      {notes.map((nota, index) => (
        <div key={`n${index}`} style={{ marginTop: 4, display: "flex", gap: 5, fontSize: 11, color: "var(--color-text-muted)" }}>
          <Icon name="info" size={11} color="var(--color-text-subtle)" />
          <span style={{ overflowWrap: "anywhere", minWidth: 0 }}>{nota}</span>
        </div>
      ))}
      {flagText.map((texto, index) => (
        <div key={`f${index}`} style={{ marginTop: 4, display: "flex", gap: 6, alignItems: "center", fontSize: 11.5, fontWeight: 700, color: "var(--color-warning)" }}>
          <Icon name="alert-triangle" size={12} color="var(--color-warning)" />
          <span style={{ flex: 1, overflowWrap: "anywhere", minWidth: 0 }}>{texto}</span>
          {onAccept && index === 0 && (
            <button
              type="button"
              onClick={onAccept}
              style={{ border: "1px solid var(--color-warning-border)", background: "#fff", borderRadius: 7, padding: "2px 7px", fontSize: 11, fontWeight: 800, color: "var(--color-warning)", whiteSpace: "nowrap" }}
            >
              Manter assim
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
