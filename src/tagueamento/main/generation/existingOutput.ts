/// <reference types="@figma/plugin-typings" />

/**
 * Tagueamento já gerado para uma tela (spec 3.3 e 11).
 *
 * Os cards e marcadores de cada frame ficam num grupo "Tagueamento — …",
 * filho da página (ou da Seção do frame), marcado com pluginData PRÓPRIO do
 * tagueamento ("tagueamento.screenId" = id do frame). Nenhuma chave da
 * acessibilidade é lida ou escrita aqui.
 */

export const OUTPUT_SCREEN_KEY = "tagueamento.screenId";
export const CARD_NODE_KEY = "tagueamento.nodeId";
export const CARD_NUMBER_KEY = "tagueamento.numero";
export const OUTPUT_GROUP_PREFIX = "Tagueamento — ";

function containersOf(frame: SceneNode): (PageNode | SectionNode)[] {
  const containers: (PageNode | SectionNode)[] = [figma.currentPage];
  const parent = frame.parent;
  if (parent && parent.type === "SECTION") containers.push(parent);
  return containers;
}

/** Grupos de tagueamento gerados para este frame. */
export function findTagOutput(frame: SceneNode): SceneNode[] {
  const found: SceneNode[] = [];
  for (const container of containersOf(frame)) {
    for (const child of container.children) {
      if (child.getPluginData(OUTPUT_SCREEN_KEY) === frame.id && !found.includes(child)) found.push(child);
    }
  }
  return found;
}

/** Quantos cards já foram gerados para este frame. */
export function countTaggedCards(frame: SceneNode): number {
  let count = 0;
  for (const group of findTagOutput(frame)) {
    if ("findAll" in group) {
      count += group.findAll((node) => node.getPluginData(CARD_NUMBER_KEY) !== "" && node.type === "INSTANCE").length;
    }
  }
  return count;
}

/** Exclui o tagueamento gerado para o frame. Devolve quantos cards havia. */
export function deleteTagOutput(frame: SceneNode): number {
  const count = countTaggedCards(frame);
  for (const group of findTagOutput(frame)) {
    if (!group.removed) group.remove();
  }
  return count;
}
