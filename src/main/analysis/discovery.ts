/// <reference types="@figma/plugin-typings" />

const IGNORED_COMPONENT_NAME = "Header Web";

/**
 * Percorre a árvore a partir do node da tela selecionada e retorna
 * somente os componentes/instances de NÍVEL MAIS ALTO (seção 6 do
 * briefing): assim que um INSTANCE ou COMPONENT é encontrado, não
 * descemos para os filhos dele (nested components não geram card
 * próprio).
 *
 * "Header Web" (seção 7) é ignorado por completo: não vira card, não
 * conta para Core Web/Core App, e sua subárvore também não é
 * percorrida.
 */
export function discoverTopLevelComponents(root: SceneNode): (InstanceNode | ComponentNode)[] {
  const found: (InstanceNode | ComponentNode)[] = [];

  function walk(node: SceneNode): void {
    if (node.name === IGNORED_COMPONENT_NAME) {
      return; // ignora completamente, inclusive a subárvore
    }

    if (node.type === "INSTANCE" || node.type === "COMPONENT") {
      found.push(node);
      return; // não desce para nested components
    }

    if ("children" in node) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  if ("children" in root) {
    for (const child of root.children) {
      walk(child);
    }
  }

  return found;
}
