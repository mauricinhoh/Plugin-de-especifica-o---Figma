/// <reference types="@figma/plugin-typings" />

/**
 * Ordena nodes pela posição real no canvas, em vez da ordem das
 * camadas no arquivo (pedido do usuário depois de testes reais:
 * "hoje tem designer que tem o arquivo bagunçado em camadas, então
 * precisamos considerar o componente em tela e não pelas camadas
 * para formar a ordem").
 *
 * Comportamento pedido: linhas de cima para baixo; dentro de cada
 * linha, da esquerda para a direita (não é um "Z" desenhado
 * literalmente — é a leitura padrão de texto em grade/coluna).
 *
 * Algoritmo: agrupa os nodes em linhas comparando o CENTRO vertical
 * de cada item com a MÉDIA dos centros já agrupados na linha atual
 * (não com a extensão [topo, base] da linha, que cresce a cada item
 * novo). Comparar com uma extensão que só aumenta é o que causava o
 * bug relatado: uma linha "esticava" verticalmente a cada item
 * adicionado e acabava absorvendo itens que visualmente já
 * pertenciam à próxima linha. Comparar com a média do centro evita
 * esse acúmulo de erro.
 *
 * LIMITAÇÃO CONHECIDA (inerente a qualquer heurística espacial, não
 * apenas desta): layouts muito irregulares — elementos sobrepostos de
 * propósito, cards em posições diagonais, colunas com alturas muito
 * diferentes — podem não produzir a ordem exata que um humano
 * escolheria. Não existe uma forma 100% confiável de inferir ordem de
 * leitura só a partir de coordenadas; esta é a abordagem mais robusta
 * sem inventar regras específicas de layout.
 */

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getBounds(node: SceneNode): Bounds | null {
  const box = node.absoluteBoundingBox;
  if (!box) return null;
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}

interface Entry<T> {
  node: T;
  bounds: Bounds;
  centerY: number;
}

interface Row<T> {
  items: Entry<T>[];
  /** Média corrente dos centros verticais dos itens já agrupados nesta linha. */
  averageCenterY: number;
}

/**
 * Distância máxima (em px) entre o centro vertical de um item e a
 * média da linha atual para ainda considerá-lo "na mesma linha".
 * Usa uma fração da altura dos itens envolvidos — assim se adapta a
 * componentes pequenos (textos, ícones) e grandes (cards) sem um
 * número fixo arbitrário.
 */
function rowThresholdFor(a: Bounds, b: Bounds): number {
  return Math.min(a.height, b.height) * 0.6;
}

export function sortByReadingOrder<T extends SceneNode>(nodes: T[]): T[] {
  const withBounds: Entry<T>[] = [];
  const withoutBounds: T[] = [];

  for (const node of nodes) {
    const bounds = getBounds(node);
    if (bounds) {
      withBounds.push({ node, bounds, centerY: bounds.y + bounds.height / 2 });
    } else {
      // Nodes sem absoluteBoundingBox (raro) vão para o final, na
      // ordem em que já estavam, em vez de quebrar a ordenação dos
      // demais.
      withoutBounds.push(node);
    }
  }

  // Ordena inicialmente por centro vertical, critério de desempate
  // por x — dá uma base estável para o agrupamento em linhas abaixo.
  withBounds.sort((a, b) => a.centerY - b.centerY || a.bounds.x - b.bounds.x);

  const rows: Row<T>[] = [];

  for (const entry of withBounds) {
    const lastRow = rows[rows.length - 1];
    const lastItem = lastRow?.items[lastRow.items.length - 1];
    const threshold = lastItem ? rowThresholdFor(lastItem.bounds, entry.bounds) : 0;

    if (lastRow && Math.abs(entry.centerY - lastRow.averageCenterY) <= threshold) {
      lastRow.items.push(entry);
      const sum = lastRow.items.reduce((acc, item) => acc + item.centerY, 0);
      lastRow.averageCenterY = sum / lastRow.items.length;
    } else {
      rows.push({ items: [entry], averageCenterY: entry.centerY });
    }
  }

  const ordered: T[] = [];
  for (const row of rows) {
    row.items.sort((a, b) => a.bounds.x - b.bounds.x);
    ordered.push(...row.items.map((e) => e.node));
  }

  return [...ordered, ...withoutBounds];
}
