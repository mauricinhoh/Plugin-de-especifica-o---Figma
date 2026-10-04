import React, { useMemo, useState } from "react";
import { ModoGeracao, RegionsData, SetupSelection } from "../../shared/types";
import { describeReport, normalizeWithReport } from "../../shared/naming";
import { TitleBar } from "../components/TitleBar";
import { Stepper } from "../components/Stepper";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Dropdown, DropdownOption } from "../components/Dropdown";
import { ModeSegmented, TokenHint } from "../components/TagParts";

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
}

function ReportLines({ notas = [], pendencias = [] }: { notas?: string[]; pendencias?: string[] }) {
  return (
    <>
      {notas.map((nota, index) => (
        <div key={`n${index}`} style={{ marginTop: 5, display: "flex", gap: 6, fontSize: 11.5, color: "var(--color-text-muted)" }}>
          <Icon name="info" size={12} color="var(--color-text-subtle)" />
          <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{nota}</span>
        </div>
      ))}
      {pendencias.map((pendencia, index) => (
        <div key={`p${index}`} style={{ marginTop: 5, display: "flex", gap: 6, fontSize: 11.5, fontWeight: 700, color: "var(--color-warning)" }}>
          <Icon name="alert-triangle" size={12} color="var(--color-warning)" />
          <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{pendencia}</span>
        </div>
      ))}
    </>
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

export function SetupScreen({ data, initial, onComplete, onExit, onClose }: SetupScreenProps) {
  const restored = useMemo(() => restore(data, initial), [data, initial]);
  const [canalNome, setCanalNome] = useState(restored.canal);
  const [produtoValue, setProdutoValue] = useState(restored.produto);
  const [produtoTexto, setProdutoTexto] = useState(restored.produtoTexto);
  const [fluxoValue, setFluxoValue] = useState(restored.fluxo);
  const [fluxoTexto, setFluxoTexto] = useState(restored.fluxoTexto);
  const [modo, setModo] = useState<ModoGeracao>(restored.modo ?? "tela");

  const canal = data.canais.find((item) => item.nome === canalNome) ?? null;
  const produto = canal && produtoValue !== OUTRO ? canal.produtos.find((item) => item.nome === produtoValue) ?? null : null;
  const produtoOutro = produtoValue === OUTRO;
  const fluxoOutro = fluxoValue === OUTRO;

  // Só o texto digitado no "Outro" passa pelo dicionário; o que vem do Excel já foi validado.
  const produtoReport = produtoOutro ? normalizeWithReport(produtoTexto, "region") : null;
  const region = produtoReport ? produtoReport.value : produto?.region ?? "";
  const fluxo = produto && !fluxoOutro && fluxoValue !== NA ? produto.fluxos.find((item) => item.nome === fluxoValue) ?? null : null;
  const fluxoReport = fluxoOutro ? normalizeWithReport(fluxoTexto, "subregion") : null;
  const subregion = fluxoValue === NA ? "N/A" : fluxoReport ? fluxoReport.value : fluxo?.subregion ?? "";

  const OUTRO_LABEL = "Outro — digitar";
  const produtoOptions: DropdownOption[] = canal
    ? [
        ...canal.produtos.map((item) => ({ value: item.nome, label: item.nome, hint: item.region })),
        { value: OUTRO, label: OUTRO_LABEL, pinned: "bottom" as const }
      ]
    : [];

  const fluxoOptions: DropdownOption[] = [
    { value: NA, label: "N/A — sem subregion", hint: "N/A", pinned: "top" },
    ...(produto ? produto.fluxos.map((item) => ({ value: item.nome, label: item.nome, hint: item.subregion })) : []),
    { value: OUTRO, label: OUTRO_LABEL, pinned: "bottom" }
  ];

  const produtoOk = produtoOutro ? region.length > 0 : produto !== null;
  const fluxoOk = fluxoOutro ? subregion.length > 0 : fluxoValue === NA || fluxo !== null;
  const complete = canal !== null && produtoOk && fluxoOk;
  const faltam = [!canal && "canal", !produtoOk && "produto", !fluxoOk && "fluxo"].filter(Boolean) as string[];
  const faltamTexto = faltam.length <= 1 ? faltam.join("") : `${faltam.slice(0, -1).join(", ")} e ${faltam[faltam.length - 1]}`;
  const filled = 3 - faltam.length;

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
    if (!complete || !canal) return;
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

  const emptyText = (query: string) => `Nada encontrado para "${query}". Use "${OUTRO_LABEL}".`;

  return (
    <>
      <TitleBar title="Tagueamento" showBack onBack={onExit} onClose={onClose} />
      <Stepper current={1} progress={complete ? 1 : 0.3 + (filled * 0.7) / 3} />
      <div className="scroll-area tag-fade">
        <div className="tag-body">
          <h2 className="tag-h2">Sobre o que é este fluxo?</h2>
          <p className="tag-sub">Essas escolhas definem a region e a subregion de todos os cards.</p>

          <div className="tag-field">
            <span className="tag-label" id="tag-modo-label">
              Como gerar
            </span>
            <ModeSegmented value={modo} onChange={setModo} />
          </div>

          <div className="tag-field">
            <label className="tag-label" htmlFor="tag-canal">
              Canal
            </label>
            <Dropdown
              id="tag-canal"
              ariaLabel="Canal"
              placeholder="Escolha o canal"
              options={data.canais.map((item) => ({ value: item.nome, label: item.nome }))}
              value={canalNome || null}
              onChange={handleCanal}
              leadingIcon={canal ? (canal.plataforma === "APP" ? "smartphone" : "monitor") : undefined}
            />
            {canal && <TokenHint label={canal.plataforma === "APP" ? "Aplicativo" : "Web"} value={canal.plataforma === "APP" ? "screen_view" : "page_view"} neutral />}
          </div>

          <div className="tag-field">
            <label className="tag-label" htmlFor="tag-produto">
              Produto
            </label>
            {produtoOutro ? (
              <div className="tag-other">
                <Dropdown id="tag-produto" ariaLabel="Produto" placeholder="Buscar produto" options={produtoOptions} value={produtoValue} onChange={handleProduto} searchable leadingIcon="pencil" emptyText={emptyText} />
                <input
                  className="tag-other__input"
                  aria-label="Nome do produto"
                  value={produtoTexto}
                  onChange={(event) => setProdutoTexto(event.target.value)}
                  placeholder="Nome do produto (ex.: Consórcio digital)"
                  autoFocus
                />
              </div>
            ) : (
              <Dropdown
                id="tag-produto"
                ariaLabel="Produto"
                placeholder="Buscar produto"
                options={produtoOptions}
                value={produtoValue || null}
                onChange={handleProduto}
                searchable
                lockedText={canal ? undefined : "Disponível após escolher o canal"}
                emptyText={emptyText}
              />
            )}
            {produtoOutro
              ? region && <TokenHint label="region gerada" value={region} />
              : produto && <TokenHint label="region" value={produto.region} />}
            {produtoReport && <ReportLines {...describeReport(produtoReport)} />}
          </div>

          <div className="tag-field">
            <label className="tag-label" htmlFor="tag-fluxo">
              {fluxoOutro ? "Fluxo · tarefa do usuário" : "Fluxo"}
            </label>
            {fluxoOutro ? (
              <div className="tag-other">
                <Dropdown id="tag-fluxo" ariaLabel="Fluxo" placeholder="Buscar fluxo" options={fluxoOptions} value={fluxoValue} onChange={setFluxoValue} searchable leadingIcon="pencil" emptyText={emptyText} />
                <input
                  className="tag-other__input"
                  aria-label="Nome do fluxo (tarefa do usuário)"
                  value={fluxoTexto}
                  onChange={(event) => setFluxoTexto(event.target.value)}
                  placeholder="Tarefa do usuário (ex.: Contratar consórcio)"
                  autoFocus
                />
              </div>
            ) : (
              <Dropdown
                id="tag-fluxo"
                ariaLabel="Fluxo"
                placeholder="Buscar fluxo"
                options={fluxoOptions}
                value={fluxoValue || null}
                onChange={setFluxoValue}
                searchable
                lockedText={produtoOk ? undefined : "Disponível após escolher o produto"}
                emptyText={emptyText}
              />
            )}
            {fluxoOutro ? subregion && <TokenHint label="subregion gerada" value={subregion} /> : subregion && <TokenHint label="subregion" value={subregion} />}
            {fluxoReport && <ReportLines {...describeReport(fluxoReport)} />}
          </div>

          {(produtoOutro || fluxoOutro) && (
            <div className="tag-note" style={{ marginTop: 18 }}>
              <Icon name="info" size={15} color="#5C6459" />
              <span>
                Ao continuar, o plugin abre o formulário para registrar {produtoOutro && fluxoOutro ? "o produto e o fluxo novos" : produtoOutro ? "o produto novo" : "o fluxo novo"} na planilha.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="tag-footer">
        <Button fullWidth disabled={!complete} onClick={handleContinue} iconRight={<Icon name="arrow-right" size={16} color={complete ? "#fff" : undefined} />}>
          Continuar
        </Button>
        {!complete && <div className="tag-help">Faltam: {faltamTexto}</div>}
      </div>
    </>
  );
}
