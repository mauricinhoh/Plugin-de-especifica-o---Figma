/// <reference types="@figma/plugin-typings" />

const IGNORED_COMPONENT_NAME = "Header Web";

/**
 * Percorre a árvore a partir do node da tela selecionada e retorna
 * TODOS os componentes/instances encontrados, em QUALQUER
 * profundidade — inclusive componentes aninhados dentro de outros
 * componentes/instances (ex.: "Breadcrumb" e "Header Product" dentro
 * de uma composição "Header Flow").
 *
 * ATENÇÃO — histórico: a versão anterior parava no primeiro
 * INSTANCE/COMPONENT encontrado e não descia mais (regra explícita de
 * uma tarefa anterior, para não gerar card para "nested components").
 * Essa regra foi revertida a pedido do usuário depois de testes reais
 * em produção: arquivos com composições feitas de vários componentes
 * nomeados (ex.: um "Header Flow" contendo "Breadcrumbs" e "Header
 * Product" como componentes próprios) faziam o plugin ignorar
 * componentes reais que precisavam de card. Se um componente A contém
 * um componente B, AMBOS agora geram card.
 *
 * "Header Web" continua ignorado por completo: não vira card, não
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
      // Não retorna mais aqui: continua descendo para encontrar
      // componentes aninhados dentro deste também.
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
