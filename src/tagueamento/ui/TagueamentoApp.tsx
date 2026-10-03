import React, { useEffect, useState } from "react";
import { onTagMessage, postToTagMain } from "./bridge";
import { TitleBar } from "./components/TitleBar";
import { Stepper } from "./components/Stepper";
import { EmptyState } from "./components/EmptyState";
import { Button } from "./components/Button";
import { Icon } from "./components/Icon";

/**
 * Raiz do fluxo de TAGUEAMENTO (Fase 1 — base isolada).
 *
 * Único ponto de contato com a acessibilidade: o App.tsx renderiza este
 * componente quando o PD escolhe "Tagueamento" na tela inicial, e passa
 * `onExit` para voltar a ela. Todo o resto (telas, estado, mensagens)
 * vive dentro de src/tagueamento/.
 *
 * Nesta fase a tela só confirma que o canal próprio com o main thread
 * funciona (tag:ui-ready → tag:ready). As etapas de setup (Canal,
 * Produto, Fluxo, Modo) entram nas próximas fases.
 */

interface TagueamentoAppProps {
  /** Volta para a tela inicial (escolha Acessibilidade / Tagueamento). */
  onExit: () => void;
}

export function TagueamentoApp({ onExit }: TagueamentoAppProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    const stop = onTagMessage((message) => {
      switch (message.type) {
        case "tag:ready":
          setFileName(message.fileName);
          break;
        default:
          break;
      }
    });
    postToTagMain({ type: "tag:ui-ready" });
    return stop;
  }, []);

  return (
    <>
      <TitleBar
        title="Tagueamento"
        showBack
        onBack={onExit}
        onClose={() => postToTagMain({ type: "tag:close-plugin" })}
      />
      <Stepper current={1} progress={0} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 24
        }}
      >
        <EmptyState
          iconName="tag"
          title="Tagueamento em construção"
          description="O fluxo de Google Analytics está sendo desenvolvido por etapas. A especificação de acessibilidade continua disponível na tela inicial."
          maxWidth={290}
        >
          <div style={{ marginTop: 22, width: "100%", maxWidth: 260 }}>
            <Button variant="secondary" fullWidth onClick={onExit} icon={<Icon name="chevron-left" size={15} />}>
              Voltar ao início
            </Button>
          </div>
        </EmptyState>
      </div>

      <div
        role="status"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "0 24px 20px",
          fontSize: 11.5,
          fontWeight: 700,
          color: fileName ? "var(--color-text-subtle)" : "var(--color-text-disabled)"
        }}
      >
        <Icon
          name={fileName ? "check" : "info"}
          size={12}
          color={fileName ? "var(--color-primary)" : "var(--color-text-disabled)"}
        />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {fileName ? `Conectado ao arquivo ${fileName}` : "Conectando ao arquivo…"}
        </span>
      </div>
    </>
  );
}
