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
 *
 * Componentes/camadas OCULTOS no Figma (`node.visible === false`)
 * também são ignorados por completo, junto com toda a sua subárvore
 * — um componente escondido atrás de outro, ou uma variante alternada
 * por visibilidade, não deveria virar card nem marcação. Isso vale
 * tanto para o próprio componente quanto para qualquer ancestral: se
 * um grupo/frame estiver oculto, nada dentro dele é considerado,
 * mesmo que o node filho individualmente tenha `visible: true` (é
 * assim que a visibilidade efetiva funciona no Figma — a
 * visibilidade de um ancestral nunca é copiada para os filhos, então
 * o corte precisa acontecer na hora de decidir se desce ou não).
 */
export function discoverTopLevelComponents(root: SceneNode): (InstanceNode | ComponentNode)[] {
  const found: (InstanceNode | ComponentNode)[] = [];

  function walk(node: SceneNode): void {
    if ("visible" in node && !node.visible) {
      return; // oculto: ignora completamente, inclusive a subárvore
    }

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
