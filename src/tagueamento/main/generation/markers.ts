/// <reference types="@figma/plugin-typings" />

/**
 * Marcadores sobre a tela — CÓPIA adaptada de src/main/generation/markers.ts
 * (acessibilidade): contorno tracejado + círculo numerado. Diferenças:
 *  - cor do evento (EVENT_COLORS, enviadas pelo Mau), em vez do azul fixo;
 *  - número sem zero à esquerda, igual ao número do card ("1", "2"…);
 *  - card de tela (nº 1): só o círculo, no canto superior esquerdo do frame,
 *    sem contorno em volta da tela inteira (decisão do Mau, 03/10/2026).
 */

import { colorOf, hexToRgb } from "../../shared/eventColors";

const MARKER_STROKE_WIDTH = 2;
const MARKER_PADDING = 6;
const CIRCLE_DIAMETER = 24;
export const MARKER_FONT: FontName = { family: "Inter", style: "Bold" };

function circleWithNumber(numero: number, evento: string, x: number, y: number): SceneNode[] {
  const color = colorOf(evento);
  const circle = figma.createEllipse();
  circle.name = `Marcador ${numero} - círculo`;
  circle.resize(CIRCLE_DIAMETER, CIRCLE_DIAMETER);
  circle.x = x;
  circle.y = y;
  circle.fills = [{ type: "SOLID", color: hexToRgb(color.fill) }];
  circle.strokes = [];

  const label = figma.createText();
  label.fontName = MARKER_FONT;
  label.characters = String(numero);
  label.fontSize = 12;
  label.fills = [{ type: "SOLID", color: hexToRgb(color.text) }];
  label.textAlignHorizontal = "CENTER";
  label.textAlignVertical = "CENTER";
  // Texto novo nasce com auto-size; resize() exige textAutoResize = "NONE" antes.
  label.textAutoResize = "NONE";
  label.resize(CIRCLE_DIAMETER, CIRCLE_DIAMETER);
  label.x = x;
  label.y = y;
  return [circle, label];
}

/** Marcador de um componente: contorno tracejado em volta dele + círculo no canto. */
export function createComponentMarker(bounds: Rect, numero: number, evento: string, nodeName: string): GroupNode {
  const color = colorOf(evento);
  const outline = figma.createRectangle();
  outline.name = `Marcador ${numero} - contorno`;
  outline.x = bounds.x - MARKER_PADDING;
  outline.y = bounds.y - MARKER_PADDING;
  outline.resize(Math.max(1, bounds.width + MARKER_PADDING * 2), Math.max(1, bounds.height + MARKER_PADDING * 2));
  outline.fills = [];
  outline.strokes = [{ type: "SOLID", color: hexToRgb(color.fill) }];
  outline.strokeWeight = MARKER_STROKE_WIDTH;
  outline.dashPattern = [4, 4];
  outline.cornerRadius = 4;

  const parts = circleWithNumber(
    numero,
    evento,
    bounds.x - MARKER_PADDING - CIRCLE_DIAMETER / 2,
    bounds.y - MARKER_PADDING - CIRCLE_DIAMETER / 2
  );
  const group = figma.group([outline, ...parts], figma.currentPage);
  group.name = `Marcador ${numero} - ${nodeName}`;
  return group;
}

/** Marcador do card de tela: só o círculo, no canto superior esquerdo do frame. */
export function createScreenMarker(frameBounds: Rect, numero: number, evento: string): GroupNode {
  const parts = circleWithNumber(numero, evento, frameBounds.x - CIRCLE_DIAMETER / 2, frameBounds.y - CIRCLE_DIAMETER / 2);
  const group = figma.group(parts, figma.currentPage);
  group.name = `Marcador ${numero} - tela`;
  return group;
}
