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
   * A qual das 12 categorias fixas de "Tipo de marcação" este
   * componente pertence. É esse valor, não `key`/`label`, que aparece
   * selecionado no dropdown da Etapa 2.
   */
  markupType: MarkupTypeKey;
  /** Como identificar automaticamente este tipo a partir do node do Figma. */
  identifier: ComponentIdentifier;
  /** Se este tipo produz verbalização. Se false, o campo fica sempre vazio. */
  hasVerbalization: boolean;
  /**
   * Quais dados devem ser extraídos do Figma para este tipo.
   * "first-text": primeiro TEXT visível encontrado (padrão, a maioria
   * dos componentes). "all-text": todos os textos visíveis, juntados
   * com ", " — para componentes com múltiplos textos que formam a
   * verbalização junto (ex.: Breadcrumb). Os dois preenchem o mesmo
   * campo `extractedData.text`, então uma regra deve usar só um dos
   * dois na prática.
   */
  extraction: Array<"first-text" | "all-text">;
  /**
   * Template de verbalização. Usa placeholders "(Nome)", "[Nome]" ou
   * "{Nome}" — os três estilos usados pela planilha real; ver
   * `placeholders.ts`. Só é usado quando hasVerbalization === true.
   */
  template?: string;
  /**
   * Verbalizações alternativas por estado/variante (ex.: "Habilitado",
   * "Foco", "Loading macOS"), quando a planilha descreve mais de uma.
   * `template` é usado como padrão; `computeVerbalization` tenta
   * primeiro achar um estado deste mapa que bata com o estado real da
   * instância no Figma (ver `selectVerbalizationTemplate` abaixo).
   */
  states?: Record<string, string>;
  /**
   * Se este componente recebe número de Ordem de foco (Regra 3 do
   * documento de regras de acessibilidade). Vem da coluna "Foco" da
   * planilha: true só quando o valor é exatamente "Sim". Componentes
   * do tipo Estrutura têm "Foco" = "Apenas elementos interativos" —
   * ou seja, a ESTRUTURA em si nunca recebe número (focusEligible
   * false), mas os componentes internos dela têm sua própria regra
   * e seu próprio "Foco", então continuam elegíveis normalmente
   * (ver Regra 4 e main/generation/panel.ts).
   */
  focusEligible: boolean;
  /**
   * Se true, a descoberta cria um card para este componente E
   * continua descendo dentro dele procurando outros componentes
   * reconhecidos (ex.: "Header Product", que sempre tem um
   * "Breadcrumb" ou título de verdade dentro). Default (ausente) é
   * false: comportamento padrão de "para aqui, não desce" — ver
   * discovery.ts.
   */
  alwaysDescend: boolean;
  /**
   * Traduz o NOME de uma propriedade booleana do Figma (quando "true")
   * para o rótulo de estado correspondente na planilha, quando eles
   * usam palavras diferentes — ex.: a propriedade do Figma se chama
   * "Selected" (inglês), mas o estado na planilha se chama "Marcado"
   * (português). Sem esse mapa, "Selected: true" nunca bateria com
   * "Marcado" (são palavras diferentes, não uma questão de
   * maiúscula/abreviação). Descoberto via log de diagnóstico real com
   * o usuário — ver stateExtraction.ts.
   */
  stateFlagAliases?: Record<string, string>;
  /**
   * Regras de inferência por AUSÊNCIA de sinal — para estados que o
   * Figma não representa com nenhuma propriedade "true" (ex.:
   * "Desmarcado" de um Checkbox: não existe uma propriedade
   * "Unselected: true", só a AUSÊNCIA de "Selected"/"Indeterminate").
   *
   * IMPORTANTE: isso é ESPECÍFICO de cada componente, cadastrado só
   * quando confirmado com dados reais — nunca um algoritmo genérico
   * aplicado a todo mundo. Componentes diferentes podem ter
   * convenções de variant property completamente diferentes, então
   * cada um precisa da própria regra (ou nenhuma, se não tiver esse
   * problema). Ver discussão com o usuário: "não podemos inferir que
   * o que funciona vai funcionar para todos".
   *
   * `whenFlagsEqual` precisa bater EXATAMENTE com todas as
   * propriedades listadas (comparação sem diferenciar maiúsculas) —
   * um match parcial não conta, para não produzir um estado errado
   * quando outras propriedades relevantes (ex.: Disabled) também
   * estiverem ativas.
   */
  derivedStates?: Array<{ whenFlagsEqual: Record<string, string>; thenState: string }>;
  /**
   * Links reais que devem virar HYPERLINK de verdade no .docx
   * exportado (não só texto azul — um link clicável de verdade).
   * `text` precisa aparecer exatamente dentro do template/verbalização
   * final; é esse trecho que a geração do docx troca por um hyperlink
   * apontando para `url`. Ver ui/docx/generateHandoffDocx.ts.
   */
  links?: Array<{ text: string; url: string }>;
}

