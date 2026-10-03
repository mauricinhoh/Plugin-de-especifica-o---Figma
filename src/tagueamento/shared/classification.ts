/**
 * Classificação dos componentes Colmeia para o TAGUEAMENTO.
 * Fonte: TAGUEAMENTO_SPEC.md, seção 4.2 (validada pelo Mau em 01/10/2026),
 * com as decisões da Fase 4 (03/10/2026):
 *  - "container" e "nao_marcar": não viram card, mas o plugin percorre por dentro
 *    (ex.: botão "Tentar novamente" dentro de um Empty State vira select_content).
 *  - modal_view e feedback: viram card E o plugin percorre por dentro
 *    (botões dentro de Modal/Drawer ganham local_type = Modal).
 *  - select_content e search: viram card e o plugin NÃO entra (o que tem dentro é parte deles).
 *  - Componente fora da tabela: o plugin percorre por dentro; se não achar nada
 *    reconhecido e o componente tiver texto, vira select_content marcado
 *    "não reconhecido, confirme".
 *  - Chevron: regra adiada para os testes.
 *
 * Ajustes do Mau (03/10/2026, testes da Fase 4):
 *  - Table: o componente inteiro vira um item (select_content), sem entrar nele.
 *  - Breadcrumb: não é mapeado (nem ele nem o que tem dentro).
 *  - Input Search: é o componente de search (vira um item só, sem entrar nele).
 *
 * Dados puros: para mudar a classificação, edite só este arquivo.
 */

import { GaEventKey } from "./gaCard";

export type ComponentClass = "select_content" | "search" | "feedback" | "modal_view" | "container" | "nao_marcar";

/**
 * Valor de ação quando o componente não tem label (spec 4.2):
 *  - texto fixo (ex.: "Expandir", "Selecionar");
 *  - "label": usa o label; se não tiver texto, fica pendente para o PD;
 *  - "pd": sempre preenchido pelo PD na revisão (Button Icon).
 */
export type ActionSource = string | { kind: "label" } | { kind: "pd" };

export interface ClassificationRule {
  names: string[];
  classe: ComponentClass;
  acao?: ActionSource;
}

const LABEL: ActionSource = { kind: "label" };
const PD: ActionSource = { kind: "pd" };

export const CLASSIFICATION: ClassificationRule[] = [
  // "Input Search": o componente inteiro é o search, sem entrar nele (ajuste do Mau, 03/10/2026).
  { names: ["Search", "Input Search"], classe: "search", acao: "Buscar" },
  { names: ["Alert", "Toast", "Flag", "Flag Cooperado"], classe: "feedback" },
  { names: ["Modal", "Drawer"], classe: "modal_view" },
  {
    names: [
      "Button Primary",
      "Button Secondary",
      "Button Mini",
      "Link Icon",
      "Shortcut",
      "Tab",
      "List Navigation",
      "Menu Button",
      "Popover Menu"
    ],
    classe: "select_content",
    acao: LABEL
  },
  { names: ["Accordion"], classe: "select_content", acao: "Expandir" },
  {
    names: ["Checkbox", "Radio Button", "List Select", "Chip Select", "Dropdown", "Input Select"],
    classe: "select_content",
    acao: "Selecionar"
  },
  { names: ["Chip Filter"], classe: "select_content", acao: "Filtrar" },
  { names: ["Switch"], classe: "select_content", acao: "Ativar / Desativar" },
  { names: ["Date Picker"], classe: "select_content", acao: "Selecionar_data" },
  { names: ["Pagination", "Carousel Nav"], classe: "select_content", acao: "Navegar" },
  { names: ["Uploader"], classe: "select_content", acao: "Anexar" },
  { names: ["Rate Input", "Cookies", "Banner Image Full"], classe: "select_content", acao: LABEL },
  {
    names: [
      "Input Text",
      "Input Text Area",
      "Input Password",
      "Input Code",
      "Input Code Number",
      "Input Date",
      "Currency"
    ],
    classe: "select_content",
    acao: LABEL
  },
  { names: ["Button Icon"], classe: "select_content", acao: PD },
  // Table: o componente inteiro vira um item e o plugin não entra nele (ajuste do Mau, 03/10/2026).
  // A ação fica para o PD na revisão até a regra da tabela ser definida.
  { names: ["Table"], classe: "select_content", acao: PD },
  { names: ["Card", "Card Review", "Fixed Bar", "Header Product", "Button Group"], classe: "container" },
  {
    names: [
      "Avatar Business",
      "Avatar Name",
      "Badge",
      "Brand",
      "Description",
      "Heading",
      "Icon",
      "Icon Shape",
      "Image",
      "Loading",
      "Page Indicator",
      "Paragraph",
      "Progress Line",
      "Skeleton",
      "Tag Container",
      "Tag Icon",
      "Topic",
      "List Content",
      "List Ghost",
      "Tooltip",
      "Empty State",
      "Credit Card"
    ],
    classe: "nao_marcar"
  }
];

/**
 * Camadas ignoradas por completo (não viram card e o plugin não entra) —
 * os mesmos "cabeçalhos fixos" que a acessibilidade ignora (decisão do Mau,
 * 03/10/2026). Lista copiada, não compartilhada.
 */
export const IGNORED_LAYER_NAMES = [
  "Header Web",
  "[IB-Leg] Acessibility Settings Bar",
  "[IB-Leg] Header",
  "[IB-Leg] Navigation Bar",
  "[IB-Leg] Footer",
  // Não mapear (ajuste do Mau, 03/10/2026): nem o componente nem o que tem dentro.
  "Breadcrumb"
];

/** Evento gerado por classe (container e nao_marcar não geram). */
export const EVENT_BY_CLASS: Partial<Record<ComponentClass, GaEventKey>> = {
  select_content: "select_content",
  search: "search",
  feedback: "feedback",
  modal_view: "modal_view"
};

function normalizeName(name: string): string {
  return name.replace(/\s+/g, " ").trim().toLowerCase();
}

const RULE_BY_NAME = new Map<string, { rule: ClassificationRule; name: string }>();
for (const rule of CLASSIFICATION) {
  for (const name of rule.names) RULE_BY_NAME.set(normalizeName(name), { rule, name });
}

/**
 * Procura a regra pelos nomes candidatos (instância, conjunto de variantes,
 * componente principal). Compara o nome inteiro e o último trecho depois de
 * "/" (pastas do painel de Assets), sem diferenciar maiúsculas.
 */
export function findClassification(candidates: (string | null | undefined)[]): { rule: ClassificationRule; name: string } | null {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const full = normalizeName(candidate);
    const last = normalizeName(candidate.split("/").pop() ?? candidate);
    const match = RULE_BY_NAME.get(full) ?? RULE_BY_NAME.get(last);
    if (match) return match;
  }
  return null;
}

const IGNORED_NORMALIZED = IGNORED_LAYER_NAMES.map(normalizeName);

/** true quando algum nome (inteiro ou último trecho depois de "/") está na lista de ignorados. */
export function isIgnoredLayer(names: (string | null | undefined)[]): boolean {
  return names.some((name) => {
    if (!name) return false;
    const full = normalizeName(name);
    const last = normalizeName(name.split("/").pop() ?? name);
    return IGNORED_NORMALIZED.includes(full) || IGNORED_NORMALIZED.includes(last);
  });
}
