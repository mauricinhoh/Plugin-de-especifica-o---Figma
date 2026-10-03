import React, { useState } from "react";
import { MappedItem, MappedScreen, MappingResult, SetupSelection } from "../../shared/types";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { usePrefersReducedMotionCopy } from "../hooks";
import { FormsStatus, SetupBar } from "../components/SetupBar";

/**
 * Fase 4 — prévia do mapeamento (só leitura). Mostra, por frame, o card de
 * tela e os componentes encontrados, com os valores que o plugin preencheu,
 * as pendências e o que fica para o PD. A revisão com edição é a Fase 6; a
 * geração dos cards no canvas, a Fase 7.
 */

interface MappingPreviewProps {
  setup: SetupSelection;
  formsStatus: FormsStatus;
  result: MappingResult | null;
  progress: { done: number; total: number } | null;
  error: string | null;
  /** "Mapear outra tela" (tela por tela) ou "Mapear de novo" (página inteira). */
  remapLabel: string;
  onFocusNode: (nodeId: string) => void;
  onRemap: () => void;
  onEditSetup: () => void;
  onClose: () => void;
}

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 11.5, wordBreak: "break-all" };

function Spinner() {
  const reduced = usePrefersReducedMotionCopy();
  return (
    <span
      aria-hidden="true"
      style={{
        width: 30,
        height: 30,
        borderRadius: 999,
        border: "3px solid var(--color-primary-tint)",
        borderTopColor: "var(--color-primary)",
        display: "inline-block",
        animation: reduced ? undefined : "spin .8s linear infinite"
      }}
    />
  );
}

function ItemCard({ item, onFocus }: { item: MappedItem; onFocus: () => void }) {
  const hasPending = item.pendencias.length > 0;
  return (
    <div
      style={{
        marginTop: 10,
        borderRadius: 12,
        border: `1px solid ${hasPending ? "var(--color-warning-border)" : "var(--color-border)"}`,
        background: hasPending ? "var(--color-warning-bg-soft)" : "var(--color-surface)",
        padding: "10px 12px"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span
          style={{
            minWidth: 24,
            height: 24,
            borderRadius: 999,
            background: "var(--color-chrome)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {item.numero}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 900 }}>{item.evento}</div>
          <div style={{ fontSize: 11.5, color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.componente}
            {item.label && item.origem === "componente" ? ` · “${item.label}”` : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={onFocus}
          aria-label={`Ver ${item.componente} no canvas`}
          title="Ver no canvas"
          style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)", borderRadius: 8, padding: "4px 8px", fontSize: 11, fontWeight: 800 }}
        >
          Ver
        </button>
      </div>

      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 10, rowGap: 3 }}>
        {Object.entries(item.params).map(([key, value]) => (
          <React.Fragment key={key}>
            <span style={{ ...mono, color: "var(--color-text-muted)" }}>{key}</span>
            <span style={{ ...mono, fontWeight: 700, color: value.startsWith("<") ? "var(--color-text-disabled)" : "var(--color-text-dark)" }}>
              {value}
            </span>
          </React.Fragment>
        ))}
      </div>

      {item.paraPd.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--color-text-muted)" }}>
          Na revisão, o PD preenche: <span style={mono}>{item.paraPd.join(", ")}</span>
        </div>
      )}
      {item.pendencias.map((pendencia, index) => (
        <div key={index} style={{ marginTop: 6, display: "flex", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--color-warning)" }}>
          <Icon name="alert-triangle" size={13} color="var(--color-warning)" />
          <span>{pendencia}</span>
        </div>
      ))}
    </div>
  );
}

function ScreenSection({ screen, onFocusNode }: { screen: MappedScreen; onFocusNode: (id: string) => void }) {
  const pendingCount = screen.items.filter((item) => item.pendencias.length > 0).length;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--color-surface-muted)", border: "1px solid var(--color-border)" }}>
        <div style={{ fontSize: 15, fontWeight: 900 }}>{screen.nomeTela || "(sem nome)"}</div>
        <div style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 2 }}>
          {screen.frameName} · {screen.largura}×{screen.altura}
        </div>
        <div style={{ fontSize: 12, marginTop: 6 }}>
          {screen.items.length - 1} {screen.items.length - 1 === 1 ? "componente" : "componentes"}
          {pendingCount > 0 ? ` · ${pendingCount} com pendência` : ""}
        </div>
        {screen.avisos.map((aviso, index) => (
          <div key={index} style={{ marginTop: 6, display: "flex", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--color-warning)" }}>
            <Icon name="alert-triangle" size={13} color="var(--color-warning)" />
            <span>{aviso}</span>
          </div>
        ))}
      </div>
      {screen.items.map((item) => (
        <ItemCard key={item.nodeId + item.numero} item={item} onFocus={() => onFocusNode(item.nodeId)} />
      ))}
    </div>
  );
}

