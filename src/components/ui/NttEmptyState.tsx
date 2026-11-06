import type { ReactNode } from "react";
import "./NttUI.css";

type NttEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function NttEmptyState({
  icon,
  title,
  description,
  action,
}: NttEmptyStateProps) {
  return (
    <div className="ntt-empty-state" role="status">
      {icon && <div className="ntt-empty-state-icon">{icon}</div>}
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action && <div className="ntt-empty-state-action">{action}</div>}
    </div>
  );
}
