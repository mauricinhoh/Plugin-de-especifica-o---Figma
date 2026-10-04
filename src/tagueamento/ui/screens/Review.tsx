import React, { useEffect, useState } from "react";
import { ElementInfo, SetupSelection, TagSelectionState } from "../../shared/types";
import { MANUAL_EVENTS, pendenciasOf } from "../../shared/review";
import { colorOf } from "../../shared/eventColors";
import { ReviewAction, ReviewState } from "../state/reviewStore";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Dropdown } from "../components/Dropdown";
import { FormsNotice, FormsStatus } from "../components/SetupBar";
import { FilterTabs, TagContextCard } from "../components/TagParts";
import { ReviewCard } from "../components/ReviewCard";

/**
 * Revisão (telas 08–12 e 22 do redesign de 03/10/2026). As ações são as de
 * sempre: editar valores (corrigidos ao sair do campo), trocar evento,
 * confirmar, remover, adicionar evento manual; na página inteira, navegar
 * entre telas e "Pular revisão".
 */

interface ReviewProps {
  setup: SetupSelection;
  formsStatus: FormsStatus;
  state: ReviewState;
  screenIndex: number;
  selection: TagSelectionState;
  elementReply: { info: ElementInfo | null } | null;
  /** Abre já filtrado em Pendências e com este card aberto ("Resolver pendências"). */
  focusPending?: { key: string | null } | null;
  onFocusPendingHandled?: () => void;
  dispatch: (action: ReviewAction) => void;
  onScreenIndex: (index: number) => void;
  onRequestElementInfo: (nodeId: string) => void;
  onClearElementInfo: () => void;
  onFocusNode: (nodeId: string) => void;
  onFinish: () => void;
  onEditSetup: () => void;
  onClose: () => void;
}

