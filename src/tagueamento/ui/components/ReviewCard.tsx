import React, { useState } from "react";
import { COMPONENT_EVENTS, fieldsFor, Pendencia, pendenciasOf, ReviewItem, SETUP_FIELDS, TARGET_FIELDS, PREVIOUS_SCREEN_FIELDS } from "../../shared/review";
import { Plataforma } from "../../shared/types";
import { Icon } from "./Icon";
import { ParamField } from "./ParamField";
import { Dropdown } from "./Dropdown";
import { colorOf } from "../../shared/eventColors";

/**
 * Card de evento da revisão (EventRow do redesign de 03/10/2026): cabeçalho
 * com número, evento e componente; abre para editar evento e parâmetros.
 * As cores do número continuam as de cada evento (as mesmas dos marcadores).
 */

interface ReviewCardProps {
  item: ReviewItem;
  numero: number;
  plataforma: Plataforma;
  expanded: boolean;
  /** Telas finais do fluxo (sugestões para a tela alvo). */
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
  onEditSetup: () => void;
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
  onFocus,
  onEditSetup
}: ReviewCardProps) {
  const [showOptional, setShowOptional] = useState(false);
  const pendencias = pendenciasOf(item, plataforma);
  const pendingFields = new Set(pendencias.filter((p) => p.field).map((p) => p.field as string));
  const { required, optional } = fieldsFor(item.evento, plataforma);
  const filledOptional = optional.filter((field) => item.values[field]).length;
  const hasPending = pendencias.length > 0;
  const confirmar = pendencias.find((p) => p.acao === "confirmar");
  const color = colorOf(item.evento);
  const subtitle = `${item.componente}${item.label && item.origem !== "tela" ? ` · “${item.label}”` : ""}`;

  function renderField(field: string, isOptional: boolean) {
    const flagged: Pendencia[] = pendencias.filter((p) => p.field === field && p.acao === "manter");
    return (
      <ParamField
        key={field}
        field={field}
        value={item.values[field] ?? ""}
        optional={isOptional}
        locked={SETUP_FIELDS.includes(field)}
        onEditSetup={onEditSetup}
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

  const classes = ["tag-event", hasPending ? "tag-event--pending" : "", expanded ? "tag-event--open" : ""].join(" ");

  return (
    <div className={classes}>
      <button type="button" className="tag-event__head" onClick={onToggle} aria-expanded={expanded}>
        <span className="tag-event__chip" style={{ background: color.fill, color: color.text }}>
          {numero}
        </span>
        <span className="tag-event__text">
          <span className="tag-event__name tag-ellipsis">
            {item.evento}
            {item.origem === "manual" ? " · manual" : ""}
          </span>
          <span className="tag-event__sub tag-ellipsis" title={subtitle}>
            {subtitle}
          </span>
        </span>
        {hasPending && (
          <span className="tag-event__pendency">
            {pendencias.length} {pendencias.length === 1 ? "pendência" : "pendências"}
          </span>
        )}
        <Icon name={expanded ? "chevron-up" : "chevron-down"} size={14} color={expanded ? "#5C6459" : "#B0B8A6"} />
      </button>

      {expanded && (
        <div className="tag-event__body">
          {confirmar && (
            <div className="tag-alert" style={{ marginTop: 4 }}>
              <div className="tag-alert__row">
                <Icon name="alert-triangle" size={16} color="#8A6A00" />
                <span>
                  <strong>Componente não reconhecido.</strong> Parece um <span className="tag-mono">{item.evento}</span> — confirme para resolver.
                </span>
              </div>
              <div style={{ paddingLeft: 25, marginTop: 10 }}>
                <button type="button" className="tag-btn-confirm" onClick={onConfirm}>
                  <Icon name="check" size={13} color="#fff" strokeWidth={2.8} />
                  Confirmar
                </button>
              </div>
            </div>
          )}

          {item.origem !== "tela" && (
            <div style={{ marginTop: 10 }}>
              <span className="tag-label-card">Evento</span>
              <div style={{ marginTop: 6 }}>
                <Dropdown
                  compact
                  ariaLabel="Evento do item"
                  placeholder="Escolha o evento"
                  options={COMPONENT_EVENTS.map((evento) => ({ value: evento, label: evento, dot: colorOf(evento).fill, mono: true }))}
                  value={item.evento}
                  onChange={onChangeEvent}
                />
              </div>
            </div>
          )}

          {required.map((field) => renderField(field, false))}

          {optional.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setShowOptional((value) => !value)}
                aria-expanded={showOptional}
                style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent", padding: 0, fontSize: 12, fontWeight: 800, color: "var(--color-text-muted)", borderRadius: 4 }}
              >
                <Icon name={showOptional ? "chevron-up" : "chevron-down"} size={13} color="var(--color-text-subtle)" />
                Opcionais ({optional.length}
                {filledOptional > 0 ? ` · ${filledOptional} preenchido${filledOptional > 1 ? "s" : ""}` : ""})
              </button>
              {showOptional && (
                <>
                  <div style={{ marginTop: 6, fontSize: 11, color: "var(--color-text-subtle)" }}>A toggle de cada opcional liga no card só se o campo for preenchido.</div>
                  {optional.map((field) => renderField(field, true))}
                </>
              )}
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <button type="button" className="tag-mini-btn" style={{ flex: 1 }} onClick={onFocus}>
              Mostrar na tela
            </button>
            {item.origem !== "tela" && (
              <button type="button" className="tag-mini-btn tag-mini-btn--danger" onClick={onRemove} aria-label={`Remover ${item.componente}`}>
                Remover
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
