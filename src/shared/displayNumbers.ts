import { SpecificationItem } from "./types";

/**
 * Número de identificação de cada item (badge do card da direita,
 * marcador no frame e lista do plugin).
 *
 * - Item normal: número sequencial "01", "02"...
 * - Item DENTRO de um Card (`insideCardOf`): número do Card com
 *   subnúmero — "02.1", "02.2"... Esses itens NÃO ganham marcador no
 *   frame (só o Card). Confirmado com o usuário em 07/10/2026.
 *
 * Se o Card do item não estiver ANTES dele na lista (ex.: o PD
 * removeu o Card ou moveu o item para longe), o item volta a ser
 * numerado como item normal.
 */
export interface DisplayNumber {
  label: string;
  /** true = item dentro de Card (sem marcador no frame). */
  isSubItem: boolean;
}

export function computeDisplayNumbers(orderedItems: SpecificationItem[]): Map<string, DisplayNumber> {
  const result = new Map<string, DisplayNumber>();
  const labelByNodeId = new Map<string, string>();
  const subCountByNodeId = new Map<string, number>();
  let topLevel = 0;

  for (const item of orderedItems) {
    const parentLabel = item.insideCardOf ? labelByNodeId.get(item.insideCardOf) : undefined;
    let label: string;
    let isSubItem = false;
    if (item.insideCardOf && parentLabel !== undefined) {
      const sub = (subCountByNodeId.get(item.insideCardOf) ?? 0) + 1;
      subCountByNodeId.set(item.insideCardOf, sub);
      label = `${parentLabel}.${sub}`;
      isSubItem = true;
    } else {
      topLevel += 1;
      label = String(topLevel).padStart(2, "0");
    }
    labelByNodeId.set(item.nodeId, label);
    result.set(item.id, { label, isSubItem });
  }
  return result;
}