/**
 * Normaliza uma palavra para comparação: minúsculas, sem espaço nas
 * pontas.
 */
function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

/**
 * Extrai os "tokens" de comparação de um rótulo de estado da
 * planilha, considerando a FRASE INTEIRA de cada lado (separado por
 * "/", ex.: "Habilitado/Focus" vira dois tokens: "habilitado" e
 * "focus"). Usado na primeira tentativa de casar com o estado real
 * do Figma — cobre o caso comum de um rótulo ser o nome completo do
 * estado (ex.: "Não selecionada").
 */
function fullPhraseTokens(label: string): string[] {
  return label
    .split("/")
    .map((part) => normalizeWord(part))
    .filter((word) => word.length > 0);
}

/**
 * Reduz cada rótulo à PRIMEIRA PALAVRA de cada lado (ex.: "Disabled
 * macOS" e "Disabled Windows" viram ambos "disabled"). Usada só como
 * segunda tentativa, quando a frase inteira não bateu — serve para
 * rótulos com sufixo de plataforma/variação que o Figma não distingue
 * (o Figma só diz "Disabled", sem macOS/Windows).
 */
function firstWordTokens(label: string): string[] {
  return label
    .split("/")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter((word): word is string => Boolean(word))
    .map(normalizeWord);
}

/**
 * Transforma as variant properties capturadas do Figma
 * (`extractVariantProperties` em main/analysis/stateExtraction.ts) em
 * uma lista de "candidatos" para comparar com os rótulos de estado da
 * planilha (ver `selectVerbalizationTemplate` abaixo).
 *
 * DESCOBERTA REAL (confirmada via log de diagnóstico com o usuário):
 * o Design System não modela "estado" como uma única propriedade com
 * valores tipo "Marcado"/"Desmarcado" — usa várias propriedades
 * separadas tipo interruptor (ex.: `Selected: "True"`, `Indeterminate:
 * "True"`, `Disabled: "True"`) mais uma propriedade `State` genérica
 * para hover/foco/default. Um valor "True"/"False" sozinho não diz
 * nada — o que importa é QUAL propriedade está "True".
 *
 * Por isso, para cada propriedade:
 *   - se o valor for exatamente "true" (sem diferenciar maiúsculas),
 *     o NOME da propriedade também vira candidato (ex.:
 *     `Selected: "True"` → candidato "Selected" — que precisa de um
 *     `stateFlagAliases` na regra se a planilha usar outra palavra,
 *     ex. "Marcado", já que os nomes de propriedade do Figma tendem a
 *     vir em inglês);
 *   - se o valor for "false", nada é adicionado (não temos como
 *     inferir com segurança um rótulo "negativo" tipo "Desmarcado" só
 *     a partir de "Selected: false", sem arriscar inventar);
 *   - qualquer outro valor (ex.: "Default", "Focus", "Hover") entra
 *     como candidato normalmente.
 *
 * LIMITAÇÃO CONHECIDA: estados que representam "nada está ativo" (ex.:
 * "Desmarcado" de um Checkbox, quando Selected e Indeterminate estão
 * ambos "false") não têm um sinal positivo do Figma para casar — não
 * existe uma propriedade "Unselected: true". Esses casos continuam
 * caindo no texto padrão da regra (com todos os estados listados) em
 * vez do texto específico daquele estado.
 *
 * Mora aqui (não em stateExtraction.ts) porque é código puro, sem
 * chamada à API do Figma, e a UI também precisa dele para recalcular
 * a verbalização quando o designer troca o Tipo de marcação
 * manualmente (ver ui/state/specificationStore.ts) — stateExtraction.ts
 * só existe no main thread.
 */
