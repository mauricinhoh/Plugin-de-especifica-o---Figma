import React, { useEffect, useMemo, useState } from "react";
import { ComponentTypeOption, DetachWarning, SpecificationItem } from "../../shared/types";
import { Card } from "./Card";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { EmptyState } from "./EmptyState";
import { TitleBar } from "./TitleBar";
import { Stepper } from "./Stepper";
import { postToMain } from "../mainBridge";

interface Step2Props {
  items: SpecificationItem[];
  options: ComponentTypeOption[];
  detachWarnings: DetachWarning[];
  manualSelectionEnabled: boolean;
  contextBadge?: string;
  onBack: () => void;
  onClose: () => void;
  onTypeChange: (id: string, key: string) => void;
  onVerbalizationChange: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggleManualSelection: () => void;
  onGenerate: () => void;
  onRerunAnalysis: () => void;
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function Step2({
  items,
  options,
  detachWarnings,
  manualSelectionEnabled,
  contextBadge,
  onBack,
  onClose,
  onTypeChange,
  onVerbalizationChange,
  onRemove,
  onReorder,
  onToggleManualSelection,
  onGenerate,
  onRerunAnalysis
}: Step2Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [detachFilterActive, setDetachFilterActive] = useState(false);

  const detachedNodeIds = useMemo(() => new Set(detachWarnings.map((w) => w.nodeId)), [detachWarnings]);

  // Marcação temporária no canvas ("aqui está esse componente") para
  // o card expandido — pedido do usuário depois de relatar
  // dificuldade em identificar o componente só pelo nome. Depende só
  // de valores primitivos (id/nodeId/índice), não do array `items`
  // inteiro, para não recriar a marcação a cada tecla digitada na
  // verbalização do card aberto.
  const expandedItem = useMemo(() => items.find((item) => item.id === expandedId) ?? null, [items, expandedId]);
  const expandedIndex = expandedItem ? items.indexOf(expandedItem) : -1;
  const expandedNodeId = expandedItem?.nodeId ?? null;

  useEffect(() => {
    if (expandedNodeId === null || expandedIndex === -1) {
      postToMain({ type: "clear-preview-marker" });
      return;
    }
    postToMain({ type: "preview-marker", nodeId: expandedNodeId, index: expandedIndex });
    return () => {
      postToMain({ type: "clear-preview-marker" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedNodeId, expandedIndex]);

  const optionLabelByKey = useMemo(() => {
    const map = new Map<string, string>();
    options.forEach((o) => map.set(o.key, o.label));
    return map;
  }, [options]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (detachFilterActive) {
      list = list.filter((item) => detachedNodeIds.has(item.nodeId));
    }
    const normalizedQuery = normalizeSearch(query.trim());
    if (normalizedQuery.length > 0) {
      list = list.filter((item) => {
        const typeLabel = optionLabelByKey.get(item.markupType) ?? "";
        return (
          normalizeSearch(item.nodeName).includes(normalizedQuery) ||
          normalizeSearch(typeLabel).includes(normalizedQuery)
        );
      });
    }
    return list;
  }, [items, detachFilterActive, detachedNodeIds, query, optionLabelByKey]);

  function handleDrop() {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      onReorder(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <>
      <TitleBar title="Especificação de Handoff" showBack badge={contextBadge} onBack={onBack} onClose={onClose} />
      <Stepper current={2} gutter={20} />

      <div style={{ padding: "14px 20px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-.025em", margin: 0 }}>
            Revisar componentes
          </h2>
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: "var(--color-primary-ink)",
              background: "var(--color-primary-tint)",
              borderRadius: 999,
              padding: "4px 9px"
            }}
          >
            {items.length}
          </span>
        </div>

        {detachWarnings.length > 0 && (
          <div
            style={{
              marginTop: 8,
              padding: "10px 12px",
              borderRadius: 10,
              background: "var(--color-warning-bg)",
              border: "1px solid var(--color-warning-border)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <Icon name="alert-triangle" size={16} color="var(--color-warning)" />
            <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.35, color: "#5B4700" }}>
              <strong>{detachWarnings.length} componentes sofreram detach</strong> e precisam ser corrigidos.
            </span>
            <button
              type="button"
              onClick={() => setDetachFilterActive((v) => !v)}
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: "var(--color-warning)",
                background: "transparent",
                border: "none",
                borderBottom: "1.5px solid rgba(138,106,0,.35)",
                padding: 0
              }}
            >
              {detachFilterActive ? "Ver todos" : "Ver"}
            </button>
          </div>
        )}

        <div
          style={{
            marginTop: 8,
            height: 38,
            borderRadius: 10,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-subtle)",
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <Icon name="search" size={15} color="var(--color-text-subtle)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar componente…"
            style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, outline: "none" }}
          />
        </div>
      </div>

      <div className="scroll-area" style={{ padding: "0 20px 4px" }}>
        {filteredItems.length === 0 && items.length > 0 && (
          <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", textAlign: "center", padding: "24px 0" }}>
            Nenhum componente corresponde a "{query}".
          </p>
        )}

        {items.length === 0 && (
          <div style={{ paddingTop: 40 }}>
            <EmptyState
              iconName="components"
              title="Nenhum componente na lista"
              description="A análise não encontrou componentes do Design System nesta tela — ou você removeu todos. Adicione manualmente clicando nos elementos no canvas."
              maxWidth={280}
            >
              <Button
                variant="primary"
                icon={<Icon name="plus" size={16} color="#fff" />}
                onClick={onToggleManualSelection}
              >
                Selecionar manualmente
              </Button>
              <div style={{ marginTop: 10 }}>
                <Button variant="ghost" onClick={onRerunAnalysis}>
                  Refazer análise
                </Button>
              </div>
            </EmptyState>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 8 }}>
          {filteredItems.map((item) => {
            const realIndex = items.indexOf(item);
            return (
              <Card
                key={item.id}
                item={item}
                index={realIndex}
                options={options}
                isDetached={detachedNodeIds.has(item.nodeId)}
                isExpanded={expandedId === item.id}
                onToggleExpand={(id) => setExpandedId((current) => (current === id ? null : id))}
                onTypeChange={onTypeChange}
                onVerbalizationChange={onVerbalizationChange}
                onRemove={onRemove}
                onDragStart={setDragIndex}
                onDragOver={setOverIndex}
                onDrop={handleDrop}
                isDragging={dragIndex === realIndex}
                isDropTarget={overIndex === realIndex && dragIndex !== null && dragIndex !== realIndex}
              />
            );
          })}
        </div>
      </div>

      <div
        style={{
          padding: "12px 20px 16px",
          borderTop: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-footer)",
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}
      >
        <Button
          variant="primary"
          fullWidth
          disabled={items.length === 0}
          onClick={onGenerate}
          icon={<Icon name="sparkle" size={16} color="#fff" />}
        >
          Gerar especificações
        </Button>
        <Button
          variant="secondary"
          fullWidth
          active={manualSelectionEnabled}
          onClick={onToggleManualSelection}
          icon={<Icon name="plus" size={15} color={manualSelectionEnabled ? "var(--color-primary-ink)" : "var(--color-text-dark)"} />}
        >
          {manualSelectionEnabled ? "Parar seleção manual" : "Selecionar componente manualmente"}
        </Button>
      </div>
    </>
  );
}
