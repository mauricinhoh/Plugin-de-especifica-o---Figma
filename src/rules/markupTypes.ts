/**
 * "Tipo de marcação" — categorias fixas exigidas pela especificação
 * de Handoff. Substituem o antigo comportamento em que cada regra de
 * acessibilidade aparecia como sua própria opção no dropdown da
 * Etapa 2: agora o dropdown sempre mostra exatamente estas 12
 * categorias (mais "Não especificado", tratado à parte via
 * UNSPECIFIED_TYPE_KEY em engine.ts).
 *
 * As 3 últimas (Decorativo, Estrutura, Não interativo) foram
 * acrescentadas depois, a pedido do usuário, para bater com o
 * vocabulário de "Tipo" da planilha de regras de acessibilidade
 * (Acessibilidade_Colmeia_Web.xlsx) — ver TIPO_PLANILHA_PARA_MARKUP_TYPE
 * em accessibility-rules.ts para o mapeamento.
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
  | "notas-designer"
  | "decorativo"
  | "estrutura"
  | "nao-interativo";

export interface MarkupTypeDefinition {
  key: MarkupTypeKey;
  label: string;
}

/** Ordem exata exigida pela seção 2 do briefing de Handoff, com as 3 categorias novas ao final. */
export const MARKUP_TYPES: MarkupTypeDefinition[] = [
  { key: "ponto-referencia", label: "Ponto de referência" },
  { key: "titulos", label: "Titulos" },
  { key: "ordem-foco", label: "Ordem de foco" },
  { key: "ordem-leitura", label: "Ordem de leitura" },
  { key: "botoes", label: "Botões" },
  { key: "entrada", label: "Entrada" },
  { key: "link", label: "Link" },
  { key: "imagem", label: "Imagem" },
  { key: "notas-designer", label: "Notas do designer" },
  { key: "decorativo", label: "Decorativo" },
  { key: "estrutura", label: "Estrutura" },
  { key: "nao-interativo", label: "Não interativo" }
];

/**
 * Componentes deste tipo não recebem número de Ordem de leitura
 * (Regra 2 do documento de regras de acessibilidade) — mas continuam
 * gerando card e marcação normalmente; o número do card/marcação é
 * só um identificador, não a ordem de leitura (ver
 * main/generation/panel.ts).
 */
export const DECORATIVE_MARKUP_TYPE: MarkupTypeKey = "decorativo";
