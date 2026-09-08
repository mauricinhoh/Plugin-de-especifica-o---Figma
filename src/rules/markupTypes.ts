/**
 * "Tipo de marcação" — categorias fixas exigidas pela especificação
 * de Handoff. Substituem o antigo comportamento em que cada regra de
 * acessibilidade aparecia como sua própria opção no dropdown da
 * Etapa 2: agora o dropdown sempre mostra exatamente estas 9
 * categorias (mais "Não especificado", tratado à parte via
 * UNSPECIFIED_TYPE_KEY em engine.ts).
 *
 * Cada regra de `accessibility-rules.ts` declara a QUAL dessas
 * categorias ela pertence (`ComponentTypeRule.markupType`), mas as
 * categorias em si não mudam conforme as regras — elas são a lista
 * fechada abaixo.
 */

export type MarkupTypeKey =
  | "ponto-referencia"
  | "titulos"
  | "ordem-foco"
  | "ordem-leitura"
  | "botoes"
  | "entrada"
  | "link"
  | "imagem"
  | "notas-designer";

export interface MarkupTypeDefinition {
  key: MarkupTypeKey;
  label: string;
}

/** Ordem exata exigida pela seção 2 do briefing de Handoff. */
export const MARKUP_TYPES: MarkupTypeDefinition[] = [
  { key: "ponto-referencia", label: "Ponto de referência" },
  { key: "titulos", label: "Titulos" },
  { key: "ordem-foco", label: "Ordem de foco" },
  { key: "ordem-leitura", label: "Ordem de leitura" },
  { key: "botoes", label: "Botões" },
  { key: "entrada", label: "Entrada" },
  { key: "link", label: "Link" },
  { key: "imagem", label: "Imagem" },
  { key: "notas-designer", label: "Notas do designer" }
];
