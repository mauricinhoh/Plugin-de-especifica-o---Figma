/// <reference types="@figma/plugin-typings" />

import { SpecificationItem } from "../../shared/types";
import { MARKUP_TYPES } from "../../rules/markupTypes";
import { UNSPECIFIED_TYPE_LABEL } from "../../rules/engine";

const PANEL_WIDTH = 440;
const PANEL_GAP_FROM_SCREEN = 80;

// Paleta escura, inspirada na referência ("Legendas"): fundo quase
// preto com leve matiz, badge numerado em azul, título branco e
// texto secundário em cinza claro.
const PANEL_BG: RGB = { r: 0x18 / 255, g: 0x1b / 255, b: 0x18 / 255 };
const BADGE_BLUE: RGB = { r: 0x33 / 255, g: 0x6c / 255, b: 0xff / 255 };
const TEXT_WHITE: RGB = { r: 1, g: 1, b: 1 };
const TEXT_MUTED: RGB = { r: 0xa9 / 255, g: 0xaf / 255, b: 0xaa / 255 };
const DIVIDER_COLOR: RGB = { r: 1, g: 1, b: 1 };
const DIVIDER_OPACITY = 0.1;

const BADGE_DIAMETER = 40;

const TITLE_FONT: FontName = { family: "Inter", style: "Bold" };
const ENTRY_TITLE_FONT: FontName = { family: "Inter", style: "Bold" };
const LABEL_FONT: FontName = { family: "Inter", style: "Bold" };
const BODY_FONT: FontName = { family: "Inter", style: "Regular" };

function typeLabelFor(markupType: string): string {
  const type = MARKUP_TYPES.find((t) => t.key === markupType);
  return type?.label ?? UNSPECIFIED_TYPE_LABEL;
}

async function loadFonts(): Promise<void> {
  await Promise.all([
    figma.loadFontAsync(TITLE_FONT),
    figma.loadFontAsync(ENTRY_TITLE_FONT),
    figma.loadFontAsync(LABEL_FONT),
    figma.loadFontAsync(BODY_FONT)
  ]);
}

/**
 * IMPORTANTE: `layoutSizingHorizontal`/`layoutSizingVertical` só podem
 * ser setados em um node que JÁ é filho de um frame com Auto Layout —
 * setar antes de anexar lança erro em tempo de execução na Figma API.
 * Por isso todo helper abaixo primeiro faz `parent.appendChild(child)`
 * e só depois aplica o sizing. Nós de texto, além disso, precisam de
 * `textAutoResize = "HEIGHT"` antes de aceitar `layoutSizingHorizontal
 * = "FILL"`.
 */
function appendSized(
  parent: FrameNode,
  child: SceneNode,
  sizing: { horizontal?: "FILL" | "HUG" | "FIXED"; vertical?: "FILL" | "HUG" | "FIXED" }
): void {
  parent.appendChild(child);

  if (child.type === "TEXT" && sizing.horizontal) {
    child.textAutoResize = "HEIGHT";
  }

  if (sizing.horizontal && "layoutSizingHorizontal" in child) {
    (child as TextNode | FrameNode | RectangleNode).layoutSizingHorizontal = sizing.horizontal;
  }
  if (sizing.vertical && child.type !== "TEXT" && "layoutSizingVertical" in child) {
    (child as FrameNode | RectangleNode).layoutSizingVertical = sizing.vertical;
  }
}

function createPlainText(characters: string, font: FontName, size: number, color: RGB): TextNode {
  const text = figma.createText();
  text.fontName = font;
  text.characters = characters;
  text.fontSize = size;
  text.fills = [{ type: "SOLID", color }];
  return text;
}

