/// <reference types="@figma/plugin-typings" />

import { ScreenAnalysisResult, ScreenContext, SpecificationItem } from "../../shared/types";
import { accessibilityRules, findRuleByKey, PDF_HEADING_RULE_KEY, PLAIN_TEXT_RULE_KEY } from "../../rules/accessibility-rules";
import { computeVerbalization, buildStateCandidates, findMatchingRule, UNSPECIFIED_TYPE_KEY } from "../../rules/engine";
import { generateSpecificationId } from "../idGenerator";
import { collectItems, discoverTopLevelComponents } from "./discovery";
import { resolveComponentName } from "./componentIdentity";
import { sortByReadingOrder } from "./readingOrder";
import { identifyCoreType } from "./coreIdentification";
import { resolveScreenContext } from "./contextResolver";
import { detectPossibleDetachedComponents } from "./detachDetector";
import {
  extractAllTextsJoined,
  extractFirstText,
  extractFirstThreeTexts,
  extractFirstTwoTexts,
  extractTextsByLayerName,
  findLastTextLayer,
  extractOwnTextSlots,
  findInnerInstanceText,
  extractTextList,
  extractTabs,
  extractTitleAndDescription,
  findFirstTextNode,
  hasUnderlinedText,
  findOwnTexts,
  listTextLayers
} from "./textExtraction";
import { extractBooleanProperties, extractVariantProperties } from "./stateExtraction";
import { isInsidePdfFrame, isPdfHeadingText } from "./pdfFrame";
import { detectHeadingLevelFromFontSize, MAX_HEADING_LEVEL, SMALL_TEXT_HEADING_LEVELS } from "./headingDetection";
import { findCoreIncompatibilities } from "./validation";

/**
 * Componente "reconhecido" = tem uma regra cadastrada em
 * accessibility-rules.ts (identificável pelo nome do node ou do
 * componente principal). `alwaysDescend` vem da própria regra (ver
 * `ComponentTypeRule.alwaysDescend`) — usado pela descoberta
 * (discovery.ts) para decidir se aprofunda mesmo em um componente
 * reconhecido (ex.: "Header Product").
 *
 * Um TEXT solto (não dentro de INSTANCE/COMPONENT) é "reconhecido"
 * quando o tamanho da fonte bate com um nível de título — pedido do
 * usuário depois de notar que títulos soltos na tela (sem usar o
 * componente Heading de verdade) estavam sendo ignorados pela
 * descoberta automática.
 */
