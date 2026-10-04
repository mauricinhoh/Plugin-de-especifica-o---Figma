/// <reference types="@figma/plugin-typings" />

/**
 * Geração dos cards do tagueamento no canvas (Fase 7; spec 7 e 10).
 *
 * Para cada tela, uma por vez (cedendo o controle ao Figma entre elas):
 *  1. apaga o tagueamento gerado antes para ela (se houver) — "refazer";
 *  2. cria um card por item, da variante do evento (importada pela chave);
 *  3. preenche valores, toggles, linhas do canal e número (fillCard);
 *  4. posiciona os cards em coluna à direita do frame (80 px), 24 px entre
 *     eles, abrindo uma nova coluna quando passa da altura do frame;
 *  5. cria os marcadores numerados sobre os componentes (cor do evento);
 *  6. agrupa tudo em "Tagueamento — [tela]" com pluginData próprio.
 * Componente que sumiu do arquivo não trava a geração: vira aviso.
 */

import { GenerationItem, GenerationRequest, GenerationResult, GenerationStage, GeneratedScreen, GenerationScreen } from "../../shared/types";
import { GA_CARD_EVENT_PROPERTY, GA_CARD_SET_KEY, eventKeyFromVariantName } from "../../shared/gaCard";
import { fillCard } from "./fillCard";
import { createComponentMarker, createScreenMarker, MARKER_FONT } from "./markers";
import { CARD_NODE_KEY, CARD_NUMBER_KEY, deleteTagOutput, OUTPUT_GROUP_PREFIX, OUTPUT_SCREEN_KEY } from "./existingOutput";
import { ensurePageOf, errorMessage, yieldToFigma } from "../util";

const GAP_FROM_FRAME = 80;
const GAP_BETWEEN_CARDS = 24;
const GAP_BETWEEN_COLUMNS = 40;

/**
 * Painel da acessibilidade ("Especificação de Acessibilidade"), que também
 * fica 80 px à direita da tela. Cópia do nome — o tagueamento não importa
 * nada da acessibilidade. Se ele estiver ao lado do frame, os cards do
 * tagueamento começam depois dele, para não ficarem por cima.
 */
const ACCESSIBILITY_PANEL_NAME = "Especificação de Acessibilidade";

function startXFor(frame: SceneNode, frameBox: Rect): number {
  let x = frameBox.x + frameBox.width + GAP_FROM_FRAME;
  const parent = frame.parent;
  const siblings = parent && "children" in parent ? [...parent.children, ...figma.currentPage.children] : [...figma.currentPage.children];
  for (const node of siblings) {
    if (node.type !== "FRAME" || node.name !== ACCESSIBILITY_PANEL_NAME || !node.absoluteBoundingBox) continue;
    const box = node.absoluteBoundingBox;
    const besideFrame = box.x >= frameBox.x + frameBox.width && box.x <= frameBox.x + frameBox.width + GAP_FROM_FRAME * 2;
    const sameRow = box.y < frameBox.y + frameBox.height && box.y + box.height > frameBox.y;
    if (besideFrame && sameRow) x = Math.max(x, box.x + box.width + GAP_FROM_FRAME);
  }
  return x;
}

async function loadVariants(): Promise<Map<string, ComponentNode>> {
  const set = await figma.importComponentSetByKeyAsync(GA_CARD_SET_KEY);
  const variants = new Map<string, ComponentNode>();
  for (const child of set.children) {
    if (child.type !== "COMPONENT") continue;
    const variantName = child.variantProperties?.[GA_CARD_EVENT_PROPERTY];
    if (variantName) variants.set(eventKeyFromVariantName(variantName), child);
  }
  return variants;
}

/** Coloca o grupo dentro da Seção do frame (se houver), mantendo a posição na tela. */
function placeInFrameContainer(group: GroupNode, frame: SceneNode): void {
  const parent = frame.parent;
  if (!parent || parent.type !== "SECTION") return;
  const absX = group.absoluteTransform[0][2];
  const absY = group.absoluteTransform[1][2];
  parent.appendChild(group);
  group.x = absX - parent.absoluteTransform[0][2];
  group.y = absY - parent.absoluteTransform[1][2];
}

