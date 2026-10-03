/// <reference types="@figma/plugin-typings" />

/**
 * Fase 2 do TAGUEAMENTO — diagnóstico do card "[Helper] Google Analytics, atributo".
 *
 * Objetivo: descobrir, a partir de uma instância REAL do card no arquivo,
 * tudo o que a geração (Fase 7) vai precisar — sem supor nada:
 *  - chave do componente e do conjunto de variantes (para importar pela chave);
 *  - variantes da propriedade "Evento" (ex.: "[App] screen_view");
 *  - propriedades booleanas (toggles) e de texto, com o nome exato que a API usa;
 *  - nomes das camadas de valor e quais propriedades controlam cada camada;
 *  - fontes usadas (precisam ser carregadas antes de editar textos).
 *
 * Também cria um "card de teste" ao lado do card lido, para confirmar que a
 * importação pela chave funciona neste arquivo.
 *
 * Nada aqui altera o card selecionado. O card de teste é uma instância nova,
 * e a toggle "Mostrar atributo" nunca é tocada.
 */

import {
  CardDiagnosis,
  DiagnosedComponent,
  DiagnosedLayer,
  DiagnosedProperty,
  GA_CARD_COMPONENT_NAME,
  TestCardResult
} from "../shared/types";

/** Limite de camadas listadas — protege o plugin contra seleções enormes. */
const MAX_LAYERS = 600;
const MAX_CHARACTERS = 120;
/** Distância entre o card lido e o card de teste criado ao lado. */
const TEST_CARD_GAP = 40;
/** Marca própria do tagueamento no card de teste (chave separada da acessibilidade). */
const TEST_CARD_PLUGIN_DATA_KEY = "tagueamento.testCard";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function stripPropertyId(name: string): string {
  const hashIndex = name.lastIndexOf("#");
  return hashIndex > 0 ? name.slice(0, hashIndex) : name;
}

function describeComponent(node: ComponentNode | ComponentSetNode): DiagnosedComponent {
  return { id: node.id, name: node.name, key: node.key, remote: node.remote };
}

function fontLabel(font: FontName): string {
  return `${font.family} ${font.style}`;
}

/**
 * Lê a árvore de camadas da instância (incluindo camadas ocultas — é assim
 * que o plugin vai achar as linhas APP/WEB e os parâmetros opcionais).
 */
function collectLayers(root: SceneNode): { layers: DiagnosedLayer[]; truncated: boolean; fonts: string[] } {
  const layers: DiagnosedLayer[] = [];
  const fonts = new Set<string>();
  let truncated = false;

  function visit(node: SceneNode, depth: number): void {
    if (layers.length >= MAX_LAYERS) {
      truncated = true;
      return;
    }
    const layer: DiagnosedLayer = { depth, type: node.type, name: node.name, visible: node.visible };

    if (node.type === "TEXT") {
      const text = node.characters;
      layer.characters = text.length > MAX_CHARACTERS ? `${text.slice(0, MAX_CHARACTERS)}…` : text;
      if (node.fontName !== figma.mixed) {
        layer.font = fontLabel(node.fontName);
        fonts.add(layer.font);
      } else {
        layer.font = "(várias fontes)";
        try {
          for (const font of node.getRangeAllFontNames(0, text.length)) {
            fonts.add(fontLabel(font));
          }
        } catch {
          // Leitura de fontes mistas não é essencial para o diagnóstico.
        }
      }
    }

    const refs = "componentPropertyReferences" in node ? node.componentPropertyReferences : null;
    if (refs) {
      const entries = Object.entries(refs).filter(([, value]) => typeof value === "string") as [string, string][];
      if (entries.length > 0) {
        // Object.fromEntries não existe no ES2017 do main thread do Figma.
        const propertyRefs: Record<string, string> = {};
        for (const [field, property] of entries) propertyRefs[field] = property;
        layer.propertyRefs = propertyRefs;
      }
    }

    layers.push(layer);

    if ("children" in node) {
      for (const child of node.children) {
        visit(child, depth + 1);
      }
    }
  }

  visit(root, 0);
  return { layers, truncated, fonts: [...fonts].sort() };
}

/**
 * Definições das propriedades (padrões e opções de variante). Para uma
 * variante, as definições ficam no conjunto (ComponentSet); para um
 * componente sem variantes, no próprio componente.
 */
function readPropertyDefinitions(
  mainComponent: ComponentNode,
  componentSet: ComponentSetNode | null,
  warnings: string[]
): ComponentPropertyDefinitions | null {
  try {
    if (componentSet) return componentSet.componentPropertyDefinitions;
    return mainComponent.componentPropertyDefinitions;
  } catch (error) {
    warnings.push(
      `Não foi possível ler as definições das propriedades (opções de variante e valores padrão): ${errorMessage(error)}`
    );
    return null;
  }
}

