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

import { GenerationRequest, GenerationResult, GeneratedScreen, GenerationScreen } from "../../shared/types";
import { GA_CARD_EVENT_PROPERTY, GA_CARD_SET_KEY, eventKeyFromVariantName } from "../../shared/gaCard";
import { fillCard } from "./fillCard";
import { createComponentMarker, createScreenMarker, MARKER_FONT } from "./markers";
import { CARD_NODE_KEY, CARD_NUMBER_KEY, deleteTagOutput, OUTPUT_GROUP_PREFIX, OUTPUT_SCREEN_KEY } from "./existingOutput";

const GAP_FROM_FRAME = 80;
const GAP_BETWEEN_CARDS = 24;
const GAP_BETWEEN_COLUMNS = 40;

const yieldToFigma = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
  variants: Map<string, ComponentNode>
): Promise<GeneratedScreen> {
  const result: GeneratedScreen = { frameId: screen.frameId, nomeTela: screen.nomeTela, cards: 0, groupId: null, avisos: [] };
  const frame = (await figma.getNodeByIdAsync(screen.frameId)) as SceneNode | null;
  if (!frame || !("absoluteBoundingBox" in frame) || !frame.absoluteBoundingBox) {
    result.avisos.push(`A tela "${screen.nomeTela}" não existe mais no arquivo.`);
    return result;
  }
  const frameBox = frame.absoluteBoundingBox;
  deleteTagOutput(frame);

  const created: SceneNode[] = [];
  let x = frameBox.x + frameBox.width + GAP_FROM_FRAME;
  let y = frameBox.y;
  let columnWidth = 0;
  const bottomLimit = frameBox.y + frameBox.height;

  for (const item of screen.items) {
    const variant = variants.get(item.evento);
    if (!variant) {
      result.avisos.push(`Card ${item.numero}: variante do evento "${item.evento}" não encontrada na biblioteca.`);
      continue;
    }
    let card: InstanceNode;
    try {
      card = variant.createInstance();
    } catch (error) {
      result.avisos.push(`Card ${item.numero}: não foi possível criar (${errorMessage(error)}).`);
      continue;
    }
    card.name = `${item.numero}. ${item.evento} — ${item.componente}`;
    card.setPluginData(OUTPUT_SCREEN_KEY, frame.id);
    card.setPluginData(CARD_NODE_KEY, item.nodeId);
    card.setPluginData(CARD_NUMBER_KEY, String(item.numero));
    try {
      result.avisos.push(...(await fillCard(card, item.evento, item.values, item.numero, request.plataforma)).map((a) => `Card ${item.numero}: ${a}`));
    } catch (error) {
      result.avisos.push(`Card ${item.numero}: erro ao preencher (${errorMessage(error)}).`);
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
        created.push(createScreenMarker(frameBox, item.numero, item.evento));
      } else {
        const target = (await figma.getNodeByIdAsync(item.nodeId)) as SceneNode | null;
        const bounds = target && "absoluteBoundingBox" in target ? target.absoluteBoundingBox : null;
        if (!target || !bounds) {
          result.avisos.push(`Card ${item.numero}: o componente "${item.componente}" não existe mais — card criado sem marcador.`);
        } else {
          const marker = createComponentMarker(bounds, item.numero, item.evento, item.componente);
          marker.setPluginData(CARD_NODE_KEY, item.nodeId);
          created.push(marker);
        }
      }
    } catch (error) {
      result.avisos.push(`Card ${item.numero}: marcador não criado (${errorMessage(error)}).`);
    }
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

export async function generateCards(
  request: GenerationRequest,
  onProgress: (done: number, total: number) => void
): Promise<GenerationResult> {
  const result: GenerationResult = { screens: [], avisos: [] };
  const variants = await loadVariants();
  await figma.loadFontAsync(MARKER_FONT);

  onProgress(0, request.screens.length);
  for (let index = 0; index < request.screens.length; index++) {
    result.screens.push(await generateScreen(request.screens[index], request, variants));
    onProgress(index + 1, request.screens.length);
    await yieldToFigma();
  }
  return result;
}
