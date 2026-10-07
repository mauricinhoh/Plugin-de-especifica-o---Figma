/// <reference types="@figma/plugin-typings" />

import { SpecificationItem } from "../../shared/types";
import { computeDisplayNumbers } from "../../shared/displayNumbers";

const MARKER_BLUE: RGB = { r: 0x33 / 255, g: 0x6c / 255, b: 0xff / 255 };
const MARKER_STROKE_WIDTH = 2;
const MARKER_PADDING = 6; // folga entre o contorno e o componente
const CIRCLE_DIAMETER = 24;

const MARKER_FONT: FontName = { family: "Inter", style: "Bold" };

/**
 * Cria a marcação (retângulo pontilhado + círculo numerado) para um
 * único item, como objetos reais e independentes do documento,
 * filhos da Page atual (seção 28: fora dos componentes, sem alterar
 * a estrutura original nem o Auto Layout).
 *
 * Fonte usada nos números: "Inter" (fonte padrão sempre disponível
 * no Figma), já que o requisito de fonte "Nunito" do briefing
 * (seção 33) se refere à interface do plugin, não a objetos gerados
 * no canvas de um arquivo cujas fontes locais podem variar.
 */
export async function createMarkerForItem(node: SceneNode, labelText: string): Promise<GroupNode> {
  const bounds = node.absoluteBoundingBox;
  if (!bounds) {
    throw new Error(`Não foi possível ler a posição do componente "${node.name}".`);
  }

  const outline = figma.createRectangle();
  outline.name = `Marcação ${labelText} - contorno`;
  outline.x = bounds.x - MARKER_PADDING;
  outline.y = bounds.y - MARKER_PADDING;
  outline.resize(bounds.width + MARKER_PADDING * 2, bounds.height + MARKER_PADDING * 2);
  outline.fills = [];
  outline.strokes = [{ type: "SOLID", color: MARKER_BLUE }];
  outline.strokeWeight = MARKER_STROKE_WIDTH;
  outline.dashPattern = [4, 4];
  outline.cornerRadius = 4;

  const circle = figma.createEllipse();
  circle.name = `Marcação ${labelText} - círculo`;
  // Subnúmero (ex.: "02.1", só na prévia) precisa de um círculo mais largo.
  const circleWidth = labelText.length > 2 ? CIRCLE_DIAMETER + 8 * (labelText.length - 2) : CIRCLE_DIAMETER;
  circle.resize(circleWidth, CIRCLE_DIAMETER);
  circle.x = bounds.x - MARKER_PADDING - CIRCLE_DIAMETER / 2;
  circle.y = bounds.y - MARKER_PADDING - CIRCLE_DIAMETER / 2;
  circle.fills = [{ type: "SOLID", color: MARKER_BLUE }];
  circle.strokes = [];

  await figma.loadFontAsync(MARKER_FONT);
  const label = figma.createText();
  label.fontName = MARKER_FONT;
  label.characters = labelText;
  label.fontSize = 12;
  label.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  label.textAlignHorizontal = "CENTER";
  label.textAlignVertical = "CENTER";
  // Nós de texto novos nascem com textAutoResize = "WIDTH_AND_HEIGHT"
  // (auto-size nas duas direções). resize() lança erro em runtime a
  // menos que textAutoResize seja "NONE" antes de chamar resize().
  label.textAutoResize = "NONE";
  label.resize(circleWidth, CIRCLE_DIAMETER);
  label.x = circle.x;
  label.y = circle.y;

  const group = figma.group([outline, circle, label], figma.currentPage);
  group.name = `Marcação ${labelText} - ${node.name}`;
  return group;
}


/**
 * Gera as marcações para todos os itens da especificação, na ordem
 * final definida pelo designer. Itens cujo node original não existe
 * mais no arquivo são reportados como erro (seção 38) e pulados, sem
 * quebrar a geração dos demais.
 */
export async function generateMarkers(
  items: SpecificationItem[],
  onProgress?: (done: number, total: number) => void
): Promise<{ createdGroups: GroupNode[]; missingNodeErrors: string[] }> {
  const createdGroups: GroupNode[] = [];
  const missingNodeErrors: string[] = [];

  const ordered = [...items].sort((a, b) => a.order - b.order);
  const numbers = computeDisplayNumbers(ordered);
  const total = ordered.length;
  onProgress?.(0, total);

  for (let i = 0; i < ordered.length; i += 1) {
    const item = ordered[i];
    const number = numbers.get(item.id);
    // Itens dentro de Card não ganham marcador no frame (só o Card).
    if (number?.isSubItem) {
      onProgress?.(i + 1, total);
      continue;
    }
    const node = await figma.getNodeByIdAsync(item.nodeId);
    if (!node || !("absoluteBoundingBox" in node)) {
      missingNodeErrors.push(item.nodeName);
      onProgress?.(i + 1, total);
      continue;
    }
    const group = await createMarkerForItem(node as SceneNode, number?.label ?? String(i + 1).padStart(2, "0"));
    createdGroups.push(group);
    onProgress?.(i + 1, total);
  }

  return { createdGroups, missingNodeErrors };
}
