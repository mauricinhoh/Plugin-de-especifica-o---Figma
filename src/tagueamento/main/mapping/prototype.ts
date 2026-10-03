/// <reference types="@figma/plugin-typings" />

/**
 * Setas de protótipo entre telas (spec 5.2 — tela anterior / tela alvo).
 *
 * Lê as `reactions` do frame e de tudo o que está dentro dele. Considera só
 * ações de navegação para outra tela (type "NODE" + navigation "NAVIGATE").
 * Overlays, trocas de variante e rolagens não contam como mudança de tela.
 *
 *  - Tela anterior do frame F = frames que têm uma seta chegando em F.
 *  - Tela alvo do frame F = frames para onde saem setas de F.
 */

export interface PrototypeGraph {
  /** frameId → frames de destino (sem repetição, na ordem em que foram achados). */
  outgoing: Map<string, string[]>;
  /** frameId → frames de origem (sem repetição). */
  incoming: Map<string, string[]>;
}

function pushUnique(map: Map<string, string[]>, key: string, value: string): void {
  const list = map.get(key) ?? [];
  if (!list.includes(value)) list.push(value);
  map.set(key, list);
}

function navigationTargets(node: SceneNode): string[] {
  if (!("reactions" in node)) return [];
  const targets: string[] = [];
  for (const reaction of node.reactions) {
    // API atual: reaction.actions (lista). Versões antigas: reaction.action.
    const legacy = (reaction as { action?: Action | null }).action;
    const actions: Action[] = reaction.actions ?? (legacy ? [legacy] : []);
    for (const action of actions) {
      if (action.type === "NODE" && action.navigation === "NAVIGATE" && action.destinationId) {
        targets.push(action.destinationId);
      }
    }
  }
  return targets;
}

/** Sobe até o frame de primeiro nível (filho da página ou de uma seção) que contém o node. */
async function topLevelFrameId(nodeId: string, frameIds: Set<string>): Promise<string | null> {
  if (frameIds.has(nodeId)) return nodeId;
  let node = (await figma.getNodeByIdAsync(nodeId)) as BaseNode | null;
  while (node) {
    if (frameIds.has(node.id)) return node.id;
    node = node.parent;
  }
  return null;
}

export async function buildPrototypeGraph(frames: SceneNode[]): Promise<PrototypeGraph> {
  const graph: PrototypeGraph = { outgoing: new Map(), incoming: new Map() };
  const frameIds = new Set(frames.map((frame) => frame.id));

  for (const frame of frames) {
    const withReactions: SceneNode[] = [frame];
    if ("findAll" in frame) {
      withReactions.push(...frame.findAll((node) => "reactions" in node && node.reactions.length > 0));
    }
    for (const node of withReactions) {
      for (const destinationId of navigationTargets(node)) {
        const destinationFrame = await topLevelFrameId(destinationId, frameIds);
        if (!destinationFrame || destinationFrame === frame.id) continue;
        pushUnique(graph.outgoing, frame.id, destinationFrame);
        pushUnique(graph.incoming, destinationFrame, frame.id);
      }
    }
  }
  return graph;
}
