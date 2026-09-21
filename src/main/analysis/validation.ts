import { CoreIncompatibility, CoreType, ScreenContext } from "../../shared/types";

interface CoreItemLike {
  nodeId: string;
  nodeName: string;
  coreType: CoreType;
}

/**
 * Verifica incompatibilidades de Core (seção 10 do briefing):
 * se o contexto é WEB, somente Core Web é permitido; se APLICATIVO,
 * somente Core App. Componentes "DESCONHECIDO" (não pertencem a
 * nenhuma das duas bibliotecas core) não são tratados como
 * incompatibilidade — eles simplesmente não participam da contagem
 * nem da checagem, já que o briefing só define a regra para
 * componentes que pertencem ao Core oposto.
 */
export function findCoreIncompatibilities(
  items: CoreItemLike[],
  context: ScreenContext
): CoreIncompatibility[] {
  const forbidden: CoreType = context === "WEB" ? "CORE_APP" : "CORE_WEB";

  return items
    .filter((item) => item.coreType === forbidden)
    .map((item) => ({
      nodeId: item.nodeId,
      nodeName: item.nodeName,
      foundCoreType: forbidden,
      expectedContext: context
    }));
}
