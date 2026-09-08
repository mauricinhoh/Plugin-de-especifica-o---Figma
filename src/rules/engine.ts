/**
 * Motor de regras genérico.
 *
 * Este arquivo NÃO conhece nada sobre "acessibilidade" nem sobre
 * "Figma" diretamente. Ele define o contrato que qualquer domínio de
 * regras (acessibilidade hoje, tagueamento/analytics futuramente)
 * precisa implementar, e a função pura que aplica uma regra a um
 * conjunto de dados extraídos.
 *
 * Dados extraídos do Figma (ex.: "primeiro TEXT encontrado") são
 * responsabilidade da camada de análise (src/main/analysis), não
 * deste arquivo.
 */

import { MarkupTypeKey } from "./markupTypes";
import { resolvePlaceholders } from "./placeholders";

export interface ExtractedTextData {
  /** Conteúdo do primeiro node TEXT encontrado dentro do componente, se houver. */
  text?: string;
}

/**
 * Como uma regra de tipo de componente identifica se um determinado
 * componente do Figma corresponde a esse tipo. `nodeName` é o nome
 * do node/instância; `componentName` é o nome do componente principal
 * (quando aplicável).
 */
export interface ComponentIdentifier {
  /** Testa se o nome do componente/instância corresponde a este tipo. */
  matches: (input: { nodeName: string; componentName: string | null }) => boolean;
}

/**
 * Definição de uma regra de tipo de componente para um domínio
 * (ex.: acessibilidade). Ver seção 16 do briefing.
 */
export interface ComponentTypeRule<TExtracted extends object = ExtractedTextData> {
  /** Chave estável usada internamente (ex.: "botao"). */
  key: string;
  /** Nome legível da regra, para documentação/depuração (não é mais exibido no SELECT — ver markupTypes.ts). */
  label: string;
  /**
   * A qual das 9 categorias fixas de "Tipo de marcação" este
   * componente pertence (seção 2 do briefing de Handoff). É esse
   * valor, não `key`/`label`, que aparece selecionado no dropdown da
   * Etapa 2.
   */
  markupType: MarkupTypeKey;
  /** Como identificar automaticamente este tipo a partir do node do Figma. */
  identifier: ComponentIdentifier;
  /** Se este tipo produz verbalização. Se false, o campo fica sempre vazio. */
  hasVerbalization: boolean;
  /**
   * Quais dados devem ser extraídos do Figma para este tipo.
   * Hoje só existe extração de "primeiro TEXT". A estrutura é uma lista
   * para permitir extensão futura sem quebrar o contrato.
   */
  extraction: Array<"first-text">;
  /**
   * Template de verbalização. Usa placeholders "(Nome)", "[Nome]" ou
   * "{Nome}" — os três estilos usados pela planilha real; ver
   * `placeholders.ts`. Só é usado quando hasVerbalization === true.
   */
  template?: string;
  /**
   * Verbalizações alternativas por estado/variante (ex.: "Habilitado",
   * "Foco", "Loading macOS"), quando a planilha descreve mais de uma.
   * `template` acima é o valor usado hoje como verbalização inicial
   * (normalmente o primeiro estado, tipicamente "Habilitado"); este
   * mapa fica disponível para quando a seleção automática por estado
   * real da instância (ver SpecificationItem.variantProperties) for
   * implementada — não é consumido pelo motor ainda.
   */
  states?: Record<string, string>;
}

/**
 * Gera a verbalização inicial de um componente a partir da regra do
 * seu tipo e dos dados extraídos. Retorna string vazia quando o tipo
 * não possui verbalização (regra explícita, não texto inventado).
 */
export function computeVerbalization(
  rule: ComponentTypeRule | undefined,
  extractedData: Record<string, string>
): string {
  if (!rule || !rule.hasVerbalization || !rule.template) {
    return "";
  }
  return resolvePlaceholders(rule.template, extractedData);
}

/**
 * Encontra a regra correspondente a um componente do Figma, testando
 * cada regra cadastrada do domínio na ordem em que foram definidas.
 * Retorna undefined quando nenhuma regra corresponde (caso "Não
 * especificado", ver seção 21 do briefing).
 */
export function findMatchingRule<TExtracted extends object>(
  rules: ComponentTypeRule<TExtracted>[],
  input: { nodeName: string; componentName: string | null }
): ComponentTypeRule<TExtracted> | undefined {
  return rules.find((rule) => rule.identifier.matches(input));
}

/** Chave reservada para o caso em que nenhuma regra corresponde ao componente. */
export const UNSPECIFIED_TYPE_KEY = "nao-especificado";

export const UNSPECIFIED_TYPE_LABEL = "Não especificado";
