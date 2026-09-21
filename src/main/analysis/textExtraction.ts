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
