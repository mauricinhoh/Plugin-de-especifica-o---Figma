import React from "react";
import { GenerationResult } from "../../shared/types";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Queued, Spinner } from "../components/TagParts";
import { Confetti } from "../components/Confetti";

/**
 * Geração e resultado (telas 14, 15, 16, 18 e 19 do redesign de 03/10/2026).
 * As etapas do checklist são as que o main thread realmente executa:
 * carregar o card da biblioteca → criar/preencher/posicionar cada card com o
 * marcador → agrupar ao lado da tela.
 */

export interface GenerationLive {
  libDone: boolean;
  cardsDone: number;
  cardsTotal: number;
  groupsDone: number;
  screensTotal: number;
}

type StepState = "done" | "current" | "pending";

function CheckRow({ state, children }: { state: StepState; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <span style={{ width: 15, flex: "0 0 15px", display: "flex", justifyContent: "center" }}>
        {state === "done" ? <Icon name="check" size={15} color="#33820D" strokeWidth={2.8} /> : state === "current" ? <Spinner size={15} /> : <Queued size={15} />}
      </span>
      <span
        className="tag-ellipsis"
        style={{
          fontSize: 13,
          fontWeight: state === "current" ? 800 : 700,
          color: state === "done" ? "#5C6459" : state === "current" ? "#131713" : "#B0B8A6"
        }}
      >
        {children}
      </span>
    </div>
  );
}

