import React from "react";
import { Icon } from "./Icon";

interface TitleBarProps {
  title: string;
  badge?: string;
  showBack?: boolean;
  showLogo?: boolean;
  showClose?: boolean;
  onBack?: () => void;
  onClose?: () => void;
}

const iconButtonStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  minWidth: 24,
  borderRadius: 6,
  border: "none",
  background: "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background-color 120ms ease"
};

export function TitleBar({ title, badge, showBack, showLogo, showClose = true, onBack, onClose }: TitleBarProps) {
  return (
    <div
      style={{
        height: 46,
        minHeight: 46,
        background: "var(--color-chrome)",
        padding: "0 12px 0 14px",
        display: "flex",
        alignItems: "center",
        gap: 10
      }}
    >
      {showLogo && (
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            background: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Icon name="accessibility" size={13} color="#fff" />
        </div>
      )}

      {showBack && (
        <button
          type="button"
          aria-label="Voltar"
          onClick={onBack}
          style={iconButtonStyle}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.14)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
        >
          <Icon name="chevron-left" size={14} color="#C9CFC4" />
        </button>
      )}

      <span
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "-.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}
      >
        {title}
      </span>

      {badge && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "var(--color-on-chrome-accent)",
            background: "rgba(111,191,63,.16)",
            borderRadius: 999,
            padding: "3px 8px"
          }}
        >
          {badge}
        </span>
      )}

      <div style={{ flex: 1 }} />

      {showClose && (
        <button
          type="button"
          aria-label="Fechar plugin"
          onClick={onClose}
          style={iconButtonStyle}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.14)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
        >
          <Icon name="x" size={13} color="#C9CFC4" />
        </button>
      )}
    </div>
  );
}
