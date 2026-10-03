/// <reference types="@figma/plugin-typings" />

/**
 * Preenche um card "[Helper] Google Analytics Spec" já criado (Fase 7).
 *
 *  1. Toggles: a toggle de cada linha opcional liga só se o campo foi
 *     preenchido (uma toggle que controla várias linhas — ex.: "message",
 *     que também controla UTMs e hiring_Id — liga se qualquer uma tiver
 *     valor). "Mostrar atributos" nunca é alterada.
 *  2. Linhas do outro canal (ex.: page_name num app) ficam ocultas.
 *  3. Valores: cada linha é achada pelo NOME DO PARÂMETRO (cardStructure) e
 *     recebe o valor revisado. Campo sem valor mantém o placeholder do card.
 *  4. Número do card na área "Number".
 *
 * Subregion "N/A" conta como não preenchida (a toggle subregion fica desligada).
 */

import { GA_CARD_SHOW_TOGGLE, normalizeParamLabel } from "../../shared/gaCard";
import { fieldsFor, isEmptyValue, SETUP_FIELDS } from "../../shared/review";
import { Plataforma } from "../../shared/types";
import { readCardStructure } from "../cardStructure";

const APP_ONLY = ["firebase_screen", "firebase_previous_screen", "target_screen"];
const WEB_ONLY = ["page_name", "previous_page", "target_page"];

function stripPropertyId(name: string): string {
  const hashIndex = name.lastIndexOf("#");
  return hashIndex > 0 ? name.slice(0, hashIndex) : name;
}

function isFilled(value: string | undefined): boolean {
  return !isEmptyValue(value) && (value ?? "").trim().toUpperCase() !== "N/A";
}

async function loadFontsOf(node: TextNode): Promise<void> {
  const fonts: FontName[] =
    node.fontName === figma.mixed ? node.getRangeAllFontNames(0, node.characters.length) : [node.fontName];
  await Promise.all(fonts.map((font) => figma.loadFontAsync(font)));
}

async function setText(node: TextNode, text: string): Promise<void> {
  if (node.characters === text) return;
  await loadFontsOf(node);
  node.characters = text;
}

export async function fillCard(
  card: InstanceNode,
  evento: string,
  values: Record<string, string>,
  numero: number,
  plataforma: Plataforma
): Promise<string[]> {
  const avisos: string[] = [];
  const valueOf = (label: string) => values[normalizeParamLabel(label)];

  // 1. Toggles
  const structure = readCardStructure(card);
  const toggleOn = new Map<string, boolean>();
  for (const row of structure.rows) {
    const toggle = row.info.toggle;
    if (!toggle || toggle === GA_CARD_SHOW_TOGGLE) continue;
    toggleOn.set(toggle, (toggleOn.get(toggle) ?? false) || isFilled(valueOf(row.info.label)));
  }
  const fullNames = new Map<string, string>();
  for (const [name, property] of Object.entries(card.componentProperties)) {
    if (property.type === "BOOLEAN") fullNames.set(stripPropertyId(name), name);
  }
  const toApply: Record<string, boolean> = {};
  for (const [toggle, on] of toggleOn) {
    const fullName = fullNames.get(toggle);
    if (fullName) toApply[fullName] = on;
    else avisos.push(`Toggle "${toggle}" não encontrada no card.`);
  }
  if (Object.keys(toApply).length > 0) card.setProperties(toApply);

  // 2 e 3. Linhas do outro canal e valores (lê de novo: as toggles mudam a visibilidade)
  const { required, optional } = fieldsFor(evento, plataforma);
  const allowed = new Set([...required, ...optional, ...SETUP_FIELDS]);
  const hiddenChannel = plataforma === "APP" ? WEB_ONLY : APP_ONLY;
  const after = readCardStructure(card);
  for (const row of after.rows) {
    const param = normalizeParamLabel(row.info.label);
    if (hiddenChannel.includes(param) && !allowed.has(param)) {
      row.row.visible = false;
      continue;
    }
    const value = values[param];
    if (!value || isEmptyValue(value)) continue; // mantém o placeholder do card
    try {
      await setText(row.valueNode, value);
    } catch (error) {
      avisos.push(`Não foi possível escrever "${param}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 4. Número
  if (after.numberNode) {
    try {
      await setText(after.numberNode, String(numero));
    } catch (error) {
      avisos.push(`Não foi possível escrever o número ${numero}: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    avisos.push("Área de número (Number) não encontrada no card.");
  }

  return avisos;
}
