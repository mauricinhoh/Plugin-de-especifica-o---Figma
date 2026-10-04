import React, { useEffect, useState } from "react";
import { ElementInfo, SetupSelection, TagSelectionState } from "../../shared/types";
import { MANUAL_EVENTS, pendenciasOf } from "../../shared/review";
import { ReviewAction, ReviewState, screenPendencias } from "../state/reviewStore";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { FormsStatus, SetupBar } from "../components/SetupBar";
import { ReviewCard } from "../components/ReviewCard";

/**
 * Fase 6 — revisão (spec seção 8). Visual adaptado da Etapa 2 da
 * acessibilidade (src/ui/components/Step2.tsx): lista de cards que expandem.
 *
 *  - Editar valores (corrigidos ao sair do campo), trocar evento, remover.
 *  - Pendências destacadas, com filtro "Só pendências".
 *  - Adicionar evento manual: selecionar o elemento → escolher o evento → Adicionar.
 *  - Página inteira: "Tela X de N", Avançar, Pular revisão.
 */

interface ReviewProps {
  setup: SetupSelection;
  formsStatus: FormsStatus;
  state: ReviewState;
  screenIndex: number;
  selection: TagSelectionState;
  elementReply: { info: ElementInfo | null } | null;
  dispatch: (action: ReviewAction) => void;
  onScreenIndex: (index: number) => void;
  onRequestElementInfo: (nodeId: string) => void;
  onClearElementInfo: () => void;
  onFocusNode: (nodeId: string) => void;
  onFinish: () => void;
  onEditSetup: () => void;
  onRemap: () => void;
  remapLabel: string;
  onClose: () => void;
}

