import React from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { TitleBar } from "./TitleBar";
import { CoreIncompatibility } from "../../shared/types";

interface IncompatibilityBlockProps {
  context: "WEB" | "APLICATIVO";
  incompatibilities: CoreIncompatibility[];
  onBackToSelection: () => void;
  onFocusNode: (nodeId: string) => void;
  onClose: () => void;
}

const oppositeLabel: Record<string, string> = {
  WEB: "Core App",
  APLICATIVO: "Core Web"
};

const contextLabel: Record<string, string> = {
  WEB: "Web",
  APLICATIVO: "Aplicativo"
};

export function IncompatibilityBlock({
  context,
  incompatibilities,
  onBackToSelection,
  onFocusNode,
  onClose
}: IncompatibilityBlockProps) {
  const opposite = oppositeLabel[context];
  const contextText = contextLabel[context];
  const count = incompatibilities.length;

  return (
    <>
      <TitleBar title="Especificação de Handoff" showBack onBack={onBackToSelection} onClose={onClose} />
      <div className="scroll-area" style={{ padding: "28px 24px 24px" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#FDECEC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Icon name="x-circle" size={22} color="var(--color-danger)" />
        </div>

        <h2
          style={{
            marginTop: 16,
            fontSize: 21,
            fontWeight: 900,
            letterSpacing: "-.025em",
            color: "var(--color-text-dark)",
            margin: "16px 0 0"
          }}
        >
          Componentes incompatíveis
        </h2>

        <p style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.45, color: "var(--color-text-muted)" }}>
          A tela foi identificada como <strong style={{ color: "var(--color-text-dark)" }}>{contextText}</strong>,
          mas contém {count} {count === 1 ? "componente" : "componentes"} do{" "}
          <strong style={{ color: "var(--color-text-dark)" }}>{opposite}</strong>. Corrija no Figma e rode a
          análise de novo.
        </p>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          {incompatibilities.map((item) => (
            <div
              key={item.nodeId}
              style={{
                padding: 12,
                borderRadius: 11,
                background: "var(--color-danger-bg)",
                border: "1px solid var(--color-danger-border)",
                display: "flex",
                alignItems: "center",
                gap: 11
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 34,
                  minWidth: 5,
                  borderRadius: 99,
                  background: "var(--color-danger)"
                }}
              />
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
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--color-danger-ink)", marginTop: 2 }}>
                  {opposite} usado em tela {contextText}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onFocusNode(item.nodeId)}
                style={{
                  fontSize: 11.5,
                  fontWeight: 900,
                  color: "var(--color-danger)",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1.5px solid rgba(199,52,52,.35)",
                  padding: 0,
                  whiteSpace: "nowrap"
                }}
              >
                Ir para
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px 24px 18px", borderTop: "1px solid var(--color-border)" }}>
        <Button variant="secondary" fullWidth onClick={onBackToSelection} icon={<Icon name="chevron-left" size={15} />}>
          Voltar para seleção
        </Button>
      </div>
    </>
  );
}
