/// <reference types="@figma/plugin-typings" />

/** Utilidades do main thread do tagueamento (cópias próprias, sem compartilhar com a acessibilidade). */

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Devolve o controle ao Figma entre etapas longas, para o arquivo não travar (spec 10). */
export function yieldToFigma(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Página onde o node está. */
export function pageOf(node: BaseNode): PageNode | null {
  let current: BaseNode | null = node;
  while (current && current.type !== "PAGE") current = current.parent;
  return current as PageNode | null;
}

/** Garante que a página do node está aberta (o PD pode ter trocado de página no meio do fluxo). */
export async function ensurePageOf(node: BaseNode): Promise<void> {
  const page = pageOf(node);
  if (page && page.id !== figma.currentPage.id) await figma.setCurrentPageAsync(page);
}