export function Review({
  setup,
  formsStatus,
  state,
  screenIndex,
  selection,
  elementReply,
  focusPending,
  onFocusPendingHandled,
  dispatch,
  onScreenIndex,
  onRequestElementInfo,
  onClearElementInfo,
  onFocusNode,
  onFinish,
  onEditSetup,
  onClose
}: ReviewProps) {
  const screen = state.screens[screenIndex];
  const total = state.screens.length;
  const isPageMode = setup.modo === "pagina";
  const isLast = screenIndex >= total - 1;

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<"todos" | "pendencias">("todos");
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

  // "Resolver pendências" (resumo): filtra Pendências e abre o primeiro card pendente.
  useEffect(() => {
    if (!focusPending) return;
    setFilter("pendencias");
    setExpandedKey(focusPending.key);
    onFocusPendingHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusPending, screenIndex]);

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

  const withPending = screen.items.filter((item) => pendenciasOf(item, state.plataforma).length > 0).length;
  const visibleItems = screen.items
    .map((item, index) => ({ item, numero: index + 1 }))
    .filter(({ item }) => filter === "todos" || pendenciasOf(item, state.plataforma).length > 0);
  const hiddenCount = screen.items.length - visibleItems.length;
  const screenName = screen.nomeTela || screen.frameName;

  const avisos = screen.avisos.map((aviso, index) => (
    <div key={index} style={{ display: "flex", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--color-warning)" }}>
      <Icon name="alert-triangle" size={13} color="#8A6A00" />
      <span style={{ overflowWrap: "anywhere", minWidth: 0 }}>{aviso}</span>
    </div>
  ));

  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onEditSetup} onClose={onClose} />
      <Stepper current={2} progress={isPageMode && total > 0 ? (screenIndex + 1) / total : 1} gutter={20} />

      <div className="tag-body--review" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <FormsNotice formsStatus={formsStatus} />
        {isPageMode && total > 1 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 6, borderRadius: 12, border: "1px solid var(--color-border)" }}>
            <button type="button" className="tag-icon-btn" aria-label="Tela anterior" disabled={screenIndex === 0} onClick={() => onScreenIndex(Math.max(0, screenIndex - 1))}>
              <Icon name="chevron-left" size={15} color={screenIndex === 0 ? "#C8D0BF" : "#131713"} />
            </button>
            <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
              <div className="tag-ellipsis" style={{ fontSize: 13.5, fontWeight: 900 }} title={screenName}>
                {screenName}
              </div>
              <div className="tag-label-card" style={{ marginTop: 1 }}>
                Tela {screenIndex + 1} de {total}
              </div>
            </div>
            <button type="button" className="tag-icon-btn" aria-label="Próxima tela" disabled={isLast} onClick={() => onScreenIndex(Math.min(total - 1, screenIndex + 1))}>
              <Icon name="chevron-right" size={15} color={isLast ? "#C8D0BF" : "#131713"} />
            </button>
          </div>
        ) : (
          <TagContextCard canal={setup.canal} plataforma={setup.plataforma} region={setup.region} subregion={setup.subregion} screenName={screenName} onEdit={onEditSetup} />
        )}
        {avisos}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FilterTabs value={filter} total={screen.items.length} pending={withPending} onChange={setFilter} />
          {isPageMode && total > 1 && (
            <button type="button" className="tag-link" style={{ marginLeft: "auto", fontSize: 12 }} onClick={onEditSetup}>
              Alterar setup
            </button>
          )}
        </div>
      </div>

      <div className="scroll-area">
        <div style={{ padding: "0 20px 14px", display: "flex", flexDirection: "column", gap: 6, opacity: manualOpen ? 0.55 : 1, transition: "opacity .16s" }}>
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
              onEditSetup={onEditSetup}
            />
          ))}
          {filter === "pendencias" && (
            <div style={{ marginTop: 6, textAlign: "center", fontSize: 12, fontWeight: 700, color: "#8A9382" }}>
              {visibleItems.length === 0 ? "Nenhuma pendência nesta tela · " : hiddenCount > 0 ? `${hiddenCount} ${hiddenCount === 1 ? "card sem pendência oculto" : "cards sem pendência ocultos"} · ` : ""}
              <button type="button" className="tag-link" style={{ fontSize: 12 }} onClick={() => setFilter("todos")}>
                Ver todos
              </button>
            </div>
          )}
        </div>
      </div>

      {manualOpen ? (
        <div className="tag-manual">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14.5, fontWeight: 900 }}>Novo evento</span>
            <button
              type="button"
              aria-label="Fechar novo evento"
              onClick={() => {
                setManualOpen(false);
                setOtherScreenInfo(null);
              }}
              style={{ marginLeft: "auto", width: 26, height: 26, border: "none", background: "transparent", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="x" size={14} color="#8A9382" />
            </button>
          </div>
          <div style={{ marginTop: 2, fontSize: 12.5, color: "var(--color-text-muted)" }}>Selecione o elemento no canvas e escolha o evento.</div>

          <div style={{ marginTop: 12 }}>
            <span className="tag-label-card">Elemento</span>
            {selection.element ? (
              <div className="tag-element">
                <Icon name="frame" size={14} color="#33820D" />
                <span className="tag-ellipsis" style={{ flex: 1 }} title={selection.element.name}>
                  {selection.element.name}
                </span>
                <Icon name="check" size={14} color="#33820D" />
              </div>
            ) : (
              <div className="tag-element tag-element--empty">Clique em um elemento no canvas</div>
            )}
          </div>

          <div style={{ marginTop: 10 }}>
            <span className="tag-label-card">Evento</span>
            <div style={{ marginTop: 6 }}>
              <Dropdown
                compact
                dropUp
                ariaLabel="Evento manual"
                placeholder="Escolha o evento"
                options={MANUAL_EVENTS.map((evento) => ({ value: evento, label: evento, dot: colorOf(evento).fill, mono: true }))}
                value={manualEvento}
                onChange={setManualEvento}
              />
            </div>
          </div>

          {otherScreenInfo && (
            <div className="tag-alert" style={{ marginTop: 10 }}>
              <div className="tag-alert__row">
                <Icon name="alert-triangle" size={16} color="#8A6A00" />
                <span>Esse elemento está em outra tela. Adicionar nesta tela mesmo assim?</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 8 }}>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                if (otherScreenInfo) setOtherScreenInfo(null);
                else setManualOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              fullWidth
              disabled={!otherScreenInfo && (!selection.element || waitingInfo)}
              icon={<Icon name="plus" size={15} color={!otherScreenInfo && (!selection.element || waitingInfo) ? undefined : "#fff"} />}
              onClick={() => {
                if (otherScreenInfo) {
                  addManual(otherScreenInfo);
                  return;
                }
                if (!selection.element) return;
                setWaitingInfo(true);
                onRequestElementInfo(selection.element.id);
              }}
            >
              {otherScreenInfo ? "Adicionar mesmo assim" : "Adicionar evento"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="tag-footer tag-footer--review">
          {isPageMode && total > 1 ? (
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8 }}>
              <Button variant="secondary" onClick={onFinish}>
                <span style={{ padding: "0 14px" }}>Pular revisão</span>
              </Button>
              {!isLast ? (
                <Button fullWidth onClick={() => onScreenIndex(screenIndex + 1)} iconRight={<Icon name="arrow-right" size={16} color="#fff" />}>
                  Próxima tela
                </Button>
              ) : (
                <Button fullWidth onClick={onFinish} iconRight={<Icon name="arrow-right" size={16} color="#fff" />}>
                  Concluir revisão
                </Button>
              )}
            </div>
          ) : (
            <Button fullWidth onClick={onFinish} iconRight={<Icon name="arrow-right" size={16} color="#fff" />}>
              Concluir revisão
            </Button>
          )}
          <Button variant="secondary" fullWidth onClick={() => setManualOpen(true)} icon={<Icon name="plus" size={15} color="#131713" />}>
            Adicionar um evento manualmente
          </Button>
        </div>
      )}
    </>
  );
}
