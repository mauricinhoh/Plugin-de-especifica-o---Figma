/// <reference types="@figma/plugin-typings" />

/**
 * Ordena nodes pela posição real no canvas, em vez da ordem das
 * camadas no arquivo (seção pedida pelo usuário depois de testes
 * reais: "hoje tem designer que tem o arquivo bagunçado em camadas,
 * então precisamos considerar o componente em tela e não pelas
 * camadas para formar a ordem").
 *
 * Algoritmo: agrupa os nodes em "linhas" (componentes cujo retângulo
 * vertical se sobrepõe significativamente ficam na mesma linha) e,
 * dentro de cada linha, ordena da esquerda para a direita. As linhas
 * são ordenadas de cima para baixo. Isso reproduz a leitura em "Z"
 * pedida, e é a heurística padrão para inferir ordem de leitura a
 * partir de posição espacial em layouts organizados em grade/coluna.
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

/**
 * Duas linhas verticais [aTop, aBottom] e [bTop, bBottom] são
 * consideradas "a mesma linha de leitura" quando a sobreposição entre
 * elas é maior que metade da altura do menor dos dois elementos —
 * evita que uma pequena diferença de alinhamento vertical (comum em
 * componentes de tamanhos diferentes numa mesma linha) crie linhas
 * separadas indevidamente.
 */
function verticallyOverlaps(a: Bounds, b: Bounds): boolean {
  const aTop = a.y;
  const aBottom = a.y + a.height;
  const bTop = b.y;
  const bBottom = b.y + b.height;
  const overlap = Math.min(aBottom, bBottom) - Math.max(aTop, bTop);
  const smallerHeight = Math.min(a.height, b.height);
  if (smallerHeight <= 0) return false;
  return overlap > smallerHeight * 0.5;
}

export function sortByReadingOrder<T extends SceneNode>(nodes: T[]): T[] {
  const withBounds = nodes
    .map((node) => ({ node, bounds: getBounds(node) }))
    .filter((entry): entry is { node: T; bounds: Bounds } => entry.bounds !== null);

  // Nodes sem absoluteBoundingBox (raro) vão para o final, na ordem
  // em que já estavam, em vez de quebrar a ordenação dos demais.
  const withoutBounds = nodes.filter((node) => getBounds(node) === null);

  // Ordena inicialmente por topo (y), critério de desempate por x.
  withBounds.sort((a, b) => a.bounds.y - b.bounds.y || a.bounds.x - b.bounds.x);

  type Row = { top: number; bottom: number; items: { node: T; bounds: Bounds }[] };
  const rows: Row[] = [];

  for (const entry of withBounds) {
    const lastRow = rows[rows.length - 1];
    if (lastRow && verticallyOverlaps({ y: lastRow.top, height: lastRow.bottom - lastRow.top, x: 0, width: 0 }, entry.bounds)) {
      lastRow.items.push(entry);
      lastRow.top = Math.min(lastRow.top, entry.bounds.y);
      lastRow.bottom = Math.max(lastRow.bottom, entry.bounds.y + entry.bounds.height);
    } else {
      rows.push({ top: entry.bounds.y, bottom: entry.bounds.y + entry.bounds.height, items: [entry] });
    }
  }

  const ordered: T[] = [];
  for (const row of rows) {
    row.items.sort((a, b) => a.bounds.x - b.bounds.x);
    ordered.push(...row.items.map((e) => e.node));
  }

  return [...ordered, ...withoutBounds];
}
