import { ComponentTypeRule, ExtractedTextData } from "./engine";
import { MarkupTypeKey } from "./markupTypes";
import { UNSPECIFIED_TYPE_KEY } from "./engine";
import { accessibilityRuleRecords, AccessibilityRuleRecord } from "./accessibility-rules-data";

/**
 * Regras de tipos de componente para o domínio "Acessibilidade".
 *
 * `accessibilityRules` é gerado automaticamente dos registros de
 * `accessibility-rules-data.ts` (o espelho fiel da planilha
 * "Acessibilidade_Colmeia_Web.xlsx", fornecida em 10/09/2026). Este
 * arquivo só contém a LÓGICA de transformação — nunca edite um
 * componente aqui; edite o registro correspondente em
 * `accessibility-rules-data.ts`.
 *
 * O que este arquivo decide, por registro:
 *   1. Como identificar o componente no Figma (nome do node/componente
 *      principal) — reaproveita a mesma estratégia desde a primeira
 *      versão do plugin (`matchesComponentName`).
 *   2. A qual das 12 categorias fixas de "Tipo de marcação"
 *      (markupTypes.ts) o componente pertence — mapeamento 1:1 direto
 *      da coluna "Tipo" da planilha (os 8 valores do documento de
 *      regras de acessibilidade batem exatamente com 8 das nossas 12
 *      categorias).
 *   3. Se o componente é elegível a receber Ordem de foco — direto da
 *      coluna "Foco" da planilha ("Sim" = elegível; "Não" e "Apenas
 *      elementos interativos" = não elegível. Ver Regra 3/4).
 *   4. O texto inicial de verbalização — o CONTEÚDO INTEIRO da célula
 *      "Verbalização esperada", usado como estava na planilha (com
 *      placeholders resolvidos quando possível). Isso vale tanto para
 *      células com uma lista limpa de "Estado: texto" quanto para
 *      células com um parágrafo explicativo e exemplo embutido — o
 *      time de acessibilidade confirmou que o texto inteiro deve
 *      preencher automaticamente o campo, servindo de referência
 *      editável para o designer, não só os casos "limpos".
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
 * Os 8 valores válidos da coluna "Tipo" da planilha mapeiam 1:1 para
 * 8 das 12 categorias fixas do plugin — mapeamento completo e
 * inequívoco (confirmado: todas as 70 linhas usam só esses 8
 * valores). Um valor fora dessa lista (typo na planilha, célula
 * vazia) cai em "Não especificado" em vez de adivinhar.
 */
const TIPO_PLANILHA_PARA_MARKUP_TYPE: Partial<Record<string, MarkupTypeKey>> = {
  Botão: "botoes",
  Entrada: "entrada",
  Link: "link",
  Título: "titulos",
  Imagem: "imagem",
  Decorativo: "decorativo",
  Estrutura: "estrutura",
  "Não interativo": "nao-interativo"
};

function resolveMarkupType(record: AccessibilityRuleRecord): MarkupTypeKey | typeof UNSPECIFIED_TYPE_KEY {
  if (!record.tipo) return UNSPECIFIED_TYPE_KEY;
  return TIPO_PLANILHA_PARA_MARKUP_TYPE[record.tipo] ?? UNSPECIFIED_TYPE_KEY;
}

// ---------- 3. Ordem de foco (Regra 3/4) ----------

/**
 * Só "Sim" torna o componente elegível a um número de Ordem de foco.
 * "Não" e "Apenas elementos interativos" (usado pelas Estruturas —
 * Card, Table, Modal etc.) resultam em não-elegível: a estrutura em
 * si nunca recebe número, só os componentes internos dela (que têm
 * sua própria regra, com seu próprio "Foco").
 */
function resolveFocusEligible(record: AccessibilityRuleRecord): boolean {
  return record.foco === "Sim";
}

// ---------- 4. Parser best-effort de "Estado: texto" (metadado auxiliar, não gate mais o template) ----------

/**
 * Casa uma linha no formato "Rótulo curto: texto." — usado só para
 * popular `ComponentTypeRule.states` (metadado para uso futuro, ex.:
 * seleção automática por variante real do Figma). NÃO decide mais se
 * o componente recebe verbalização automática — isso agora é sempre
 * o texto inteiro da célula (ver `buildRule`).
 */
