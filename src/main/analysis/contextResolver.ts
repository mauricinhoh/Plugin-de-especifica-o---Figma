import { ScreenContext } from "../../shared/types";

export interface ContextResolution {
  context: ScreenContext | null;
  requiresContextChoice: boolean;
}

/**
 * Determina o contexto da tela pela maioria de componentes Core Web
 * vs Core App (seção 9 do briefing). Em empate (incluindo 0 a 0... na
 * prática 0 a 0 não deveria acontecer pois nesse caso não há itens
 * Core para desambiguar, mas tratamos como empate igualmente, já que
 * a regra do briefing é estritamente sobre igualdade de contagem),
 * sinaliza que a UI precisa perguntar ao designer.
 */
export function resolveScreenContext(coreWebCount: number, coreAppCount: number): ContextResolution {
  if (coreWebCount > coreAppCount) {
    return { context: "WEB", requiresContextChoice: false };
  }
  if (coreAppCount > coreWebCount) {
    return { context: "APLICATIVO", requiresContextChoice: false };
  }
  return { context: null, requiresContextChoice: true };
}
