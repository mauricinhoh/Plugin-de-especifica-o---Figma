/// <reference types="@figma/plugin-typings" />

/**
 * Fase 6 — dados do elemento escolhido no "Adicionar evento manual":
 * nome do componente, primeiro texto visível e o frame de primeiro nível
 * que o contém (para a UI avisar quando o elemento é de outra tela).
 */

import { ElementInfo } from "../shared/types";
import { displayName, resolveComponentNames } from "./traversal/componentIdentity";
import { firstVisibleText } from "./traversal/discovery";

function topLevelFrameId(node: BaseNode): string | null {
  let current: BaseNode | null = node;
  while (current && current.parent) {
    const parent: BaseNode = current.parent;
    if (parent.type === "PAGE" || parent.type === "SECTION") {
      return current.type === "FRAME" || current.type === "GROUP" ? current.id : null;
    }
    current = parent;
  }
  return null;
}

export async function elementInfo(nodeId: string): Promise<ElementInfo | null> {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node || !("visible" in node)) return null;
  const scene = node as SceneNode;
  const componente =
    scene.type === "INSTANCE" || scene.type === "COMPONENT" ? displayName(await resolveComponentNames(scene)) : scene.name;
  return { nodeId, componente, label: firstVisibleText(scene), frameId: topLevelFrameId(scene) };
}
