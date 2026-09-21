/// <reference types="@figma/plugin-typings" />

/**
 * Resolve o nome do "componente principal" de um node — usado tanto
 * pela descoberta (para decidir se um componente é reconhecido, ver
 * discovery.ts) quanto pela identificação de regra em analyzer.ts.
 * Extraído para um único lugar para não duplicar a lógica async de
 * `getMainComponentAsync` nos dois pontos.
 */
export async function resolveComponentName(node: InstanceNode | ComponentNode): Promise<string | null> {
  if (node.type === "INSTANCE") {
    const mainComponent = await node.getMainComponentAsync();
    return mainComponent?.name ?? null;
  }
  return node.name;
}
