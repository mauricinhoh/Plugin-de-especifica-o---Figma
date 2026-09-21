import React from "react";
import { Icon } from "./Icon";

interface EmptyStateProps {
  iconName: React.ComponentProps<typeof Icon>["name"];
  title: string;
  description: string;
  maxWidth?: number;
  children?: React.ReactNode;
}

export function EmptyState({ iconName, title, description, maxWidth = 250, children }: EmptyStateProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "var(--color-surface-muted)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Icon name={iconName} size={26} color="var(--color-text-subtle)" />
      </div>
      <h2 style={{ marginTop: 18, fontSize: 19, fontWeight: 900, margin: "18px 0 0" }}>{title}</h2>
      <p
        style={{
          marginTop: 8,
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--color-text-muted)",
          maxWidth
        }}
      >
        {description}
      </p>
      {children}
    </div>
  );
}
