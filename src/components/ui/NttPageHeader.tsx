import type { ReactNode } from "react";
import "./NttUI.css";

type NttPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
};

export default function NttPageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
}: NttPageHeaderProps) {
  return (
    <header className="ntt-page-header">
      <div className="ntt-page-header-main">
        {icon && <span className="ntt-page-header-icon">{icon}</span>}
        <div className="ntt-page-header-copy">
          {eyebrow && <span className="ntt-eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>
      {actions && <div className="ntt-page-header-actions">{actions}</div>}
    </header>
  );
}
