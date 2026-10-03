import React, { useMemo, useState } from "react";
import { ModoGeracao, RegionsData, SetupSelection } from "../../shared/types";
import { normalizeRegion, normalizeSubregion } from "../../shared/naming";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { SearchOption, SearchSelect } from "../components/SearchSelect";

/**
 * Fase 3 — setup do tagueamento (spec, seções 1 a 3):
 *   Canal → Produto (grava a Region) → Fluxo (grava a Subregion) → Modo.
 * Produto e Fluxo têm busca e a opção "Outro" (texto livre, normalizado).
 * Fluxo aceita "N/A" (subregion é opcional).
 */

const OUTRO = "__outro__";
const NA = "__na__";

interface SetupScreenProps {
  data: RegionsData;
  /** Última escolha guardada (só é usada se ainda existir na lista). */
  initial: SetupSelection | null;
  onComplete: (setup: SetupSelection) => void;
  onExit: () => void;
  onClose: () => void;
  onOpenDiagnostic: () => void;
}

const fieldLabel: React.CSSProperties = { fontSize: 12.5, fontWeight: 800, color: "var(--color-text-dark)" };

const textInput: React.CSSProperties = {
  marginTop: 8,
  width: "100%",
  height: 40,
  padding: "0 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border-strong)",
  fontSize: 13.5,
  outline: "none",
  background: "var(--color-surface)"
};

function CodePreview({ label, value, pending }: { label: string; value: string; pending?: boolean }) {
  return (
    <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--color-text-muted)", display: "flex", gap: 6, flexWrap: "wrap" }}>
      <span>{label}:</span>
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: pending ? "var(--color-text-disabled)" : "var(--color-primary-ink)" }}>
        {value}
      </span>
    </div>
  );
}

function ModeOption({
  selected,
  title,
  description,
  icon,
  onSelect
}: {
  selected: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      style={{
        flex: 1,
        textAlign: "left",
        padding: 12,
        borderRadius: 12,
        border: `1.5px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
        background: selected ? "var(--color-primary-tint-strong)" : "var(--color-surface)",
        boxShadow: selected ? "var(--shadow-card-active)" : "none",
        transition: "var(--transition)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: selected ? "var(--color-primary)" : "var(--color-text-subtle)" }}>{icon}</span>
        <span
          aria-hidden="true"
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            border: `1.5px solid ${selected ? "var(--color-primary)" : "var(--color-border-strong)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {selected && <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--color-primary)" }} />}
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 800 }}>{title}</div>
      <div style={{ marginTop: 2, fontSize: 11.5, lineHeight: 1.35, color: "var(--color-text-muted)" }}>{description}</div>
    </button>
  );
}

/** Restaura a última escolha só se canal/produto/fluxo ainda existirem na lista. */
function restore(data: RegionsData, initial: SetupSelection | null) {
  const state = { canal: "", produto: "", produtoTexto: "", fluxo: "", fluxoTexto: "", modo: null as ModoGeracao | null };
  if (!initial) return state;
  const canal = data.canais.find((item) => item.nome === initial.canal);
  if (!canal) return state;
  state.canal = canal.nome;
  state.modo = initial.modo === "tela" || initial.modo === "pagina" ? initial.modo : null;

  let produto: RegionsData["canais"][number]["produtos"][number] | null = null;
  if (initial.produtoOutro) {
    state.produto = OUTRO;
    state.produtoTexto = initial.produto;
  } else {
    produto = canal.produtos.find((item) => item.nome === initial.produto) ?? null;
    if (!produto) return state; // produto saiu da lista: para aqui
    state.produto = produto.nome;
  }

  if (initial.fluxoOutro) {
    state.fluxo = OUTRO;
    state.fluxoTexto = initial.fluxo;
  } else if (initial.fluxo === "N/A") {
    state.fluxo = NA;
  } else if (produto && produto.fluxos.some((item) => item.nome === initial.fluxo)) {
    state.fluxo = initial.fluxo;
  }
  return state;
}