/** Badge circular numerado, no mesmo azul usado nas marcações do canvas (seção 27). */
async function createBadge(index: number): Promise<FrameNode> {
  const badge = figma.createFrame();
  badge.name = "Badge";
  badge.layoutMode = "VERTICAL";
  badge.primaryAxisAlignItems = "CENTER";
  badge.counterAxisAlignItems = "CENTER";
  badge.primaryAxisSizingMode = "FIXED";
  badge.counterAxisSizingMode = "FIXED";
  badge.resize(BADGE_DIAMETER, BADGE_DIAMETER);
  badge.cornerRadius = BADGE_DIAMETER / 2;
  badge.fills = [{ type: "SOLID", color: BADGE_BLUE }];

  const label = createPlainText(String(index + 1).padStart(2, "0"), LABEL_FONT, 13, TEXT_WHITE);
  badge.appendChild(label);

  return badge;
}

function createDividerRect(): RectangleNode {
  const rect = figma.createRectangle();
  rect.resize(1, 1);
  rect.fills = [{ type: "SOLID", color: DIVIDER_COLOR }];
  rect.opacity = DIVIDER_OPACITY;
  return rect;
}

async function createEntryRow(item: SpecificationItem, index: number, isLast: boolean): Promise<FrameNode> {
  const row = figma.createFrame();
  row.name = `Especificação ${String(index + 1).padStart(2, "0")}`;
  row.layoutMode = "VERTICAL";
  row.itemSpacing = 20;
  row.paddingTop = 24;
  row.paddingBottom = isLast ? 24 : 0;
  row.paddingLeft = 0;
  row.paddingRight = 0;
  row.fills = [];
  row.primaryAxisSizingMode = "AUTO";
  row.counterAxisSizingMode = "FIXED";

  // Linha superior: badge + coluna de texto, lado a lado.
  const header = figma.createFrame();
  header.name = "Cabeçalho";
  header.layoutMode = "HORIZONTAL";
  header.itemSpacing = 16;
  header.counterAxisAlignItems = "CENTER";
  header.fills = [];
  header.primaryAxisSizingMode = "AUTO";
  header.counterAxisSizingMode = "AUTO";

  const badge = await createBadge(index);
  header.appendChild(badge);
  badge.layoutSizingHorizontal = "FIXED";
  badge.layoutSizingVertical = "FIXED";

  const textColumn = figma.createFrame();
  textColumn.name = "Textos";
  textColumn.layoutMode = "VERTICAL";
  textColumn.itemSpacing = 6;
  textColumn.fills = [];
  textColumn.primaryAxisSizingMode = "AUTO";
  textColumn.counterAxisSizingMode = "FIXED";

  header.appendChild(textColumn);
  textColumn.layoutSizingHorizontal = "FILL";
  textColumn.layoutSizingVertical = "HUG";

  const title = createPlainText(item.nodeName, ENTRY_TITLE_FONT, 15, TEXT_WHITE);
  appendSized(textColumn, title, { horizontal: "FILL" });

  const typeLine = createPlainText(typeLabelFor(item.markupType), BODY_FONT, 12, TEXT_MUTED);
  appendSized(textColumn, typeLine, { horizontal: "FILL" });

  appendSized(row, header, { horizontal: "FILL", vertical: "HUG" });

  // Verbalização esperada, abaixo do cabeçalho.
  const verbalizationLabel = createPlainText("Verbalização esperada:", LABEL_FONT, 12, TEXT_MUTED);
  appendSized(row, verbalizationLabel, { horizontal: "FILL" });

  const verbalizationText = createPlainText(
    item.verbalization.length > 0 ? item.verbalization : "—",
    BODY_FONT,
    13,
    TEXT_MUTED
  );
  appendSized(row, verbalizationText, { horizontal: "FILL" });

  if (!isLast) {
    const divider = createDividerRect();
    appendSized(row, divider, { horizontal: "FILL", vertical: "FIXED" });
  }

  return row;
}