export async function diagnoseSelection(): Promise<CardDiagnosis> {
  const selection = figma.currentPage.selection;
  if (selection.length !== 1) {
    throw new Error(
      selection.length === 0
        ? "Selecione no canvas uma instância do card antes de ler."
        : "Selecione só um card por vez."
    );
  }

  const node = selection[0];
  const warnings: string[] = [];
  const diagnosis: CardDiagnosis = {
    nodeId: node.id,
    nodeName: node.name,
    nodeType: node.type,
    width: Math.round(node.width),
    height: Math.round(node.height),
    mainComponent: null,
    componentSet: null,
    properties: [],
    layers: [],
    layersTruncated: false,
    fonts: [],
    warnings
  };

  if (node.type !== "INSTANCE") {
    warnings.push(
      `A camada selecionada é do tipo ${node.type}, não uma instância. Selecione a instância do card (ícone de losango no painel de camadas), não uma camada de dentro dele.`
    );
  } else {
    const mainComponent = await node.getMainComponentAsync();
    if (!mainComponent) {
      warnings.push("A instância não tem componente principal (ele pode ter sido apagado da biblioteca).");
    } else {
      diagnosis.mainComponent = describeComponent(mainComponent);

      let componentSet: ComponentSetNode | null = null;
      try {
        const parent = mainComponent.parent;
        if (parent && parent.type === "COMPONENT_SET") {
          componentSet = parent;
          diagnosis.componentSet = describeComponent(parent);
        }
      } catch (error) {
        warnings.push(`Não foi possível ler o conjunto de variantes: ${errorMessage(error)}`);
      }

      const setName = componentSet ? componentSet.name : mainComponent.name;
      if (setName !== GA_CARD_COMPONENT_NAME) {
        warnings.push(
          `O componente se chama "${setName}", e o esperado era "${GA_CARD_COMPONENT_NAME}". Confira se é o card certo.`
        );
      }

      const definitions = readPropertyDefinitions(mainComponent, componentSet, warnings);
      for (const [name, property] of Object.entries(node.componentProperties)) {
        const definition = definitions ? definitions[name] : undefined;
        const diagnosed: DiagnosedProperty = {
          name,
          displayName: stripPropertyId(name),
          type: property.type,
          value: property.value
        };
        if (definition) {
          diagnosed.defaultValue = definition.defaultValue;
          if (definition.type === "VARIANT" && definition.variantOptions) {
            diagnosed.options = [...definition.variantOptions];
          }
        }
        diagnosis.properties.push(diagnosed);
      }
    }
  }

  const { layers, truncated, fonts } = collectLayers(node);
  diagnosis.layers = layers;
  diagnosis.layersTruncated = truncated;
  diagnosis.fonts = fonts;
  if (truncated) {
    warnings.push(`A lista de camadas foi cortada em ${MAX_LAYERS} itens.`);
  }

  return diagnosis;
}

/**
 * Cria um card de teste ao lado do card diagnosticado:
 *  1. tenta importar pela chave (figma.importComponentByKeyAsync) — é o
 *     caminho que a geração vai usar, então é ele que precisa ser validado;
 *  2. se a importação falhar (ex.: componente local, não publicado), cria a
 *     instância direto do componente principal e informa o erro da importação.
 * Depois aplica as variantes escolhidas (ex.: Evento). Toggles e textos
 * ficam com os padrões do componente.
 */
export async function createTestCard(
  sourceNodeId: string,
  variantValues: Record<string, string>
): Promise<TestCardResult> {
  const source = await figma.getNodeByIdAsync(sourceNodeId);
  if (!source || source.type !== "INSTANCE") {
    return { ok: false, message: "O card lido não existe mais no arquivo. Selecione-o e clique em Ler card de novo." };
  }

  const mainComponent = await source.getMainComponentAsync();
  if (!mainComponent) {
    return { ok: false, message: "O card lido não tem componente principal." };
  }

  let instance: InstanceNode;
  let method: string;
  let importError: string | undefined;
  try {
    const imported = await figma.importComponentByKeyAsync(mainComponent.key);
    instance = imported.createInstance();
    method = "Importado pela chave (importComponentByKeyAsync)";
  } catch (error) {
    importError = errorMessage(error);
    try {
      instance = mainComponent.createInstance();
      method = "Criado direto do componente principal (a importação pela chave falhou)";
    } catch (fallbackError) {
      return {
        ok: false,
        message: `Não foi possível criar o card de teste: ${errorMessage(fallbackError)}`,
        importError
      };
    }
  }

  const box = source.absoluteBoundingBox;
  if (box) {
    instance.x = box.x + box.width + TEST_CARD_GAP;
    instance.y = box.y;
  }
  instance.setPluginData(TEST_CARD_PLUGIN_DATA_KEY, "1");

  // Só variantes, só as que existem na instância nova, e só quando mudam.
  const current = instance.componentProperties;
  const toApply: Record<string, string> = {};
  for (const [name, value] of Object.entries(variantValues)) {
    const property = current[name];
    if (property && property.type === "VARIANT" && property.value !== value) {
      toApply[name] = value;
    }
  }

  try {
    if (Object.keys(toApply).length > 0) {
      instance.setProperties(toApply);
    }
  } catch (error) {
    figma.currentPage.selection = [instance];
    figma.viewport.scrollAndZoomIntoView([source, instance]);
    return {
      ok: false,
      message: `O card de teste foi criado, mas não deu para aplicar as variantes: ${errorMessage(error)}`,
      method,
      importError
    };
  }

  figma.currentPage.selection = [instance];
  figma.viewport.scrollAndZoomIntoView([source, instance]);

  const applied: Record<string, string> = {};
  for (const [name, property] of Object.entries(instance.componentProperties)) {
    if (property.type === "VARIANT") applied[name] = String(property.value);
  }

  return {
    ok: true,
    message: "Card de teste criado ao lado do card lido.",
    method,
    importError,
    appliedProperties: applied
  };
}
