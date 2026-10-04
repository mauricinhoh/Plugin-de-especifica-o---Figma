/**
 * Configuração do card de Google Analytics da biblioteca e lista de
 * parâmetros por evento. Dados puros (sem `figma` e sem DOM), usados pelo
 * main thread e pela UI do tagueamento.
 *
 * FONTES (nada aqui é inventado):
 *  - Nome do conjunto, nome da toggle "Mostrar atributos" e chave: confirmados
 *    pelo Mau em 03/10/2026 a partir do diagnóstico da Fase 2. A chave foi lida
 *    de uma foto do relatório — por isso o botão "Verificar todas as variantes"
 *    confere a chave importando o componente por ela (se a importação funciona,
 *    a chave está certa).
 *  - Parâmetros por evento: TAGUEAMENTO_SPEC.md, seção 7.2 (prints dos cards).
 */

/** Nome do conjunto de variantes na biblioteca "Elementos de apoio para arquivo". */
export const GA_CARD_SET_NAME = "[Helper] Google Analytics Spec";

/** Chave do conjunto de variantes (figma.importComponentSetByKeyAsync). */
export const GA_CARD_SET_KEY = "051df160d03349be02f026974d98735ec96a5128";

/** Toggle que esconde o card inteiro — o plugin NUNCA altera. */
export const GA_CARD_SHOW_TOGGLE = "Mostrar atributos";

/**
 * Toggle que liga/desliga as linhas message, UTM e hiring_Id. Regra do Mau
 * (03/10/2026): na geração, deve vir SEMPRE desligada (quase nunca é usada).
 */

/** Propriedade de variante que escolhe o evento do card. */
export const GA_CARD_EVENT_PROPERTY = "Evento";

export type GaEventKey =
  | "screen_view"
  | "page_view"
  | "select_content"
  | "modal_view"
  | "feedback"
  | "search"
  | "login"
  | "transaction"
  | "refresh"
  | "conversion";

export interface GaEventSchema {
  key: GaEventKey;
  /**
   * Parâmetros esperados no card, como escritos na spec 7.2. Opcionais
   * terminam com "*" (o card mostra "subregion*", por exemplo). Para eventos
   * compartilhados, as linhas APP e WEB aparecem as duas.
   */
  params: string[];
}

export const GA_EVENTS: GaEventSchema[] = [
  {
    key: "screen_view",
    params: [
      "firebase_screen",
      "region",
      "subregion*",
      "firebase_previous_screen",
      "target_screen*",
      "code*",
      "status*",
      "title*",
      "message*",
      "details*",
      "utm_source*",
      "utm_medium*",
      "utm_campaing*",
      "utm_content*",
      "utm_term*",
      "hiring_id*"
    ]
  },
  {
    // Lista completa confirmada pela foto do card web (03/10/2026): mesmos
    // opcionais do screen_view, com os nomes web nas linhas de tela.
    key: "page_view",
    params: [
      "page_name",
      "region",
      "subregion*",
      "previous_page",
      "target_page*",
      "code*",
      "status*",
      "title*",
      "message*",
      "details*",
      "utm_source*",
      "utm_medium*",
      "utm_campaing*",
      "utm_content*",
      "utm_term*",
      "hiring_id*"
    ]
  },
  {
    key: "select_content",
    params: ["content_type", "region", "subregion*", "action", "local_name", "local_type", "previous_page"]
  },
  { key: "modal_view", params: ["modal_name", "page_name", "firebase_screen", "region", "subregion*"] },
  {
    key: "feedback",
    params: [
      "region",
      "subregion*",
      "firebase_screen",
      "page_name",
      "feedback_name",
      "firebase_previous_screen",
      "previous_page"
    ]
  },
  {
    key: "search",
    params: [
      "search_term",
      "result",
      "firebase_screen",
      "page_name",
      "region",
      "subregion*",
      "firebase_previous_screen",
      "previous_page"
    ]
  },
  { key: "login", params: ["region", "authentication", "result", "method*", "details*"] },
  {
    key: "transaction",
    params: [
      "firebase_screen",
      "page_name",
      "authentication",
      "region",
      "subregion*",
      "transaction_id*",
      "transaction_type",
      "transaction_code",
      "transaction_name",
      "transaction_items",
      "value*",
      "result",
      "details*"
    ]
  },
  {
    key: "refresh",
    params: ["firebase_screen", "page_name", "region", "firebase_previous_screen", "previous_page", "subregion*", "details*"]
  },
  { key: "conversion", params: ["firebase_screen", "page_name", "region", "result", "subregion*", "details*"] }
];

/**
 * Normaliza o nome de um parâmetro para comparação: sem "*", sem espaços nas
 * pontas, minúsculo. ("subregion*" e "Subregion" viram "subregion".)
 */
export function normalizeParamLabel(label: string): string {
  return label.replace(/\*/g, "").trim().toLowerCase();
}

/**
 * Normaliza o nome de uma variante de Evento para achar o evento dela:
 * "[App] screen_view" → "screen_view"; "select_content" → "select_content".
 */
export function eventKeyFromVariantName(variantName: string): string {
  return variantName
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

/** Tira o sufixo "#id" do nome de uma propriedade de componente ("subregion#1472:0" → "subregion"). */
export function stripPropertyId(name: string): string {
  const hashIndex = name.lastIndexOf("#");
  return hashIndex > 0 ? name.slice(0, hashIndex) : name;
}
