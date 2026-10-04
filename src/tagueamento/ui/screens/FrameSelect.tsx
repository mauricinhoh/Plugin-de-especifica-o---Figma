import React, { useEffect } from "react";
import { SetupSelection, TagSelectionState } from "../../shared/types";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { FormsNotice, FormsStatus } from "../components/SetupBar";

/**
 * Telas 05/06 (Selecione uma tela) e 17 (Tela já tagueada) do redesign de
 * 03/10/2026. Mesmas ações de antes: mapear, refazer ou excluir os marcadores.
 */

interface FrameSelectProps {
  setup: SetupSelection;
  formsStatus: FormsStatus;
  selection: TagSelectionState;
  onMap: () => void;
  /** "Excluir marcadores" de uma tela que já tem tagueamento. */
  onDeleteOutput: () => void;
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

function metaOf(selection: TagSelectionState): string {
  const parts: string[] = [];
  if (selection.nodeType) parts.push(selection.nodeType === "FRAME" ? "Frame" : selection.nodeType === "GROUP" ? "Grupo" : selection.nodeType);
  if (selection.width !== undefined && selection.height !== undefined) parts.push(`${selection.width}×${selection.height}`);
  if (selection.layerCount !== undefined) parts.push(`${selection.layerCount} ${selection.layerCount === 1 ? "camada" : "camadas"}`);
  return parts.join(" · ");
}

export function FrameSelect({ formsStatus, selection, onMap, onDeleteOutput, onEditSetup, onClose }: FrameSelectProps) {
  const tagged = selection.valid && (selection.taggedCards ?? 0) > 0;
  const cards = selection.taggedCards ?? 0;

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key !== "Enter" || isTypingTarget(document.activeElement) || !selection.valid || tagged) return;
      // Enter num botão focado já dispara o clique dele.
      if (document.activeElement && document.activeElement.tagName === "BUTTON") return;
      onMap();
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [selection.valid, tagged, onMap]);

  // 17 · Tela já tagueada
  if (tagged) {
    return (
      <>
        <TitleBar title="Tagueamento" showBack onBack={onEditSetup} onClose={onClose} />
        <div className="scroll-area">
          <div style={{ padding: "28px 24px 20px" }}>
            <FormsNotice formsStatus={formsStatus} />
            <span className="tag-pill tag-pill--ok" style={{ marginTop: formsStatus ? 16 : 0 }}>
              <Icon name="tag" size={12} color="#266009" />
              Já tagueada · {cards} {cards === 1 ? "card" : "cards"}
            </span>
            <h2 className="tag-h2" style={{ marginTop: 12, display: "flex", gap: 6, minWidth: 0, flexWrap: "nowrap" }}>
              <span style={{ flex: "0 0 auto" }}>O que fazer com</span>
              <span style={{ display: "flex", minWidth: 0 }}>
                <span className="tag-ellipsis" style={{ color: "var(--color-primary)" }} title={selection.nodeName ?? ""}>
                  {selection.nodeName}
                </span>
                <span style={{ flex: "0 0 auto" }}>?</span>
              </span>
            </h2>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-subtle)"
              }}
            >
              <div style={{ width: 34, height: 34, flex: "0 0 34px", borderRadius: 9, background: "#fff", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="frame" size={16} color="#5C6459" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="tag-ellipsis" style={{ fontSize: 13.5, fontWeight: 800 }} title={selection.nodeName ?? ""}>
                  {selection.nodeName}
                </div>
                <div className="tag-mono tag-ellipsis" style={{ fontSize: 11, fontWeight: 700, color: "#4E6A3C", marginTop: 1 }}>
                  {metaOf(selection)}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <button type="button" className="tag-choice" onClick={onMap}>
                <span className="tag-choice__icon">
                  <Icon name="refresh" size={19} color="#33820D" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="tag-choice__title" style={{ display: "block" }}>
                    Refazer o tagueamento
                  </span>
                  <span className="tag-choice__desc" style={{ display: "block" }}>
                    Mapeia de novo. {cards === 1 ? "O card antigo só sai" : `Os ${cards} cards antigos só saem`} quando você gerar os novos.
                  </span>
                </span>
                <Icon name="chevron-right" size={16} color="#8A9382" />
              </button>
              <button type="button" className="tag-choice tag-choice--danger" onClick={onDeleteOutput}>
                <span className="tag-choice__icon">
                  <Icon name="trash" size={19} color="#C73434" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="tag-choice__title" style={{ display: "block" }}>
                    Excluir marcadores
                  </span>
                  <span className="tag-choice__desc" style={{ display: "block" }}>
                    Remove {cards === 1 ? "o card" : `os ${cards} cards`} desta tela. Dá para desfazer com Ctrl+Z.
                  </span>
                </span>
                <Icon name="chevron-right" size={16} color="#8A9382" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 05/06 · Selecione uma tela
  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onEditSetup} onClose={onClose} />
      <Stepper current={1} progress={1} />
      <div className="scroll-area">
        <div className="tag-body">
          <FormsNotice formsStatus={formsStatus} />
          <h2 className="tag-h2" style={{ marginTop: formsStatus ? 18 : 0 }}>
            Selecione uma tela
          </h2>
          <p className="tag-sub">Escolha no canvas o frame que você quer taguear.</p>

          {!selection.valid ? (
            <>
              <div
                style={{
                  marginTop: 20,
                  border: "1.5px dashed #D3DACB",
                  borderRadius: 12,
                  background: "#F9FBF7",
                  padding: "26px 22px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center"
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 13, background: "#fff", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="frame" size={22} color="#8A9382" />
                </div>
                <div style={{ marginTop: 14, fontSize: 14.5, fontWeight: 800 }}>Nenhuma tela selecionada</div>
                <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.45, color: "var(--color-text-muted)", maxWidth: 260 }}>
                  Clique em um frame no canvas do Figma — o plugin acompanha sua seleção em tempo real.
                </div>
              </div>
              <div style={{ marginTop: 18 }}>
                <span className="tag-label-card">Aceita</span>
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
                      <Icon name="check" size={12} color="#33820D" />
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  marginTop: 20,
                  border: "1px solid #33820D",
                  borderRadius: 12,
                  background: "#F4F9F0",
                  padding: 16,
                  boxShadow: "0 0 0 3px rgba(51,130,13,.08)",
                  display: "flex",
                  gap: 13,
                  alignItems: "center"
                }}
              >
                <div style={{ width: 38, height: 38, flex: "0 0 38px", borderRadius: 10, background: "#33820D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="frame" size={18} color="#fff" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }} className="tag-label-card">
                    <span style={{ color: "var(--color-primary-ink)" }}>Tela selecionada</span>
                    <Icon name="check" size={12} color="#33820D" />
                  </div>
                  <div className="tag-ellipsis" style={{ fontSize: 14.5, fontWeight: 800, marginTop: 2 }} title={selection.nodeName ?? ""}>
                    {selection.nodeName}
                  </div>
                  <div className="tag-mono tag-ellipsis" style={{ marginTop: 3, fontSize: 11.5, fontWeight: 700, color: "#4E6A3C" }}>
                    {metaOf(selection)}
                  </div>
                </div>
              </div>
              <div className="tag-note" style={{ marginTop: 14 }}>
                <Icon name="info" size={15} color="#5C6459" />
                <span>Vamos encontrar os componentes da tela e preparar os eventos. Você revisa tudo antes de gerar os cards.</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="tag-footer">
        <Button fullWidth disabled={!selection.valid} onClick={onMap} iconRight={<Icon name="arrow-right" size={16} color={selection.valid ? "#fff" : undefined} />}>
          Mapear tela
        </Button>
        {selection.valid && (
          <div className="tag-help">
            ou pressione <kbd className="tag-kbd">⏎ Enter</kbd>
          </div>
        )}
      </div>
    </>
  );
}
