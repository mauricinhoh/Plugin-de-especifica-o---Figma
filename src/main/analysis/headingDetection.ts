/// <reference types="@figma/plugin-typings" />

/**
 * Mapa de tamanho de fonte (px) → nível de título, exatamente como
 * definido pelo usuário: h1 e h2 contam como "nível 2" (não existe
 * "nível 1" nessa convenção); h3 a h6 seguem numeração normal.
 *
 *   h1/h2: 40px ou 32px → nível 2
 *   h3: 24px            → nível 3
 *   h4: 20px            → nível 4
 *   h5: 16px            → nível 5
 *   h6: 14px            → nível 6
 *
 * Usado para reconhecer título "solto" na tela — um TEXT que não está
 * dentro de nenhuma instância do componente "Heading" do Design
 * System, mas que visualmente É um título (o designer só usou um
 * texto com o tamanho certo). Sem isso, esses textos eram
 * silenciosamente ignorados pela descoberta automática (que só olha
 * INSTANCE/COMPONENT) — pedido explícito do usuário para corrigir.
 */
const FONT_SIZE_TO_HEADING_LEVEL: Record<number, string> = {
  40: "2",
  32: "2",
  24: "3",
  20: "4",
  16: "5",
  14: "6"
};

/**
 * Retorna o nível de título ("2" a "6") correspondente ao tamanho de
 * fonte do TEXT, ou null se o tamanho não bater com nenhum nível
 * conhecido (nesse caso o texto continua sendo ignorado, como antes —
 * evita tratar qualquer texto pequeno como se fosse título).
 *
 * `fontSize` pode ser `figma.mixed` quando o texto tem mais de um
 * tamanho dentro dele mesmo (trechos com tamanhos diferentes); nesse
 * caso não dá pra determinar um nível único com segurança, então
 * retorna null também.
 */
export function detectHeadingLevelFromFontSize(node: TextNode): string | null {
  if (node.fontSize === figma.mixed) {
    return null;
  }
  const size = node.fontSize as number;
  return FONT_SIZE_TO_HEADING_LEVEL[size] ?? null;
}
