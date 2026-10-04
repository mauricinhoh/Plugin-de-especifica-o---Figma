import React from "react";
import { SetupSelection } from "../../shared/types";
import { ReviewState, screenPendencias, totalPendencias } from "../state/reviewStore";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { TagContextCard } from "../components/TagParts";

/**
 * Resumo (telas 13 e 23 do redesign de 03/10/2026). A regra continua: pendência
 * BLOQUEIA a geração. "Resolver pendências" abre a revisão já filtrada.
 */

interface ReviewSummaryProps {
  setup: SetupSelection;
  state: ReviewState;
  onGoToScreen: (index: number) => void;
  onResolve: () => void;
  onGenerate: () => void;
  onBack: () => void;
  onEditSetup: () => void;
  onClose: () => void;
}

export function ReviewSummary({ setup, state, onGoToScreen, onResolve, onGenerate, onBack, onEditSetup, onClose }: ReviewSummaryProps) {
  const pending = totalPendencias(state);
  const cards = state.screens.reduce((sum, screen) => sum + screen.items.length, 0);
  const screensWithPending = state.screens.filter((screen) => screenPendencias(state, screen) > 0).length;
  const isPage = state.screens.length > 1;
  const pendLabel = `${pending} ${pending === 1 ? "pendência" : "pendências"}`;

  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onBack} onClose={onClose} />
      <Stepper current={3} progress={pending > 0 ? 0.3 : 0.6} />
      <div className="scroll-area">
        <div className="tag-body">
          {pending > 0 ? (
            <span className="tag-pill tag-pill--warning">
              <Icon name="alert-triangle" size={13} color="#8A6A00" />
              {pendLabel}
              {isPage ? ` em ${screensWithPending} ${screensWithPending === 1 ? "tela" : "telas"}` : ""}
            </span>
          ) : (
            <span className="tag-pill tag-pill--ok">
              <Icon name="check" size={12} color="#266009" />
              Sem pendências
            </span>
          )}
          <h2 className="tag-h2" style={{ marginTop: 10 }}>
            {pending > 0 ? "Falta pouco para gerar" : "Tudo pronto para gerar"}
          </h2>
          <p className="tag-sub">
            {isPage
              ? `${state.screens.length} telas · ${cards} cards no total.`
              : pending > 0
                ? "Os cards só podem ser gerados quando todas as pendências estiverem resolvidas."
                : "Os cards e marcadores vão ser criados ao lado da tela."}
          </p>

          <div style={{ marginTop: 16 }}>
            <TagContextCard canal={setup.canal} plataforma={setup.plataforma} region={setup.region} subregion={setup.subregion} onEdit={onEditSetup} />
          </div>

          <div className="tag-list" style={{ marginTop: 12 }}>
            {state.screens.map((screen, index) => {
              const count = screenPendencias(state, screen);
              const name = screen.nomeTela || screen.frameName;
              return (
                <button key={screen.frameId} type="button" className="tag-list__row" onClick={() => onGoToScreen(index)}>
                  <span className="tag-list__box" style={{ background: count > 0 ? "#FFF7E4" : "#EDF5E7" }}>
                    <Icon name={count > 0 ? "alert-triangle" : "check"} size={15} color={count > 0 ? "#8A6A00" : "#33820D"} />
                  </span>
                  <span className="tag-list__main">
                    <span className="tag-list__name tag-ellipsis" style={{ display: "block" }} title={name}>
                      {name}
                    </span>
                    <span className="tag-list__meta" style={{ display: "block" }}>
                      {screen.items.length} {screen.items.length === 1 ? "card" : "cards"} ·{" "}
                      {count > 0 ? <span style={{ color: "#8A6A00" }}>{count} {count === 1 ? "pendência" : "pendências"}</span> : "pronta"}
                    </span>
                  </span>
                  <span className="tag-list__action" style={count > 0 ? undefined : { color: "#5C6459" }}>
                    {count > 0 ? "Revisar" : "Ver"}
                    <Icon name="chevron-right" size={14} color={count > 0 ? "#33820D" : "#5C6459"} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="tag-footer">
        {pending > 0 ? (
          <>
            <Button fullWidth onClick={onResolve} iconRight={<Icon name="arrow-right" size={16} color="#fff" />}>
              Resolver {pendLabel}
            </Button>
            <div className="tag-help">"Gerar cards" libera quando zerar</div>
          </>
        ) : (
          <Button fullWidth onClick={onGenerate} iconRight={<Icon name="arrow-right" size={16} color="#fff" />}>
            Gerar cards
          </Button>
        )}
      </div>
    </>
  );
}