export function Generating({ live }: { live: GenerationLive }) {
  const cardsFinished = live.cardsTotal > 0 && live.cardsDone >= live.cardsTotal;
  const groupsFinished = live.screensTotal > 0 && live.groupsDone >= live.screensTotal;
  const lib: StepState = live.libDone ? "done" : "current";
  const cards: StepState = !live.libDone ? "pending" : cardsFinished ? "done" : "current";
  const group: StepState = groupsFinished ? "done" : cardsFinished || live.groupsDone > 0 ? "current" : "pending";
  const progress = live.cardsTotal > 0 ? (live.cardsDone + live.groupsDone) / (live.cardsTotal + live.screensTotal) : 0;

  return (
    <>
      <TitleBar title="Tagueamento" showLogo showClose={false} />
      <Stepper current={3} progress={Math.max(0.3, progress)} />
      <div role="status" aria-live="polite" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <Spinner size={54} large />
        <h2 className="tag-h2" style={{ marginTop: 20 }}>
          Gerando os cards…
        </h2>
        <p className="tag-sub" style={{ maxWidth: 280 }}>
          Não feche o plugin — leva poucos segundos.
        </p>
        <div style={{ marginTop: 22, width: "100%", maxWidth: 280, display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
          <CheckRow state={lib}>{lib === "done" ? "Card da biblioteca carregado" : "Carregando o card da biblioteca"}</CheckRow>
          <CheckRow state={cards}>
            {cards === "done"
              ? "Cards criados, preenchidos e marcados"
              : `Criando e preenchendo os cards${live.cardsTotal > 0 ? ` (${live.cardsDone}/${live.cardsTotal})` : ""}`}
          </CheckRow>
          <CheckRow state={group}>
            {group === "done"
              ? "Agrupados ao lado da tela"
              : `Agrupando ao lado da tela${live.screensTotal > 1 ? ` (${live.groupsDone}/${live.screensTotal})` : ""}`}
          </CheckRow>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) {
  return (
    <div className={`tag-stat${warning ? " tag-stat--warning" : ""}`}>
      <div className="tag-stat__num">{value}</div>
      <div className="tag-stat__label">{label}</div>
    </div>
  );
}

interface WarningView {
  title: string;
  desc: string;
  cardId: string | null;
}

function warningsOf(result: GenerationResult): WarningView[] {
  const list: WarningView[] = result.avisos.map((aviso) => ({ title: "Aviso", desc: aviso, cardId: null }));
  for (const screen of result.screens) {
    for (const aviso of screen.avisosDetalhados ?? []) {
      const desc = aviso.mensagem.charAt(0).toUpperCase() + aviso.mensagem.slice(1);
      list.push({ title: `Card ${aviso.numero} · ${aviso.componente}${aviso.label ? ` “${aviso.label}”` : ""}`, desc, cardId: aviso.cardId });
    }
    // Avisos da tela que não são de um card (ex.: a tela não existe mais).
    const detailed = new Set((screen.avisosDetalhados ?? []).map((aviso) => `Card ${aviso.numero}: ${aviso.mensagem}`));
    for (const aviso of screen.avisos) {
      if (!detailed.has(aviso)) list.push({ title: screen.nomeTela, desc: aviso, cardId: null });
    }
  }
  return list;
}

interface DoneProps {
  /** Resultado da geração, ou null quando a tela é de "Marcadores excluídos" ou de erro. */
  result: GenerationResult | null;
  deleted?: { frameName: string; cards: number } | null;
  error?: { message: string; code?: string } | null;
  onShow: () => void;
  onGoTo: (nodeId: string) => void;
  onNew: () => void;
  /** Erro: refaz a geração com a mesma revisão. */
  onRetry: () => void;
  /** Erro: volta para a revisão. */
  onBackToReview: () => void;
  /** Excluídos: volta para a seleção com essa tela. */
  onTagThisScreen: () => void;
  onExit: () => void;
  onClose: () => void;
}

const clampTwoLines: React.CSSProperties = {
  overflowWrap: "anywhere",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden"
};

export function Done({ result, deleted, error, onShow, onGoTo, onNew, onRetry, onBackToReview, onTagThisScreen, onExit, onClose }: DoneProps) {
  // 19 · Erro na geração
  if (error) {
    const libraryProblem = error.code === "biblioteca";
    return (
      <>
        <TitleBar title="Tagueamento" showLogo onClose={onClose} />
        <div className="scroll-area">
          <div className="tag-body" style={{ paddingTop: 32 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FDECEC", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="x-circle" size={22} color="#C73434" />
            </div>
            <h2 className="tag-h2" style={{ marginTop: 16 }}>
              Não deu para gerar
            </h2>
            <p className="tag-sub" style={{ overflowWrap: "anywhere" }}>
              {libraryProblem
                ? "O card “[Helper] Google Analytics Spec” não pôde ser carregado da biblioteca “Elementos de apoio para arquivo”. "
                : `${error.message} `}
              Sua revisão foi mantida.
            </p>
            {libraryProblem && (
              <div className="tag-steps" style={{ marginTop: 18 }}>
                <span className="tag-label-card">Como resolver</span>
                {[
                  <>
                    No Figma, abra <strong>Assets → Libraries</strong>
                  </>,
                  <>Ative “Elementos de apoio para arquivo”</>,
                  <>Volte aqui e toque em Tentar de novo</>
                ].map((text, index) => (
                  <div key={index} className="tag-steps__item">
                    <span className="tag-steps__num">{index + 1}</span>
                    <span style={{ paddingTop: 1 }}>{text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="tag-footer">
          <Button fullWidth onClick={onRetry} icon={<Icon name="refresh" size={15} color="#fff" />}>
            Tentar de novo
          </Button>
          {libraryProblem && (
            <Button variant="secondary" fullWidth onClick={onBackToReview}>
              Voltar à revisão
            </Button>
          )}
        </div>
      </>
    );
  }

  // 18 · Marcadores excluídos
  if (deleted) {
    return (
      <>
        <TitleBar title="Tagueamento" showLogo onClose={onClose} />
        <div className="scroll-area" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "56px 24px 24px", overflowX: "hidden" }}>
          <div className="tag-seal tag-seal--neutral">
            <Icon name="trash" size={28} color="#5C6459" />
          </div>
          <h2 className="tag-h2" style={{ marginTop: 22 }}>
            Marcadores excluídos
          </h2>
          <p className="tag-sub" style={{ maxWidth: 300, width: "100%", ...clampTwoLines, WebkitLineClamp: 3 }} title={deleted.frameName}>
            {deleted.cards} {deleted.cards === 1 ? "card removido" : "cards removidos"} de <strong style={{ color: "var(--color-text-dark)" }}>{deleted.frameName}</strong>. Use{" "}
            <kbd className="tag-kbd">Ctrl+Z</kbd> no Figma para desfazer.
          </p>
        </div>
        <div className="tag-footer">
          <Button fullWidth onClick={onTagThisScreen} iconRight={<Icon name="arrow-right" size={16} color="#fff" />}>
            Taguear esta tela
          </Button>
          <Button variant="secondary" fullWidth onClick={onExit}>
            Voltar ao início
          </Button>
        </div>
      </>
    );
  }

  // 15 / 16 · Tagueamento pronto (com ou sem aviso)
  const cards = result ? result.screens.reduce((sum, screen) => sum + screen.cards, 0) : 0;
  const telas = result ? result.screens.length : 0;
  const warnings = result ? warningsOf(result) : [];
  const single = result && result.screens.length === 1 ? result.screens[0].nomeTela : null;

  return (
    <>
      <TitleBar title="Tagueamento" showLogo onClose={onClose} />
      <div
        className="scroll-area"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: warnings.length > 0 ? "flex-start" : "center",
          textAlign: "center",
          padding: warnings.length > 0 ? "56px 24px 24px" : "24px",
          overflowX: "hidden"
        }}
      >
        <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
          <Confetti />
          <div className="tag-seal tag-seal--ok">
            <Icon name="check" size={32} color="#fff" strokeWidth={2.8} />
          </div>
        </div>
        <h2 className="tag-h2" style={{ marginTop: 22, position: "relative", zIndex: 1 }}>
          Tagueamento pronto
        </h2>
        <p className="tag-sub" style={{ maxWidth: 300, width: "100%", position: "relative", zIndex: 1, ...clampTwoLines }} title={single ?? undefined}>
          {cards} {cards === 1 ? "card gerado" : "cards gerados"} ao lado de{" "}
          {single ? <strong style={{ color: "var(--color-text-dark)" }}>{single}</strong> : `${telas} telas`}.
        </p>

        <div className="tag-stats" style={{ marginTop: 20, position: "relative", zIndex: 1 }}>
          <Stat label={telas === 1 ? "Tela" : "Telas"} value={telas} />
          <Stat label="Cards" value={cards} />
          {warnings.length > 0 && <Stat label={warnings.length === 1 ? "Aviso" : "Avisos"} value={warnings.length} warning />}
        </div>

        {warnings.length > 0 && (
          <div style={{ marginTop: 18, width: "100%", display: "flex", flexDirection: "column", gap: 8, position: "relative", zIndex: 1 }}>
            {warnings.map((warning, index) => (
              <div key={index} className="tag-warn-card">
                <Icon name="alert-triangle" size={16} color="#8A6A00" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="tag-warn-card__title tag-ellipsis" title={warning.title}>
                    {warning.title}
                  </div>
                  <div className="tag-warn-card__desc" style={{ overflowWrap: "anywhere" }}>
                    {warning.desc}
                  </div>
                  {warning.cardId && (
                    <button type="button" className="tag-link" style={{ marginTop: 6, fontSize: 12 }} onClick={() => onGoTo(warning.cardId as string)}>
                      Ir para
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tag-footer">
        <Button fullWidth onClick={onShow}>
          Mostrar na tela
        </Button>
        <Button variant="secondary" fullWidth onClick={onNew}>
          Novo tagueamento
        </Button>
      </div>
    </>
  );
}
