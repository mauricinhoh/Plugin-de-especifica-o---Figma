/// <reference types="@figma/plugin-typings" />

/**
 * Camada fina sobre a Figma Plugin API.
 *
 * Cada função aqui usa apenas capacidades confirmadas nos typings
 * oficiais (@figma/plugin-typings) e na documentação pública da
 * Figma Plugin API. Nada aqui é inventado.
 *
 * Notas de confirmação técnica:
 * - `figma.currentUser.name`: propriedade real (User | null).
 * - `figma.currentPage.selection`: array real de SceneNode.
 * - `figma.on("selectionchange", cb)` / `figma.off(...)`: eventos reais
 *   do main thread.
 * - `InstanceNode.getMainComponentAsync()`: método real, recomendado
 *   no modo `documentAccess: "dynamic-page"` (usado neste manifest)
 *   em vez da propriedade síncrona `mainComponent`.
 * - `ComponentNode.remote`: propriedade real (boolean) que indica se
 *   o componente vem de uma biblioteca publicada.
 * - Não existe, nos typings públicos, uma API que devolva o "nome da
 *   biblioteca" (arquivo publicado) de um componente remoto. Por
 *   isso, a identificação Core Web/Core App usa o nome do componente
 *   principal e do seu component set/página como sinal — ver
 *   `analysis/coreIdentification.ts` para o comentário completo sobre
 *   essa limitação.
 * - Não existe metadado oficial de "detach history" na API. A
 *   detecção de possíveis componentes detachados é heurística e
 *   documentada em `analysis/detachDetector.ts`.
 */

export type SelectableNode = FrameNode | GroupNode;

/** Retorna o nome do usuário atual, ou string vazia se não disponível. */
export function getCurrentUserName(): string {
  return figma.currentUser?.name ?? "";
}

/** Nós de topo aceitos como "tela" para iniciar a análise. */
export function isValidScreenNode(node: SceneNode): node is SelectableNode {
  return node.type === "FRAME" || node.type === "GROUP";
}

/** Lê a seleção atual do usuário no canvas. */
export function getCurrentSelection(): readonly SceneNode[] {
  return figma.currentPage.selection;
}

/** Registra um listener de mudança de seleção. Retorna função de cleanup. */
export function onSelectionChange(callback: () => void): () => void {
  figma.on("selectionchange", callback);
  return () => figma.off("selectionchange", callback);
}

/** Busca um node pelo id, de forma assíncrona (compatível com dynamic-page). */
export async function getNodeByIdAsync(nodeId: string): Promise<BaseNode | null> {
  return figma.getNodeByIdAsync(nodeId);
}

const LAYER_COUNT_LIMIT = 5000;

/**
 * Conta recursivamente os descendentes de um node, cortando em
 * `LAYER_COUNT_LIMIT` por segurança (telas muito grandes não devem
 * travar a UI por causa de uma contagem meramente informativa).
 */
export function countDescendants(node: SceneNode): number {
  let count = 0;
  function walk(current: SceneNode): boolean {
    if ("children" in current) {
      for (const child of current.children) {
        count += 1;
        if (count >= LAYER_COUNT_LIMIT) return false;
        if (!walk(child)) return false;
      }
    }
    return true;
  }
  walk(node);
  return count;
}

/** Seleciona um node no canvas e centraliza a viewport nele. */
export async function focusNode(nodeId: string): Promise<boolean> {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node || !("x" in node)) {
    return false;
  }
  const sceneNode = node as SceneNode;
  figma.currentPage.selection = [sceneNode];
  figma.viewport.scrollAndZoomIntoView([sceneNode]);
  return true;
}

export function closePlugin(): void {
  figma.closePlugin();
}
