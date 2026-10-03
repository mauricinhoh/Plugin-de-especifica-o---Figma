/// <reference types="@figma/plugin-typings" />

/**
 * Travessia do TAGUEAMENTO — cópia adaptada de src/main/analysis/discovery.ts
 * (acessibilidade). Código independente: mexer aqui não muda a acessibilidade.
 *
 * Regras (spec 4.1/4.2 + decisões da Fase 4, 03/10/2026):
 *  - Camadas ocultas e os "cabeçalhos fixos" (IGNORED_LAYER_NAMES) são
 *    ignorados por completo, inclusive o que têm dentro.
 *  - select_content e search: viram item e a travessia NÃO entra neles.
 *  - modal_view e feedback: viram item E a travessia entra (botões de dentro
 *    também viram item; dentro de Modal/Drawer, com local_type = Modal).
 *  - container e nao_marcar: não viram item, mas a travessia entra.
 *  - Fora da tabela: a travessia entra; se nada reconhecido for achado lá
 *    dentro e o componente tiver texto visível, ele vira select_content
 *    marcado como "não reconhecido".
 *  - TEXT solto não vira item (diferente da acessibilidade).
 */

import { ComponentClass, findClassification, isIgnoredLayer } from "../../shared/classification";
import { candidateNames, ComponentNames, displayName, resolveComponentNames } from "./componentIdentity";

export interface DiscoveredItem {
  node: InstanceNode | ComponentNode;
  names: ComponentNames;
  /** Nome mostrado ao PD (nome da regra quando reconhecido). */
  componentName: string;
  classe: ComponentClass | "nao_reconhecido";
  /** Nome da regra que reconheceu (ex.: "Button Primary"), ou null. */
  ruleName: string | null;
  /** true quando está dentro de um Modal ou Drawer. */
  insideModal: boolean;
}

/** Primeiro texto visível dentro do node (ordem das camadas), ou null. */
export function firstVisibleText(node: SceneNode): string | null {
  if ("visible" in node && !node.visible) return null;
  if (node.type === "TEXT") {
    const text = node.characters.replace(/\s+/g, " ").trim();
    return text.length > 0 ? text : null;
  }
  if ("children" in node) {
    for (const child of node.children) {
      const found = firstVisibleText(child);
      if (found) return found;
    }
  }
  return null;
}

export async function discoverItems(root: SceneNode): Promise<DiscoveredItem[]> {
  const found: DiscoveredItem[] = [];

  async function walkChildren(node: SceneNode, insideModal: boolean): Promise<void> {
    if (!("children" in node)) return;
    for (const child of node.children) {
      await walk(child, insideModal);
    }
  }

  async function walk(node: SceneNode, insideModal: boolean): Promise<void> {
    if ("visible" in node && !node.visible) return;
    if (isIgnoredLayer([node.name])) return;

    if (node.type !== "INSTANCE" && node.type !== "COMPONENT") {
      await walkChildren(node, insideModal);
      return;
    }

    const names = await resolveComponentNames(node);
    if (isIgnoredLayer(candidateNames(names))) return;

    const match = findClassification(candidateNames(names));
    if (!match) {
      // Fora da tabela: entra; se nada for achado dentro, vira select_content "não reconhecido".
      const before = found.length;
      await walkChildren(node, insideModal);
      if (found.length === before && firstVisibleText(node)) {
        found.push({
          node,
          names,
          componentName: displayName(names),
          classe: "nao_reconhecido",
          ruleName: null,
          insideModal
        });
      }
      return;
    }

    const { rule, name } = match;
    const item: DiscoveredItem = { node, names, componentName: name, classe: rule.classe, ruleName: name, insideModal };

    switch (rule.classe) {
      case "select_content":
      case "search":
        found.push(item);
        return;
      case "modal_view":
        found.push(item);
        await walkChildren(node, true);
        return;
      case "feedback":
        found.push(item);
        await walkChildren(node, insideModal);
        return;
      case "container":
      case "nao_marcar":
        await walkChildren(node, insideModal);
        return;
    }
  }

  await walkChildren(root, false);
  return found;
}
