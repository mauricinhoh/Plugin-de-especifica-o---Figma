/// <reference types="@figma/plugin-typings" />

/**
 * Nomes de componentes/instâncias sempre ignorados pela descoberta
 * automática: não viram card, não contam para Core Web/Core App, e
 * sua subárvore inteira também não é percorrida (pode haver
 * componentes reais aninhados neles, mas essas camadas são
 * consideradas "chrome" fixo da tela, não conteúdo a especificar).
 *
 * Para adicionar/remover um nome desta lista, edite só este array —
 * nenhuma outra parte do código precisa mudar.
 */
const IGNORED_COMPONENT_NAMES = [
  "Header Web",
  "[IB-Leg] Acessibility Settings Bar",
  "[IB-Leg] Header",
  "[IB-Leg] Navigation Bar",
  "[IB-Leg] Footer"
];

/**
 * Decide, para um componente/instância reconhecido pela descoberta,
 * se ele é reconhecido (tem regra) e se a busca deve continuar
 * descendo dentro dele mesmo assim (ver `ComponentTypeRule.alwaysDescend`
 * em accessibility-rules.ts — casos como "Header Product", que sempre
 * têm outros componentes reais dentro). Fornecida por quem chama
 * (analyzer.ts), para discovery.ts continuar sem depender do motor de
 * regras diretamente. Assíncrona porque resolver o nome do componente
 * principal de uma INSTANCE exige `getMainComponentAsync`.
 */
export type ComponentClassifier = (
  node: InstanceNode | ComponentNode
) => Promise<{ recognized: boolean; alwaysDescend: boolean }>;

/**
 * Percorre a árvore a partir do node da tela selecionada e decide,
 * componente por componente, se aprofunda ou não:
 *
 * - Componente RECONHECIDO (tem regra na planilha) → vira card. Por
 *   padrão a busca NÃO desce para dentro dele — a menos que a regra
 *   marque `alwaysDescend: true` (ex.: "Header Product"), caso em que
 *   o card É criado E a busca continua procurando mais componentes
 *   reconhecidos lá dentro.
 * - Componente NÃO reconhecido → NÃO vira card sozinho, mas a busca
 *   continua descendo dentro dele — pode haver componentes reais lá
 *   dentro (ex.: um "Header Flow" que é só uma composição do arquivo,
 *   sem regra própria, mas contém um "Breadcrumb" e um "Header
 *   Product" que são reconhecidos e geram card cada um).
 *
 * "Header Web" e os demais nomes de `IGNORED_COMPONENT_NAMES`
 * continuam ignorados por completo: não viram card, não contam para
 * Core Web/Core App, e sua subárvore também não é percorrida.
 *
 * Componentes/camadas OCULTOS no Figma (`node.visible === false`)
 * também são ignorados por completo, junto com toda a sua subárvore
 * — a visibilidade de um ancestral nunca é copiada para os filhos no
 * Figma, então o corte precisa acontecer na hora de decidir se desce.
 */
export async function discoverTopLevelComponents(
  root: SceneNode,
  classify: ComponentClassifier
): Promise<(InstanceNode | ComponentNode)[]> {
  const found: (InstanceNode | ComponentNode)[] = [];

  async function walk(node: SceneNode): Promise<void> {
    if ("visible" in node && !node.visible) {
      return; // oculto: ignora completamente, inclusive a subárvore
    }

    if (IGNORED_COMPONENT_NAMES.includes(node.name)) {
      return; // ignora completamente, inclusive a subárvore
    }

    if (node.type === "INSTANCE" || node.type === "COMPONENT") {
      const { recognized, alwaysDescend } = await classify(node);
      if (recognized) {
        found.push(node);
        if (!alwaysDescend) {
          return; // reconhecido e comportamento padrão: para aqui
        }
        // reconhecido, mas marcado para sempre aprofundar: cria o
        // card acima E continua a busca dentro dele também.
      }
      // não reconhecido: não vira card sozinho, mas continua a busca
      // dentro dele (pode haver componentes reais lá dentro).
    }

    if ("children" in node) {
      for (const child of node.children) {
        await walk(child);
      }
    }
  }

  if ("children" in root) {
    for (const child of root.children) {
      await walk(child);
    }
  }

  return found;
}
