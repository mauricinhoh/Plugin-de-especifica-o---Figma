/**
 * CÓPIA de src/ui/hooks/usePrefersReducedMotion.ts (acessibilidade), feita na
 * Fase 4 do Tagueamento — sem lógica compartilhada entre os fluxos.
 */
import { useEffect, useState } from "react";

export function usePrefersReducedMotionCopy(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  return reduced;
}
