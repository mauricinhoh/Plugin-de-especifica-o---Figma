/**
 * Tipos do TAGUEAMENTO compartilhados entre UI e main thread.
 * Separados dos tipos da acessibilidade (src/shared/types.ts).
 * Tudo aqui precisa ser serializável em JSON.
 */

// ---------- Fase 2: diagnóstico do card "[Helper] Google Analytics, atributo" ----------


export interface DiagnosedComponent {
  id: string;
  name: string;
  /** Chave usada por figma.importComponentByKeyAsync / importComponentSetByKeyAsync. */
  key: string;
  /** true quando vem de uma biblioteca publicada (não é local do arquivo). */
  remote: boolean;
}

export interface DiagnosedProperty {
  /** Nome completo, como a API exige em setProperties (booleanas/texto têm sufixo "#id"). */
  name: string;
  /** Nome sem o sufixo "#id", como aparece no painel do Figma. */
  displayName: string;
  /** "VARIANT", "BOOLEAN", "TEXT", "INSTANCE_SWAP" (ou outro tipo que a API venha a ter). */
  type: string;
  /** Valor atual nesta instância. */
  value: string | boolean;
  /** Valor padrão no componente (quando a API informa). */
  defaultValue?: string | boolean;
  /** Opções possíveis — só para VARIANT (ex.: as variantes de "Evento"). */
  options?: string[];
}

export interface DiagnosedLayer {
  depth: number;
  type: string;
  name: string;
  visible: boolean;
  /** Conteúdo atual, só para camadas de texto (cortado em 120 caracteres). */
  characters?: string;
  /** Fonte da camada de texto (família + estilo), quando é uma só. */
  font?: string;
  /**
   * Propriedades do componente ligadas a esta camada (ex.: visible ← "subregion#12:3",
   * characters ← "valor#4:5"). É o que diz qual toggle controla qual linha.
   */
  propertyRefs?: Record<string, string>;
}

export interface CardDiagnosis {
  /** Id do node selecionado (para criar o card de teste ao lado dele). */
  nodeId: string;
  nodeName: string;
  nodeType: string;
  width: number;
  height: number;
  mainComponent: DiagnosedComponent | null;
  componentSet: DiagnosedComponent | null;
  properties: DiagnosedProperty[];
  layers: DiagnosedLayer[];
  layersTruncated: boolean;
  /** Fontes usadas nas camadas de texto — precisam ser carregadas antes de editar textos. */
  fonts: string[];
  /** Avisos do diagnóstico (ex.: nome diferente do esperado, leitura que a API negou). */
  warnings: string[];
}

export interface TestCardResult {
  ok: boolean;
  message: string;
  /** Como a instância foi criada — informação importante para a Fase 7. */
  method?: string;
  /** Erro da importação pela chave, quando ela falhou e o plugin usou o plano B. */
  importError?: string;
  /** Propriedades efetivamente aplicadas ao card de teste. */
  appliedProperties?: Record<string, string>;
}

// ---------- Fase 2.1: verificação de todas as variantes do card ----------

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

export interface VariantCheck {
  /** Evento da spec (ex.: "screen_view"). */
  eventKey: string;
  /** Nome da variante encontrada no card (ex.: "[App] screen_view"), ou null se não achou. */
  variantName: string | null;
  /** true quando todos os parâmetros da spec foram encontrados no card. */
  ok: boolean;
  expectedCount: number;
  foundCount: number;
  /** Parâmetros da spec que o card não tem. */
  missing: string[];
  /** Linhas do card que não estão na lista da spec (informativo, não é erro). */
  extra: string[];
  rows: CardRowInfo[];
  /** Texto do título do card (camada "Type"), se encontrado. */
  typeText?: string;
  /** true quando o card tem a área de número ("Number"). */
  hasNumber: boolean;
  /** Erro ao ler esta variante, se houver. */
  error?: string;
}

export interface AllVariantsCheck {
  /** Chave usada na importação (a que está no código). */
  keyUsed: string;
  /** true quando figma.importComponentSetByKeyAsync funcionou com essa chave. */
  importOk: boolean;
  importError?: string;
  /** De onde vieram as variantes lidas: importação pela chave ou o card selecionado. */
  source: "import" | "selection" | "none";
  setName?: string;
  setNameOk: boolean;
  /** Chave real lida do card (quando foi possível ler). */
  actualSetKey?: string;
  /** Opções da variante Evento no card. */
  variantOptions: string[];
  /** Variantes do card que não correspondem a nenhum evento da spec. */
  unmatchedVariants: string[];
  /** Toggles (BOOLEAN) do card, sem o sufixo "#id". */
  toggles: string[];
  /** true quando a toggle "Mostrar atributos" foi encontrada. */
  showToggleFound: boolean;
  checks: VariantCheck[];
  warnings: string[];
}

// ---------- Fase 3: setup ----------

export type Plataforma = "APP" | "WEB";
export type ModoGeracao = "tela" | "pagina";

/** Lista de regions gerada do Excel no build (scripts/build-regions.mjs). */
export interface RegionsData {
  /** "planilha" = regions.xlsx real; "template" = regions.template.xlsx de exemplo. */
  fonte: "planilha" | "template";
  arquivo: string;
  geradoEm: string;
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
}
