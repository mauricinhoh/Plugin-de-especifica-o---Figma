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

/**
 * Todos os nodes de saída do tagueamento na página, agrupados pelo frame.
 * Procura na página INTEIRA pelo pluginData próprio (não só nos filhos
 * diretos da página/Seção): continua achando o tagueamento mesmo que o PD
 * tenha movido o grupo para outra Seção/frame ou desagrupado os cards.
 * Guarda só o node mais alto de cada saída (o grupo, não os cards dentro dele).
 */
export function tagOutputIndex(): Map<string, SceneNode[]> {
  const index = new Map<string, SceneNode[]>();
  const matches = figma.currentPage.findAllWithCriteria({ pluginData: { keys: [OUTPUT_SCREEN_KEY] } }) as SceneNode[];
  for (const node of matches) {
    const frameId = node.getPluginData(OUTPUT_SCREEN_KEY);
    if (!frameId) continue;
    let ancestor = node.parent;
    let nested = false;
    while (ancestor && ancestor.type !== "PAGE") {
      if ((ancestor as SceneNode).getPluginData(OUTPUT_SCREEN_KEY) === frameId) {
        nested = true;
        break;
      }
      ancestor = ancestor.parent;
    }
    if (nested) continue;
    const list = index.get(frameId) ?? [];
    list.push(node);
    index.set(frameId, list);
  }
  return index;
}

/** Saída de tagueamento gerada para este frame. */
export function findTagOutput(frame: SceneNode, index: Map<string, SceneNode[]> = tagOutputIndex()): SceneNode[] {
  return index.get(frame.id) ?? [];
}

function cardsIn(node: SceneNode): number {
  const isCard = (n: SceneNode) => n.type === "INSTANCE" && n.getPluginData(CARD_NUMBER_KEY) !== "";
  let count = isCard(node) ? 1 : 0;
  if ("findAll" in node) count += node.findAll(isCard).length;
  return count;
}

/** Quantos cards já foram gerados para este frame. */
export function countTaggedCards(frame: SceneNode, index?: Map<string, SceneNode[]>): number {
  return findTagOutput(frame, index).reduce((sum, node) => sum + cardsIn(node), 0);
}

/**
 * Se o PD selecionou o grupo "Tagueamento — …", um card ou um marcador,
 * devolve o id do frame a que ele pertence.
 */
export function frameIdOfOutput(node: SceneNode): string | null {
  let current: BaseNode | null = node;
  while (current && current.type !== "PAGE" && current.type !== "DOCUMENT") {
    const frameId = (current as SceneNode).getPluginData(OUTPUT_SCREEN_KEY);
    if (frameId) return frameId;
    current = current.parent;
  }
  return null;
}

/** Exclui o tagueamento gerado para o frame. Devolve quantos cards havia. */
export function deleteTagOutput(frame: SceneNode): number {
  const outputs = findTagOutput(frame);
  const count = outputs.reduce((sum, node) => sum + cardsIn(node), 0);
  for (const node of outputs) {
    if (!node.removed) node.remove();
  }
  return count;
}
