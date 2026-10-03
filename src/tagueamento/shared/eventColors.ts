/**
 * Cores de cada evento do tagueamento (enviadas pelo Mau em 03/10/2026).
 * Usadas na bolinha do número na revisão e no marcador sobre a tela.
 * Dados puros: para mudar uma cor, edite só este arquivo.
 */

export interface EventColor {
  /** Cor de preenchimento (hex). */
  fill: string;
  /** Cor do texto sobre o preenchimento (hex). */
  text: string;
}

export const EVENT_COLORS: Record<string, EventColor> = {
  select_content: { fill: "#E60050", text: "#FFFFFF" },
  screen_view: { fill: "#FFCD00", text: "#323C32" },
  page_view: { fill: "#FFCD00", text: "#323C32" },
  modal_view: { fill: "#9328FF", text: "#FFFFFF" },
  feedback: { fill: "#28D8FF", text: "#323C32" },
  login: { fill: "#33820D", text: "#FFFFFF" },
  transaction: { fill: "#4665FF", text: "#FFFFFF" },
  search: { fill: "#FF28C6", text: "#FFFFFF" },
  refresh: { fill: "#FF7028", text: "#FFFFFF" },
  conversion: { fill: "#1BB718", text: "#FFFFFF" }
};

/** Cor neutra para algum evento sem cor definida (não deve acontecer). */
export const FALLBACK_COLOR: EventColor = { fill: "#131713", text: "#FFFFFF" };

export function colorOf(evento: string): EventColor {
  return EVENT_COLORS[evento] ?? FALLBACK_COLOR;
}

/** Converte "#RRGGBB" no formato RGB do Figma (0 a 1). */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255
  };
}