/**
 * Card especial "01 a XX - Ordem de leitura" (seção 3-4 e 19 do
 * briefing de Handoff). Sempre o primeiro do painel. NÃO consome um
 * número de componente — é só uma linha de texto, sem o badge
 * numerado usado pelos cards de componente.
 *
 * `totalComponentCount` é calculado por quem chama esta função a
 * partir de TODOS os itens presentes na especificação no momento da
 * geração — automáticos e adicionados manualmente (ver code.ts). Uma
 * versão anterior considerava só os componentes da análise
 * automática; mudado a pedido do usuário após um caso real em que o
 * total ficava desatualizado assim que ele adicionava itens manuais.
 */
function createReadingOrderRow(totalComponentCount: number, hasMoreRows: boolean): FrameNode {
  const row = figma.createFrame();
  row.name = "Ordem de leitura";
  row.layoutMode = "VERTICAL";
  row.itemSpacing = 16;
  row.paddingTop = 0;
  row.paddingBottom = 20;
  row.paddingLeft = 0;
  row.paddingRight = 0;
  row.fills = [];
  row.primaryAxisSizingMode = "AUTO";
  row.counterAxisSizingMode = "FIXED";

  const totalLabel = String(totalComponentCount).padStart(2, "0");
  const text = createPlainText(`01 a ${totalLabel} - Ordem de leitura`, ENTRY_TITLE_FONT, 15, TEXT_WHITE);
  appendSized(row, text, { horizontal: "FILL" });

  if (hasMoreRows) {
    const divider = createDividerRect();
    appendSized(row, divider, { horizontal: "FILL", vertical: "FIXED" });
  }

  return row;
}

/**
 * Cria o painel único de especificações no canvas (seção 29-30 do
 * briefing original de acessibilidade; seção 19 do briefing de
 * Handoff), posicionado ao lado da tela analisada. Usa Auto Layout
 * para que o painel se ajuste ao conteúdo, mas é um objeto real e
 * independente — não fica "grudado" (tracking) à tela depois de
 * criado, conforme exigido. Paleta e espaçamento seguem a referência
 * "Legendas" fornecida.
 */
export async function generatePanel(
  screenNode: SceneNode,
  items: SpecificationItem[],
  totalComponentCount: number
): Promise<FrameNode> {
  await loadFonts();

  const ordered = [...items].sort((a, b) => a.order - b.order);

  const panel = figma.createFrame();
  panel.name = "Especificação de Acessibilidade";
  panel.layoutMode = "VERTICAL";
  panel.itemSpacing = 0;
  panel.paddingTop = 32;
  panel.paddingBottom = 8;
  panel.paddingLeft = 32;
  panel.paddingRight = 32;
  panel.primaryAxisSizingMode = "AUTO";
  panel.counterAxisSizingMode = "FIXED";
  panel.resize(PANEL_WIDTH, panel.height);
  panel.fills = [{ type: "SOLID", color: PANEL_BG }];
  panel.cornerRadius = 12;

  const title = createPlainText("ESPECIFICAÇÃO DE ACESSIBILIDADE", TITLE_FONT, 16, TEXT_WHITE);
  appendSized(panel, title, { horizontal: "FILL" });

  const titleSpacer = figma.createFrame();
  titleSpacer.name = "Espaço";
  titleSpacer.fills = [];
  titleSpacer.resize(1, 16);
  appendSized(panel, titleSpacer, { horizontal: "FILL", vertical: "FIXED" });

  const readingOrderRow = createReadingOrderRow(totalComponentCount, ordered.length > 0);
  appendSized(panel, readingOrderRow, { horizontal: "FILL", vertical: "HUG" });

  for (let i = 0; i < ordered.length; i += 1) {
    const row = await createEntryRow(ordered[i], i, i === ordered.length - 1);
    appendSized(panel, row, { horizontal: "FILL", vertical: "HUG" });
  }

  const bounds = screenNode.absoluteBoundingBox;
  if (bounds) {
    panel.x = bounds.x + bounds.width + PANEL_GAP_FROM_SCREEN;
    panel.y = bounds.y;
  }

  figma.currentPage.appendChild(panel);
  return panel;
}
