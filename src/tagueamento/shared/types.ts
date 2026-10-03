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