export function MappingPreview({
  setup,
  formsStatus,
  result,
  progress,
  error,
  remapLabel,
  onFocusNode,
  onRemap,
  onEditSetup,
  onClose
}: MappingPreviewProps) {
  const [index, setIndex] = useState(0);
  const screens = result?.screens ?? [];
  const current = screens[Math.min(index, Math.max(0, screens.length - 1))];
  const loading = !result && !error;

  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onEditSetup} onClose={onClose} />
      <Stepper current={2} progress={0.3} />
      <div className="scroll-area" style={{ padding: "18px 24px 24px" }}>
        <SetupBar setup={setup} formsStatus={formsStatus} onEdit={onEditSetup} />

        <h2 style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-.025em", margin: "20px 0 0" }}>Prévia do mapeamento</h2>
        <p style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.45, color: "var(--color-text-muted)" }}>
          Só leitura por enquanto: a edição chega na revisão (Fase 6) e os cards no canvas, na geração (Fase 7).
        </p>

        {loading && (
          <div role="status" style={{ marginTop: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Spinner />
            <span style={{ fontSize: 13, fontWeight: 800 }}>
              {progress && progress.total > 1 ? `Mapeando tela ${Math.min(progress.done + 1, progress.total)} de ${progress.total}` : "Mapeando a tela…"}
            </span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 16,
              display: "flex",
              gap: 8,
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-danger-bg)",
              border: "1px solid var(--color-danger-border)",
              color: "var(--color-danger)",
              fontSize: 12.5,
              fontWeight: 700
            }}
          >
            <Icon name="alert-circle" size={14} color="var(--color-danger)" />
            <span>{error}</span>
          </div>
        )}

        {result && result.avisos.map((aviso, i) => (
          <div key={i} style={{ marginTop: 14, fontSize: 12.5, fontWeight: 700, color: "var(--color-warning)" }}>
            {aviso}
          </div>
        ))}

        {result && screens.length > 1 && (
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Button variant="secondary" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} ariaLabel="Tela anterior">
              <Icon name="chevron-left" size={15} />
            </Button>
            <div style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 900 }}>
              Tela {index + 1} de {screens.length}
            </div>
            <Button
              variant="secondary"
              onClick={() => setIndex((i) => Math.min(screens.length - 1, i + 1))}
              disabled={index >= screens.length - 1}
              ariaLabel="Próxima tela"
            >
              <Icon name="chevron-right" size={15} />
            </Button>
          </div>
        )}

        {current && <ScreenSection screen={current} onFocusNode={onFocusNode} />}
      </div>

      <div style={{ borderTop: "1px solid var(--color-border)", padding: "12px 24px 18px", display: "flex", gap: 8 }}>
        <Button variant="secondary" fullWidth onClick={onRemap} disabled={loading} icon={<Icon name="refresh" size={15} />}>
          {remapLabel}
        </Button>
      </div>
    </>
  );
}