async function generateScreen(
  screen: GenerationScreen,
  request: GenerationRequest,
  variants: Map<string, ComponentNode>,
  onItemDone: () => void
): Promise<GeneratedScreen> {
  const result: GeneratedScreen = { frameId: screen.frameId, nomeTela: screen.nomeTela, cards: 0, groupId: null, avisos: [], avisosDetalhados: [] };
  // Aviso de um card: o texto de sempre + o card a que se refere (para "Ir para").
  const warn = (item: GenerationItem, mensagem: string, cardId: string | null) => {
    result.avisos.push(`Card ${item.numero}: ${mensagem}`);
    result.avisosDetalhados?.push({ numero: item.numero, componente: item.componente, label: item.label ?? null, mensagem, cardId });
  };
  const frame = (await figma.getNodeByIdAsync(screen.frameId)) as SceneNode | null;
  if (!frame || !("absoluteBoundingBox" in frame) || !frame.absoluteBoundingBox) {
    result.avisos.push(`A tela "${screen.nomeTela}" não existe mais no arquivo.`);
    return result;
  }
  // O PD pode ter trocado de página durante a revisão: gera na página da tela.
  await ensurePageOf(frame);
  const frameBox = frame.absoluteBoundingBox;
  deleteTagOutput(frame);

  const created: SceneNode[] = [];
  let x = startXFor(frame, frameBox);
  let y = frameBox.y;
  let columnWidth = 0;
  const bottomLimit = frameBox.y + frameBox.height;

  for (const item of screen.items) {
    const variant = variants.get(item.evento);
    if (!variant) {
      warn(item, `variante do evento "${item.evento}" não encontrada na biblioteca.`, null);
      onItemDone();
      continue;
    }
    let card: InstanceNode;
    try {
      card = variant.createInstance();
    } catch (error) {
      warn(item, `não foi possível criar (${errorMessage(error)}).`, null);
      onItemDone();
      continue;
    }
    card.name = `${item.numero}. ${item.evento} — ${item.componente}`;
    card.setPluginData(OUTPUT_SCREEN_KEY, frame.id);
    card.setPluginData(CARD_NODE_KEY, item.nodeId);
    card.setPluginData(CARD_NUMBER_KEY, String(item.numero));
    try {
      for (const aviso of await fillCard(card, item.evento, item.values, item.numero, request.plataforma)) warn(item, aviso, card.id);
    } catch (error) {
      warn(item, `erro ao preencher (${errorMessage(error)}).`, card.id);
    }

    // Nova coluna quando o card passaria da altura do frame (sempre cabe pelo menos um por coluna).
    if (y > frameBox.y && y + card.height > bottomLimit) {
      x += columnWidth + GAP_BETWEEN_COLUMNS;
      y = frameBox.y;
      columnWidth = 0;
    }
    card.x = x;
    card.y = y;
    y += card.height + GAP_BETWEEN_CARDS;
    columnWidth = Math.max(columnWidth, card.width);
    created.push(card);
    result.cards += 1;

    // Marcador sobre a tela
    try {
      if (item.origem === "tela") {
        const screenMarker = createScreenMarker(frameBox, item.numero, item.evento);
        screenMarker.setPluginData(OUTPUT_SCREEN_KEY, frame.id);
        created.push(screenMarker);
      } else {
        const target = (await figma.getNodeByIdAsync(item.nodeId)) as SceneNode | null;
        const bounds = target && "absoluteBoundingBox" in target ? target.absoluteBoundingBox : null;
        if (!target || !bounds) {
          warn(item, "O componente não existe mais — card criado sem marcador.", card.id);
        } else {
          const marker = createComponentMarker(bounds, item.numero, item.evento, item.componente);
          marker.setPluginData(CARD_NODE_KEY, item.nodeId);
          marker.setPluginData(OUTPUT_SCREEN_KEY, frame.id);
          created.push(marker);
        }
      }
    } catch (error) {
      warn(item, `marcador não criado (${errorMessage(error)}).`, card.id);
    }
    onItemDone();
  }

  if (created.length > 0) {
    const group = figma.group(created, figma.currentPage);
    group.name = `${OUTPUT_GROUP_PREFIX}${screen.nomeTela || frame.name}`;
    group.setPluginData(OUTPUT_SCREEN_KEY, frame.id);
    placeInFrameContainer(group, frame);
    result.groupId = group.id;
  }
  return result;
}

/** Erro da geração com um código conhecido (a UI mostra os passos para resolver). */
export type GenerationFailure = Error & { code?: "biblioteca" };

export async function generateCards(
  request: GenerationRequest,
  onProgress: (done: number, total: number, stage: GenerationStage, stageDone: number, stageTotal: number) => void
): Promise<GenerationResult> {
  const result: GenerationResult = { screens: [], avisos: [] };
  const screensTotal = request.screens.length;
  const itemsTotal = request.screens.reduce((sum, screen) => sum + screen.items.length, 0);

  // 1. Carrega o card da biblioteca (importado pela chave).
  onProgress(0, screensTotal, "biblioteca", 0, 1);
  let variants: Map<string, ComponentNode>;
  try {
    variants = await loadVariants();
  } catch (error) {
    const failure: GenerationFailure = new Error(errorMessage(error));
    failure.code = "biblioteca";
    throw failure;
  }
  await figma.loadFontAsync(MARKER_FONT);

  // 2. Cria, preenche e posiciona cada card com o marcador dele (tela por tela).
  let itemsDone = 0;
  onProgress(0, screensTotal, "cards", 0, itemsTotal);
  for (let index = 0; index < screensTotal; index++) {
    result.screens.push(
      await generateScreen(request.screens[index], request, variants, () => {
        itemsDone += 1;
        onProgress(index, screensTotal, "cards", itemsDone, itemsTotal);
      })
    );
    // 3. O agrupamento "Tagueamento — tela" acontece no fim de cada tela.
    onProgress(index + 1, screensTotal, "agrupando", index + 1, screensTotal);
    await yieldToFigma();
  }
  return result;
}