export function Review({
  setup,
  formsStatus,
  state,
  screenIndex,
  selection,
  elementReply,
  dispatch,
  onScreenIndex,
  onRequestElementInfo,
  onClearElementInfo,
  onFocusNode,
  onFinish,
  onEditSetup,
  onRemap,
  remapLabel,
  onClose
}: ReviewProps) {
  const screen = state.screens[screenIndex];
  const total = state.screens.length;
  const isPageMode = setup.modo === "pagina";
  const isLast = screenIndex >= total - 1;

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [onlyPending, setOnlyPending] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualEvento, setManualEvento] = useState<string>(MANUAL_EVENTS[0]);
  const [waitingInfo, setWaitingInfo] = useState(false);
  const [otherScreenInfo, setOtherScreenInfo] = useState<ElementInfo | null>(null);

  // Ao trocar de tela, fecha o card aberto e o painel manual.
  useEffect(() => {
    setExpandedKey(null);
    setManualOpen(false);
    setOtherScreenInfo(null);
  }, [screenIndex]);

  // Resposta do main thread com os dados do elemento escolhido para o evento manual.
  useEffect(() => {
    if (!waitingInfo || !elementReply) return;
    setWaitingInfo(false);
    onClearElementInfo();
    const elementInfo = elementReply.info;
    if (!elementInfo) return; // elemento sumiu: libera o botão para escolher outro
    if (elementInfo.frameId && elementInfo.frameId !== screen.frameId) {
      setOtherScreenInfo(elementInfo);
      return;
    }
    addManual(elementInfo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementReply, waitingInfo]);

  function addManual(info: ElementInfo) {
    dispatch({ type: "add-manual", screen: screenIndex, nodeId: info.nodeId, componente: info.componente, label: info.label, evento: manualEvento });
    setOtherScreenInfo(null);
    setManualOpen(false);
  }

  if (!screen) return null;

  const pendingCount = screenPendencias(state, screen);
  const visibleItems = screen.items
    .map((item, index) => ({ item, numero: index + 1 }))
    .filter(({ item }) => !onlyPending || pendenciasOf(item, state.plataforma).length > 0);

  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onEditSetup} onClose={onClose} />
      <Stepper current={2} progress={total > 0 ? (screenIndex + 1) / total : 1} />
      <div className="scroll-area" style={{ padding: "16px 20px 20px" }}>
        <SetupBar setup={setup} formsStatus={formsStatus} onEdit={onEditSetup} />

        {isPageMode && total > 1 && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Button variant="secondary" onClick={() => onScreenIndex(Math.max(0, screenIndex - 1))} disabled={screenIndex === 0} ariaLabel="Tela anterior">
              <Icon name="chevron-left" size={15} />
            </Button>
            <div style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 900 }}>
              Tela {screenIndex + 1} de {total}
            </div>
            <Button variant="secondary" onClick={() => onScreenIndex(Math.min(total - 1, screenIndex + 1))} disabled={isLast} ariaLabel="Próxima tela">
              <Icon name="chevron-right" size={15} />
            </Button>
          </div>
        )}

        <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "var(--color-surface-muted)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
          <div style={{ fontSize: 15, fontWeight: 900, overflowWrap: "anywhere" }}>{screen.nomeTela || "(sem nome)"}</div>
          <div style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 2, overflowWrap: "anywhere" }}>{screen.frameName}</div>
          <div style={{ fontSize: 12, marginTop: 6, fontWeight: 700, color: pendingCount > 0 ? "var(--color-warning)" : "var(--color-primary-ink)" }}>
            {screen.items.length} {screen.items.length === 1 ? "card" : "cards"} ·{" "}
            {pendingCount > 0 ? `${pendingCount} ${pendingCount === 1 ? "pendência" : "pendências"}` : "sem pendências"}
          </div>
          {screen.avisos.map((aviso, index) => (
            <div key={index} style={{ marginTop: 6, display: "flex", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--color-warning)" }}>
              <Icon name="alert-triangle" size={13} color="var(--color-warning)" />
              <span style={{ overflowWrap: "anywhere", minWidth: 0 }}>{aviso}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            role="switch"
            aria-checked={onlyPending}
            onClick={() => setOnlyPending((value) => !value)}
            style={{
              height: 30,
              padding: "0 12px",
              borderRadius: 999,
              border: `1px solid ${onlyPending ? "var(--color-warning-border)" : "var(--color-border-strong)"}`,
              background: onlyPending ? "var(--color-warning-bg)" : "var(--color-surface)",
              color: onlyPending ? "var(--color-warning)" : "var(--color-text-dark)",
              fontSize: 12,
              fontWeight: 800
            }}
          >
            Só pendências ({pendingCount})
          </button>
        </div>

        {visibleItems.map(({ item, numero }) => (
          <ReviewCard
            key={item.key}
            item={item}
            numero={numero}
            plataforma={state.plataforma}
            expanded={expandedKey === item.key}
            destinos={screen.destinos}
            origens={screen.origens}
            onToggle={() => setExpandedKey((key) => (key === item.key ? null : item.key))}
            onCommit={(field, raw) => dispatch({ type: "commit-value", screen: screenIndex, key: item.key, field, raw })}
            onAccept={(field) => dispatch({ type: "accept-flag", screen: screenIndex, key: item.key, field })}
            onConfirm={() => dispatch({ type: "confirm", screen: screenIndex, key: item.key })}
            onChangeEvent={(evento) => dispatch({ type: "change-event", screen: screenIndex, key: item.key, evento })}
            onRemove={() => dispatch({ type: "remove", screen: screenIndex, key: item.key })}
            onFocus={() => onFocusNode(item.nodeId)}
          />
        ))}
        {onlyPending && visibleItems.length === 0 && (
          <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--color-text-muted)", textAlign: "center" }}>Nenhuma pendência nesta tela.</div>
        )}

        <div style={{ marginTop: 14, borderRadius: 12, border: "1px dashed var(--color-border-strong)", padding: "10px 12px" }}>
          {!manualOpen ? (
            <button
              type="button"
              onClick={() => setManualOpen(true)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "none", background: "transparent", fontSize: 12.5, fontWeight: 800, color: "var(--color-primary)" }}
            >
              <Icon name="plus" size={14} color="var(--color-primary)" />
              Adicionar evento manual
            </button>
          ) : (
            <div>
              <div style={{ fontSize: 13, fontWeight: 900 }}>Adicionar evento manual</div>
              <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-text-muted)" }}>
                Selecione o elemento no canvas, escolha o evento e clique em Adicionar.
              </div>
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: selection.element ? "var(--color-primary-tint-strong)" : "var(--color-surface-muted)",
                  border: `1px solid ${selection.element ? "var(--color-primary)" : "var(--color-border)"}`,
                  fontSize: 12,
                  fontWeight: 700,
                  overflowWrap: "anywhere"
                }}
              >
                {selection.element ? `Elemento: ${selection.element.name}` : "Nenhum elemento selecionado"}
              </div>
              <label style={{ display: "block", marginTop: 8, fontSize: 12, fontWeight: 800 }}>
                Evento
                <select
                  aria-label="Evento manual"
                  value={manualEvento}
                  onChange={(event) => setManualEvento(event.target.value)}
                  style={{ display: "block", marginTop: 4, width: "100%", height: 34, borderRadius: 8, border: "1px solid var(--color-border-strong)", padding: "0 8px", fontSize: 12.5, background: "var(--color-surface)" }}
                >
                  {MANUAL_EVENTS.map((evento) => (
                    <option key={evento} value={evento}>
                      {evento}
                    </option>
                  ))}
                </select>
              </label>

              {otherScreenInfo ? (
                <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-warning)" }}>
                    Esse elemento está em outra tela. Adicionar nesta tela mesmo assim?
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    <Button variant="secondary" fullWidth onClick={() => setOtherScreenInfo(null)}>
                      Cancelar
                    </Button>
                    <Button fullWidth onClick={() => addManual(otherScreenInfo)}>
                      Adicionar
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <Button variant="secondary" fullWidth onClick={() => setManualOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    fullWidth
                    disabled={!selection.element || waitingInfo}
                    onClick={() => {
                      if (!selection.element) return;
                      setWaitingInfo(true);
                      onRequestElementInfo(selection.element.id);
                    }}
                  >
                    Adicionar
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button
            type="button"
            onClick={onRemap}
            style={{ border: "none", background: "transparent", fontSize: 12, fontWeight: 800, color: "var(--color-text-subtle)", textDecoration: "underline" }}
          >
            {remapLabel} (descarta as edições)
          </button>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--color-border)", padding: "12px 20px 16px", display: "flex", gap: 8 }}>
        {isPageMode && total > 1 && (
          <Button variant="secondary" fullWidth onClick={onFinish}>
            Pular revisão
          </Button>
        )}
        {isPageMode && !isLast ? (
          <Button fullWidth onClick={() => onScreenIndex(screenIndex + 1)} iconRight={<Icon name="arrow-right" size={15} color="#fff" />}>
            Avançar
          </Button>
        ) : (
          <Button fullWidth onClick={onFinish} iconRight={<Icon name="arrow-right" size={15} color="#fff" />}>
            Concluir revisão
          </Button>
        )}
      </div>
    </>
  );
}
