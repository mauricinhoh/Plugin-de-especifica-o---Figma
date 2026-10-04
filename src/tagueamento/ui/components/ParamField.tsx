import React, { useEffect, useId, useState } from "react";
import { Icon } from "./Icon";
import { Dropdown } from "./Dropdown";

/**
 * Campo de parâmetro da revisão (redesign 03/10/2026). O PD digita livremente;
 * ao sair do campo, o valor é corrigido pelas regras de nomenclatura (quem faz
 * isso é quem recebe `onCommit`). Mostra notas do dicionário e pendências.
 * Sem <select>/<datalist> nativos: seletor customizado e sugestões em chips.
 */

interface ParamFieldProps {
  field: string;
  value: string;
  optional?: boolean;
  /** Region/subregion: travados (vêm do setup). */
  locked?: boolean;
  onEditSetup?: () => void;
  /** Seletor em vez de texto livre (ex.: local_type). */
  options?: string[];
  /** Sugestões (ex.: telas do protótipo). */
  suggestions?: string[];
  /** Campo com pendência (obrigatório vazio, termo sinalizado…). */
  pending?: boolean;
  notes?: string[];
  /** Pendência do campo com botão "Manter assim". */
  flagText?: string[];
  onCommit: (raw: string) => void;
  onAccept?: () => void;
}

export function ParamField({
  field,
  value,
  optional,
  locked,
  onEditSetup,
  options,
  suggestions,
  pending,
  notes = [],
  flagText = [],
  onCommit,
  onAccept
}: ParamFieldProps) {
  const id = useId();
  const isPlaceholder = value.trim().startsWith("<") && value.trim().endsWith(">");
  const [draft, setDraft] = useState(isPlaceholder ? "" : value);

  // Quando o valor muda por fora (normalização, troca de evento), atualiza o rascunho.
  useEffect(() => {
    setDraft(isPlaceholder ? "" : value);
  }, [value, isPlaceholder]);

  const emptyRequired = !optional && pending && draft.trim() === "";
  const placeholder = isPlaceholder ? value : optional ? "opcional" : field === "content_type" ? "ex.: Botao_ajuda" : "Preencha o valor";
  const visibleSuggestions = (suggestions ?? []).filter((suggestion) => suggestion !== draft);

  return (
    <div className="tag-param">
      <label className="tag-param__label" htmlFor={id}>
        <span className="tag-param__name tag-ellipsis">
          {field}
          {optional ? "*" : ""}
        </span>
        {emptyRequired && <span className="tag-param__req">Obrigatório</span>}
        {locked && <span className="tag-param__from">vem do setup</span>}
      </label>

      {locked ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="tag-locked" style={{ flex: 1, minWidth: 0 }} id={id} aria-readonly="true">
            <Icon name="lock" size={13} color="#8A9382" />
            <span className="tag-locked__value tag-ellipsis" title={value}>
              {value}
            </span>
          </div>
          {onEditSetup && (
            <button type="button" className="tag-link" style={{ fontSize: 11.5, marginTop: 6 }} onClick={onEditSetup}>
              Alterar
            </button>
          )}
        </div>
      ) : options ? (
        <div style={{ marginTop: 6 }}>
          <Dropdown
            id={id}
            compact
            ariaLabel={field}
            placeholder="Escolha"
            options={options.map((option) => ({ value: option, label: option }))}
            value={value || null}
            onChange={onCommit}
          />
        </div>
      ) : (
        <>
          <input
            id={id}
            className={`tag-input${pending ? " tag-input--pending" : ""}`}
            value={draft}
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              if (draft !== (isPlaceholder ? "" : value)) onCommit(draft);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") (event.target as HTMLInputElement).blur();
            }}
          />
          {visibleSuggestions.length > 0 && (
            <div className="tag-suggest">
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-subtle)" }}>Sugestões:</span>
              {visibleSuggestions.map((suggestion) => (
                <button key={suggestion} type="button" className="tag-suggest__chip tag-ellipsis" title={suggestion} onClick={() => onCommit(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {notes.map((nota, index) => (
        <div key={`n${index}`} style={{ marginTop: 5, display: "flex", gap: 5, fontSize: 11, color: "var(--color-text-muted)" }}>
          <Icon name="info" size={11} color="var(--color-text-subtle)" />
          <span style={{ overflowWrap: "anywhere", minWidth: 0 }}>{nota}</span>
        </div>
      ))}
      {flagText.map((texto, index) => (
        <div key={`f${index}`} style={{ marginTop: 5, display: "flex", gap: 6, alignItems: "center", fontSize: 11.5, fontWeight: 700, color: "var(--color-warning)" }}>
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
