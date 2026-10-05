/// <reference types="@figma/plugin-typings" />

/**
 * Extração de texto (seção 17 do briefing).
 *
 * Busca o primeiro node TEXT "utilizável" dentro do componente, em
 * ordem determinística: percorre `node.children` em profundidade
 * (depth-first), na ordem em que os filhos aparecem no array
 * `children` (que reflete a ordem de empilhamento no Figma).
 *
 * "Utilizável" aqui exclui dois casos que não representam o texto
 * real exibido ao usuário — e que, se não excluídos, fariam a busca
 * parar num node errado mesmo havendo um rótulo visível depois dele:
 *   1. Nodes ocultos (`visible === false`), incluindo texto dentro de
 *      subárvores ocultas. Componentes de botão frequentemente têm
 *      camadas de texto auxiliares/de variante escondidas.
 *   2. Nodes TEXT com conteúdo vazio ou só espaços em branco.
 * A busca continua normalmente até achar o primeiro TEXT visível e
 * não-vazio; se nenhum existir, retorna null (comportamento anterior
 * preservado para esse caso).
 *
 * A assinatura é isolada em uma função própria para permitir que, no
 * futuro, uma regra especifique uma forma mais precisa de localizar
 * um texto/camada específico sem alterar quem chama esta função.
 */
