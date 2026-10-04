import React from "react";
import { MappingPlanItem, SetupSelection } from "../../shared/types";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { FormsNotice, FormsStatus } from "../components/SetupBar";
import { Queued, Spinner, TagContextCard } from "../components/TagParts";

/**
 * Telas 07 (tela por tela) e 21 (página inteira) do redesign de 03/10/2026,
 * e o erro do mapeamento, se houver.
 */

export interface MappingLive {
  done: number;
  total: number;
  plan: MappingPlanItem[] | null;
  currentFrameId: string | null;
  /** frameId → cards da tela já mapeada. */
  finished: Record<string, number>;
  componentsFound: number | null;
}

interface MappingProgressProps {
  setup: SetupSelection;
  formsStatus: FormsStatus;
  /** Nome da tela selecionada (tela por tela). */
  screenName: string | null;
  live: MappingLive | null;
  error: string | null;
  avisos: string[];
  onRetry: () => void;
  onEditSetup: () => void;
  onClose: () => void;
}

const SKELETON_WIDTHS: [number, number][] = [
  [52, 34],
  [64, 40],
  [46, 30],
  [58, 44],
  [40, 26],
  [54, 36]
];

export function MappingProgress({ setup, formsStatus, screenName, live, error, avisos, onRetry, onEditSetup, onClose }: MappingProgressProps) {
  const finishedEmpty = !error && avisos.length > 0;
  const failed = !!error || finishedEmpty;
  const isPage = setup.modo === "pagina";
  const total = live?.total ?? 0;
  const done = live?.done ?? 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onEditSetup} onClose={onClose} />
      <Stepper current={2} progress={isPage && total > 0 ? Math.max(0.15, done / total) : 0.15} gutter={20} />
      <div className="scroll-area">
        <div className="tag-body--review" style={{ paddingTop: 14 }}>
          <FormsNotice formsStatus={formsStatus} />
          <div style={{ marginTop: formsStatus ? 12 : 0 }}>
            <TagContextCard
              canal={setup.canal}
              plataforma={setup.plataforma}
              region={setup.region}
              subregion={setup.subregion}
              screenName={isPage ? undefined : screenName ?? undefined}
              onEdit={onEditSetup}
            />
          </div>

          {failed && (
            <div
              role="alert"
              style={{
                marginTop: 18,
                display: "flex",
                gap: 9,
                padding: 12,
                borderRadius: 10,
                background: "var(--color-danger-bg)",
                border: "1px solid var(--color-danger-border)",
                color: "var(--color-danger-text)",
                fontSize: 12.5,
                fontWeight: 700,
                lineHeight: 1.45
              }}
            >
              <Icon name="x-circle" size={16} color="#C73434" />
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{error ?? avisos.join(" ")}</span>
            </div>
          )}

          {!failed && !isPage && (
            <>
              <div role="status" style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 9 }}>
                <Spinner size={16} />
                <span style={{ fontSize: 13, fontWeight: 800 }}>Mapeando a tela…</span>
                {live?.componentsFound !== null && live?.componentsFound !== undefined && (
                  <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#8A9382" }}>
                    {live.componentsFound} {live.componentsFound === 1 ? "componente" : "componentes"}
                  </span>
                )}
              </div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }} aria-hidden="true">
                {SKELETON_WIDTHS.map(([a, b], index) => (
                  <div key={index} className="tag-skeleton" style={{ opacity: 1 - index * 0.14 }}>
                    <span className="tag-skeleton__dot" />
                    <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <span className="tag-skeleton__bar" style={{ height: 9, width: `${a}%`, background: "#E7EBE3" }} />
                      <span className="tag-skeleton__bar" style={{ height: 7, width: `${b}%`, background: "#EEF1EA" }} />
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {!failed && isPage && (
            <>
              <div role="status" style={{ marginTop: 18, display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-.02em" }}>
                  {total > 0 ? `Mapeando tela ${Math.min(done + 1, total)} de ${total}` : "Preparando…"}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 900, color: "var(--color-primary)" }}>{percent}%</span>
              </div>
              <div className="tag-progress" style={{ marginTop: 10 }}>
                <div style={{ width: `${percent}%` }} />
              </div>
              {live?.plan && live.plan.length > 0 && (
                <div className="tag-list" style={{ marginTop: 14 }}>
                  {live.plan.map((item) => {
                    const cards = live.finished[item.frameId];
                    const isDone = cards !== undefined;
                    const isCurrent = !isDone && !item.skipped && item.frameId === live.currentFrameId;
                    const status = item.skipped ? "pulada" : isDone ? `${cards} ${cards === 1 ? "card" : "cards"}` : isCurrent ? "mapeando…" : "na fila";
                    return (
                      <div key={item.frameId} className={`tag-list__row${isCurrent ? " tag-list__row--current" : ""}`}>
                        <span style={{ width: 16, display: "flex", justifyContent: "center", flex: "0 0 16px" }}>
                          {item.skipped ? (
                            <Icon name="skip" size={16} color="#A3AC9B" />
                          ) : isDone ? (
                            <Icon name="check" size={16} color="#33820D" />
                          ) : isCurrent ? (
                            <Spinner size={15} />
                          ) : (
                            <Queued size={15} />
                          )}
                        </span>
                        <span className="tag-list__main">
                          <span
                            className="tag-list__name tag-ellipsis"
                            style={{ display: "block", fontSize: 13, color: isDone || isCurrent ? "var(--color-text-dark)" : "#8A9382" }}
                            title={item.name}
                          >
                            {item.name}
                          </span>
                        </span>
                        <span style={{ flex: "0 0 auto", fontSize: 11.5, fontWeight: 700, color: isCurrent ? "var(--color-primary-ink)" : "#8A9382" }}>{status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {failed && (
        <div className="tag-footer">
          <Button fullWidth onClick={onRetry} icon={<Icon name="refresh" size={15} color="#fff" />}>
            Tentar de novo
          </Button>
        </div>
      )}
    </>
  );
}
