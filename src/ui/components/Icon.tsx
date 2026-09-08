import React from "react";

/**
 * Ícones SVG inline, todos com o mesmo estilo (stroke, sem fill),
 * conforme exigido: nada de biblioteca de ícones nem download via
 * rede (o plugin não tem acesso à rede).
 */

const paths: Record<string, string> = {
  accessibility:
    "M12 4a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 12 4Zm-8 5 8-1.6L20 9M12 2.4V21.6M8 21.6l4-6 4 6",
  tag: "M12.59 2H4a2 2 0 0 0-2 2v8.59a2 2 0 0 0 .59 1.41l9 9a2 2 0 0 0 2.82 0l8.59-8.59a2 2 0 0 0 0-2.82l-9-9A2 2 0 0 0 12.59 2ZM7 7h.01",
  frame: "M3 3v18M9 3v18M3 9h18M3 15h18M21 3v18M15 3v18",
  check: "M20 6 9 17l-5-5",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01",
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "chevron-left": "M15 18l-6-6 6-6",
  "chevron-right": "M9 18l6-6-6-6",
  "chevron-down": "M6 9l6 6 6-6",
  "chevron-up": "M18 15l-6-6-6 6",
  x: "M18 6 6 18M6 6l12 12",
  "x-circle": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM15 9l-6 6M9 9l6 6",
  "alert-triangle":
    "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01",
  "alert-circle": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 8v4M12 16h.01",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35",
  grip: "M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01",
  plus: "M12 5v14M5 12h14",
  sparkle: "M12 2 9.6 8.6 3 11l6.6 2.4L12 20l2.4-6.6L21 11l-6.6-2.4L12 2Z",
  monitor: "M3 4h18v12H3zM8 20h8M12 16v4",
  smartphone: "M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM12 18h.01",
  components:
    "M12 2 3 7l9 5 9-5-9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"
};

interface IconProps {
  name: keyof typeof paths;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function Icon({ name, size = 16, color = "currentColor", strokeWidth = 2.2, className }: IconProps) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}
