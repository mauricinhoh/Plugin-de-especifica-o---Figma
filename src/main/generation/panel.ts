/// <reference types="@figma/plugin-typings" />

import { SpecificationItem } from "../../shared/types";
import { DECORATIVE_MARKUP_TYPE, MARKUP_TYPES } from "../../rules/markupTypes";
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

/**
 * Badge circular numerado, no mesmo azul usado nas marcações do
 * canvas — é só um IDENTIFICADOR do card/marcação correspondente,
 * não representa a Ordem de leitura (essa é uma linha separada, ver
 * `createEntryRow`). Por isso todo item numerado aqui, inclusive
 * Decorativo, que não entra na Ordem de leitura.
 */
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

async function createEntryRow(
  item: SpecificationItem,
  index: number,
  isLast: boolean,
  readingOrderNumber: number | null,
  focusOrderNumber: number | null
): Promise<FrameNode> {
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

  // Ordem de leitura (Regra 2): número separado do badge de
  // identificação do card/marcação. O badge acima (canto do
  // cabeçalho) é só um identificador visual — não representa a ordem
  // de leitura. Itens Decorativo não recebem esse número (mas
  // continuam com card e marcação normalmente).
  if (readingOrderNumber !== null) {
    const readingOrderLine = createPlainText(`Ordem de leitura: ${readingOrderNumber}`, BODY_FONT, 12, TEXT_MUTED);
    appendSized(textColumn, readingOrderLine, { horizontal: "FILL" });
  }

  // Ordem de foco (Regra 3/4): número separado da ordem de leitura,
  // mostrado só quando o componente é elegível ("Foco: Sim" na
  // planilha). Estruturas e não-elegíveis simplesmente não mostram
  // essa linha — não escrevemos "Não aplicável" pra não poluir o
  // painel com uma linha vazia em quase metade dos componentes.
  if (focusOrderNumber !== null) {
    const focusLine = createPlainText(`Ordem de foco: ${focusOrderNumber}`, BODY_FONT, 12, BADGE_BLUE);
    appendSized(textColumn, focusLine, { horizontal: "FILL" });
  }

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
 * `readingOrderCount` conta só os itens ELEGÍVEIS à ordem de leitura
 * (todos, exceto Decorativo — Regra 2), calculado a partir de TODOS
 * os itens presentes na especificação no momento da geração —
 * automáticos e adicionados manualmente (ver code.ts).
 */
function createReadingOrderRow(readingOrderCount: number, hasMoreRows: boolean): FrameNode {
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

  const totalLabel = String(readingOrderCount).padStart(2, "0");
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
export async function generatePanel(screenNode: SceneNode, items: SpecificationItem[]): Promise<FrameNode> {
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

  // Ordem de leitura: numeração separada do badge de identificação,
  // sequencial só entre os itens elegíveis (tudo, exceto Decorativo —
  // Regra 2). Itens Decorativo continuam com card/marcação e badge
  // normalmente, só não entram nesta contagem/numeração.
  let nextReadingOrderNumber = 1;
  const readingOrderByItemId = new Map<string, number>();
  for (const item of ordered) {
    if (item.markupType !== DECORATIVE_MARKUP_TYPE) {
      readingOrderByItemId.set(item.id, nextReadingOrderNumber);
      nextReadingOrderNumber += 1;
    }
  }
  const readingOrderCount = readingOrderByItemId.size;

  const readingOrderRow = createReadingOrderRow(readingOrderCount, ordered.length > 0);
  appendSized(panel, readingOrderRow, { horizontal: "FILL", vertical: "HUG" });

  // Ordem de foco: numeração SEPARADA da ordem de leitura, sequencial
  // só entre os itens elegíveis (Regra 3/4), na mesma ordem relativa
  // da leitura — ex.: dentro de um Card com Heading/Description/
  // Button Primary, a leitura numera os 3, mas só o Button Primary
  // (elegível) recebe "Ordem de foco: 1".
  let nextFocusNumber = 1;
  const focusOrderByItemId = new Map<string, number>();
  for (const item of ordered) {
    if (item.focusEligible) {
      focusOrderByItemId.set(item.id, nextFocusNumber);
      nextFocusNumber += 1;
    }
  }

  for (let i = 0; i < ordered.length; i += 1) {
    const row = await createEntryRow(
      ordered[i],
      i,
      i === ordered.length - 1,
      readingOrderByItemId.get(ordered[i].id) ?? null,
      focusOrderByItemId.get(ordered[i].id) ?? null
    );
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
