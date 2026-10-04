import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon, IconName } from "./Icon";
import { searchKey } from "../regionsData";

/**
 * Dropdown customizado do tagueamento (redesign 03/10/2026): botão + lista,
 * sem <select> nativo. Duas formas:
 *  - simples: o gatilho é um <button> (Canal, Evento, local_type);
 *  - pesquisável: o gatilho tem um campo de busca (Produto, Fluxo).
 * Teclado: ↓/↑ navegam, Enter escolhe, Esc fecha. A busca ignora acentos.
 * Opções "fixas" (pinned) aparecem sempre, mesmo filtrando.
 */

export interface DropdownOption {
  value: string;
  label: string;
  /** Texto secundário em mono (ex.: código da region). */
  hint?: string;
  /** Bolinha de cor antes do texto (eventos). */
  dot?: string;
  /** Rótulo em fonte mono (eventos). */
  mono?: boolean;
  pinned?: "top" | "bottom";
}

interface DropdownProps {
  options: DropdownOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  id?: string;
  searchable?: boolean;
  compact?: boolean;
  /** Bloqueado: mostra este texto com o cadeado. */
  lockedText?: string;
  /** Ícone fixo à esquerda (ex.: smartphone no Canal, pencil no "Outro"). */
  leadingIcon?: IconName;
  emptyText?: (query: string) => string;
  /** Abre a lista para cima (dropdown perto do rodapé). */
  dropUp?: boolean;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder,
  ariaLabel,
  id: givenId,
  searchable = false,
  compact = false,
  lockedText,
  leadingIcon,
  emptyText,
  dropUp = false
}: DropdownProps) {
  const autoId = useId();
  const id = givenId ?? autoId;
  const listId = `${id}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = options.find((option) => option.value === value) ?? null;

  const visible = useMemo(() => {
    if (!searchable) return options;
    const key = searchKey(query);
    const top = options.filter((option) => option.pinned === "top");
    const bottom = options.filter((option) => option.pinned === "bottom");
    const regular = options.filter(
      (option) => !option.pinned && (key === "" || searchKey(option.label).includes(key) || (option.hint ? searchKey(option.hint).includes(key) : false))
    );
    return [...top, ...regular, ...bottom];
  }, [options, query, searchable]);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function openList() {
    if (lockedText) return;
    setOpen(true);
    setQuery("");
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
  }

  function close() {
    setOpen(false);
    setQuery("");
  }

  function choose(option: DropdownOption) {
    onChange(option.value);
    close();
    if (searchable) inputRef.current?.blur();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || (!searchable && event.key === " ")) {
        event.preventDefault();
        openList();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(visible.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = visible[active];
      if (option) choose(option);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      close();
    }
  }

  const rootClass = `tag-dd${compact ? " tag-dd--compact" : ""}${open ? " tag-dd--open" : ""}${dropUp ? " tag-dd--up" : ""}`;

  if (lockedText) {
    return (
      <div className={rootClass}>
        <div className="tag-dd__trigger tag-dd__trigger--locked" aria-disabled="true" aria-label={ariaLabel} id={id}>
          {searchable && <Icon name="search" size={15} color="#B0B8A6" />}
          <span className="tag-dd__locked-text tag-ellipsis">{lockedText}</span>
          <Icon name="lock" size={14} color="#B0B8A6" />
        </div>
      </div>
    );
  }

  const valueNode = selected ? (
    <span className="tag-dd__value" style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }} title={selected.label}>
      {selected.dot && <span className="tag-dot" style={{ background: selected.dot }} />}
      <span className={`tag-ellipsis${selected.mono ? " tag-mono" : ""}`} style={selected.mono ? { fontSize: 12.5, fontWeight: 800 } : undefined}>
        {selected.label}
      </span>
    </span>
  ) : (
    <span className="tag-dd__placeholder tag-ellipsis">{placeholder}</span>
  );

  return (
    <div className={rootClass} ref={rootRef}>
      {searchable ? (
        <div className="tag-dd__trigger" onClick={() => !open && inputRef.current?.focus()}>
          <Icon name={leadingIcon ?? "search"} size={15} color={leadingIcon ? "#5C6459" : "#8A9382"} />
          <input
            ref={inputRef}
            id={id}
            className="tag-dd__input"
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && visible[active] ? `${id}-opt-${active}` : undefined}
            value={open ? query : selected?.label ?? ""}
            title={!open && selected ? selected.label : undefined}
            placeholder={open && selected ? selected.label : placeholder}
            onFocus={openList}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
              if (!open) setOpen(true);
            }}
            onKeyDown={onKeyDown}
          />
          <Icon name="chevron-down" size={15} color="#5C6459" />
        </div>
      ) : (
        <button
          type="button"
          id={id}
          className="tag-dd__trigger"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => (open ? close() : openList())}
          onKeyDown={onKeyDown}
        >
          {leadingIcon && <Icon name={leadingIcon} size={15} color="#5C6459" />}
          {valueNode}
          <Icon name="chevron-down" size={15} color="#5C6459" />
        </button>
      )}

      {open && (
        <ul className="tag-dd__list" id={listId} role="listbox" aria-label={ariaLabel}>
          {visible.map((option, index) => {
            const isSelected = option.value === value;
            const classes = [
              "tag-dd__item",
              index === active ? "tag-dd__item--active" : "",
              isSelected ? "tag-dd__item--selected" : "",
              option.pinned === "bottom" && index > 0 ? "tag-dd__item--pinned" : ""
            ].join(" ");
            return (
              <li
                key={option.value}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                className={classes}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option)}
              >
                {option.dot && <span className="tag-dot" style={{ background: option.dot }} />}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className={`tag-ellipsis${option.mono ? " tag-mono" : ""}`} style={{ display: "block", fontSize: option.mono ? 12.5 : undefined }} title={option.label}>
                    {option.label}
                  </span>
                  {option.hint && (
                    <span className="tag-dd__hint tag-ellipsis" style={{ display: "block" }} title={option.hint}>
                      {option.hint}
                    </span>
                  )}
                </span>
                {isSelected && <Icon name="check" size={14} color="var(--color-primary)" />}
              </li>
            );
          })}
          {searchable && query.trim() !== "" && visible.filter((option) => !option.pinned).length === 0 && (
            <li className="tag-dd__empty">{emptyText ? emptyText(query) : `Nada encontrado para "${query}".`}</li>
          )}
        </ul>
      )}
    </div>
  );
}
