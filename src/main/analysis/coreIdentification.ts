/// <reference types="@figma/plugin-typings" />

import { CoreType } from "../../shared/types";

/**
 * Identificação de Core Web / Core App (seção 8 do briefing).
 *
 * LIMITAÇÃO TÉCNICA CONFIRMADA:
 * A Figma Plugin API não expõe um método que devolva diretamente "o
 * nome do arquivo de biblioteca publicada" de onde um componente
 * remoto veio (não existe algo como `component.libraryName`). O que
 * a API garante:
 *   - `InstanceNode.getMainComponentAsync()` → ComponentNode | null
 *   - `ComponentNode.remote` → boolean (true quando vem de biblioteca)
 *   - `ComponentNode.name` → nome do componente
 *   - Quando o componente principal faz parte de um ComponentSet
 *     (variantes), `ComponentNode.parent` pode ser o `ComponentSetNode`
 *     correspondente, com seu próprio `.name`.
 *
 * Sinal usado (real, não inventado): times de Design System no Figma
 * costumam nomear componentes/component sets usando "/" como
 * separador de pasta no painel de Assets (ex.: "Core Web/Button").
 * Esse nome de pasta fica de fato armazenado em `component.name`
 * (ou no nome do ComponentSet pai). Por isso, a estratégia aqui
 * verifica se o nome do componente principal ou do seu ComponentSet
 * contém, como segmento de caminho, exatamente uma das bibliotecas
 * informadas no briefing.
 *
 * Se essa convenção de nomenclatura não for exatamente a usada pelo
 * Design System real, os nomes abaixo devem ser ajustados — nenhuma
 * outra lógica deve ser inventada além dessa checagem de nome.
 */

const LIBRARY_NAME_CORE_WEB = "Colmeia DS | Core Web";
const LIBRARY_NAME_CORE_APP = "Colmeia DS | Core App";

function pathContainsLibrary(path: string, libraryName: string): boolean {
  return path
    .split("/")
    .map((segment) => segment.trim())
    .includes(libraryName);
}

export interface CoreIdentificationResult {
  coreType: CoreType;
  mainComponentName: string | null;
}

function classifyByNamePaths(candidatePaths: string[], selfName: string): CoreIdentificationResult {
  for (const path of candidatePaths) {
    if (pathContainsLibrary(path, LIBRARY_NAME_CORE_WEB)) {
      return { coreType: "CORE_WEB", mainComponentName: selfName };
    }
    if (pathContainsLibrary(path, LIBRARY_NAME_CORE_APP)) {
      return { coreType: "CORE_APP", mainComponentName: selfName };
    }
  }
  return { coreType: "DESCONHECIDO", mainComponentName: selfName };
}

/**
 * Resolve o Core Type (Core Web / Core App / Desconhecido) de uma
 * instância, a partir do seu componente principal.
 */
export async function identifyCoreTypeForInstance(instance: InstanceNode): Promise<CoreIdentificationResult> {
  const mainComponent = await instance.getMainComponentAsync();

  if (!mainComponent) {
    return { coreType: "DESCONHECIDO", mainComponentName: null };
  }

  const candidatePaths = [mainComponent.name];
  const parent = mainComponent.parent;
  if (parent && parent.type === "COMPONENT_SET") {
    candidatePaths.push(parent.name);
  }

  return classifyByNamePaths(candidatePaths, mainComponent.name);
}

/**
 * Resolve o Core Type quando o node de topo já É o componente
 * principal (node.type === "COMPONENT", sem ser uma instância).
 */
export function identifyCoreTypeForComponent(component: ComponentNode): CoreIdentificationResult {
  const candidatePaths = [component.name];
  const parent = component.parent;
  if (parent && parent.type === "COMPONENT_SET") {
    candidatePaths.push(parent.name);
  }
  return classifyByNamePaths(candidatePaths, component.name);
}

/** Ponto único usado pela análise: aceita INSTANCE ou COMPONENT de topo. */
export async function identifyCoreType(
  node: InstanceNode | ComponentNode
): Promise<CoreIdentificationResult> {
  if (node.type === "INSTANCE") {
    return identifyCoreTypeForInstance(node);
  }
  return identifyCoreTypeForComponent(node);
}
