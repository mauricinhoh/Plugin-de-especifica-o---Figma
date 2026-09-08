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
export function findFirstText(node: SceneNode): TextNode | null {
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
