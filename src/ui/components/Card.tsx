import React, { useLayoutEffect, useRef } from "react";
import { ComponentTypeOption, SpecificationItem } from "../../shared/types";
import { Icon } from "./Icon";

interface CardProps {
  item: SpecificationItem;
  index: number;
  options: ComponentTypeOption[];
  isDetached: boolean;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onTypeChange: (id: string, key: string) => void;
  onVerbalizationChange: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
  isDragging: boolean;
  isDropTarget: boolean;
}

const CHAR_LIMIT = 240;

export function Card({
  item,
  index,
  options,
  isDetached,
  isExpanded,
  onToggleExpand,
  onTypeChange,
  onVerbalizationChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  isDropTarget
}: CardProps) {
  const bodyId = `card-body-${item.id}`;
  const selectedOption = options.find((o) => o.key === item.markupType);
  const verbalizationEnabled = selectedOption?.hasVerbalization ?? true;
  const overLimit = item.verbalization.length > CHAR_LIMIT;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-cresce o textarea até ~120px conforme o conteúdo, tanto ao
  // digitar quanto ao expandir o card com um texto já preenchido.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [item.verbalization, isExpanded]);

  const chipColor = isDetached
    ? { color: "var(--color-warning)", background: "var(--color-warning-chip-bg)" }
    : isExpanded
      ? { color: "var(--color-primary-ink)", background: "var(--color-primary-tint)" }
      : { color: "var(--color-text-subtle)", background: "var(--color-surface-muted)" };

  const summary = !selectedOption || selectedOption.key === "nao-especificado"
    ? null
    : `${selectedOption.label} · ${selectedOption.hasVerbalization ? "com verbalização" : "sem verbalização"}`;

  return (
    <div
      style={{
        position: "relative",
        border: `1px solid ${isExpanded ? "var(--color-primary)" : isDetached ? "var(--color-warning-border)" : "var(--color-border)"}`,
        borderRadius: 11,
        background: isDetached && !isExpanded ? "var(--color-warning-bg-soft)" : "#fff",
        boxShadow: isExpanded ? "var(--shadow-card-active)" : "none",
        opacity: isDragging ? 0.5 : 1,
        transition: "transform .16s, box-shadow .16s, border-color .16s"
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      {isDropTarget && (
        <div
          style={{
            position: "absolute",
            top: -4,
            left: 8,
            right: 8,
            height: 2,
            borderRadius: 99,
            background: "var(--color-primary)"
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 12px",
          cursor: "pointer"
        }}
        onClick={() => onToggleExpand(item.id)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={bodyId}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpand(item.id);
          }
        }}
      >
        <span
          draggable
          onClick={(e) => e.stopPropagation()}
          onDragStart={(e) => {
            e.stopPropagation();
            onDragStart(index);
          }}
          aria-label="Arrastar para reordenar"
          style={{
            width: 24,
            height: 24,
            minWidth: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "grab"
          }}
        >
          <Icon name="grip" size={12} color={isDetached ? "#D8C48A" : "#B0B8A6"} />
        </span>

        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            fontVariantNumeric: "tabular-nums",
            padding: "3px 6px",
            borderRadius: 6,
            ...chipColor
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              fontWeight: 800,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {item.nodeName}
          </div>
          {!isExpanded && (
            <div
              style={{
                marginTop: 2,
                fontSize: 11.5,
                fontWeight: 700,
                color: isDetached ? "var(--color-warning)" : "var(--color-text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {isDetached ? (
                <>
                  <Icon name="alert-circle" size={11} color="var(--color-warning)" />
                  Detach · tipo não definido
                </>
              ) : summary ? (
                summary
              ) : (
                <span style={{ color: "var(--color-text-subtle)" }}>Tipo não definido</span>
              )}
            </div>
          )}
        </div>

        {isExpanded && (
          <button
            type="button"
            aria-label="Remover componente"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            style={{
              width: 24,
              height: 24,
              border: "none",
              background: "transparent",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = "var(--color-surface-muted)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <Icon name="x" size={13} color="var(--color-text-subtle)" />
          </button>
        )}

        <Icon
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={isExpanded ? "var(--color-text-muted)" : "#B0B8A6"}
        />
      </div>

      {isExpanded && (
        <div id={bodyId} style={{ padding: "0 12px 12px" }}>
          <label
            style={{
              display: "block",
              fontSize: "10.5px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: ".07em",
              color: "var(--color-text-subtle)"
            }}
          >
            Tipo de marcação
          </label>
          <div style={{ position: "relative", marginTop: 6 }}>
            <select
              value={item.markupType}
              onChange={(e) => onTypeChange(item.id, e.target.value)}
              style={{
                width: "100%",
                height: 38,
                borderRadius: 9,
                border: "1px solid var(--color-border-hover)",
                background: "#fff",
                padding: "0 32px 0 12px",
                fontSize: 13,
                fontWeight: 700,
                appearance: "none",
                color: "var(--color-text-dark)"
              }}
            >
              {options.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Icon name="chevron-down" size={14} color="var(--color-text-muted)" />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 8 }}>
            <label
              style={{
                fontSize: "10.5px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: ".07em",
                color: "var(--color-text-subtle)"
              }}
            >
              Verbalização esperada
            </label>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                color: overLimit ? "var(--color-danger)" : "#B0B8A6"
              }}
            >
              {item.verbalization.length}/{CHAR_LIMIT}
            </span>
          </div>

          <textarea
            ref={textareaRef}
            value={item.verbalization}
            disabled={!verbalizationEnabled}
            onChange={(e) => onVerbalizationChange(item.id, e.target.value)}
            rows={2}
            style={{
              width: "100%",
              marginTop: 6,
              minHeight: 40,
              maxHeight: 120,
              borderRadius: 9,
              border: `1px solid ${verbalizationEnabled ? "var(--color-primary)" : "var(--color-border)"}`,
              padding: "9px 11px",
              fontSize: 12.5,
              lineHeight: 1.45,
              resize: "vertical",
              fontFamily: "inherit",
              backgroundColor: verbalizationEnabled ? "#fff" : "var(--color-disabled-bg)"
            }}
            onFocus={(e) => {
              if (!verbalizationEnabled) return;
              (e.currentTarget as HTMLTextAreaElement).style.boxShadow = "0 0 0 3px rgba(51,130,13,.10)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLTextAreaElement).style.boxShadow = "none";
            }}
          />
          {!verbalizationEnabled && (
            <p style={{ marginTop: 6, fontSize: 11.5, color: "var(--color-text-subtle)" }}>
              Este tipo não recebe verbalização.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
