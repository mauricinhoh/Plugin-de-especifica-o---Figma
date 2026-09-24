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
 * Decide, para um componente/instância/texto reconhecido pela
 * descoberta, se ele é reconhecido (tem regra, ou — no caso de um
 * TEXT solto — se o tamanho da fonte bate com um nível de título) e
 * se a busca deve continuar descendo dentro dele mesmo assim (ver
 * `ComponentTypeRule.alwaysDescend` em accessibility-rules.ts — casos
 * como "Header Product", que sempre têm outros componentes reais
 * dentro). Fornecida por quem chama (analyzer.ts), para discovery.ts
 * continuar sem depender do motor de regras diretamente. Assíncrona
 * porque resolver o nome do componente principal de uma INSTANCE
 * exige `getMainComponentAsync`.
 */
export type ComponentClassifier = (
  node: InstanceNode | ComponentNode | TextNode
) => Promise<{ recognized: boolean; alwaysDescend: boolean; childrenOnly?: boolean; cardPerItem?: boolean }>;

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
 * - Node TEXT solto (não dentro de nenhum componente já reconhecido)
 *   → também passa por `classify`: se o tamanho da fonte bater com um
 *   nível de título (ver main/analysis/headingDetection.ts), vira
 *   card como se fosse um "Heading" — pedido do usuário depois de
 *   notar que títulos soltos na tela (sem usar o componente Heading
 *   de verdade) estavam sendo ignorados. Só roda FORA de qualquer
 *   componente já reconhecido (ver `insideRecognizedContainer` no
 *   corpo da função) — dentro de um container estruturado (Empty
 *   State, Card, Modal...) o texto já é capturado pela extração
 *   própria daquele componente, então classificar de novo por tamanho
 *   duplicaria ou confundiria o resultado. TEXT nunca tem
 *   `alwaysDescend` relevante (não tem filhos).
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
/**
 * Itens de um contêiner "cardPerItem" (ex.: os chips de um Chip
 * Filter): as instâncias visíveis mais próximas dentro dele, passando
 * por frames/grupos de layout intermediários. Não desce dentro de um
 * item já encontrado (o texto dele é extraído depois, pela regra).
 */
function collectItems(node: SceneNode): (InstanceNode | ComponentNode)[] {
  const items: (InstanceNode | ComponentNode)[] = [];
  if (!("children" in node)) return items;
  for (const child of node.children) {
    if ("visible" in child && !child.visible) continue;
    if (child.type === "INSTANCE" || child.type === "COMPONENT") {
      items.push(child);
    } else if ("children" in child) {
      items.push(...collectItems(child));
    }
  }
  return items;
}

/**
 * `inheritedParents` (opcional, saída): para cada item gerado por um
 * contêiner "cardPerItem", guarda item.id → contêiner, para que o
 * analyzer aplique a regra do contêiner ao item.
 */
export async function discoverTopLevelComponents(
  root: SceneNode,
  classify: ComponentClassifier,
  inheritedParents?: Map<string, InstanceNode | ComponentNode>
): Promise<(InstanceNode | ComponentNode | TextNode)[]> {
  const found: (InstanceNode | ComponentNode | TextNode)[] = [];

  async function walk(node: SceneNode, insideRecognizedContainer: boolean): Promise<void> {
    if ("visible" in node && !node.visible) {
      return; // oculto: ignora completamente, inclusive a subárvore
    }

    if (IGNORED_COMPONENT_NAMES.includes(node.name)) {
      return; // ignora completamente, inclusive a subárvore
    }

    // TEXT solto só é classificado (por tamanho de título) quando NÃO
    // está dentro de um componente já reconhecido. Componentes
    // estruturados (Empty State, Card, Modal, Drawer...) têm a PRÓPRIA
    // extração de texto (ex.: "primeiro e segundo texto" do Empty
    // State) — deixar o detector genérico de título rodar também
    // dentro deles duplicaria/confundiria título e descrição com o
    // texto que o próprio card do container já captura. Só se aplica
    // dentro de composições SEM regra própria (ex.: "Header Flow"),
    // onde não existe outra extração cuidando desse texto.
    const shouldClassify =
      node.type === "INSTANCE" || node.type === "COMPONENT" || (node.type === "TEXT" && !insideRecognizedContainer);

    let nextInsideRecognizedContainer = insideRecognizedContainer;

    if (shouldClassify) {
      const { recognized, alwaysDescend, childrenOnly, cardPerItem } = await classify(
        node as InstanceNode | ComponentNode | TextNode
      );
      if (recognized && cardPerItem && (node.type === "INSTANCE" || node.type === "COMPONENT")) {
        // Contêiner de itens iguais (ex.: Chip Filter): cada item de
        // dentro vira card com a regra do contêiner. Se não achar
        // nenhum item, cai no card único do contêiner (nada se perde).
        const items = collectItems(node);
        if (items.length === 0) {
          found.push(node);
        } else {
          for (const item of items) {
            found.push(item);
            inheritedParents?.set(item.id, node);
          }
        }
        return;
      }
      if (recognized && childrenOnly) {
        // Reconhecido, mas SEM card próprio (ex.: Button Group): só
        // desce, e cada componente reconhecido lá dentro vira seu card.
        nextInsideRecognizedContainer = true;
      } else if (recognized) {
        found.push(node as InstanceNode | ComponentNode | TextNode);
        if (!alwaysDescend) {
          return; // reconhecido e comportamento padrão: para aqui
        }
        // reconhecido, mas marcado para sempre aprofundar: cria o
        // card acima E continua a busca dentro dele também — a partir
        // daqui, TEXT solto encontrado já está "dentro" desse
        // container reconhecido.
        nextInsideRecognizedContainer = true;
      }
      // não reconhecido: não vira card sozinho, mas continua a busca
      // dentro dele (pode haver componentes reais lá dentro — não se
      // aplica a TEXT, que não tem filhos).
    }

    if ("children" in node) {
      for (const child of node.children) {
        await walk(child, nextInsideRecognizedContainer);
      }
    }
  }

  if ("children" in root) {
    for (const child of root.children) {
      await walk(child, false);
    }
  }

  return found;
}
