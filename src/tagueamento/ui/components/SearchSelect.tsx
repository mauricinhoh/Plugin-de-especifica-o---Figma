import React, { useId, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";
import { searchKey } from "../regionsData";

/**
 * Campo de escolha com busca (combobox) do tagueamento — usado em Produto e
 * Fluxo do setup. A lista abre embaixo do campo, empurrando o conteúdo
 * (não flutua), para nunca ficar cortada no painel estreito do plugin.
 *
 * Teclado: ↓/↑ navegam, Enter escolhe, Esc fecha. Busca ignora acentos e caixa.
 * Opções "fixas" (ex.: "Outro", "N/A") aparecem sempre, mesmo filtrando.
 */

export interface SearchOption {
  value: string;
  label: string;
  /** Texto secundário, em fonte mono (ex.: o código da region). */
  hint?: string;
  /** Opções fixas aparecem sempre, independentemente da busca. */
  pinned?: "top" | "bottom";
}

interface SearchSelectProps {
  label: string;
  placeholder: string;
  options: SearchOption[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  disabledHint?: string;
}

const fieldLabel: React.CSSProperties = { fontSize: 12.5, fontWeight: 800, color: "var(--color-text-dark)" };

export function SearchSelect({ label, placeholder, options, value, onChange, disabled, disabledHint }: SearchSelectProps) {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = options.find((option) => option.value === value) ?? null;

  const visible = useMemo(() => {
    const key = searchKey(query);
    const top = options.filter((option) => option.pinned === "top");
    const bottom = options.filter((option) => option.pinned === "bottom");
    const regular = options.filter(
      (option) =>
        !option.pinned &&
        (key === "" || searchKey(option.label).includes(key) || (option.hint ? searchKey(option.hint).includes(key) : false))
    );
    return [...top, ...regular, ...bottom];
  }, [options, query]);

  const regularCount = visible.filter((option) => !option.pinned).length;

  function openList() {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    const index = Math.max(0, visible.findIndex((option) => option.value === value));
    setActiveIndex(index);
  }

  function choose(option: SearchOption) {
    onChange(option.value);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      event.preventDefault();
      openList();
      return;
    }
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(visible.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = visible[activeIndex];
      if (option) choose(option);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div style={{ marginTop: 18 }}>
      <label htmlFor={id} style={fieldLabel}>
        {label}
      </label>
      <div
        style={{
          marginTop: 6,
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 42,
          padding: "0 12px",
          borderRadius: "var(--radius-md)",
          border: `1px solid ${open ? "var(--color-primary)" : "var(--color-border-strong)"}`,
          background: disabled ? "var(--color-surface-muted)" : "var(--color-surface)",
          boxShadow: open ? "0 0 0 3px var(--color-primary-tint)" : "none"
        }}
      >
        <Icon name="search" size={14} color="var(--color-text-subtle)" />
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && visible[activeIndex] ? `${id}-opt-${activeIndex}` : undefined}
          disabled={disabled}
          value={open ? query : selected?.label ?? ""}
          placeholder={disabled ? disabledHint ?? placeholder : open && selected ? selected.label : placeholder}
          onFocus={openList}
          onClick={() => !open && openList()}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            if (!open) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            // Espera o clique numa opção ser processado antes de fechar.
            window.setTimeout(() => setOpen(false), 120);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 13.5,
            fontWeight: selected && !open ? 700 : 500,
            color: "var(--color-text-dark)"
          }}
        />
        <Icon name={open ? "chevron-up" : "chevron-down"} size={14} color="var(--color-text-subtle)" />
      </div>

      {selected?.hint && !open && (
        <div style={{ marginTop: 5, fontSize: 11.5, color: "var(--color-text-muted)" }}>
          <span style={{ fontFamily: "var(--font-mono)" }}>{selected.hint}</span>
        </div>
      )}

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          style={{
            listStyle: "none",
            margin: "6px 0 0",
            padding: 4,
            maxHeight: 232,
            overflowY: "auto",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface)",
            boxShadow: "var(--shadow-card)"
          }}
        >
          {visible.map((option, index) => {
            const isActive = index === activeIndex;
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                onMouseEnter={() => setActiveIndex(index)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: isActive ? "var(--color-primary-tint)" : "transparent",
                  borderTop: option.pinned === "bottom" && index > 0 ? "1px solid var(--color-border)" : undefined,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: isSelected ? 800 : 600, color: "var(--color-text-dark)" }}>
                    {option.label}
                  </div>
                  {option.hint && (
                    <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", marginTop: 1 }}>
                      {option.hint}
                    </div>
                  )}
                </div>
                {isSelected && <Icon name="check" size={14} color="var(--color-primary)" />}
              </li>
            );
          })}
          {regularCount === 0 && query.trim() !== "" && (
            <li style={{ padding: "8px 10px", fontSize: 12.5, color: "var(--color-text-muted)" }}>
              Nada encontrado para "{query}". Use "Outro" para digitar.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
