/**
 * CÓPIA de src/ui/components/Button.tsx (fluxo de Acessibilidade), feita na
 * Fase 1 do Tagueamento. Pertence só ao tagueamento: pode ser adaptada à
 * vontade sem afetar a acessibilidade — e a original NUNCA deve ser editada
 * por causa do tagueamento (ver TAGUEAMENTO_SPEC.md, seção 0).
 */
import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button";
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  active?: boolean;
  ariaLabel?: string;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  fullWidth = false,
  type = "button",
  icon,
  iconRight,
  active = false,
  ariaLabel
}: ButtonProps) {
  const base: React.CSSProperties = {
    borderRadius: "var(--radius-md)",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    transition: "var(--transition)",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    width: fullWidth ? "100%" : undefined
  };

  let style: React.CSSProperties = { ...base };

  if (disabled) {
    style = {
      ...style,
      background: "var(--color-disabled-bg)",
      color: "var(--color-text-disabled)",
      boxShadow: "none",
      height: variant === "secondary" ? 42 : 46,
      fontSize: variant === "secondary" ? "13.5px" : "14.5px"
    };
  } else if (variant === "primary") {
    style = {
      ...style,
      height: 46,
      fontSize: "14.5px",
      background: "var(--color-primary)",
      color: "#fff",
      boxShadow: "var(--shadow-btn)"
    };
  } else if (variant === "secondary") {
    style = {
      ...style,
      height: 42,
      fontSize: "13.5px",
      background: "var(--color-surface)",
      border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border-strong)"}`,
      color: active ? "var(--color-primary-ink)" : "var(--color-text-dark)"
    };
  } else {
    style = {
      ...style,
      background: "transparent",
      fontSize: "13px",
      color: "var(--color-text-muted)",
      textDecoration: "none",
      borderBottom: "1.5px solid var(--color-border-strong)",
      borderRadius: 0,
      paddingBottom: 2,
      width: fullWidth ? "100%" : undefined
    };
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={style}
      onMouseEnter={(e) => {
        if (disabled) return;
        const el = e.currentTarget as HTMLButtonElement;
        if (variant === "primary") {
          el.style.background = "var(--color-primary-hover)";
          el.style.transform = "translateY(-1px)";
          el.style.boxShadow = "var(--shadow-btn-hover)";
        } else if (variant === "secondary") {
          el.style.background = "#F4F7F1";
          el.style.borderColor = "#B7C1AA";
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        const el = e.currentTarget as HTMLButtonElement;
        if (variant === "primary") {
          el.style.background = "var(--color-primary)";
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "var(--shadow-btn)";
        } else if (variant === "secondary") {
          el.style.background = "var(--color-surface)";
          el.style.borderColor = active ? "var(--color-primary)" : "var(--color-border-strong)";
        }
      }}
      onMouseDown={(e) => {
        if (disabled || variant !== "primary") return;
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
      }}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}
