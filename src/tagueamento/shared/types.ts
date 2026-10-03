/**
 * Tipos do TAGUEAMENTO compartilhados entre UI e main thread.
 * Separados dos tipos da acessibilidade (src/shared/types.ts).
 * Tudo aqui precisa ser serializável em JSON.
 */

// ---------- Fase 2: diagnóstico do card "[Helper] Google Analytics, atributo" ----------

/** Nome do componente da biblioteca, como está na spec (seção 7.1). */
export const GA_CARD_COMPONENT_NAME = "[Helper] Google Analytics, atributo";

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
