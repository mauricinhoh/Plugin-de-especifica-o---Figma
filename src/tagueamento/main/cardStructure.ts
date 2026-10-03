/// <reference types="@figma/plugin-typings" />

/**
 * Leitura da estrutura do card "[Helper] Google Analytics Spec".
 *
 * Estrutura observada no diagnóstico da Fase 2 (03/10/2026):
 *   [INSTANCE] card
 *     [FRAME] Number → [INSTANCE] Tag → [TEXT] número do card
 *     [FRAME] GA Fields (visible ← "Mostrar atributos")
 *       [FRAME] Type → [TEXT] nome do evento
 *       [FRAME] Fields
 *         [FRAME] Specs (visible ← toggle do parâmetro, quando opcional)
 *           [TEXT] nome do parâmetro (ex.: "subregion*")
 *           [INSTANCE] _Atributos GA → [INSTANCE] Tag → [TEXT] valor (ex.: "<Nome_da_tela>")
 *
 * Todas as linhas se chamam "Specs", então a linha é identificada pela
 * FORMA (um texto direto + uma instância com texto dentro) e pelo TEXTO do
 * nome do parâmetro — nunca pelo nome da camada. Este módulo é do
 * tagueamento e vai ser reaproveitado na geração (Fase 7).
 */

import { CardRowInfo } from "../shared/types";

function stripPropertyId(name: string): string {
  const hashIndex = name.lastIndexOf("#");
  return hashIndex > 0 ? name.slice(0, hashIndex) : name;
}

function firstTextInside(node: SceneNode): TextNode | null {
  if (node.type === "TEXT") return node;
  if ("children" in node) {
    for (const child of node.children) {
      const found = firstTextInside(child);
      if (found) return found;
    }
  }
  return null;
}

export interface CardRowNode {
  info: CardRowInfo;
  /** Frame da linha (é ele que se esconde com visible = false). */
  row: FrameNode | InstanceNode | GroupNode;
  labelNode: TextNode;
  valueNode: TextNode;
}

export interface CardStructure {
  rows: CardRowNode[];
  typeNode: TextNode | null;
  numberNode: TextNode | null;
}

/** Tenta interpretar um node como linha de parâmetro. */
function asRow(node: SceneNode): CardRowNode | null {
  if (node.type !== "FRAME" && node.type !== "GROUP") return null;
  let labelNode: TextNode | null = null;
  let valueNode: TextNode | null = null;
  for (const child of node.children) {
    if (!labelNode && child.type === "TEXT") labelNode = child;
    if (!valueNode && child.type === "INSTANCE") valueNode = firstTextInside(child);
  }
  if (!labelNode || !valueNode) return null;

  const refs = node.type === "FRAME" ? node.componentPropertyReferences : null;
  const info: CardRowInfo = {
    label: labelNode.characters.trim(),
    value: valueNode.characters,
    visible: node.visible
  };
  if (refs && typeof refs.visible === "string") {
    info.toggle = stripPropertyId(refs.visible);
  }
  return { info, row: node, labelNode, valueNode };
}

export function readCardStructure(card: InstanceNode): CardStructure {
  const structure: CardStructure = { rows: [], typeNode: null, numberNode: null };

  function visit(node: SceneNode): void {
    if (node !== card) {
      const row = asRow(node);
      if (row) {
        structure.rows.push(row);
        return; // não procura linhas dentro de uma linha
      }
      if (!structure.typeNode && node.type === "FRAME" && node.name === "Type") {
        structure.typeNode = firstTextInside(node);
      }
      if (!structure.numberNode && node.type === "FRAME" && node.name === "Number") {
        structure.numberNode = firstTextInside(node);
      }
    }
    if ("children" in node) {
      for (const child of node.children) visit(child);
    }
  }

  visit(card);
  return structure;
}
