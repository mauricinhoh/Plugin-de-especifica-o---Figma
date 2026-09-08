/// <reference types="@figma/plugin-typings" />

import { createMarkerForItem } from "./markers";

/**
 * Marcação temporária de "aqui está esse componente", mostrada
 * enquanto um card está expandido na Etapa 2 — pedido do usuário
 * depois de relatar dificuldade em identificar visualmente qual
 * componente um card representa só pelo nome.
 *
 * Reaproveita exatamente `createMarkerForItem` (o mesmo retângulo
 * pontilhado + círculo azul numerado da geração final), só que criada
 * e removida em tempo real conforme o designer abre/fecha cards — não
 * é salva como parte da especificação, e não deve sobrar nenhum
 * resíduo no arquivo se o designer fechar o plugin, remover o item ou
 * gerar a especificação com um card ainda aberto.
 *
 * Guarda a REFERÊNCIA do node criado (não só o id) de propósito: o
 * cleanup precisa poder rodar de forma síncrona dentro de
 * `figma.on("close", ...)` (ver code.ts), que é chamado sempre que o
 * plugin fecha por QUALQUER motivo — inclusive o X nativo do Figma,
 * que não passa pela nossa mensagem "close-plugin". A documentação
 * oficial da Figma é explícita: esse callback não pode usar
 * async/await (`getNodeByIdAsync` incluso) — o ambiente do plugin é
 * destruído assim que o callback retorna. Por isso `clearPreviewMarker`
 * é síncrona e usa a referência já em mãos, em vez de buscar o node
 * de novo pelo id.
 */
let previewMarkerGroup: GroupNode | null = null;

export async function showPreviewMarker(nodeId: string, index: number): Promise<void> {
  clearPreviewMarker();

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node || !("absoluteBoundingBox" in node) || !(node as SceneNode).absoluteBoundingBox) {
    // Componente removido do arquivo ou sem posição legível: não há
    // o que marcar. Silencioso de propósito — é só um auxílio visual,
    // não uma ação que deveria travar o fluxo do designer.
    return;
  }

  previewMarkerGroup = await createMarkerForItem(node as SceneNode, index);
}

export function clearPreviewMarker(): void {
  if (!previewMarkerGroup) return;
  try {
    previewMarkerGroup.remove();
  } catch {
    // Pode já ter sido removido por outro motivo (ex.: o designer
    // apagou a marcação manualmente) — não é um erro que importa aqui.
  }
  previewMarkerGroup = null;
}
