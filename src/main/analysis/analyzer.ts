/// <reference types="@figma/plugin-typings" />

import { ScreenAnalysisResult, ScreenContext, SpecificationItem } from "../../shared/types";
import { accessibilityRules } from "../../rules/accessibility-rules";
import { computeVerbalization, buildStateCandidates, findMatchingRule, UNSPECIFIED_TYPE_KEY } from "../../rules/engine";
import { generateSpecificationId } from "../idGenerator";
import { discoverTopLevelComponents } from "./discovery";
import { resolveComponentName } from "./componentIdentity";
import { sortByReadingOrder } from "./readingOrder";
import { identifyCoreType } from "./coreIdentification";
import { resolveScreenContext } from "./contextResolver";
import { detectPossibleDetachedComponents } from "./detachDetector";
import { extractAllTextsJoined, extractFirstText } from "./textExtraction";
import { extractVariantProperties } from "./stateExtraction";
import { findCoreIncompatibilities } from "./validation";

/**
 * Componente "reconhecido" = tem uma regra cadastrada em
 * accessibility-rules.ts (identificável pelo nome do node ou do
 * componente principal). `alwaysDescend` vem da própria regra (ver
 * `ComponentTypeRule.alwaysDescend`) — usado pela descoberta
 * (discovery.ts) para decidir se aprofunda mesmo em um componente
 * reconhecido (ex.: "Header Product").
 */
async function classifyComponent(
  node: InstanceNode | ComponentNode
): Promise<{ recognized: boolean; alwaysDescend: boolean }> {
  const componentName = await resolveComponentName(node);
  const rule = findMatchingRule(accessibilityRules, { nodeName: node.name, componentName });
  return { recognized: rule !== undefined, alwaysDescend: rule?.alwaysDescend ?? false };
}

/**
 * DIAGNÓSTICO TEMPORÁRIO — pedido do usuário depois de relatar que
 * Checkbox e Input Text Area pegam o texto certo, mas não o estado
 * certo. Em vez de arriscar outro palpite sobre o nome/valor da
 * variant property (já erramos uma vez com a biblioteca), este log
 * mostra os dados reais: quais estados a regra conhece (`rule.states`)
 * e o que a API do Figma realmente devolve em `variantProperties`
 * para aquela instância. Com isso dá pra confirmar se o valor do
 * Figma bate com o rótulo esperado ou se o Design System usa um nome
 * diferente do que a planilha descreve.
 *
 * Como ver: Plugins → Development → Open Console, com o console já
 * aberto ANTES de rodar a análise.
 */
const DEBUG_STATE_MATCHING = true;

function logStateDebugInfo(
  node: SceneNode,
  rule: ReturnType<typeof findMatchingRule>,
  variantProperties: Record<string, string> | null,
  variantValues: string[]
): void {
  if (!DEBUG_STATE_MATCHING || !rule?.states) return;
  console.log("[state-matching-debug]", {
    nodeName: node.name,
    ruleKey: rule.key,
    estadosConhecidosPelaRegra: Object.keys(rule.states),
    variantPropertiesDoFigma: variantProperties,
    valoresComparados: variantValues
  });
}

/**
 * Constrói um SpecificationItem a partir de um node de topo
 * descoberto, já aplicando o motor de regras de acessibilidade.
 */
async function buildSpecificationItem(
  node: SceneNode,
  order: number,
  manuallyAdded: boolean
): Promise<SpecificationItem> {
  const isComponentLike = node.type === "INSTANCE" || node.type === "COMPONENT";
  const coreType = isComponentLike
    ? (await identifyCoreType(node as InstanceNode | ComponentNode)).coreType
    : "DESCONHECIDO";

  const componentName = isComponentLike ? await resolveComponentName(node as InstanceNode | ComponentNode) : null;

  const rule = findMatchingRule(accessibilityRules, {
    nodeName: node.name,
    componentName
  });

  const extractedData: Record<string, string> = {};
  if (rule?.extraction.includes("all-text")) {
    const text = extractAllTextsJoined(node);
    if (text !== undefined) {
      extractedData.text = text;
    }
  } else if (rule?.extraction.includes("first-text")) {
    const text = extractFirstText(node);
    if (text !== undefined) {
      extractedData.text = text;
    }
  }

  const variantProperties = extractVariantProperties(node);
  const variantValues = buildStateCandidates(variantProperties, rule?.derivedStates);
  logStateDebugInfo(node, rule, variantProperties, variantValues);
  const verbalization = computeVerbalization(rule, extractedData, variantValues);

  return {
    id: generateSpecificationId(),
    nodeId: node.id,
    nodeName: node.name,
    nodeType: node.type,
    markupType: rule?.markupType ?? UNSPECIFIED_TYPE_KEY,
    ruleKey: rule?.key ?? null,
    variantProperties,
    coreType,
    extractedData,
    verbalization,
    order,
    manuallyAdded,
    verbalizationEdited: false,
    focusEligible: rule?.focusEligible ?? false
  };
}

/**
 * Executa a análise completa de uma tela, seguindo exatamente a
 * ordem descrita na seção 12 do briefing (passos 1 a 8; os passos 9
 * e 10 — bloquear ou criar cards — ficam a cargo de quem consome o
 * resultado, pois dependem de uma eventual escolha manual de
 * contexto feita pelo designer em caso de empate).
 */
export async function analyzeScreen(
  screenNode: SceneNode,
  forcedContext?: ScreenContext
): Promise<ScreenAnalysisResult> {
  const discovered = await discoverTopLevelComponents(screenNode, classifyComponent);
  // Numeração pela posição real no canvas (leitura em "Z"), não pela
  // ordem das camadas no arquivo — pedido explícito após testes reais
  // com arquivos organizados de forma inconsistente nas camadas.
  const topLevelNodes = sortByReadingOrder(discovered);

  const items: SpecificationItem[] = [];
  let coreWebCount = 0;
  let coreAppCount = 0;

  let order = 0;
  for (const node of topLevelNodes) {
    const item = await buildSpecificationItem(node, order, false);
    if (item.coreType === "CORE_WEB") coreWebCount += 1;
    if (item.coreType === "CORE_APP") coreAppCount += 1;
    items.push(item);
    order += 1;
  }

  const resolution = forcedContext
    ? { context: forcedContext, requiresContextChoice: false }
    : resolveScreenContext(coreWebCount, coreAppCount);

  const incompatibilities = resolution.context
    ? findCoreIncompatibilities(items, resolution.context)
    : [];

  const detachWarnings = detectPossibleDetachedComponents(topLevelNodes);

  return {
    screenNodeId: screenNode.id,
    screenName: screenNode.name,
    context: resolution.context,
    requiresContextChoice: resolution.requiresContextChoice,
    coreWebCount,
    coreAppCount,
    items,
    incompatibilities,
    detachWarnings
  };
}

/** Constrói um item a partir de um node selecionado manualmente (seção 23-24). */
export async function buildManualItem(node: SceneNode, order: number): Promise<SpecificationItem> {
  return buildSpecificationItem(node, order, true);
}
