/// <reference types="@figma/plugin-typings" />

/**
 * Fase 2.1 do TAGUEAMENTO — "Verificar todas as variantes".
 *
 * 1. Importa o conjunto de variantes pela chave que está no código
 *    (GA_CARD_SET_KEY). Se funcionar, a chave está certa — é o mesmo caminho
 *    que a geração vai usar. Se falhar e houver um card selecionado, usa o
 *    conjunto do card selecionado só para conseguir ler as variantes.
 * 2. Para cada variante: cria uma instância temporária fora da área visível,
 *    lê as linhas de parâmetro, compara com a lista da spec (seção 7.2) e
 *    apaga a instância. Nada fica no arquivo.
 *
 * O resultado é um resumo curto, pensado para o PD transcrever só o que
 * não bater (a máquina da empresa não permite copiar texto).
 */

import { AllVariantsCheck, VariantCheck } from "../shared/types";
import {
  GA_CARD_EVENT_PROPERTY,
  GA_CARD_SET_KEY,
  GA_CARD_SET_NAME,
  GA_CARD_SHOW_TOGGLE,
  GA_EVENTS,
  eventKeyFromVariantName,
  normalizeParamLabel
} from "../shared/gaCard";
import { readCardStructure } from "./cardStructure";
import { stripPropertyId } from "../shared/gaCard";
import { errorMessage } from "./util";

/** Longe de tudo, para a instância temporária não aparecer na tela. */
const TEMP_OFFSET = -100000;



async function setFromSelection(): Promise<ComponentSetNode | null> {
  const selection = figma.currentPage.selection;
  if (selection.length !== 1 || selection[0].type !== "INSTANCE") return null;
  const main = await selection[0].getMainComponentAsync();
  const parent = main ? main.parent : null;
  return parent && parent.type === "COMPONENT_SET" ? parent : null;
}

function variantNameOf(component: ComponentNode): string | null {
  const props = component.variantProperties;
  return props && typeof props[GA_CARD_EVENT_PROPERTY] === "string" ? props[GA_CARD_EVENT_PROPERTY] : null;
}

export async function checkAllVariants(): Promise<AllVariantsCheck> {
  const result: AllVariantsCheck = {
    keyUsed: GA_CARD_SET_KEY,
    importOk: false,
    source: "none",
    setNameOk: false,
    variantOptions: [],
    unmatchedVariants: [],
    toggles: [],
    showToggleFound: false,
    checks: [],
    warnings: []
  };

  let componentSet: ComponentSetNode | null = null;
  try {
    componentSet = await figma.importComponentSetByKeyAsync(GA_CARD_SET_KEY);
    result.importOk = true;
    result.source = "import";
  } catch (error) {
    result.importError = errorMessage(error);
    componentSet = await setFromSelection();
    if (componentSet) {
      result.source = "selection";
      result.warnings.push(
        "A importação pela chave falhou; as variantes foram lidas do card selecionado. A geração precisa da importação funcionando."
      );
    } else {
      result.warnings.push(
        "A importação pela chave falhou e não há um card selecionado. Selecione uma instância do card e verifique de novo para ver a chave real."
      );
      return result;
    }
  }

  result.setName = componentSet.name;
  result.setNameOk = componentSet.name === GA_CARD_SET_NAME;
  result.actualSetKey = componentSet.key;
  if (!result.setNameOk) {
    result.warnings.push(`O conjunto se chama "${componentSet.name}"; o esperado era "${GA_CARD_SET_NAME}".`);
  }

  try {
    const definitions = componentSet.componentPropertyDefinitions;
    for (const [name, definition] of Object.entries(definitions)) {
      if (definition.type === "BOOLEAN") result.toggles.push(stripPropertyId(name));
      if (definition.type === "VARIANT" && name === GA_CARD_EVENT_PROPERTY && definition.variantOptions) {
        result.variantOptions = [...definition.variantOptions];
      }
    }
  } catch (error) {
    result.warnings.push(`Não foi possível ler as propriedades do conjunto: ${errorMessage(error)}`);
  }
  result.showToggleFound = result.toggles.includes(GA_CARD_SHOW_TOGGLE);
  if (!result.showToggleFound) {
    result.warnings.push(`A toggle "${GA_CARD_SHOW_TOGGLE}" não foi encontrada no conjunto.`);
  }

  // Variantes do conjunto, indexadas pelo evento normalizado.
  const variantsByEvent = new Map<string, ComponentNode>();
  for (const child of componentSet.children) {
    if (child.type !== "COMPONENT") continue;
    const variantName = variantNameOf(child);
    if (!variantName) continue;
    const eventKey = eventKeyFromVariantName(variantName);
    if (GA_EVENTS.some((event) => event.key === eventKey)) {
      variantsByEvent.set(eventKey, child);
    } else {
      result.unmatchedVariants.push(variantName);
    }
  }

  for (const event of GA_EVENTS) {
    const expected = event.params.map(normalizeParamLabel);
    const check: VariantCheck = {
      eventKey: event.key,
      variantName: null,
      ok: false,
      expectedCount: expected.length,
      foundCount: 0,
      missing: [],
      extra: [],
      rows: [],
      hasNumber: false
    };
    const variant = variantsByEvent.get(event.key);
    if (!variant) {
      check.missing = [...event.params];
      check.error = "Nenhuma variante de Evento corresponde a este evento.";
      result.checks.push(check);
      continue;
    }
    check.variantName = variantNameOf(variant);

    let temp: InstanceNode | null = null;
    try {
      temp = variant.createInstance();
      temp.x = TEMP_OFFSET;
      temp.y = TEMP_OFFSET;
      const structure = readCardStructure(temp);
      check.rows = structure.rows.map((row) => row.info);
      check.typeText = structure.typeNode ? structure.typeNode.characters : undefined;
      check.hasNumber = structure.numberNode !== null;

      const foundLabels = new Set(check.rows.map((row) => normalizeParamLabel(row.label)));
      check.missing = event.params.filter((param) => !foundLabels.has(normalizeParamLabel(param)));
      check.extra = check.rows
        .map((row) => row.label)
        .filter((label) => !expected.includes(normalizeParamLabel(label)));
      check.foundCount = expected.length - check.missing.length;
      check.ok = check.missing.length === 0;
    } catch (error) {
      check.error = `Não foi possível ler esta variante: ${errorMessage(error)}`;
      check.missing = [...event.params];
    } finally {
      if (temp && !temp.removed) temp.remove();
    }
    result.checks.push(check);
  }

  return result;
}