export function SetupScreen({ data, initial, onComplete, onExit, onClose, onOpenDiagnostic }: SetupScreenProps) {
  const restored = useMemo(() => restore(data, initial), [data, initial]);
  const [canalNome, setCanalNome] = useState(restored.canal);
  const [produtoValue, setProdutoValue] = useState(restored.produto);
  const [produtoTexto, setProdutoTexto] = useState(restored.produtoTexto);
  const [fluxoValue, setFluxoValue] = useState(restored.fluxo);
  const [fluxoTexto, setFluxoTexto] = useState(restored.fluxoTexto);
  const [modo, setModo] = useState<ModoGeracao | null>(restored.modo);

  const canal = data.canais.find((item) => item.nome === canalNome) ?? null;
  const produto = canal && produtoValue !== OUTRO ? canal.produtos.find((item) => item.nome === produtoValue) ?? null : null;
  const produtoOutro = produtoValue === OUTRO;
  const fluxoOutro = fluxoValue === OUTRO;

  const region = produtoOutro ? normalizeRegion(produtoTexto) : produto?.region ?? "";
  const fluxo = produto && !fluxoOutro && fluxoValue !== NA ? produto.fluxos.find((item) => item.nome === fluxoValue) ?? null : null;
  const subregion = fluxoValue === NA ? "N/A" : fluxoOutro ? normalizeSubregion(fluxoTexto) : fluxo?.subregion ?? "";

  const produtoOptions: SearchOption[] = canal
    ? [
        ...canal.produtos.map((item) => ({ value: item.nome, label: item.nome, hint: item.region })),
        { value: OUTRO, label: "Outro (digitar)", pinned: "bottom" as const }
      ]
    : [];

  const fluxoOptions: SearchOption[] = [
    { value: NA, label: "N/A — sem subregion", hint: "N/A", pinned: "top" },
    ...(produto ? produto.fluxos.map((item) => ({ value: item.nome, label: item.nome, hint: item.subregion })) : []),
    { value: OUTRO, label: "Outro (digitar)", pinned: "bottom" }
  ];

  const produtoOk = produtoOutro ? region.length > 0 : produto !== null;
  const fluxoOk = fluxoOutro ? subregion.length > 0 : fluxoValue === NA || fluxo !== null;
  const complete = canal !== null && produtoOk && fluxoOk && modo !== null;

  function handleCanal(nome: string) {
    setCanalNome(nome);
    setProdutoValue("");
    setProdutoTexto("");
    setFluxoValue("");
    setFluxoTexto("");
  }

  function handleProduto(value: string) {
    setProdutoValue(value);
    setFluxoValue("");
    setFluxoTexto("");
  }

  function handleContinue() {
    if (!complete || !canal || !modo) return;
    onComplete({
      canal: canal.nome,
      plataforma: canal.plataforma,
      produto: produtoOutro ? produtoTexto.trim() : (produto as NonNullable<typeof produto>).nome,
      region,
      produtoOutro,
      fluxo: fluxoValue === NA ? "N/A" : fluxoOutro ? fluxoTexto.trim() : (fluxo as NonNullable<typeof fluxo>).nome,
      subregion,
      fluxoOutro,
      modo
    });
  }

  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onExit} onClose={onClose} />
      <Stepper current={1} progress={complete ? 1 : 0.5} />
      <div className="scroll-area" style={{ padding: "18px 24px 20px" }}>
        <h2 style={{ margin: 0, fontSize: 21, lineHeight: 1.2, fontWeight: 900, letterSpacing: "-.025em" }}>
          Sobre o que é este fluxo?
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.45, color: "var(--color-text-muted)" }}>
          Essas escolhas definem a region e a subregion de todos os cards.
        </p>

        {data.fonte === "template" && (
          <div
            role="note"
            style={{
              marginTop: 12,
              display: "flex",
              gap: 8,
              padding: "8px 10px",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-warning-bg)",
              border: "1px solid var(--color-warning-border)",
              color: "var(--color-warning)",
              fontSize: 12,
              fontWeight: 700
            }}
          >
            <Icon name="alert-triangle" size={14} color="var(--color-warning)" />
            <span>Lista de exemplo (template). Troque pelo Excel real antes de usar no dia a dia.</span>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <label htmlFor="tag-canal" style={fieldLabel}>
            Canal
          </label>
          <div style={{ position: "relative", marginTop: 6 }}>
            <select
              id="tag-canal"
              value={canalNome}
              onChange={(event) => handleCanal(event.target.value)}
              style={{
                width: "100%",
                height: 42,
                padding: "0 36px 0 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-strong)",
                fontSize: 13.5,
                fontWeight: canal ? 700 : 500,
                color: canal ? "var(--color-text-dark)" : "var(--color-text-subtle)",
                background: "var(--color-surface)",
                appearance: "none"
              }}
            >
              <option value="" disabled>
                Escolha o canal
              </option>
              {data.canais.map((item) => (
                <option key={item.nome} value={item.nome}>
                  {item.nome}
                </option>
              ))}
            </select>
            <span style={{ position: "absolute", right: 12, top: 14, pointerEvents: "none" }}>
              <Icon name="chevron-down" size={14} color="var(--color-text-subtle)" />
            </span>
          </div>
          {canal && (
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--color-text-muted)" }}>
              <Icon name={canal.plataforma === "APP" ? "smartphone" : "monitor"} size={12} color="var(--color-text-muted)" />
              <span>
                {canal.plataforma === "APP" ? "Aplicativo — cards de tela: screen_view" : "Web — cards de tela: page_view"}
              </span>
            </div>
          )}
        </div>

        <SearchSelect
          label="Produto"
          placeholder="Buscar produto"
          options={produtoOptions}
          value={produtoValue || null}
          onChange={handleProduto}
          disabled={!canal}
          disabledHint="Escolha o canal primeiro"
        />
        {produtoOutro && (
          <div style={{ marginTop: 10 }}>
            <label htmlFor="tag-produto-outro" style={fieldLabel}>
              Nome do produto
            </label>
            <input
              id="tag-produto-outro"
              value={produtoTexto}
              onChange={(event) => setProdutoTexto(event.target.value)}
              placeholder="Ex.: Área não logada"
              autoFocus
              style={textInput}
            />
            <CodePreview label="Region" value={region || "—"} pending={!region} />
          </div>
        )}

        <SearchSelect
          label="Fluxo"
          placeholder="Buscar fluxo"
          options={fluxoOptions}
          value={fluxoValue || null}
          onChange={setFluxoValue}
          disabled={!produtoOk}
          disabledHint="Escolha o produto primeiro"
        />
        {fluxoOutro && (
          <div style={{ marginTop: 10 }}>
            <label htmlFor="tag-fluxo-outro" style={fieldLabel}>
              Nome do fluxo (tarefa do usuário)
            </label>
            <input
              id="tag-fluxo-outro"
              value={fluxoTexto}
              onChange={(event) => setFluxoTexto(event.target.value)}
              placeholder="Ex.: Esqueci minha senha"
              autoFocus
              style={textInput}
            />
            <CodePreview label="Subregion" value={subregion || "—"} pending={!subregion} />
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <span style={fieldLabel} id="tag-modo-label">
            Como gerar
          </span>
          <div role="radiogroup" aria-labelledby="tag-modo-label" style={{ marginTop: 8, display: "flex", gap: 10 }}>
            <ModeOption
              selected={modo === "tela"}
              title="Tela por tela"
              description="Você seleciona um frame e revisa antes de gerar."
              icon={<Icon name="frame" size={18} />}
              onSelect={() => setModo("tela")}
            />
            <ModeOption
              selected={modo === "pagina"}
              title="Página inteira"
              description="Todos os frames da página, com conferência."
              icon={<Icon name="components" size={18} />}
              onSelect={() => setModo("pagina")}
            />
          </div>
        </div>

        {(produtoOutro || fluxoOutro) && (
          <p style={{ margin: "14px 0 0", fontSize: 12, lineHeight: 1.45, color: "var(--color-text-muted)" }}>
            Ao continuar, o plugin abre o formulário para registrar {produtoOutro && fluxoOutro ? "o produto e o fluxo novos" : produtoOutro ? "o produto novo" : "o fluxo novo"} na planilha.
          </p>
        )}

        <div style={{ textAlign: "center", marginTop: 22 }}>
          <button
            type="button"
            onClick={onOpenDiagnostic}
            style={{ border: "none", background: "transparent", fontSize: 11.5, fontWeight: 700, color: "var(--color-text-subtle)", textDecoration: "underline" }}
          >
            Diagnóstico do card (desenvolvimento)
          </button>
        </div>
      </div>

      <div style={{ padding: "12px 24px 18px", borderTop: "1px solid var(--color-border)", boxShadow: "var(--shadow-footer)" }}>
        <Button fullWidth disabled={!complete} onClick={handleContinue} iconRight={<Icon name="arrow-right" size={16} />}>
          Continuar
        </Button>
      </div>
    </>
  );
}
