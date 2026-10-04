import React, { useState } from "react";
import { COMPONENT_EVENTS, fieldsFor, Pendencia, pendenciasOf, ReviewItem, SETUP_FIELDS, TARGET_FIELDS, PREVIOUS_SCREEN_FIELDS } from "../../shared/review";
import { Plataforma } from "../../shared/types";
import { Icon } from "./Icon";
import { ParamField } from "./ParamField";
import { colorOf } from "../../shared/eventColors";

/**
 * Card da revisão (Fase 6) — visual adaptado do Card da acessibilidade
 * (src/ui/components/Card.tsx): cabeçalho com número, evento e componente;
 * expande para editar evento e parâmetros.
 */

interface ReviewCardProps {
  item: ReviewItem;
  numero: number;
  plataforma: Plataforma;
  expanded: boolean;
  /** Telas de destino do protótipo (sugestões para a tela alvo). */
  destinos: string[];
  /** Telas de origem do protótipo (sugestões para a tela anterior). */
  origens: string[];
  onToggle: () => void;
  onCommit: (field: string, raw: string) => void;
  onAccept: (field: string) => void;
  onConfirm: () => void;
  onChangeEvent: (evento: string) => void;
  onRemove: () => void;
  onFocus: () => void;
}


export function ReviewCard({
  item,
  numero,
  plataforma,
  expanded,
  destinos,
  origens,
  onToggle,
  onCommit,
  onAccept,
  onConfirm,
  onChangeEvent,
  onRemove,
  onFocus
}: ReviewCardProps) {
  const [showOptional, setShowOptional] = useState(false);
  const pendencias = pendenciasOf(item, plataforma);
  const pendingFields = new Set(pendencias.filter((p) => p.field).map((p) => p.field as string));
  const { required, optional } = fieldsFor(item.evento, plataforma);
  const filledOptional = optional.filter((field) => item.values[field]).length;
  const hasPending = pendencias.length > 0;
  const confirmar = pendencias.find((p) => p.acao === "confirmar");

  function renderField(field: string, isOptional: boolean) {
    const flagged: Pendencia[] = pendencias.filter((p) => p.field === field && p.acao === "manter");
    return (
      <ParamField
        key={field}
        field={field}
        value={item.values[field] ?? ""}
        optional={isOptional}
        readOnlyNote={SETUP_FIELDS.includes(field) ? "vem do setup — altere lá" : undefined}
        options={field === "local_type" ? ["Screen", "Modal"] : undefined}
        suggestions={TARGET_FIELDS.includes(field) ? destinos : PREVIOUS_SCREEN_FIELDS.includes(field) ? origens : undefined}
        pending={pendingFields.has(field)}
        notes={item.notes[field]}
        flagText={flagged.map((p) => p.texto)}
        onCommit={(raw) => onCommit(field, raw)}
        onAccept={flagged.length > 0 ? () => onAccept(field) : undefined}
      />
    );
  }

  return (
    <div
      style={{
        marginTop: 10,
        borderRadius: 12,
        border: `1px solid ${hasPending ? "var(--color-warning-border)" : expanded ? "var(--color-primary)" : "var(--color-border)"}`,
        background: hasPending ? "var(--color-warning-bg-soft)" : "var(--color-surface)",
        boxShadow: expanded ? "var(--shadow-card-active)" : "none"
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", border: "none", background: "transparent", textAlign: "left" }}
      >
        <span
          style={{
            minWidth: 24,
            height: 24,
            borderRadius: 999,
            background: colorOf(item.evento).fill,
            color: colorOf(item.evento).text,
            fontSize: 12,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {numero}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 900, overflowWrap: "anywhere" }}>
            {item.evento}
            {item.origem === "manual" ? " · manual" : ""}
          </span>
          <span style={{ display: "block", fontSize: 11.5, color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.componente}
            {item.label && item.origem !== "tela" ? ` · “${item.label}”` : ""}
          </span>
        </span>
        {hasPending && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: "var(--color-warning)",
              background: "var(--color-warning-chip-bg)",
              borderRadius: 999,
              padding: "3px 8px",
              whiteSpace: "nowrap"
            }}
          >
            {pendencias.length} {pendencias.length === 1 ? "pendência" : "pendências"}
          </span>
        )}
        <Icon name={expanded ? "chevron-up" : "chevron-down"} size={14} color="var(--color-text-subtle)" />
      </button>

      {expanded && (
        <div style={{ padding: "0 12px 12px", borderTop: "1px solid var(--color-border)" }}>
          {confirmar && (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: "8px 10px",
                borderRadius: 8,
                background: "var(--color-warning-bg)",
                border: "1px solid var(--color-warning-border)",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--color-warning)"
              }}
            >
              <Icon name="alert-triangle" size={13} color="var(--color-warning)" />
              <span style={{ flex: 1 }}>{confirmar.texto}</span>
              <button
                type="button"
                onClick={onConfirm}
                style={{ border: "none", background: "var(--color-primary)", color: "#fff", borderRadius: 7, padding: "4px 9px", fontSize: 11.5, fontWeight: 800 }}
              >
                Confirmar
              </button>
            </div>
          )}

          {item.origem !== "tela" && (
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 800 }}>
                Evento
                <select
                  aria-label="Evento do item"
                  value={item.evento}
                  onChange={(event) => onChangeEvent(event.target.value)}
                  style={{
                    display: "block",
                    marginTop: 4,
                    width: "100%",
                    height: 34,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-strong)",
                    padding: "0 8px",
                    fontSize: 12.5,
                    background: "var(--color-surface)"
                  }}
                >
                  {COMPONENT_EVENTS.map((evento) => (
                    <option key={evento} value={evento}>
                      {evento}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {required.map((field) => renderField(field, false))}

          {optional.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setShowOptional((value) => !value)}
                aria-expanded={showOptional}
                style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent", padding: 0, fontSize: 12, fontWeight: 800, color: "var(--color-text-muted)" }}
              >
                <Icon name={showOptional ? "chevron-up" : "chevron-down"} size={13} color="var(--color-text-subtle)" />
                Opcionais ({optional.length}{filledOptional > 0 ? ` · ${filledOptional} preenchido${filledOptional > 1 ? "s" : ""}` : ""})
              </button>
              {showOptional && (
                <>
                  <div style={{ marginTop: 6, fontSize: 11, color: "var(--color-text-subtle)" }}>
                    A toggle de cada opcional liga no card só se o campo for preenchido.
                  </div>
                  {optional.map((field) => renderField(field, true))}
                </>
              )}
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onFocus}
              style={{ flex: 1, height: 32, borderRadius: 8, border: "1px solid var(--color-border-strong)", background: "var(--color-surface)", fontSize: 12, fontWeight: 800 }}
            >
              Mostrar na tela
            </button>
            {item.origem !== "tela" && (
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Remover ${item.componente}`}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "1px solid var(--color-danger-border)",
                  background: "var(--color-danger-bg)",
                  color: "var(--color-danger)",
                  fontSize: 12,
                  fontWeight: 800
                }}
              >
                Remover
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