async function classifyComponent(
  node: InstanceNode | ComponentNode | TextNode
): Promise<{
  recognized: boolean;
  alwaysDescend: boolean;
  childrenOnly?: boolean;
  cardPerItem?: boolean;
  ignoreLooseText?: boolean;
}> {
  if (node.type === "TEXT") {
    const headingLevel = detectHeadingLevelFromFontSize(node);
    if (headingLevel === null && DEBUG_TEXT_LAYERS && node.characters.trim().length > 0) {
      // Texto solto ignorado porque o tamanho não está na tabela de
      // títulos — mostra o tamanho real para ajustar a tabela.
      console.log("[texto-solto-ignorado-debug]", {
        texto: node.characters,
        camada: node.name,
        tamanhoDaFonte: node.fontSize === figma.mixed ? "misto" : node.fontSize
      });
    }
    return { recognized: headingLevel !== null, alwaysDescend: false };
  }
  const componentName = await resolveComponentName(node);
  const rule = findMatchingRule(accessibilityRules, { nodeName: node.name, componentName });
  // Lista no formato padrão (ex.: Popover Menu com Item1..Item4): um
  // card por item. Alterada pelo PD: cada componente de dentro.
  if (rule?.standardItemNamePattern && (await hasStandardItems(node, rule.standardItemNamePattern))) {
    return { recognized: true, alwaysDescend: false, childrenOnly: false, cardPerItem: true, ignoreLooseText: false };
  }
  return {
    recognized: rule !== undefined,
    alwaysDescend: rule?.alwaysDescend ?? false,
    childrenOnly: rule?.childrenOnly ?? false,
    cardPerItem: rule?.cardPerItem ?? false,
    ignoreLooseText: rule?.ignoreLooseText ?? false
  };
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

/**
 * DIAGNÓSTICO — para componentes com textosPorCamada: mostra no console
 * o nome e o texto de cada camada de texto, e quais placeholders foram
 * preenchidos. Se algum placeholder não preencher, esse log mostra o
 * nome real da camada no Figma para ajustar a regra.
 */
const DEBUG_TEXT_LAYERS = true;

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
/**
 * Regras dos componentes ANCESTRAIS reconhecidos do node, do mais
 * próximo para o mais distante (ex.: [Drawer]). Usado para variantes
 * "dentro de contêiner" e para a ordem "por último dentro de".
 */
/**
 * true quando a lista do contêiner está no formato padrão: há itens, e
 * TODOS têm nome que bate com `pattern` e são do mesmo componente.
 */
export async function hasStandardItems(node: InstanceNode | ComponentNode, pattern: string): Promise<boolean> {
  const items = collectItems(node);
  if (items.length === 0) return false;
  const nameRegex = new RegExp(pattern, "i");
  if (!items.every((item) => nameRegex.test(item.name.trim()))) return false;
  const componentNames = new Set<string | null>();
  for (const item of items) componentNames.add(await resolveComponentName(item));
  return componentNames.size === 1 && !componentNames.has(null);
}

/** Mesma normalização dos nomes de placeholder (sem acento, minúsculo). */
function normalizePlaceholderKey(name: string): string {
  return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

/** Primeira instância, dentro do node, reconhecida pela regra de nome `ruleLabel` (ex.: "Checkbox"). */
async function findInnerComponentByRule(node: SceneNode, ruleLabel: string): Promise<InstanceNode | null> {
  if (!("children" in node)) return null;
  for (const child of node.children) {
    if (child.type === "INSTANCE") {
      const name = await resolveComponentName(child);
      const childRule = findMatchingRule(accessibilityRules, { nodeName: child.name, componentName: name });
      if (childRule?.label === ruleLabel) return child;
    }
    const found = await findInnerComponentByRule(child, ruleLabel);
    if (found) return found;
  }
  return null;
}

async function findAncestorRules(
  node: SceneNode
): Promise<Array<{ node: InstanceNode | ComponentNode; ruleKey: string }>> {
  const result: Array<{ node: InstanceNode | ComponentNode; ruleKey: string }> = [];
  let current = node.parent;
  while (current && current.type !== "PAGE" && current.type !== "DOCUMENT") {
    if (current.type === "INSTANCE" || current.type === "COMPONENT") {
      const name = await resolveComponentName(current);
      const rule = findMatchingRule(accessibilityRules, { nodeName: current.name, componentName: name });
      if (rule) result.push({ node: current, ruleKey: rule.key });
    }
    current = current.parent;
  }
  return result;
}

/**
 * O texto está dentro de um contêiner com `textoPequenoSemTitulo` (ex.:
 * Header Flow)? Confere qualquer ancestral — instância/componente pelo
 * nome do componente principal, e também frames/grupos pelo nome da
 * camada (o Header Flow pode ser só uma composição do arquivo).
 */
async function isInsideSmallTextAsPlainTextContainer(node: SceneNode): Promise<boolean> {
  let current = node.parent;
  while (current && current.type !== "PAGE" && current.type !== "DOCUMENT") {
    const componentName =
      current.type === "INSTANCE" || current.type === "COMPONENT" ? await resolveComponentName(current) : null;
    const rule = findMatchingRule(accessibilityRules, { nodeName: current.name, componentName });
    if (rule?.smallTextAsPlainText) return true;
    current = current.parent;
  }
  return false;
}

async function buildSpecificationItem(
  node: SceneNode,
  order: number,
  manuallyAdded: boolean,
  inheritRuleFrom?: InstanceNode | ComponentNode
): Promise<SpecificationItem> {
  const isComponentLike = node.type === "INSTANCE" || node.type === "COMPONENT";
  const isTextNode = node.type === "TEXT";

  const coreType = isComponentLike
    ? (await identifyCoreType(node as InstanceNode | ComponentNode)).coreType
    : "DESCONHECIDO";

  const componentName = isComponentLike ? await resolveComponentName(node as InstanceNode | ComponentNode) : null;

  let rule = isComponentLike
    ? findMatchingRule(accessibilityRules, { nodeName: node.name, componentName })
    : undefined;

  // Item de um contêiner "cardPerItem" (ex.: um chip dentro do Chip
  // Filter): usa a regra do CONTÊINER, com o texto/estado do item.
  if (inheritRuleFrom) {
    const parentComponentName = await resolveComponentName(inheritRuleFrom);
    rule = findMatchingRule(accessibilityRules, { nodeName: inheritRuleFrom.name, componentName: parentComponentName }) ?? rule;
    // Item de lista padrão (ex.: Popover Menu): regra própria do item.
    if (rule?.standardItemNamePattern) {
      rule = findRuleByKey(`${rule.key}--item`) ?? rule;
    }
  }

  // Variante "dentro de contêiner" (ex.: Button Icon dentro do Drawer
  // → "Fechar"). Vale o contêiner reconhecido MAIS PRÓXIMO que tiver
  // variante definida; fora dele, a regra normal continua valendo.
  if (rule?.variantsInsideContainer) {
    for (const ancestor of await findAncestorRules(node)) {
      const variantKey = rule.variantsInsideContainer[ancestor.ruleKey];
      if (variantKey) {
        rule = findRuleByKey(variantKey) ?? rule;
        break;
      }
    }
  }

  const extractedData: Record<string, string> = {};

  if (isTextNode && isInsidePdfFrame(node)) {
    // Texto dentro de um frame "PDF" (ver pdfFrame.ts): Bold/ExtraBold
    // = título, sem nível automático (o PD completa); o resto = o
    // próprio texto. O tamanho da fonte não é usado aqui.
    rule = findRuleByKey(isPdfHeadingText(node as TextNode) ? PDF_HEADING_RULE_KEY : PLAIN_TEXT_RULE_KEY);
    extractedData.text = (node as TextNode).characters;
  } else if (isTextNode) {
    // Título "solto": usa sempre a regra "Heading", independente do
    // nome da camada — o motivo de ter sido descoberto já é o tamanho
    // da fonte bater com um nível de título (ver classifyComponent).
    const headingLevel = detectHeadingLevelFromFontSize(node as TextNode);
    if (headingLevel && SMALL_TEXT_HEADING_LEVELS.has(headingLevel) && (await isInsideSmallTextAsPlainTextContainer(node))) {
      // Texto pequeno dentro de contêiner como o Header Flow: só texto.
      rule = findRuleByKey(PLAIN_TEXT_RULE_KEY);
      extractedData.text = (node as TextNode).characters;
    } else if (headingLevel) {
      rule = accessibilityRules.find((r) => r.key === "heading");
      extractedData.text = (node as TextNode).characters;
      extractedData.nivel = headingLevel;
    }
  } else if (rule?.extraction.includes("all-text")) {
    const text = extractAllTextsJoined(node);
    if (text !== undefined) {
      extractedData.text = text;
    }
  } else if (rule?.extraction.includes("tabs")) {
    const tabs = extractTabs(node);
    if (tabs.length > 0) {
      extractedData.abas = JSON.stringify(tabs.map(({ label, selected }) => ({ label, selected })));
      extractedData.text = tabs.map((t) => t.label).join(", ");
    }
    if (DEBUG_TEXT_LAYERS) {
      // Se nenhuma aba sair como selecionada, este log mostra as
      // propriedades reais de cada aba no Figma para ajustar a regra.
      console.log("[tab-debug]", { nodeName: node.name, abas: tabs });
    }
  } else if (rule?.extraction.includes("header")) {
    // Cabeçalho (ex.: Header Product): 1º texto próprio = título (com
    // nível pelo tamanho da fonte), 2º = descrição. Textos de botões e
    // outras instâncias internas ficam de fora (têm card próprio).
    const ownTexts = findOwnTexts(node);
    if (ownTexts[0]) {
      extractedData.text = ownTexts[0].characters;
      const level = detectHeadingLevelFromFontSize(ownTexts[0]);
      if (level) extractedData.nivel = level;
    }
    if (ownTexts[1]) {
      extractedData.text2 = ownTexts[1].characters;
    }
  } else if (rule?.extraction.includes("title-description")) {
    const { title, description } = extractTitleAndDescription(node, rule.ownTextsOnly);
    if (title !== undefined) {
      extractedData.text = title;
    }
    if (description !== undefined) {
      extractedData.text2 = description;
    }
  } else if (rule?.extraction.includes("item-list")) {
    const list = extractTextList(node);
    if (list.length > 0) {
      extractedData.lista = JSON.stringify(list);
      extractedData.text = list.join(", ");
    }
  } else if (rule?.extraction.includes("first-two-texts")) {
    const { first, second } = extractFirstTwoTexts(node);
    if (first !== undefined) {
      extractedData.text = first;
    }
    if (second !== undefined) {
      extractedData.text2 = second;
    }
  } else if (rule?.extraction.includes("first-three-texts")) {
    const { first, second, third } = extractFirstThreeTexts(node);
    if (first !== undefined) {
      extractedData.text = first;
    }
    if (second !== undefined) {
      extractedData.text2 = second;
    }
    if (third !== undefined) {
      extractedData.text3 = third;
    }
  } else if (rule?.extraction.includes("first-text")) {
    const text = extractFirstText(node);
    if (text !== undefined) {
      extractedData.text = text;
    }
  }

  // Textos achados pelo NOME da camada (ex.: Label, Placeholder, Helper
  // text dos Inputs) — cada um vai para o seu placeholder.
  // Textos do próprio componente + texto do botão interno (ex.: Uploader).
  if (!isTextNode && rule?.ownTextSlots) {
    const slots = extractOwnTextSlots(node, rule.ownTextSlots);
    for (const [placeholder, value] of Object.entries(slots)) {
      extractedData[`camada:${placeholder}`] = value;
    }
    if (DEBUG_TEXT_LAYERS) {
      console.log("[own-texts-debug]", { nodeName: node.name, ruleKey: rule.key, camadasDeTexto: listTextLayers(node), preenchidos: slots });
    }
  }
  if (!isTextNode && rule?.innerButtonTextPlaceholder) {
    const buttonText = findInnerInstanceText(node);
    if (buttonText !== undefined) {
      extractedData[`camada:${rule.innerButtonTextPlaceholder}`] = buttonText;
    }
  }

  // Textos por posição → placeholders (ex.: List Select: 1º = Descrição, 2º = Label).
  if (!isTextNode && rule?.textsByPosition) {
    const texts = listTextLayers(node);
    rule.textsByPosition.forEach((placeholder, index) => {
      const value = texts[index]?.texto;
      if (value !== undefined) {
        extractedData[`camada:${normalizePlaceholderKey(placeholder)}`] = value;
      }
    });
  }

  // Primeiro texto visível → placeholder da regra (ex.: Input Search).
  if (!isTextNode && rule?.firstTextPlaceholder) {
    const firstText = extractFirstText(node);
    if (firstText !== undefined) {
      extractedData[`camada:${rule.firstTextPlaceholder}`] = firstText;
    }
  }

  // Última camada de texto reservada (ex.: contador do Input Text Area).
  const lastTextLayer = !isTextNode && rule?.lastTextLayer ? findLastTextLayer(node) : null;
  if (!isTextNode && rule?.textsByLayerName) {
    const byLayer = extractTextsByLayerName(node, rule.textsByLayerName, lastTextLayer?.node.id);
    for (const [placeholder, value] of Object.entries(byLayer)) {
      extractedData[`camada:${placeholder}`] = value;
    }
    if (DEBUG_TEXT_LAYERS) {
      console.log("[text-layers-debug]", { nodeName: node.name, ruleKey: rule.key, camadasDeTexto: listTextLayers(node), preenchidos: byLayer });
    }
  }

  if (rule?.lastTextLayer && lastTextLayer) {
    if (lastTextLayer.visible && lastTextLayer.node.characters.trim().length > 0) {
      extractedData[`camada:${rule.lastTextLayer.placeholder}`] = lastTextLayer.node.characters;
    } else {
      delete extractedData[`camada:${rule.lastTextLayer.placeholder}`];
      extractedData.ultimaCamadaOculta = "sim";
    }
  }

  // Componente Heading (instância): o nível vem do tamanho da fonte do
  // texto de dentro dele — mesma tabela do título solto (ver
  // headingDetection.ts). Tamanho fora da tabela: não inventa nível.
  if (!isTextNode && rule?.key === "heading" && extractedData.nivel === undefined) {
    const headingText = findFirstTextNode(node);
    const level = headingText ? detectHeadingLevelFromFontSize(headingText) : null;
    if (level) {
      extractedData.nivel = level;
    }
  }

  if (rule?.onlyWithUnderline) {
    extractedData.sublinhado = hasUnderlinedText(node) ? "sim" : "nao";
  }

  let variantProperties = extractVariantProperties(node);
  let booleanProperties = extractBooleanProperties(node);
  // Estado vindo de um componente interno (ex.: Checkbox dentro do List
  // Select): as propriedades dele se somam às do próprio componente.
  if (!isTextNode && rule?.stateFromInnerComponent) {
    const inner = await findInnerComponentByRule(node, rule.stateFromInnerComponent);
    if (inner) {
      const innerVariants = extractVariantProperties(inner);
      const innerBooleans = extractBooleanProperties(inner);
      if (innerVariants) variantProperties = { ...(variantProperties ?? {}), ...innerVariants };
      if (innerBooleans) booleanProperties = { ...(booleanProperties ?? {}), ...innerBooleans };
    }
  }
  const variantValues = buildStateCandidates(variantProperties, rule?.derivedStates, booleanProperties);
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
    booleanProperties,
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
/**
 * Regra "por último dentro do contêiner" (ex.: dentro do Drawer, o
 * Button Icon — o X de fechar — é sempre o último item). Aplicada
 * DEPOIS da ordenação espacial: os itens marcados são tirados de onde
 * caíram e recolocados logo após o último item daquele contêiner.
 */
/**
 * Um componente que tem card E itens com card dentro dele (ex.: Header
 * Product com botões) é lido ANTES do que está dentro dele. A ordem
 * espacial usa o centro de cada elemento, e o centro de um contêiner
 * alto fica abaixo dos itens do topo — sem isso, o título do Header
 * Product viria depois dos botões.
 */
function placeContainersBeforeContents<T extends SceneNode>(ordered: T[]): T[] {
  const result = [...ordered];
  const ids = new Set(result.map((n) => n.id));
  for (const container of ordered) {
    let firstInside = -1;
    result.forEach((node, index) => {
      if (firstInside !== -1 || node.id === container.id) return;
      let parent = node.parent;
      while (parent && parent.type !== "PAGE" && parent.type !== "DOCUMENT") {
        if (parent.id === container.id) {
          firstInside = index;
          return;
        }
        parent = parent.parent;
      }
    });
    const containerIndex = result.indexOf(container);
    if (firstInside !== -1 && containerIndex > firstInside && ids.has(container.id)) {
      result.splice(containerIndex, 1);
      result.splice(firstInside, 0, container);
    }
  }
  return result;
}

async function moveLastInsideContainers<T extends SceneNode>(ordered: T[]): Promise<T[]> {
  const result = [...ordered];

  // Contêineres com regra "por último dentro" são achados pelos
  // ANCESTRAIS dos itens — funciona mesmo quando o contêiner não gera
  // card próprio (ex.: Drawer, que é "somente filhos").
  const containers = new Map<string, { lastInside: string[]; insideIds: Set<string>; toMove: T[] }>();
  for (const node of result) {
    for (const ancestor of await findAncestorRules(node)) {
      const containerRule = findRuleByKey(ancestor.ruleKey);
      if (!containerRule?.lastInside?.length) continue;
      let entry = containers.get(ancestor.node.id);
      if (!entry) {
        entry = { lastInside: containerRule.lastInside, insideIds: new Set(), toMove: [] };
        containers.set(ancestor.node.id, entry);
      }
      entry.insideIds.add(node.id);
      if (node.type === "INSTANCE" || node.type === "COMPONENT") {
        const name = await resolveComponentName(node);
        const rule = findMatchingRule(accessibilityRules, { nodeName: node.name, componentName: name });
        if (rule && entry.lastInside.includes(rule.label)) entry.toMove.push(node);
      }
    }
  }

  for (const entry of containers.values()) {
    if (entry.toMove.length === 0) continue;
    // Posição original do primeiro item movido — usada só se o
    // contêiner não tiver nenhum outro item (aí nada muda de lugar).
    const originalFirst = Math.min(...entry.toMove.map((n) => result.indexOf(n)));
    for (const node of entry.toMove) result.splice(result.indexOf(node), 1);
    let insertAt = -1;
    result.forEach((node, index) => {
      if (entry.insideIds.has(node.id)) insertAt = index;
    });
    const position = insertAt === -1 ? originalFirst : insertAt + 1;
    result.splice(position, 0, ...entry.toMove);
  }
  return result;
}

export async function analyzeScreen(
  screenNode: SceneNode,
  forcedContext?: ScreenContext
): Promise<ScreenAnalysisResult> {
  const inheritedParents = new Map<string, InstanceNode | ComponentNode>();
  const discovered = await discoverTopLevelComponents(screenNode, classifyComponent, inheritedParents);
  // Numeração pela posição real no canvas (leitura em "Z"), não pela
  // ordem das camadas no arquivo — pedido explícito após testes reais
  // com arquivos organizados de forma inconsistente nas camadas.
  const topLevelNodes = await moveLastInsideContainers(placeContainersBeforeContents(sortByReadingOrder(discovered)));

  const items: SpecificationItem[] = [];
  let coreWebCount = 0;
  let coreAppCount = 0;

  let order = 0;
  for (const node of topLevelNodes) {
    const item = await buildSpecificationItem(node, order, false, inheritedParents.get(node.id));
    if (item.coreType === "CORE_WEB") coreWebCount += 1;
    if (item.coreType === "CORE_APP") coreAppCount += 1;
    items.push(item);
    order += 1;
  }

  await renumberHeadingsInLogicalOrder(topLevelNodes, items);

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

/**
 * Nível dos títulos pela ORDEM LÓGICA (ordem de leitura), não pelo
 * tamanho da fonte — o tamanho só serve para saber se um texto solto é
 * título. Confirmado com o usuário em 07/10/2026.
 *
 * - Dentro de um contêiner com `headingsInLogicalOrder` (ex.: Modal):
 *   contagem própria, 1º título = nível 1, 2º = nível 2... até 6.
 *   Textos pequenos (nível 5/6 pelo tamanho) ficam como estão e não
 *   entram na contagem. (Regra de 05/10/2026, sem mudança.)
 * - No resto da tela: 1º título = nível 2, 2º = nível 3... até 6.
 *   Entram na contagem: texto solto reconhecido como título (inclusive
 *   14/16 px), componente Heading e o título do Header Product.
 *   Depois do nível 6: títulos continuam nível 6, mas texto solto
 *   pequeno (14/16 px) vira só texto (regra "texto", sem "Título de
 *   nível").
 * - Não entram: NADA dentro do frame PDF (textos e componentes ficam
 *   com as regras do PDF / do próprio componente, como antes) e textos
 *   pequenos do Header Flow (já são regra "texto").
 */
const SCREEN_FIRST_HEADING_LEVEL = 2;

export async function renumberHeadingsInLogicalOrder(nodes: SceneNode[], items: SpecificationItem[]): Promise<void> {
  const containerCounters = new Map<string, number>();
  let screenLevel = SCREEN_FIRST_HEADING_LEVEL - 1;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const node = nodes[index];
    if (!node) continue;
    // Frame "PDF": regras próprias (Bold/ExtraBold, nível manual pelo PD).
    // Nada dentro dele entra nesta contagem nem é renumerado.
    if (isInsidePdfFrame(node)) continue;
    const isHeading = item.ruleKey === "heading";
    const isHeaderProductWithTitle = item.ruleKey === "header-product" && item.extractedData.text !== undefined;
    if (!isHeading && !isHeaderProductWithTitle) continue;

    const currentLevel = item.extractedData.nivel;
    const container = (await findAncestorRules(node)).find(
      (ancestor) => findRuleByKey(ancestor.ruleKey)?.headingsInLogicalOrder
    );

    if (container) {
      // Contagem própria do contêiner (ex.: Modal) — só para o Heading,
      // como antes.
      if (!isHeading || currentLevel === undefined || SMALL_TEXT_HEADING_LEVELS.has(currentLevel)) continue;
      const next = Math.min((containerCounters.get(container.node.id) ?? 0) + 1, MAX_HEADING_LEVEL);
      containerCounters.set(container.node.id, next);
      applyHeadingLevel(item, String(next));
      continue;
    }

    screenLevel += 1;
    if (screenLevel <= MAX_HEADING_LEVEL) {
      applyHeadingLevel(item, String(screenLevel));
      continue;
    }
    // Passou do nível 6.
    const isSmallLooseText = node.type === "TEXT" && currentLevel !== undefined && SMALL_TEXT_HEADING_LEVELS.has(currentLevel);
    if (isSmallLooseText) {
      turnIntoPlainText(item);
    } else {
      applyHeadingLevel(item, String(MAX_HEADING_LEVEL));
    }
  }
}

function recomputeVerbalization(item: SpecificationItem): void {
  const rule = findRuleByKey(item.ruleKey);
  if (!rule || item.verbalizationEdited) return;
  item.verbalization = computeVerbalization(
    rule,
    item.extractedData,
    buildStateCandidates(item.variantProperties, rule.derivedStates, item.booleanProperties)
  );
}

function applyHeadingLevel(item: SpecificationItem, level: string): void {
  item.extractedData = { ...item.extractedData, nivel: level };
  recomputeVerbalization(item);
}

function turnIntoPlainText(item: SpecificationItem): void {
  const textRule = findRuleByKey(PLAIN_TEXT_RULE_KEY);
  if (!textRule) return;
  const { nivel: _nivel, ...rest } = item.extractedData;
  item.extractedData = rest;
  item.ruleKey = textRule.key;
  item.markupType = textRule.markupType;
  item.focusEligible = textRule.focusEligible;
  recomputeVerbalization(item);
}

/** Constrói um item a partir de um node selecionado manualmente (seção 23-24). */
export async function buildManualItem(node: SceneNode, order: number): Promise<SpecificationItem> {
  return buildSpecificationItem(node, order, true);
}
