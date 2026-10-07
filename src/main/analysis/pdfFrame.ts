/// <reference types="@figma/plugin-typings" />

/**
 * PDF — NÃO é componente do Design System: é um FRAME montado à mão
 * pelo designer, com o nome "PDF". É assim que o plugin sabe que é um
 * PDF. Quase tudo dentro dele é texto, então cada texto vira um card:
 *
 * - Texto em Bold ou ExtraBold → título: "[Label], Título de nível".
 *   O NÚMERO do nível NÃO é automático: depende do contexto do PDF, e
 *   o PD completa manualmente no card. Dentro do PDF o tamanho da
 *   fonte NÃO é usado (diferente do título solto na tela).
 * - Qualquer outro texto → verbalizado com o próprio texto.
 *
 * Confirmado com o usuário em 07/10/2026.
 */

const PDF_FRAME_NAME = "pdf";

/** Frame (ou grupo/seção) com o nome "PDF" — sem diferenciar maiúsculas e espaços nas pontas. */
export function isPdfFrame(node: BaseNode): boolean {
  return (
    (node.type === "FRAME" || node.type === "GROUP" || node.type === "SECTION") &&
    node.name.trim().toLowerCase() === PDF_FRAME_NAME
  );
}

/** O node está dentro de um frame "PDF" (em qualquer nível acima dele)? */
export function isInsidePdfFrame(node: SceneNode): boolean {
  let current: BaseNode | null = node.parent;
  while (current && current.type !== "PAGE" && current.type !== "DOCUMENT") {
    if (isPdfFrame(current)) return true;
    current = current.parent;
  }
  return false;
}

/**
 * Estilo da fonte é Bold ou ExtraBold (ex.: "Bold", "Bold Italic",
 * "ExtraBold", "Extra Bold"). SemiBold, Black etc. NÃO contam.
 */
function isBoldStyle(style: string): boolean {
  const compact = style.toLowerCase().replace(/[\s_-]+/g, "");
  return compact.startsWith("bold") || compact.startsWith("extrabold");
}

/**
 * Título dentro do PDF = texto inteiro em Bold/ExtraBold. Se o texto
 * mistura pesos (ex.: uma palavra em negrito no meio de um parágrafo),
 * NÃO é título — é texto.
 */
export function isPdfHeadingText(node: TextNode): boolean {
  if (node.fontName !== figma.mixed) {
    return isBoldStyle(node.fontName.style);
  }
  const segments = node.getStyledTextSegments(["fontName"]);
  return segments.length > 0 && segments.every((segment) => isBoldStyle(segment.fontName.style));
}
