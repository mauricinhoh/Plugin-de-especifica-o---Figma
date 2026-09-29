/// <reference types="@figma/plugin-typings" />

import { PANEL_GAP_FROM_SCREEN, PANEL_NAME } from "./panel";

/**
 * Marcações e painel de uma especificação já gerada para uma tela.
 *
 * Os marcadores e o painel NÃO ficam dentro do frame: são filhos da
 * página, por cima/ao lado da tela (para não mexer na estrutura
 * original). Por isso a ligação com a tela é feita assim:
 *
 * 1. A partir desta versão, cada marcador e o painel guardam o ID da
 *    tela em pluginData (`SCREEN_ID_KEY`) — invisível e confiável.
 * 2. Para o que foi gerado ANTES (sem esse dado), o plugin reconhece:
 *    - marcadores: grupos "Marcação NN ..." por cima da área da tela;
 *    - painel: o bloco "Especificação de Acessibilidade" exatamente na
 *      posição em que é criado (colado à direita da tela). Se o painel
 *      já foi excluído ou movido, ele é simplesmente ignorado.
 */
const SCREEN_ID_KEY = "handoffScreenId";
const MARKER_NAME_PATTERN = /^Marcação \d+/;
const PANEL_POSITION_TOLERANCE = 1;

export function tagAsScreenOutput(node: SceneNode, screenId: string): void {
  node.setPluginData(SCREEN_ID_KEY, screenId);
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function findExistingMarkup(screen: SceneNode): { markers: SceneNode[]; panel: SceneNode | null } {
  const markers: SceneNode[] = [];
  let panel: SceneNode | null = null;
  const bounds = screen.absoluteBoundingBox;
  if (!bounds) return { markers, panel };

  for (const child of figma.currentPage.children) {
    if (child.id === screen.id) continue;
    const owner = child.getPluginData(SCREEN_ID_KEY);
    const isMarker = child.type === "GROUP" && MARKER_NAME_PATTERN.test(child.name);
    const isPanel = child.type === "FRAME" && child.name === PANEL_NAME;
    if (!isMarker && !isPanel) continue;

    if (owner) {
      // Gerado nesta versão: só conta se for desta tela.
      if (owner !== screen.id) continue;
      if (isMarker) markers.push(child);
      else if (!panel) panel = child;
      continue;
    }

    // Gerado antes desta versão: reconhece pela posição.
    const childBounds = child.absoluteBoundingBox;
    if (!childBounds) continue;
    if (isMarker && intersects(childBounds, bounds)) {
      markers.push(child);
    } else if (
      isPanel &&
      !panel &&
      Math.abs(childBounds.y - bounds.y) <= PANEL_POSITION_TOLERANCE &&
      Math.abs(childBounds.x - (bounds.x + bounds.width + PANEL_GAP_FROM_SCREEN)) <= PANEL_POSITION_TOLERANCE
    ) {
      panel = child;
    }
  }
  return { markers, panel };
}

export function countExistingMarkers(screen: SceneNode): number {
  return findExistingMarkup(screen).markers.length;
}

/** Exclui os marcadores e o painel (se ainda existir). Retorna só a quantidade de marcadores. */
export function deleteExistingMarkup(screen: SceneNode): number {
  const { markers, panel } = findExistingMarkup(screen);
  for (const marker of markers) {
    if (!marker.removed) marker.remove();
  }
  if (panel && !panel.removed) {
    panel.remove();
  }
  return markers.length;
}
