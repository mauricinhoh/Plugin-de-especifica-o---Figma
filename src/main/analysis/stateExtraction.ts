/// <reference types="@figma/plugin-typings" />

/**
 * Identificação de "estados" de um componente (seção 9 e 24 do
 * briefing de Handoff).
 *
 * INVESTIGAÇÃO (atualizada nesta revisão):
 *
 * A propriedade original usada aqui, `InstanceNode.variantProperties`,
 * está marcada como DEPRECATED na documentação atual da Figma Plugin
 * API — "Use componentProperties instead." Continua funcionando (não
 * há nenhuma restrição documentada de dynamic-page para ela, ao
 * contrário de `mainComponent`), mas a forma recomendada e à prova de
 * futuro é `InstanceNode.componentProperties`, que devolve TODAS as
 * component properties da instância (não só variantes), no formato:
 *
 *   {
 *     Size: { type: "VARIANT", value: "Medium" },
 *     "IsDisabled#12:0": { type: "BOOLEAN", value: false },
 *     ...
 *   }
 *
 * Como "estado" no sentido do documento de regras de acessibilidade
 * (Habilitado/Desabilitado/Foco/etc.) é, na prática, quase sempre
 * modelado como uma VARIANT property (não uma BOOLEAN solta), esta
 * função filtra só as entradas com `type === "VARIANT"` e usa seus
 * valores — mesmo formato de dado que `variantProperties` já dava,
 * só que pela API atualmente recomendada.
 *
 * DECISÃO: esta função só CAPTURA o dado real (nome de cada
 * component property do tipo VARIANT e seu valor). A lógica de
 * transformar isso em candidatos de comparação (`buildStateCandidates`)
 * e de escolher qual estado bate (`selectVerbalizationTemplate`) fica
 * em `rules/engine.ts` — ambas são código puro, sem chamadas à API do
 * Figma, e precisam ser compartilhadas com a UI (que recalcula a
 * verbalização quando o designer troca o Tipo de marcação
 * manualmente), então não podem morar neste arquivo (que só existe no
 * main thread).
 */
/**
 * Propriedades BOOLEANAS (toggles liga/desliga) da instância, ex.:
 * `{ Hiden: "true" }` — o sufixo de id que o Figma põe no nome
 * ("Hiden#12:0") é removido. Usadas SÓ para conferir `derivedStates`
 * (ver engine.ts → buildStateCandidates); não viram candidatos de
 * estado por conta própria, para não mudar a escolha de estado dos
 * outros componentes. Necessário para o Currency, cujo "Hiden" é uma
 * toggle (confirmado com o usuário em 05/10/2026).
 */
export function extractBooleanProperties(node: SceneNode): Record<string, string> | null {
  if (node.type !== "INSTANCE") {
    return null;
  }
  const componentProperties = node.componentProperties;
  if (!componentProperties) {
    return null;
  }

  const booleanValues: Record<string, string> = {};
  for (const [propertyName, property] of Object.entries(componentProperties)) {
    if (property.type === "BOOLEAN" && typeof property.value === "boolean") {
      booleanValues[propertyName.split("#")[0].trim()] = property.value ? "true" : "false";
    }
  }

  return Object.keys(booleanValues).length > 0 ? booleanValues : null;
}

export function extractVariantProperties(node: SceneNode): Record<string, string> | null {
  if (node.type !== "INSTANCE") {
    return null;
  }
  const componentProperties = node.componentProperties;
  if (!componentProperties) {
    return null;
  }

  const variantValues: Record<string, string> = {};
  for (const [propertyName, property] of Object.entries(componentProperties)) {
    if (property.type === "VARIANT" && typeof property.value === "string") {
      variantValues[propertyName] = property.value;
    }
  }

  return Object.keys(variantValues).length > 0 ? variantValues : null;
}
