/**
 * Tipos de domínio compartilhados entre a UI (iframe) e o main thread
 * (sandbox com acesso à Figma API).
 *
 * Regra de arquitetura: apenas dados serializáveis atravessam essa
 * fronteira. Nunca um objeto de node do Figma é enviado diretamente
 * para a UI.
 */

/** Contexto de plataforma da tela analisada. */
export type ScreenContext = "WEB" | "APLICATIVO";

/** Origem do componente dentro do Design System. */
export type CoreType = "CORE_WEB" | "CORE_APP" | "DESCONHECIDO";

/**
 * Um item de especificação: representa um componente (automático ou
 * selecionado manualmente) que vai gerar um card na Etapa 2, uma
 * marcação no canvas e uma entrada no painel final.
 */
export interface SpecificationItem {
  /** Id interno da especificação. Independente do nodeId do Figma. */
  id: string;
  /** Id do node original no documento Figma. */
  nodeId: string;
  /** node.name no momento da descoberta/seleção. */
  nodeName: string;
  /** node.type original (INSTANCE, COMPONENT, etc.). */
  nodeType: string;
  /**
   * Chave de uma das 9 categorias fixas de "Tipo de marcação" (ver
   * rules/markupTypes.ts), ou o valor especial "nao-especificado".
   * É o valor exibido/editável no dropdown da Etapa 2.
   */
  markupType: string;
  /**
   * Chave da regra de `accessibility-rules.ts` que foi originalmente
   * identificada automaticamente para este componente, ou null se
   * nenhuma regra correspondeu. Usada para recalcular a verbalização
   * quando o designer muda o "Tipo de marcação" de volta para a
   * categoria da regra original (seção 13 do briefing de Handoff).
   * Não é exibida diretamente na UI.
   */
  ruleKey: string | null;
  /**
   * Propriedades de variante da instância no Figma (ex.:
   * `{ State: "Hover" }`), capturadas para uso futuro pela coluna
   * "Estados" da planilha (seção 9). null quando o node não é uma
   * instância de componente com variantes.
   */
  variantProperties: Record<string, string> | null;
  /** Origem Core do componente, quando aplicável. */
  coreType: CoreType;
  /** Dados brutos extraídos do Figma pela regra (ex.: { text: "Pagar" }). */
  extractedData: Record<string, string>;
  /** Texto final de verbalização, editável pelo designer. */
  verbalization: string;
  /** Posição atual na lista (0-based). Recalculada a cada reordenação. */
  order: number;
  /** true se foi adicionado via "Selecionar componente manualmente". */
  manuallyAdded: boolean;
  /** true se o designer editou manualmente o texto de verbalização. */
  verbalizationEdited: boolean;
  /**
   * Se este componente é elegível a receber um número de Ordem de
   * foco (Regra 3/4 do documento de regras de acessibilidade — só
   * componentes com "Foco: Sim" na planilha). Estruturas (Card,
   * Table, Modal etc.) são sempre false aqui; seus componentes
   * internos têm sua própria entrada com seu próprio valor.
   */
  focusEligible: boolean;
}

/** Aviso de incompatibilidade de Core (bloqueia a geração). */
export interface CoreIncompatibility {
  nodeId: string;
  nodeName: string;
  foundCoreType: Exclude<CoreType, "DESCONHECIDO">;
  expectedContext: ScreenContext;
}

/** Aviso de possível componente detachado (não bloqueia). */
export interface DetachWarning {
  nodeId: string;
  nodeName: string;
}

/** Resultado completo da análise de uma tela, enviado da main thread para a UI. */
export interface ScreenAnalysisResult {
  screenNodeId: string;
  screenName: string;
  /** Preenchido automaticamente quando não há empate; senão fica null. */
  context: ScreenContext | null;
  /** true quando Core Web === Core App > 0, exigindo pergunta ao designer. */
  requiresContextChoice: boolean;
  coreWebCount: number;
  coreAppCount: number;
  items: SpecificationItem[];
  incompatibilities: CoreIncompatibility[];
  detachWarnings: DetachWarning[];
}

/**
 * Uma opção do dropdown "Tipo de marcação" da Etapa 2: uma das 12
 * categorias fixas (rules/markupTypes.ts) ou "Não especificado".
 */
export interface ComponentTypeOption {
  key: string;
  label: string;
}

/** Etapas reais executadas pela geração (seção 9 do prompt de redesign). */
export type GenerationStage = "reading-order" | "markers" | "table";

/** Resumo mostrado na tela "Concluído" ao final da geração. */
export interface GenerationSummary {
  componentCount: number;
  verbalizationCount: number;
  warningCount: number;
  screenName: string;
  outputNodeId: string;
}

/**
 * Um registro de uso do plugin nesta página do Figma — gravado a
 * cada "Gerar especificações" bem-sucedido. Serve dois propósitos:
 * 1. Rastro de auditoria ("o plugin foi usado aqui?"), lido
 *    futuramente por uma ferramenta separada (ver
 *    `main/analysis/usageLog.ts` para onde/como é gravado).
 * 2. Matéria-prima para o export em .docx, que junta o histórico
 *    acumulado de execuções da página inteira, não só a última.
 */
export interface UsageLogEntry {
  /** ISO 8601, momento em que "Gerar especificações" foi concluído. */
  dateIso: string;
  designerName: string;
  screenName: string;
  /** Um item por componente incluído naquela geração específica. */
  items: Array<{
    nodeName: string;
    markupTypeLabel: string;
    verbalization: string;
    /** Links que devem virar hyperlink de verdade no .docx exportado — ver ComponentTypeRule.links. */
    links?: Array<{ text: string; url: string }>;
  }>;
}
