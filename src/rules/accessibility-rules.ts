import { ComponentTypeRule, ExtractedTextData } from "./engine";
import { MarkupTypeKey, MARKUP_TYPES } from "./markupTypes";
import { UNSPECIFIED_TYPE_KEY } from "./engine";
import { accessibilityRuleRecords, AccessibilityRuleRecord } from "./accessibility-rules-data";

/**
 * Regras de tipos de componente para o domínio "Acessibilidade".
 *
 * A partir daqui, `accessibilityRules` é gerado automaticamente dos
 * registros de `accessibility-rules-data.ts` (o espelho fiel da
 * planilha "Extração de Acessibilidade — Core Web, 70 componentes").
 * Este arquivo só contém a LÓGICA de transformação — nunca edite um
 * componente aqui; edite o registro correspondente em
 * `accessibility-rules-data.ts`.
 *
 * O que este arquivo decide, por registro:
 *   1. Como identificar o componente no Figma (nome do node/componente
 *      principal) — reaproveita a mesma estratégia usada desde a
 *      primeira versão do plugin (`matchesComponentName`).
 *   2. A qual das 9 categorias fixas de "Tipo de marcação"
 *      (markupTypes.ts) o componente pertence — só quando a coluna
 *      "Tipo" da planilha usa um valor SEM ambiguidade (ver
 *      `TIPO_PLANILHA_PARA_MARKUP_TYPE` abaixo). Nos demais casos,
 *      fica "Não especificado" até alguém classificar manualmente —
 *      nunca adivinhamos.
 *   3. O texto inicial de verbalização — extraído de forma
 *      conservadora da célula "Verbalização esperada" (ver
 *      `parseVerbalizationStates`): só quando a célula segue
 *      claramente o padrão "Estado: texto" linha a linha. Células em
 *      formato de texto corrido (sem esse padrão) ficam sem
 *      verbalização automática — o designer preenche manualmente a
 *      partir do texto de referência, em vez de o plugin arriscar
 *      extrair um trecho errado de um parágrafo.
 */

// ---------- 1. Identificação do componente (reaproveitada, sem mudanças de estratégia) ----------

function lastSegmentOf(value: string): string {
  return value.split("/").pop() ?? value;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Compara com o nome do node (instância, como aparece no painel de
 * Layers/renomeada pelo designer) E com o nome do componente
 * principal (a origem real na biblioteca), casando se QUALQUER um
 * dos dois bater. Aceita múltiplos nomes/aliases por regra.
 */
function matchesComponentName(...targets: string[]) {
  const normalizedTargets = targets.map(normalize);
  return ({ nodeName, componentName }: { nodeName: string; componentName: string | null }) => {
    const candidates = [nodeName, componentName].filter((v): v is string => v !== null);
    return candidates.some((candidate) => normalizedTargets.includes(normalize(lastSegmentOf(candidate))));
  };
}

// ---------- 2. Mapeamento Tipo (planilha) -> Tipo de marcação (plugin) ----------

/**
 * A coluna "Tipo" da planilha usa um vocabulário PRÓPRIO da planilha
 * (Botão, Entrada, Link, Grupo, Decorativo, Texto, "Não se aplica"),
 * diferente das 9 categorias fixas de markupTypes.ts. Só mapeamos os
 * valores em que a correspondência é inequívoca — mapear "Grupo",
 * "Decorativo" ou "Texto" para uma das 9 categorias exigiria uma
 * escolha arbitrária que o briefing pede para NÃO fazer ("não
 * associar uma regra incorreta apenas porque dois nomes são
 * vagamente parecidos"). Esses casos ficam "Não especificado" até
 * que o time de acessibilidade/design confirme o mapeamento correto
 * — é só trocar o valor abaixo quando isso acontecer.
 */
const TIPO_PLANILHA_PARA_MARKUP_TYPE: Partial<Record<string, MarkupTypeKey>> = {
  Botão: "botoes",
  Entrada: "entrada",
  Link: "link"
  // "Grupo", "Decorativo", "Texto", "Não se aplica" e célula vazia:
  // deliberadamente sem entrada aqui -> caem em "Não especificado".
};

function resolveMarkupType(record: AccessibilityRuleRecord): MarkupTypeKey | typeof UNSPECIFIED_TYPE_KEY {
  if (!record.tipo) return UNSPECIFIED_TYPE_KEY;
  return TIPO_PLANILHA_PARA_MARKUP_TYPE[record.tipo] ?? UNSPECIFIED_TYPE_KEY;
}

// ---------- 3. Parser conservador de "Estado: texto" ----------

/**
 * Casa uma linha no formato "Rótulo curto: texto." (rótulo com até 40
 * caracteres, sem dois-pontos dentro dele — evita capturar frases
 * corridas que só por acaso têm um ":" no meio). Aspas retas ou
 * curvas ao redor do texto são opcionais e removidas.
 */
const STATE_LINE_PATTERN = /^([^:\n]{2,40}):\s*[""“]?(.+?)[”"]?\.?\s*$/;

/**
 * Extrai pares (estado, texto) de uma célula "Verbalização esperada",
 * só quando TODAS as linhas não-vazias da célula batem com o padrão
 * "Estado: texto". Se qualquer linha não bater (texto corrido,
 * parágrafo explicativo, etc.), retorna lista vazia — melhor não ter
 * verbalização automática do que extrair um estado errado.
 */
function parseVerbalizationStates(raw: string | null): Array<{ label: string; text: string }> {
  if (!raw) return [];
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  const parsed: Array<{ label: string; text: string }> = [];
  for (const line of lines) {
    const match = STATE_LINE_PATTERN.exec(line);
    if (!match) {
      return []; // uma linha fugiu do padrão -> não confiar em nenhuma
    }
    parsed.push({ label: match[1].trim(), text: match[2].trim() });
  }
  return parsed;
}

function slugify(componentName: string): string {
  return componentName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------- 4. Montagem final ----------

function buildRule(record: AccessibilityRuleRecord): ComponentTypeRule<ExtractedTextData> {
  const states = parseVerbalizationStates(record.verbalizacaoEsperada);
  const statesMap =
    states.length > 0
      ? states.reduce<Record<string, string>>((acc, s) => {
          acc[s.label] = s.text;
          return acc;
        }, {})
      : undefined;
  // Verbalização inicial = texto do primeiro estado reconhecido
  // (tipicamente "Habilitado"/"Habilitado/Focus" — a planilha lista
  // os estados nessa ordem). Sem parse confiável, fica sem template
  // automático (ver comentário de parseVerbalizationStates).
  const template = states[0]?.text;

  return {
    key: slugify(record.componente),
    label: record.componente,
    markupType: resolveMarkupType(record) as MarkupTypeKey,
    identifier: { matches: matchesComponentName(record.componente, ...(record.aliasesDeNome ?? [])) },
    hasVerbalization: Boolean(template),
    extraction: ["first-text"],
    template,
    states: statesMap
  };
}

export const accessibilityRules: ComponentTypeRule<ExtractedTextData>[] = accessibilityRuleRecords.map(buildRule);

/**
 * Para adicionar um componente novo: adicione o registro em
 * `accessibility-rules-data.ts` (nunca aqui). Se ele precisar de uma
 * forma de identificação diferente de "nome igual ao da planilha"
 * (ex.: aliases de nomes legados, como aconteceu com "Botao defaut"),
 * ajuste a chamada de `matchesComponentName` dentro de `buildRule`
 * acima para esse caso específico, ou introduza uma exceção pontual
 * seguindo o mesmo padrão usado nas primeiras regras do projeto.
 */
