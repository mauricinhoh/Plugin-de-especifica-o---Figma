import React, { useEffect } from "react";
import { TitleBar } from "./TitleBar";
import { Stepper } from "./Stepper";
import { Button } from "./Button";
import { Icon } from "./Icon";

interface Step1Props {
  selectionValid: boolean;
  selectedNodeName: string | null;
  selectedNodeType?: string;
  selectedWidth?: number;
  selectedHeight?: number;
  selectedLayerCount?: number;
  onBack: () => void;
  onClose: () => void;
  onStartAnalysis: () => void;
}

const CHIPS = ["Frame", "Grupo", "Auto layout"];

function isTypingTarget(element: Element | null): boolean {
  if (!element) return false;
  const tag = element.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (element as HTMLElement).isContentEditable;
}

export function Step1({
  selectionValid,
  selectedNodeName,
  selectedNodeType,
  selectedWidth,
  selectedHeight,
  selectedLayerCount,
  onBack,
  onClose,
  onStartAnalysis
}: Step1Props) {
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key !== "Enter") return;
      if (isTypingTarget(document.activeElement)) return;
      if (!selectionValid) return;
      onStartAnalysis();
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [selectionValid, onStartAnalysis]);

  const metaDims = selectedWidth !== undefined && selectedHeight !== undefined;

  return (
    <>
      <TitleBar title="Especificação de Handoff" showBack onBack={onBack} onClose={onClose} />
      <Stepper current={1} />
      <div className="scroll-area" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-.025em", margin: 0 }}>Selecione uma tela</h2>
        <p style={{ marginTop: 6, fontSize: "13.5px", lineHeight: 1.45, color: "var(--color-text-muted)" }}>
          Escolha no canvas o frame que você quer especificar.
        </p>

        {!selectionValid ? (
          <>
            <div
              style={{
                marginTop: 20,
                border: "1.5px dashed var(--color-border-strong)",
                borderRadius: 12,
                background: "var(--color-surface-subtle)",
                padding: "28px 22px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center"
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 13,
                  background: "#fff",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Icon name="frame" size={22} color="var(--color-text-subtle)" />
              </div>
              <div style={{ marginTop: 14, fontSize: "14.5px", fontWeight: 800 }}>Nenhuma tela selecionada</div>
              <div style={{ marginTop: 4, fontSize: "12.5px", lineHeight: 1.45, color: "var(--color-text-muted)", maxWidth: 250 }}>
                Clique em um elemento no canvas do Figma — o plugin acompanha sua seleção em tempo real.
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: ".09em",
                  color: "var(--color-text-subtle)"
                }}
              >
                Aceita
              </span>
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {CHIPS.map((chip) => (
                  <span
                    key={chip}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 11px",
                      borderRadius: 999,
                      background: "var(--color-surface-muted)",
                      border: "1px solid var(--color-border)",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#3C4438"
                    }}
                  >
                    <Icon name="check" size={12} color="var(--color-primary)" />
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              marginTop: 20,
              border: "1px solid var(--color-primary)",
              borderRadius: 12,
              background: "var(--color-primary-tint-strong)",
              padding: 16,
              boxShadow: "0 0 0 3px rgba(51,130,13,.08)",
              display: "flex",
              gap: 13
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                minWidth: 38,
                borderRadius: 10,
                background: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Icon name="frame" size={18} color="#fff" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "10.5px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  color: "var(--color-primary-ink)"
                }}
              >
                Tela selecionada
                <Icon name="check" size={12} color="var(--color-primary)" />
              </div>
              <div
                style={{
                  fontSize: "14.5px",
                  fontWeight: 800,
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {selectedNodeName}
              </div>
              {(selectedNodeType || metaDims || selectedLayerCount !== undefined) && (
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: "var(--font-mono)",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#4E6A3C",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap"
                  }}
                >
                  {(selectedNodeType || metaDims) && (
                    <span>
                      {selectedNodeType}
                      {selectedNodeType && metaDims ? " · " : ""}
                      {metaDims ? `${Math.round(selectedWidth!)}×${Math.round(selectedHeight!)}` : ""}
                    </span>
                  )}
                  {selectedLayerCount !== undefined && (
                    <>
                      {(selectedNodeType || metaDims) && (
                        <span style={{ width: 3, height: 3, borderRadius: 999, background: "#9DBB8B" }} />
                      )}
                      <span>{selectedLayerCount} camadas</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 10,
            background: "var(--color-surface-muted)",
            border: "1px solid var(--color-border)",
            display: "flex",
            gap: 10,
            alignItems: "flex-start"
          }}
        >
          <Icon name="info" size={15} color="var(--color-text-muted)" />
          <span style={{ fontSize: "12.5px", lineHeight: 1.45, color: "#3C4438" }}>
            A análise considera os componentes e instâncias de nível mais alto dentro da tela selecionada.
          </span>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          padding: "14px 24px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 9
        }}
      >
        <Button
          variant="primary"
          fullWidth
          disabled={!selectionValid}
          onClick={onStartAnalysis}
          iconRight={<Icon name="arrow-right" size={16} color="#fff" />}
        >
          Começar especificação
        </Button>
        {selectionValid && (
          <div
            style={{
              textAlign: "center",
              fontSize: "11.5px",
              fontWeight: 700,
              color: "#A3AC9B"
            }}
          >
            ou pressione{" "}
            <kbd
              style={{
                fontFamily: "var(--font-mono)",
                background: "var(--color-surface-muted)",
                border: "1px solid var(--color-border)",
                borderRadius: 5,
                padding: "2px 6px",
                color: "#3C4438"
              }}
            >
              ⏎ Enter
            </kbd>
          </div>
        )}
      </div>
    </>
  );
}
