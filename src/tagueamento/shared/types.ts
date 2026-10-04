/**
 * Tipos do TAGUEAMENTO compartilhados entre UI e main thread.
 * Separados dos tipos da acessibilidade (src/shared/types.ts).
 * Tudo aqui precisa ser serializável em JSON.
 */

// ---------- Estrutura do card (leitura das linhas) ----------

/** Uma linha de parâmetro encontrada no card ("Specs": nome do parâmetro + Tag com o valor). */
export interface CardRowInfo {
  /** Texto do nome do parâmetro, como está no card (ex.: "subregion*"). */
  label: string;
  /** Texto atual do valor (ex.: "<Nome_da_tela>"). */
  value: string;
  visible: boolean;
  /** Nome (sem "#id") da toggle que liga/desliga esta linha, se houver. */
  toggle?: string;
}

// ---------- Fase 3: setup ----------

export type Plataforma = "APP" | "WEB";
export type ModoGeracao = "tela" | "pagina";

/** Lista de regions gerada do Excel no build (scripts/build-regions.mjs). */
export interface RegionsData {
  /** "planilha" = regions.xlsx real; "template" = regions.template.xlsx de exemplo. */
  fonte: "planilha" | "template";
  arquivo: string;
  totalLinhas: number;
  canais: RegionsCanal[];
}

export interface RegionsCanal {
  nome: string;
  plataforma: Plataforma;
  produtos: RegionsProduto[];
}

export interface RegionsProduto {
  nome: string;
  region: string;
  fluxos: RegionsFluxo[];
}

export interface RegionsFluxo {
  /** Coluna "Tarefa do usuário". */
  nome: string;
  /** Código da subregion, ou "N/A". */
  subregion: string;
}

/** Resultado do setup — o que vai para os cards. */
export interface SetupSelection {
  canal: string;
  plataforma: Plataforma;
  /** Nome legível (coluna Produto) ou o texto digitado no "Outro". */
  produto: string;
  region: string;
  produtoOutro: boolean;
  /** Nome legível (coluna Tarefa do usuário), texto do "Outro", ou "N/A". */
  fluxo: string;
  subregion: string;
  fluxoOutro: boolean;
  modo: ModoGeracao;
}

// ---------- Fase 4: travessia e mapeamento ----------

/** Um item mapeado num frame: o card de tela (número 1) ou um componente. */
export interface MappedItem {
  numero: number;
  /** Id do node no Figma (o próprio frame, no card de tela). */
  nodeId: string;
  /** Nome legível do componente (nome da regra, ou o nome do componente quando não reconhecido). */
  componente: string;
  /** Evento do card (ex.: "screen_view", "select_content"). */
  evento: string;
  origem: "tela" | "componente";
  /** Primeiro texto visível do componente (base do content_type / modal_name). */
  label: string | null;
  /** Parâmetros que o plugin já preencheu, com o nome igual ao do card (sem "*"). */
  params: Record<string, string>;
  /** Pontos que o PD precisa resolver na revisão (destacados). */
  pendencias: string[];
  /** Informações (não bloqueiam), ex.: termo em inglês trocado pelo dicionário. */
  notas: string[];
  /** Parâmetros de tempo de execução que o PD preenche na revisão (spec 5.1). */
  paraPd: string[];
  /** true quando o componente não está na tabela 4.2 (vira select_content até o PD confirmar). */
  naoReconhecido: boolean;
}

export interface MappedScreen {
  frameId: string;
  frameName: string;
  /** Duas primeiras palavras do nome do frame, normalizadas. */
  nomeTela: string;
  largura: number;
  altura: number;
  /** Plataforma pela largura (> 1000 px = WEB; ≤ 1000 px = APP). Só checagem. */
  plataformaPelaLargura: Plataforma;
  /** true quando a largura não combina com o canal escolhido no setup. */
  divergeDoCanal: boolean;
  /** Telas (nomeTela) com seta de protótipo chegando neste frame. */
  origens: string[];
  /** Telas (nomeTela) para onde saem setas deste frame. */
  destinos: string[];
  items: MappedItem[];
  avisos: string[];
}

export interface MappingResult {
  modo: ModoGeracao;
  screens: MappedScreen[];
  /** Avisos gerais (ex.: nenhum frame na página). */
  avisos: string[];
}

export interface TagSelectionState {
  /** true quando a seleção é um único frame/grupo (tela). */
  valid: boolean;
  nodeId: string | null;
  nodeName: string | null;
  nodeType?: string;
  width?: number;
  height?: number;
  /** Qualquer camada única selecionada (usado no "Adicionar evento manual"). */
  element?: { id: string; name: string; type: string } | null;
  /** Cards de tagueamento já gerados para a tela selecionada (0 = nenhum). */
  taggedCards?: number;
  /** Quantidade de camadas dentro da tela (só informativo). */
  layerCount?: number;
}

/** Fase 6: dados do elemento escolhido para um evento manual. */
export interface ElementInfo {
  nodeId: string;
  /** Nome do componente (conjunto de variantes / componente principal) ou da camada. */
  componente: string;
  /** Primeiro texto visível do elemento. */
  label: string | null;
  /** Frame de primeiro nível que contém o elemento (para avisar se é de outra tela). */
  frameId: string | null;
}

// ---------- Fase 7: geração ----------

export interface GenerationItem {
  numero: number;
  /** Componente marcado (o próprio frame no card de tela). */
  nodeId: string;
  componente: string;
  evento: string;
  origem: "tela" | "componente" | "manual";
  /** Texto do componente (só para os avisos da tela de resultado). */
  label?: string | null;
  /** Valores revisados, com o nome do parâmetro igual ao do card. */
  values: Record<string, string>;
}

export interface GenerationScreen {
  frameId: string;
  nomeTela: string;
  items: GenerationItem[];
}

export interface GenerationRequest {
  plataforma: Plataforma;
  screens: GenerationScreen[];
}

export interface GeneratedScreen {
  frameId: string;
  nomeTela: string;
  /** Cards criados nesta tela. */
  cards: number;
  /** Grupo "Tagueamento — …" criado (para "Mostrar na tela"). */
  groupId: string | null;
  avisos: string[];
  /** Os mesmos avisos dos cards, com o card a que se referem (para "Ir para"). */
  avisosDetalhados?: GenerationWarning[];
}

export interface GenerationWarning {
  numero: number;
  componente: string;
  label: string | null;
  mensagem: string;
  /** Card criado no canvas (para "Ir para"), ou null se o card não foi criado. */
  cardId: string | null;
}

/** Etapas reais da geração, na ordem em que o código as executa. */
export type GenerationStage = "biblioteca" | "cards" | "agrupando";

/** Tela da página inteira na lista de progresso do mapeamento. */
export interface MappingPlanItem {
  frameId: string;
  name: string;
  skipped: boolean;
}

export interface GenerationResult {
  screens: GeneratedScreen[];
  avisos: string[];
}

/** Situação da página antes de mapear em "Página inteira". */
export interface PageTagStatus {
  total: number;
  /** Nomes dos frames que já têm tagueamento gerado. */
  tagged: string[];
  /** Os mesmos frames, com id e quantidade de cards (lista com checkbox). */
  taggedFrames?: { frameId: string; name: string; cards: number }[];
}
