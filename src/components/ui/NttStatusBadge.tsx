import type { ReactNode } from "react";
import "./NttUI.css";

export type NttStatusTone = "neutral" | "info" | "success" | "warning" | "danger";

type NttStatusBadgeProps = {
  children: ReactNode;
  tone?: NttStatusTone;
  dot?: boolean;
};

export default function NttStatusBadge({
  children,
  tone = "neutral",
  dot = true,
}: NttStatusBadgeProps) {
  return (
    <span className={`ntt-status-badge ntt-status-${tone}`}>
      {dot && <i aria-hidden="true" />}
      {children}
    </span>
  );
}