function findFirstText(node: SceneNode): TextNode | null {
  if ("visible" in node && node.visible === false) {
    return null;
  }

  if (node.type === "TEXT") {
    return node.characters.trim().length > 0 ? node : null;
  }

  if ("children" in node) {
    for (const child of node.children) {
      const found = findFirstText(child);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

function normalizeLayerName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Para cada placeholder de `spec`, o texto da primeira camada TEXT
 * visível (e não vazia) cujo NOME contém um dos trechos listados.
 * Cada camada preenche no máximo um placeholder (o primeiro da lista
 * que bater), para não repetir o mesmo texto em dois lugares.
 */
export function extractTextsByLayerName(node: SceneNode, spec: Record<string, string[]>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const textNode of findAllTexts(node)) {
    const layerName = normalizeLayerName(textNode.name);
    for (const [placeholder, patterns] of Object.entries(spec)) {
      if (result[placeholder] !== undefined) continue;
      if (patterns.some((pattern) => layerName.includes(normalizeLayerName(pattern)))) {
        result[placeholder] = textNode.characters;
        break;
      }
    }
  }
  return result;
}

/** Lista (nome da camada, texto) de todos os textos visíveis — usado só no log de diagnóstico. */
export function listTextLayers(node: SceneNode): Array<{ camada: string; texto: string }> {
  return findAllTexts(node).map((t) => ({ camada: t.name, texto: t.characters }));
}

/**
 * Cada texto visível do componente como um item de lista (ex.: os
 * níveis do Breadcrumb). Ignora textos que são só separador (">", "/",
 * "›", "»", "|"), caso o separador seja uma camada de texto.
 */
export function extractTextList(node: SceneNode): string[] {
  return findAllTexts(node)
    .map((t) => t.characters.trim())
    .filter((text) => !/^[>/›»|\-–—•·]+$/.test(text));
}

/** Tamanho da fonte da descrição nos componentes com título opcional (ex.: Flag). */
const DESCRIPTION_FONT_SIZE = 14;

/**
 * Título (opcional) e descrição de componentes como a Flag. A
 * descrição é o PRIMEIRO texto de 14px; o título é o texto que vem
 * antes dela, se houver. Textos depois da descrição (ex.: o link) são
 * ignorados. Sem nenhum texto de 14px, cai na posição (1º título,
 * 2º descrição).
 */
export function extractTitleAndDescription(
  node: SceneNode,
  ownTextsOnly = false
): { title?: string; description?: string } {
  const texts = ownTextsOnly ? findOwnTexts(node) : findAllTexts(node);
  const descriptionIndex = texts.findIndex((t) => t.fontSize === DESCRIPTION_FONT_SIZE);
  if (descriptionIndex === -1) {
    return { title: texts[0]?.characters, description: texts[1]?.characters };
  }
  return {
    title: descriptionIndex > 0 ? texts[0].characters : undefined,
    description: texts[descriptionIndex].characters
  };
}

/**
 * Textos visíveis do PRÓPRIO componente: não entra em instâncias
 * internas (ex.: os botões do Header Product), que têm card próprio.
 */
export function findOwnTexts(node: SceneNode): TextNode[] {
  const result: TextNode[] = [];
  if (!("children" in node)) return result;
  for (const child of node.children) {
    if ("visible" in child && child.visible === false) continue;
    if (child.type === "TEXT") {
      if (child.characters.trim().length > 0) result.push(child);
    } else if (child.type !== "INSTANCE" && "children" in child) {
      result.push(...findOwnTexts(child));
    }
  }
  return result;
}

/** Valores de variante que indicam a aba selecionada (sem acento/maiúscula). */
const SELECTED_TAB_VALUES = ["select", "selected", "selecionado", "selecionada", "ativo", "ativa", "active"];

/** Abas visíveis mais próximas dentro do componente (atravessa frames de layout). */
function collectTabItems(node: SceneNode): (InstanceNode | ComponentNode)[] {
  const items: (InstanceNode | ComponentNode)[] = [];
  if (!("children" in node)) return items;
  for (const child of node.children) {
    if ("visible" in child && child.visible === false) continue;
    if (child.type === "INSTANCE" || child.type === "COMPONENT") {
      items.push(child);
    } else if ("children" in child) {
      items.push(...collectTabItems(child));
    }
  }
  return items;
}

function isSelectedTab(item: InstanceNode | ComponentNode): boolean {
  if (item.type !== "INSTANCE" || !item.componentProperties) return false;
  for (const [name, property] of Object.entries(item.componentProperties)) {
    const value = normalizeLayerName(String(property.value));
    if (SELECTED_TAB_VALUES.includes(value)) return true;
    // Propriedade booleana tipo "Selected: True".
    const propertyName = normalizeLayerName(name.split("#")[0]);
    if (value === "true" && SELECTED_TAB_VALUES.includes(propertyName)) return true;
  }
  return false;
}

/**
 * Abas do componente Tab (2 a 7): texto de cada aba e se ela está no
 * estado "Select", na ordem da esquerda para a direita (depois de cima
 * para baixo). Sem abas-instância dentro, usa os textos, sem seleção.
 */
export function extractTabs(node: SceneNode): Array<{ label: string; selected: boolean; propriedades?: unknown }> {
  const items = collectTabItems(node)
    .map((item) => ({ item, label: findFirstText(item)?.characters.trim() ?? "" }))
    .filter((entry) => entry.label.length > 0);
  if (items.length === 0) {
    return findAllTexts(node).map((t) => ({ label: t.characters.trim(), selected: false }));
  }
  const position = (n: SceneNode) => n.absoluteBoundingBox ?? { x: 0, y: 0 };
  items.sort((a, b) => position(a.item).x - position(b.item).x || position(a.item).y - position(b.item).y);
  return items.map(({ item, label }) => ({
    label,
    selected: isSelectedTab(item),
    propriedades: item.type === "INSTANCE" ? item.componentProperties : undefined
  }));
}

/**
 * Textos do PRÓPRIO componente em cada placeholder: primeiro pelo nome
 * da camada; os que não baterem, pela ordem dos textos restantes.
 */
export function extractOwnTextSlots(node: SceneNode, spec: Record<string, string[]>): Record<string, string> {
  const own = findOwnTexts(node);
  const result: Record<string, string> = {};
  const used = new Set<number>();
  own.forEach((textNode, index) => {
    const layerName = normalizeLayerName(textNode.name);
    for (const [slot, patterns] of Object.entries(spec)) {
      if (result[slot] !== undefined) continue;
      if (patterns.some((pattern) => layerName.includes(normalizeLayerName(pattern)))) {
        result[slot] = textNode.characters;
        used.add(index);
        break;
      }
    }
  });
  const remaining = own.filter((_, index) => !used.has(index));
  for (const slot of Object.keys(spec)) {
    if (result[slot] === undefined && remaining.length > 0) {
      result[slot] = remaining.shift()!.characters;
    }
  }
  return result;
}

/** Texto do primeiro componente interno visível (ex.: o botão do Uploader). */
export function findInnerInstanceText(node: SceneNode): string | undefined {
  if (!("children" in node)) return undefined;
  for (const child of node.children) {
    if ("visible" in child && child.visible === false) continue;
    if (child.type === "INSTANCE") {
      const text = findFirstText(child);
      if (text) return text.characters;
    } else if ("children" in child) {
      const found = findInnerInstanceText(child);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/** O próprio node TEXT do primeiro texto utilizável (ex.: para ler o tamanho da fonte do Heading). */
export function findFirstTextNode(node: SceneNode): TextNode | null {
  return findFirstText(node);
}

/** Retorna o conteúdo textual (characters) do primeiro TEXT utilizável encontrado, ou undefined. */
export function extractFirstText(node: SceneNode): string | undefined {
  const textNode = findFirstText(node);
  return textNode ? textNode.characters : undefined;
}

/**
 * Coleta TODOS os nodes TEXT utilizáveis (mesmos critérios de
 * `findFirstText`: visíveis e não-vazios) dentro do componente, na
 * mesma ordem determinística de profundidade. Usada por componentes
 * que precisam de mais de um texto para formar a verbalização (ex.:
 * Breadcrumb, onde cada nível da trilha é um TEXT separado) — pedido
 * do usuário depois de notar que "primeiro texto" não bastava para
 * esses casos.
 */
/**
 * true quando algum texto visível dentro do componente tem trecho
 * SUBLINHADO (o jeito como o link aparece no Flag/Flag Cooperado).
 * Texto com estilos misturados é conferido trecho a trecho.
 */
export function hasUnderlinedText(node: SceneNode): boolean {
  return findAllTexts(node).some((text) => {
    if (text.textDecoration === "UNDERLINE") return true;
    if (text.textDecoration === figma.mixed) {
      return text.getStyledTextSegments(["textDecoration"]).some((segment) => segment.textDecoration === "UNDERLINE");
    }
    return false;
  });
}

function findAllTexts(node: SceneNode): TextNode[] {
  if ("visible" in node && node.visible === false) {
    return [];
  }

  if (node.type === "TEXT") {
    return node.characters.trim().length > 0 ? [node] : [];
  }

  if ("children" in node) {
    const result: TextNode[] = [];
    for (const child of node.children) {
      result.push(...findAllTexts(child));
    }
    return result;
  }

  return [];
}

/**
 * Retorna todos os textos utilizáveis do componente, juntados em uma
 * única string separada por ", " (ex.: "Início, Produtos, Detalhes").
 * Retorna undefined quando não há nenhum texto (mesmo padrão de
 * `extractFirstText`, para não inventar conteúdo).
 */
export function extractAllTextsJoined(node: SceneNode): string | undefined {
  const texts = findAllTexts(node).map((t) => t.characters);
  return texts.length > 0 ? texts.join(", ") : undefined;
}

/**
 * Retorna o PRIMEIRO e o SEGUNDO texto utilizável do componente,
 * separadamente (mesma ordem de `findAllTexts`) — pedido do usuário
 * pro Empty State: "o primeiro texto sempre é o título, o segundo
 * sempre é a descrição", uma posição fixa, não relacionada a tamanho
 * de fonte. Qualquer texto além do segundo é ignorado por esta
 * função (não existe "terceiro" no contrato atual).
 */
export function extractFirstTwoTexts(node: SceneNode): { first?: string; second?: string } {
  const texts = findAllTexts(node);
  return {
    first: texts[0]?.characters,
    second: texts[1]?.characters
  };
}

/**
 * Mesma ideia de `extractFirstTwoTexts`, com um terceiro texto — pedido
 * do usuário pro Banner Image Full: título, descrição e rótulo do
 * botão, cada um na sua própria posição, todos dentro de UM card só
 * (diferente do Empty State, que virou 3 cards separados — aqui ela
 * quer tudo junto no mesmo card, só que cada palavra pegando o texto
 * certo em vez de todos repetirem o mesmo texto).
 */
export function extractFirstThreeTexts(node: SceneNode): { first?: string; second?: string; third?: string } {
  const texts = findAllTexts(node);
  return {
    first: texts[0]?.characters,
    second: texts[1]?.characters,
    third: texts[2]?.characters
  };
}
