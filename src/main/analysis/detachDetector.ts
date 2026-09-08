/// <reference types="@figma/plugin-typings" />

import { DetachWarning } from "../../shared/types";

/**
 * Detecção de possíveis componentes detachados (seção 11 do briefing).
 *
 * LIMITAÇÃO TÉCNICA CONFIRMADA:
 * A Figma Plugin API não fornece um histórico de operações (não há
 * como perguntar "este node já foi um INSTANCE no passado?"). Não
 * existe metadado oficial de "detach" retroativo. Por isso este
 * detector NÃO tenta adivinhar histórico — ele só sinaliza um caso
 * que a própria Figma expõe de forma confiável:
 *
 *   Quando o usuário faz "Detach Instance" em uma instância, a Figma
 *   converte o node em um FRAME (ou GROUP) e, na maioria das versões
 *   do app, preserva o nome original da instância como o `node.name`
 *   do novo frame — sem marcá-lo com nenhum sufixo especial. Não há
 *   como diferenciar com certeza esse frame de um frame criado do
 *   zero pelo designer com o mesmo nome.
 *
 * Dado isso, para "priorizar precisão e evitar falsos positivos"
 * (exigência explícita do briefing), este detector NÃO classifica
 * nenhum FRAME/GROUP arbitrário como detachado. Ele fica com uma
 * lista vazia até que a Figma API exponha um sinal confiável (por
 * exemplo, se no futuro a API passar a expor
 * `node.componentPropertyReferences` residual ou similar em frames
 * "ex-instância"). O objetivo desta função, por ora, é existir como
 * ponto único de extensão — não gerar falsos positivos.
 */
export function detectPossibleDetachedComponents(_topLevelNodes: readonly SceneNode[]): DetachWarning[] {
  // Nenhum sinal confiável disponível na Figma Plugin API pública no
  // momento. Retornar lista vazia é o comportamento correto e seguro
  // até que uma API oficial de histórico/detach exista.
  return [];
}