export function buildStateCandidates(
  variantProperties: Record<string, string> | null,
  derivedStates?: Array<{ whenFlagsEqual: Record<string, string>; thenState: string }>
): string[] {
  if (!variantProperties) return [];
  const candidates: string[] = [];
  for (const [propertyName, value] of Object.entries(variantProperties)) {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === "true") {
      candidates.push(propertyName);
    } else if (normalizedValue !== "false") {
      candidates.push(value);
    }
  }

  // Regras de inferência por ausência de sinal — específicas de cada
  // componente (ver ComponentTypeRule.derivedStates). Só entra em
  // ação quando TODAS as propriedades listadas baterem exatamente.
  if (derivedStates) {
    for (const rule of derivedStates) {
      const allMatch = Object.entries(rule.whenFlagsEqual).every(([flag, expected]) => {
        const actual = variantProperties[flag];
        return actual !== undefined && actual.trim().toLowerCase() === expected.trim().toLowerCase();
      });
      if (allMatch) {
        candidates.push(rule.thenState);
      }
    }
  }

  return candidates;
}

/**
 * Escolhe, dentre os estados descritos na planilha (`rule.states`),
 * qual texto usar com base no(s) valor(es) reais da instância no
 * Figma (`variantValues` — os VALORES das variant properties da
 * instância, ex.: ["Disabled", "Medium"], sem assumir nome de
 * propriedade específico, já que cada Design System pode nomear
 * diferente).
 *
 * Tenta primeiro casar a FRASE INTEIRA de cada rótulo (cobre estados
 * de duas palavras como "Não selecionada"); só se nada bater tenta de
 * novo usando só a primeira palavra de cada rótulo (cobre rótulos com
 * sufixo de plataforma, como "Disabled macOS"/"Disabled Windows",
 * quando o Figma só diz "Disabled"). Quando mais de um rótulo bate no
 * mesmo passo, usa o PRIMEIRO que aparece na planilha, em vez de não
 * escolher nenhum — decisão explícita do usuário para priorizar ter
 * uma verbalização de verdade em vez de sempre cair no texto
 * genérico.
 *
 * Retorna undefined quando não há `states`, não há variantValues, ou
 * nenhum rótulo bate em nenhum dos dois passos — nesse caso
 * `computeVerbalization` usa `rule.template` (o padrão) normalmente.
 */
export function selectVerbalizationTemplate(
  rule: ComponentTypeRule,
  variantValues: string[]
): string | undefined {
  if (!rule.states || variantValues.length === 0) {
    return undefined;
  }

  // Expande os candidatos com os aliases da regra: se "Selected"
  // (nome de propriedade do Figma) veio na lista e a regra diz que
  // "Selected" = "Marcado", "Marcado" também vira candidato.
  // Comparação sem diferenciar maiúsculas, já que o nome da
  // propriedade chega exatamente como o Figma o escreveu.
  const expandedValues = [...variantValues];
  if (rule.stateFlagAliases) {
    const normalizedAliasEntries = Object.entries(rule.stateFlagAliases).map(
      ([figmaName, portugueseLabel]) => [normalizeWord(figmaName), portugueseLabel] as const
    );
    for (const value of variantValues) {
      const normalizedValue = normalizeWord(value);
      for (const [figmaName, portugueseLabel] of normalizedAliasEntries) {
        if (figmaName === normalizedValue) {
          expandedValues.push(portugueseLabel);
        }
      }
    }
  }

  const normalizedVariantValues = expandedValues.map(normalizeWord);

  for (const tokenize of [fullPhraseTokens, firstWordTokens]) {
    for (const [label, text] of Object.entries(rule.states)) {
      const tokens = tokenize(label);
      if (tokens.some((token) => normalizedVariantValues.includes(token))) {
        return text;
      }
    }
  }
  return undefined;
}

/**
 * Gera a verbalização inicial de um componente a partir da regra do
 * seu tipo e dos dados extraídos. Retorna string vazia quando o tipo
 * não possui verbalização (regra explícita, não texto inventado).
 *
 * `variantValues` (opcional) são os valores de variant properties da
 * instância no Figma — quando informados, tenta primeiro achar um
 * estado específico da planilha que bata (ver
 * `selectVerbalizationTemplate`); sem instância/estado reconhecível,
 * cai no `template` padrão da regra.
 */
export function computeVerbalization(
  rule: ComponentTypeRule | undefined,
  extractedData: Record<string, string>,
  variantValues: string[] = []
): string {
  if (!rule || !rule.hasVerbalization) {
    return "";
  }
  const template = selectVerbalizationTemplate(rule, variantValues) ?? rule.template;
  if (!template) {
    return "";
  }
  return resolvePlaceholders(template, extractedData);
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
