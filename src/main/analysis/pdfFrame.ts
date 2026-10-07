/// <reference types="@figma/plugin-typings" />

/**
 * PDF — NÃO é componente do Design System: é um FRAME montado à mão
 * pelo designer, com o nome COMEÇANDO por "PDF" (ex.: "PDF",
 * "PDF-Informe_Rendimento1"). É assim que o plugin sabe que é um PDF.
 * Quase tudo dentro dele é texto, então cada texto vira um card:
 *
 * - Título → "[Label], Título de nível". O NÚMERO do nível NÃO é
 *   automático: depende do contexto do PDF, e o PD completa
 *   manualmente no card. É título quando, ao mesmo tempo:
 *     • o texto está do LADO ESQUERDO do frame PDF (começa na metade
 *       esquerda da largura), e
 *     • é Bold com 14 px OU ExtraBold com 12 px (exatamente esses
 *       tamanhos).
 * - Qualquer outro texto → verbalizado com o próprio texto.
 *
 * Confirmado com o usuário em 07/10/2026.
 */

const PDF_FRAME_PREFIX = "pdf";

/** Frame (ou grupo/seção) cujo nome começa com "PDF" — sem diferenciar maiúsculas e espaços nas pontas. */
export function isPdfFrame(node: BaseNode): boolean {
  return (
    (node.type === "FRAME" || node.type === "GROUP" || node.type === "SECTION") &&
    node.name.trim().toLowerCase().startsWith(PDF_FRAME_PREFIX)
  );
}

/** Frame "PDF" mais próximo acima do node, ou null se não estiver dentro de um. */
export function findPdfFrame(node: SceneNode): SceneNode | null {
  let current: BaseNode | null = node.parent;
  while (current && current.type !== "PAGE" && current.type !== "DOCUMENT") {
    if (isPdfFrame(current)) return current as SceneNode;
    current = current.parent;
  }
  return null;
}

/** O node está dentro de um frame "PDF" (em qualquer nível acima dele)? */
export function isInsidePdfFrame(node: SceneNode): boolean {
  return findPdfFrame(node) !== null;
}

type Weight = "bold" | "extrabold" | "other";

/** "Bold", "Bold Italic" → bold; "ExtraBold", "Extra Bold" → extrabold; SemiBold, Black etc. → other. */
function weightOf(style: string): Weight {
  const compact = style.toLowerCase().replace(/[\s_-]+/g, "");
  if (compact.startsWith("extrabold")) return "extrabold";
  if (compact.startsWith("bold")) return "bold";
  return "other";
}

/** Bold com 14 px ou ExtraBold com 12 px. */
function isHeadingStyle(style: string, size: number): boolean {
  const weight = weightOf(style);
  return (weight === "bold" && size === 14) || (weight === "extrabold" && size === 12);
}

/** O texto começa na metade esquerda do frame PDF? */
function isOnLeftSide(node: TextNode, pdfFrame: SceneNode): boolean {
  const text = node.absoluteBoundingBox;
  const frame = pdfFrame.absoluteBoundingBox;
  if (!text || !frame) return false;
  return text.x < frame.x + frame.width / 2;
}

/**
 * Título dentro do PDF: lado esquerdo do frame + Bold 14 px ou
 * ExtraBold 12 px. Se o texto mistura estilos/tamanhos, TODOS os
 * trechos precisam se encaixar nessa regra; senão é texto.
 */
export function isPdfHeadingText(node: TextNode): boolean {
  const pdfFrame = findPdfFrame(node);
  if (!pdfFrame || !isOnLeftSide(node, pdfFrame)) return false;
  if (node.fontName !== figma.mixed && node.fontSize !== figma.mixed) {
    return isHeadingStyle(node.fontName.style, node.fontSize);
  }
  const segments = node.getStyledTextSegments(["fontName", "fontSize"]);
  return segments.length > 0 && segments.every((segment) => isHeadingStyle(segment.fontName.style, segment.fontSize));
}
