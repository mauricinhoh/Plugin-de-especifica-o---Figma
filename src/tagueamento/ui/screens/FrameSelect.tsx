import React, { useEffect } from "react";
import { SetupSelection, TagSelectionState } from "../../shared/types";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { FormsStatus, SetupBar } from "../components/SetupBar";

/**
 * Fase 4 — "Selecione uma tela" (modo Tela por tela).
 * CÓPIA adaptada da Etapa 1 da acessibilidade (src/ui/components/Step1.tsx):
 * mesmo visual do card de seleção, sem o fluxo de "tela já marcada" (que
 * entra na Fase 7, com chaves próprias do tagueamento).
 */

interface FrameSelectProps {
  setup: SetupSelection;
  formsStatus: FormsStatus;
  selection: TagSelectionState;
  onMap: () => void;
  onEditSetup: () => void;
  onExit: () => void;
  onClose: () => void;
}

const CHIPS = ["Frame", "Grupo", "Auto layout"];

function isTypingTarget(element: Element | null): boolean {
  if (!element) return false;
  const tag = element.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (element as HTMLElement).isContentEditable;
}

export function FrameSelect({ setup, formsStatus, selection, onMap, onEditSetup, onExit, onClose }: FrameSelectProps) {
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key !== "Enter" || isTypingTarget(document.activeElement) || !selection.valid) return;
      onMap();
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [selection.valid, onMap]);

  const metaDims = selection.width !== undefined && selection.height !== undefined;

  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onEditSetup} onClose={onClose} />
      <Stepper current={1} progress={1} />
      <div className="scroll-area" style={{ padding: "18px 24px 24px" }}>
        <SetupBar setup={setup} formsStatus={formsStatus} onEdit={onEditSetup} />

        <h2 style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-.025em", margin: "20px 0 0" }}>Selecione uma tela</h2>
        <p style={{ marginTop: 6, fontSize: "13.5px", lineHeight: 1.45, color: "var(--color-text-muted)" }}>
          Escolha no canvas o frame que você quer taguear.
        </p>

        {!selection.valid ? (
          <>
            <div
              style={{
                marginTop: 18,
                border: "1.5px dashed var(--color-border-strong)",
                borderRadius: 12,
                background: "var(--color-surface-subtle)",
                padding: "26px 22px",
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
                Clique em um frame no canvas do Figma — o plugin acompanha sua seleção em tempo real.
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <span style={{ fontSize: "10.5px", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".09em", color: "var(--color-text-subtle)" }}>
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
              marginTop: 18,
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
              <div style={{ fontSize: "14.5px", fontWeight: 800, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selection.nodeName}
              </div>
              {(selection.nodeType || metaDims) && (
                <div style={{ marginTop: 4, fontFamily: "var(--font-mono)", fontSize: "11.5px", fontWeight: 700, color: "#4E6A3C" }}>
                  {selection.nodeType}
                  {selection.nodeType && metaDims ? " · " : ""}
                  {metaDims ? `${selection.width}×${selection.height}` : ""}
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
            Vamos encontrar os componentes da tela e preparar os eventos. Você revisa tudo antes de gerar os cards.
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
        <Button fullWidth disabled={!selection.valid} onClick={onMap} iconRight={<Icon name="arrow-right" size={16} color="#fff" />}>
          Mapear tela
        </Button>
        {selection.valid && (
          <div style={{ textAlign: "center", fontSize: "11.5px", fontWeight: 700, color: "#A3AC9B" }}>
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
