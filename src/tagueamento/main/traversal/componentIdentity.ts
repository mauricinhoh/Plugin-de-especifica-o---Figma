/// <reference types="@figma/plugin-typings" />

/**
 * Identificação de componente do TAGUEAMENTO — cópia adaptada de
 * src/main/analysis/componentIdentity.ts (acessibilidade).
 *
 * Diferença: além do nome da instância e do componente principal, lê o nome
 * do CONJUNTO DE VARIANTES. Numa variante, o componente principal se chama
 * algo como "Type=Primary, Size=M"; o nome que identifica o componente
 * ("Button Primary") está no conjunto. Assim uma instância renomeada no
 * painel de camadas continua sendo reconhecida.
 */

export interface ComponentNames {
  /** Nome da camada no painel (pode ter sido renomeada pelo designer). */
  instanceName: string;
  /** Nome do conjunto de variantes, quando o componente tem variantes. */
  setName: string | null;
  /** Nome do componente principal. */
  mainName: string | null;
}

export async function resolveComponentNames(node: InstanceNode | ComponentNode): Promise<ComponentNames> {
  const names: ComponentNames = { instanceName: node.name, setName: null, mainName: null };
  let main: ComponentNode | null = null;
  try {
    main = node.type === "INSTANCE" ? await node.getMainComponentAsync() : node;
  } catch {
    main = null;
  }
  if (main) {
    names.mainName = main.name;
    try {
      const parent = main.parent;
      if (parent && parent.type === "COMPONENT_SET") names.setName = parent.name;
    } catch {
      // Conjunto de biblioteca inacessível: segue com os outros nomes.
    }
  }
  return names;
}

/** Ordem de prioridade para reconhecer: conjunto, componente principal, camada. */
export function candidateNames(names: ComponentNames): string[] {
  return [names.setName, names.mainName, names.instanceName].filter((name): name is string => !!name);
}

/** Nome mais legível para mostrar ao PD. */
export function displayName(names: ComponentNames): string {
  return names.setName ?? names.mainName ?? names.instanceName;
}