const STATE_LINE_PATTERN = /^([^:\n]{2,40}):\s*[""“]?(.+?)[”"]?\.?\s*$/;

/**
 * Rótulos de linha que NÃO são um estado de verdade — são uma
 * convenção da planilha para ilustrar o estado anterior com um
 * exemplo concreto (ex.: "Marcado: “{rótulo}, ...”." seguido de
 * "Exemplo: “Receber notificações, ...”."). Sem filtrar isso, o
 * "estado" que a instância do Figma precisaria bater incluía
 * "Exemplo" misturado com os estados reais.
 */
const NON_STATE_LABELS = new Set(["exemplo"]);

function parseVerbalizationStates(raw: string | null): Array<{ label: string; text: string }> {
  if (!raw) return [];
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  // Exige que TODAS as linhas batam com "Estado: texto" — é uma
  // condição estrita de propósito: qualquer texto corrido (ex.: o
  // exemplo de leitura completo da Table, ou uma frase de introdução
  // antes dos estados) tem pelo menos uma linha que foge do padrão
  // (geralmente por ser longa demais ou não ter dois-pontos), o que
  // corretamente invalida o parse inteiro. Componentes com uma frase
  // de introdução antes dos estados de verdade (ex.: Input Text Area)
  // precisam ter essa frase removida/reformatada na própria planilha
  // de dados — não é algo pra "adivinhar" no parser sem arriscar
  // aceitar fragmentos de texto corrido como se fossem estados (foi
  // exatamente o que aconteceu quando tentei relaxar isso: Table e
  // Modal passaram a gerar "estados" fantasmas a partir de frases que
  // só coincidentemente tinham dois-pontos).
  const parsed: Array<{ label: string; text: string }> = [];
  for (const line of lines) {
    const match = STATE_LINE_PATTERN.exec(line);
    if (!match) {
      return [];
    }
    parsed.push({ label: match[1].trim(), text: match[2].trim() });
  }

  const realStates = parsed.filter((p) => !NON_STATE_LABELS.has(normalize(p.label)));

  // Menos de 2 estados reais quase sempre é uma frase corrida com
  // dois-pontos por coincidência, não um componente com estados de
  // verdade — exigir pelo menos 2 evita esse falso positivo.
  return realStates.length >= 2 ? realStates : [];
}

function slugify(componentName: string): string {
  return componentName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------- 5. Montagem final ----------

function buildRule(record: AccessibilityRuleRecord): ComponentTypeRule<ExtractedTextData> {
  const states = parseVerbalizationStates(record.verbalizacaoEsperada);
  const statesMap =
    states.length > 0
      ? states.reduce<Record<string, string>>((acc, s) => {
          acc[s.label] = s.text;
          return acc;
        }, {})
      : undefined;

  // Verbalização inicial = o texto INTEIRO da célula "Verbalização
  // esperada", como confirmado com o time de acessibilidade — não só
  // quando o parser consegue separar por estado. Isso serve de
  // referência editável pro designer mesmo quando a célula é um
  // parágrafo explicativo em vez de uma lista limpa de estados.
  const rawTemplate = record.verbalizacaoEsperada?.trim();
  const hasTemplate = Boolean(rawTemplate && rawTemplate.length > 0);

  return {
    key: slugify(record.componente),
    label: record.componente,
    markupType: resolveMarkupType(record) as MarkupTypeKey,
    identifier: { matches: matchesComponentName(record.componente, ...(record.aliasesDeNome ?? [])) },
    hasVerbalization: hasTemplate,
    extraction: [record.extracaoTexto === "todos" ? "all-text" : "first-text"],
    template: hasTemplate ? rawTemplate : undefined,
    states: statesMap,
    focusEligible: resolveFocusEligible(record),
    alwaysDescend: record.sempreAprofundar ?? false,
    stateFlagAliases: record.stateFlagAliases,
    derivedStates: record.derivedStates
  };
}

export const accessibilityRules: ComponentTypeRule<ExtractedTextData>[] = accessibilityRuleRecords.map(buildRule);

/**
 * Para adicionar um componente novo: adicione o registro em
 * `accessibility-rules-data.ts` (nunca aqui). Se ele precisar de uma
 * forma de identificação diferente de "nome igual ao da planilha",
 * use `aliasesDeNome` no próprio registro de dados.
 */
