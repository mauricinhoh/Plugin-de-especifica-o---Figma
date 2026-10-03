/**
 * Lista de regions embutida no plugin. O arquivo JSON é gerado no build a
 * partir do Excel (scripts/build-regions.mjs) — nunca editar à mão.
 */

import generated from "../data/regions.generated.json";
import { RegionsData } from "../shared/types";

export const REGIONS: RegionsData = generated as RegionsData;

/** Compara textos ignorando caixa e acentos (usado na busca dos dropdowns). */
export function searchKey(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
