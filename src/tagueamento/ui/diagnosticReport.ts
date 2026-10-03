/**
 * Monta o relatório em texto do diagnóstico do card (Fase 2), para o PD
 * copiar e colar na conversa. O formato prioriza ser lido por pessoas e
 * conter os nomes EXATOS que a API usa (com sufixo "#id").
 */

import { CardDiagnosis, TestCardResult } from "../shared/types";

function formatValue(value: string | boolean | undefined): string {
  if (value === undefined) return "—";
  if (typeof value === "boolean") return value ? "ligado" : "desligado";
  return `"${value}"`;
}

export function buildDiagnosticReport(diagnosis: CardDiagnosis, testCard: TestCardResult | null): string {
  const lines: string[] = [];
  lines.push("DIAGNÓSTICO DO CARD — Tagueamento (Fase 2)");
  lines.push("");
  lines.push(`Camada selecionada: ${diagnosis.nodeName} (${diagnosis.nodeType}, ${diagnosis.width}×${diagnosis.height})`);

  lines.push("");
  lines.push("## Componente");
  if (diagnosis.componentSet) {
    const set = diagnosis.componentSet;
    lines.push(`Conjunto de variantes: ${set.name}`);
    lines.push(`  chave: ${set.key}`);
    lines.push(`  biblioteca publicada: ${set.remote ? "sim" : "não (componente local)"}`);
  }
  if (diagnosis.mainComponent) {
    const main = diagnosis.mainComponent;
    lines.push(`Componente principal (variante atual): ${main.name}`);
    lines.push(`  chave: ${main.key}`);
    lines.push(`  biblioteca publicada: ${main.remote ? "sim" : "não (componente local)"}`);
  } else {
    lines.push("(sem componente principal)");
  }

  lines.push("");
  lines.push("## Propriedades");
  if (diagnosis.properties.length === 0) {
    lines.push("(nenhuma)");
  }
  for (const property of diagnosis.properties) {
    lines.push(`- ${property.name} [${property.type}] = ${formatValue(property.value)} (padrão: ${formatValue(property.defaultValue)})`);
    if (property.options && property.options.length > 0) {
      lines.push(`    opções (${property.options.length}): ${property.options.map((option) => `"${option}"`).join(", ")}`);
    }
  }

  lines.push("");
  lines.push(`## Camadas (${diagnosis.layers.length}${diagnosis.layersTruncated ? ", lista cortada" : ""})`);
  for (const layer of diagnosis.layers) {
    const indent = "  ".repeat(layer.depth);
    const parts = [`${indent}- [${layer.type}] ${layer.name}`];
    if (!layer.visible) parts.push("(oculta)");
    if (layer.characters !== undefined) parts.push(`texto="${layer.characters.replace(/\n/g, "⏎")}"`);
    if (layer.font) parts.push(`fonte=${layer.font}`);
    if (layer.propertyRefs) {
      const refs = Object.entries(layer.propertyRefs).map(([field, property]) => `${field}←${property}`);
      parts.push(`ligado a: ${refs.join(", ")}`);
    }
    lines.push(parts.join(" "));
  }

  lines.push("");
  lines.push("## Fontes usadas");
  lines.push(diagnosis.fonts.length > 0 ? diagnosis.fonts.join(", ") : "(nenhuma camada de texto)");

  if (diagnosis.warnings.length > 0) {
    lines.push("");
    lines.push("## Avisos");
    for (const warning of diagnosis.warnings) lines.push(`- ${warning}`);
  }

  if (testCard) {
    lines.push("");
    lines.push("## Card de teste");
    lines.push(`Resultado: ${testCard.ok ? "ok" : "falhou"} — ${testCard.message}`);
    if (testCard.method) lines.push(`Como foi criado: ${testCard.method}`);
    if (testCard.importError) lines.push(`Erro da importação pela chave: ${testCard.importError}`);
    if (testCard.appliedProperties) {
      for (const [name, value] of Object.entries(testCard.appliedProperties)) {
        lines.push(`  ${name} = "${value}"`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Copia texto para a área de transferência. O iframe do plugin costuma
 * bloquear navigator.clipboard, então o caminho principal é o
 * execCommand("copy") com um textarea temporário.
 */
export function copyText(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}
