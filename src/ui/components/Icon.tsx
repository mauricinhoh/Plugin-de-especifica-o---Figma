import React from "react";

/**
 * Ícones SVG inline. Os traços (paths/circles) vêm da Lucide
 * (lucide.dev, licença ISC — livre, inclusive uso comercial),
 * copiados aqui como dado estático em tempo de build — nada é
 * baixado em tempo de execução (o plugin não tem acesso à rede).
 *
 * Cada ícone é uma lista de elementos porque alguns (ex.:
 * "accessibility") combinam um círculo com vários traços, não dá só
 * num <path>.
 */

type IconElement = { type: "path"; d: string } | { type: "circle"; cx: number; cy: number; r: number };

const icons: Record<string, IconElement[]> = {
  accessibility: [
    { type: "circle", cx: 16, cy: 4, r: 1 },
    { type: "path", d: "m18 19 1-7-6 1" },
    { type: "path", d: "m5 8 3-3 5.5 3-2.36 3.5" },
    { type: "path", d: "M4.24 14.5a5 5 0 0 0 6.88 6" },
    { type: "path", d: "M13.76 17.5a5 5 0 0 0-6.88-6" }
  ],
  download: [
    { type: "path", d: "M12 15V3" },
    { type: "path", d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" },
    { type: "path", d: "m7 10 5 5 5-5" }
  ],
  tag: [
    {
      type: "path",
      d: "M12.59 2H4a2 2 0 0 0-2 2v8.59a2 2 0 0 0 .59 1.41l9 9a2 2 0 0 0 2.82 0l8.59-8.59a2 2 0 0 0 0-2.82l-9-9A2 2 0 0 0 12.59 2ZM7 7h.01"
    }
  ],
  frame: [{ type: "path", d: "M3 3v18M9 3v18M3 9h18M3 15h18M21 3v18M15 3v18" }],
  check: [{ type: "path", d: "M20 6 9 17l-5-5" }],
  info: [{ type: "path", d: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01" }],
  "arrow-right": [{ type: "path", d: "M5 12h14M13 6l6 6-6 6" }],
  "chevron-left": [{ type: "path", d: "M15 18l-6-6 6-6" }],
  "chevron-right": [{ type: "path", d: "M9 18l6-6-6-6" }],
  "chevron-down": [{ type: "path", d: "M6 9l6 6 6-6" }],
  "chevron-up": [{ type: "path", d: "M18 15l-6-6-6 6" }],
  x: [{ type: "path", d: "M18 6 6 18M6 6l12 12" }],
  "x-circle": [{ type: "path", d: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM15 9l-6 6M9 9l6 6" }],
  "alert-triangle": [
    {
      type: "path",
      d: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01"
    }
  ],
  "alert-circle": [{ type: "path", d: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 8v4M12 16h.01" }],
  search: [{ type: "path", d: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35" }],
  grip: [{ type: "path", d: "M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01" }],
  plus: [{ type: "path", d: "M12 5v14M5 12h14" }],
  sparkle: [{ type: "path", d: "M12 2 9.6 8.6 3 11l6.6 2.4L12 20l2.4-6.6L21 11l-6.6-2.4L12 2Z" }],
  monitor: [{ type: "path", d: "M3 4h18v12H3zM8 20h8M12 16v4" }],
  smartphone: [{ type: "path", d: "M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM12 18h.01" }],
  components: [{ type: "path", d: "M12 2 3 7l9 5 9-5-9-5ZM3 12l9 5 9-5M3 17l9 5 9-5" }]
};

interface IconProps {
  name: keyof typeof icons;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function Icon({ name, size = 16, color = "currentColor", strokeWidth = 2.2, className }: IconProps) {
  const elements = icons[name];
  if (!elements) return null;
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
      {elements.map((el, i) =>
        el.type === "circle" ? (
          <circle key={i} cx={el.cx} cy={el.cy} r={el.r} />
        ) : (
          <path key={i} d={el.d} />
        )
      )}
    </svg>
  );
}
