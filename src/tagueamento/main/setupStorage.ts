/// <reference types="@figma/plugin-typings" />

/**
 * Memória da última escolha do setup (canal, produto, fluxo, modo).
 *
 * Usa figma.clientStorage — fica no computador de quem usa o plugin, vale
 * para todos os arquivos — com chave PRÓPRIA do tagueamento. Não toca em
 * nenhuma chave da acessibilidade (spec, seção 11).
 */

import { SetupSelection } from "../shared/types";

const LAST_SETUP_KEY = "tagueamento.lastSetup";

export async function loadLastSetup(): Promise<SetupSelection | null> {
  try {
    const stored = await figma.clientStorage.getAsync(LAST_SETUP_KEY);
    return stored && typeof stored === "object" ? (stored as SetupSelection) : null;
  } catch (error) {
    console.error("Tagueamento: não foi possível ler a última escolha do setup.", error);
    return null;
  }
}

export async function saveLastSetup(setup: SetupSelection): Promise<void> {
  try {
    await figma.clientStorage.setAsync(LAST_SETUP_KEY, setup);
  } catch (error) {
    console.error("Tagueamento: não foi possível guardar a escolha do setup.", error);
  }
}
