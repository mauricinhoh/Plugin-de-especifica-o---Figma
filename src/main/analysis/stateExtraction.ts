/// <reference types="@figma/plugin-typings" />

/**
 * Identificação de "estados" de um componente (seção 9 e 24 do
 * briefing de Handoff).
 *
 * INVESTIGAÇÃO (conforme exigido antes de codificar esta parte):
 *
 * A Figma Plugin API expõe, para qualquer `InstanceNode` cujo
 * componente principal pertença a um `COMPONENT_SET` (ou seja, um
 * componente com variantes), a propriedade real e documentada:
 *
 *   InstanceNode.variantProperties: { [property: string]: string } | null
 *
 * Esse objeto contém exatamente os valores das propriedades de
 * variante daquela instância específica — por exemplo, para um botão
 * com variantes de Design System, algo como
 * `{ State: "Hover", Size: "Large" }` ou `{ Estado: "Desabilitado" }`,
 * dependendo de como cada Design System nomeou suas propriedades.
 *
 * Essa é a fonte MAIS CONFIÁVEL disponível na API pública para saber
 * o estado real de uma instância: vem diretamente da estrutura de
 * variantes do componente, não de uma inferência sobre o nome visual
 * da camada. `variantProperties` é `null` quando o componente
 * principal não pertence a um ComponentSet (não tem variantes).
 *
 * Existe também `InstanceNode.componentProperties`, que cobre
 * propriedades booleanas/texto/instance-swap (não-variante) definidas
 * no componente — útil no futuro se algum Design System modelar
 * estado como propriedade booleana (ex.: "Disabled") em vez de
 * variante. Por ora, capturamos apenas `variantProperties`, que é o
 * caso mais comum para "estado" (hover/focus/disabled/etc. quase
 * sempre são variantes, não propriedades booleanas soltas); o mesmo
 * padrão pode ser estendido para `componentProperties` quando a
 * planilha real mostrar que algum componente usa esse modelo.
 *
 * DECISÃO: esta função só CAPTURA o dado real e a estrutura fica
 * pronta para uso; ela NÃO tenta mapear esses valores para um
 * "estado esperado" de verbalização — essa lógica depende da coluna
 * "Estados" da planilha real, que ainda não foi fornecida (seção 5 e
 * 9 do briefing: não inventar essa lógica agora).
 */
export function extractVariantProperties(node: SceneNode): Record<string, string> | null {
  if (node.type !== "INSTANCE") {
    return null;
  }
  const variantProperties = node.variantProperties;
  if (!variantProperties) {
    return null;
  }
  return { ...variantProperties };
}
