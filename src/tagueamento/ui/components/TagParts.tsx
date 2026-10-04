import React from "react";
import { ModoGeracao, Plataforma } from "../../shared/types";
import { Icon } from "./Icon";

/**
 * Peças visuais do redesign do tagueamento (03/10/2026):
 * TagContextCard, FilterTabs, ModeSegmented, TokenHint, Spinner e Queued.
 * Só aparência — nenhuma regra mora aqui.
 */

// ---------- TagContextCard ----------

interface TagContextCardProps {
  canal: string;
  plataforma: Plataforma;
  region: string;
  subregion: string;
  screenName?: string;
  onEdit: () => void;
}

export function TagContextCard({ canal, plataforma, region, subregion, screenName, onEdit }: TagContextCardProps) {
  return (
    <div className="tag-context">
      <div className="tag-context__icon">
        <Icon name={plataforma === "WEB" ? "monitor" : "smartphone"} size={15} color="#5C6459" />
      </div>
      <div className="tag-context__main">
        <div className="tag-context__canal tag-ellipsis" title={canal}>
          {canal}
        </div>
        <div className="tag-context__codes" title={`${region} › ${subregion}`}>
          <span className="tag-ellipsis">{region}</span>
          <Icon name="chevron-right" size={10} color="#A3AC9B" />
          <span className="tag-ellipsis">{subregion}</span>
        </div>
        {screenName && (
          <div className="tag-context__screen" title={screenName}>
            <Icon name="frame" size={11} color="#5C6459" />
            <span className="tag-ellipsis">{screenName}</span>
          </div>
        )}
      </div>
      <button type="button" className="tag-context__edit" onClick={onEdit}>
        Alterar
      </button>
    </div>
  );
}

// ---------- FilterTabs ----------

interface FilterTabsProps {
  value: "todos" | "pendencias";
  total: number;
  pending: number;
  onChange: (value: "todos" | "pendencias") => void;
}

export function FilterTabs({ value, total, pending, onChange }: FilterTabsProps) {
  return (
    <div className="tag-tabs" role="tablist" aria-label="Filtrar eventos">
      <button type="button" role="tab" className="tag-tab" aria-selected={value === "todos"} onClick={() => onChange("todos")}>
        Todos <span className="tag-tab__count">{total}</span>
      </button>
      <button type="button" role="tab" className="tag-tab" aria-selected={value === "pendencias"} onClick={() => onChange("pendencias")}>
        Pendências <span className="tag-tab__badge">{pending}</span>
      </button>
    </div>
  );
}

// ---------- ModeSegmented ----------

export function ModeSegmented({ value, onChange }: { value: ModoGeracao; onChange: (value: ModoGeracao) => void }) {
  const options: { value: ModoGeracao; title: string; desc: string; icon: "frame" | "layers" }[] = [
    { value: "tela", title: "Tela por tela", desc: "Você revisa cada frame", icon: "frame" },
    { value: "pagina", title: "Página inteira", desc: "Todos os frames", icon: "layers" }
  ];
  return (
    <div className="tag-seg" role="radiogroup" aria-label="Como gerar">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button key={option.value} type="button" role="radio" aria-checked={selected} className="tag-seg__opt" onClick={() => onChange(option.value)}>
            <Icon name={option.icon} size={17} color={selected ? "#33820D" : "#8A9382"} />
            <span style={{ minWidth: 0 }}>
              <span className="tag-seg__title tag-ellipsis">{option.title}</span>
              <span className="tag-seg__desc tag-ellipsis">{option.desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- TokenHint ----------

export function TokenHint({ label, value, neutral = false }: { label: string; value: string; neutral?: boolean }) {
  return (
    <div className="tag-token">
      <span style={{ flex: "0 0 auto" }}>{label}</span>
      <span className={`tag-token__chip tag-ellipsis${neutral ? " tag-token__chip--neutral" : ""}`} title={value}>
        {value}
      </span>
    </div>
  );
}

// ---------- Spinner / fila ----------

export function Spinner({ size = 16, large = false }: { size?: number; large?: boolean }) {
  return <span className={`tag-spinner${large ? " tag-spinner--lg" : ""}`} style={{ width: size, height: size }} aria-hidden="true" />;
}

export function Queued({ size = 16 }: { size?: number }) {
  return <span className="tag-queued" style={{ width: size, height: size }} aria-hidden="true" />;
}
