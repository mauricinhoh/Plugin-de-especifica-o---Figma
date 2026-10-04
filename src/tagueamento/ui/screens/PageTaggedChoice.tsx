import React, { useState } from "react";
import { PageTagStatus } from "../../shared/types";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";

/**
 * Tela 20 (redesign 03/10/2026) — página inteira com telas já tagueadas.
 * O PD marca quais refazer; as desmarcadas são puladas. Marcar todas é o
 * antigo "Refazer todas"; desmarcar todas é o antigo "Pular essas".
 */

interface PageTaggedChoiceProps {
  status: PageTagStatus;
  /** Ids das telas já tagueadas que NÃO serão refeitas. */
  onContinue: (skipFrameIds: string[]) => void;
  onBack: () => void;
  onClose: () => void;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

export function PageTaggedChoice({ status, onContinue, onBack, onClose }: PageTaggedChoiceProps) {
  const frames = status.taggedFrames ?? status.tagged.map((name) => ({ frameId: name, name, cards: 0 }));
  const [redo, setRedo] = useState<Set<string>>(() => new Set(frames.map((frame) => frame.frameId)));

  const skipped = frames.filter((frame) => !redo.has(frame.frameId));
  const novas = status.total - frames.length;
  const refeitas = frames.length - skipped.length;
  const continuing = status.total - skipped.length;

  const helpParts: string[] = [];
  if (novas > 0) helpParts.push(`${novas} ${novas === 1 ? "nova" : "novas"}`);
  if (refeitas > 0) helpParts.push(`${refeitas} ${refeitas === 1 ? "refeita" : "refeitas"}`);
  let help = helpParts.join(" + ");
  if (skipped.length > 0) {
    const names = skipped.map((frame) => frame.name);
    help += `${help ? " · " : ""}${skipped.length > 2 ? `${skipped.length} telas` : joinNames(names)} ${skipped.length === 1 ? "será pulada" : "serão puladas"}`;
  }

  function toggle(frameId: string) {
    setRedo((current) => {
      const next = new Set(current);
      if (next.has(frameId)) next.delete(frameId);
      else next.add(frameId);
      return next;
    });
  }

  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onBack} onClose={onClose} />
      <Stepper current={1} progress={1} />
      <div className="scroll-area">
        <div className="tag-body">
          <h2 className="tag-h2">
            {frames.length} de {status.total} telas já têm tagueamento
          </h2>
          <p className="tag-sub">Marque as que você quer refazer. As outras serão tagueadas normalmente.</p>

          <div className="tag-list" style={{ marginTop: 16 }} role="group" aria-label="Telas já tagueadas">
            {frames.map((frame) => {
              const checked = redo.has(frame.frameId);
              return (
                <button key={frame.frameId} type="button" className="tag-list__row" role="checkbox" aria-checked={checked} onClick={() => toggle(frame.frameId)}>
                  <span className={`tag-check${checked ? " tag-check--on" : ""}`}>{checked && <Icon name="check" size={12} color="#fff" strokeWidth={3} />}</span>
                  <span className="tag-list__main">
                    <span className="tag-list__name tag-ellipsis" style={{ display: "block" }} title={frame.name}>
                      {frame.name}
                    </span>
                  </span>
                  {frame.cards > 0 && (
                    <span style={{ flex: "0 0 auto", fontSize: 12, fontWeight: 700, color: "var(--color-text-subtle)" }}>
                      {frame.cards} {frame.cards === 1 ? "card" : "cards"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="tag-note" style={{ marginTop: 14 }}>
            <Icon name="info" size={15} color="#5C6459" />
            <span>Os cards antigos só são apagados quando você gerar os novos.</span>
          </div>
        </div>
      </div>
      <div className="tag-footer">
        <Button fullWidth disabled={continuing === 0} onClick={() => onContinue(skipped.map((frame) => frame.frameId))} iconRight={continuing > 0 ? <Icon name="arrow-right" size={16} color="#fff" /> : undefined}>
          Continuar com {continuing} {continuing === 1 ? "tela" : "telas"}
        </Button>
        {help && <div className="tag-help tag-ellipsis" title={help}>{help}</div>}
      </div>
    </>
  );
}
