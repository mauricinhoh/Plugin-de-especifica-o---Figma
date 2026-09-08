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

interface ChoiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function ChoiceCard({ icon, title, description, badge, disabled = false, onClick }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: 16,
        border: disabled ? "1px dashed #DCE2D5" : "1px solid var(--color-border)",
        borderRadius: 12,
        background: disabled ? "var(--color-surface-subtle)" : "var(--color-surface)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform .16s, box-shadow .16s, border-color .16s",
        width: "100%",
        textAlign: "left"
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = "var(--color-primary)";
        el.style.boxShadow = "var(--shadow-lift)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = "var(--color-border)";
        el.style.boxShadow = "none";
        el.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          minWidth: 40,
          borderRadius: 11,
          background: disabled ? "#EDEFE9" : "var(--color-primary-tint)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: disabled ? "var(--color-text-disabled)" : "var(--color-primary)"
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "-.01em",
            color: disabled ? "var(--color-text-disabled)" : "var(--color-text-dark)"
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: disabled ? "var(--color-text-disabled)" : "var(--color-text-muted)",
            lineHeight: 1.35,
            marginTop: 2
          }}
        >
          {description}
        </div>
      </div>
      {badge ? (
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: ".07em",
            background: "var(--color-surface-muted)",
            color: "#7A8371",
            borderRadius: 999,
            padding: "4px 9px",
            whiteSpace: "nowrap"
          }}
        >
          {badge}
        </span>
      ) : (
        !disabled && (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--color-text-subtle)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        )
      )}
    </button>
  );
}
