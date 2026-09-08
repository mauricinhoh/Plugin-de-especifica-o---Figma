let counter = 0;

/** Gera um id de especificação, independente do nodeId do Figma (seção 36). */
export function generateSpecificationId(): string {
  counter += 1;
  return `spec-${Date.now()}-${counter}`;
}
