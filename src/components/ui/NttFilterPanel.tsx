import type { ReactNode } from "react";
import { Filter, RotateCcw } from "lucide-react";
import "./NttUI.css";

type NttFilterPanelProps = {
  children: ReactNode;
  title?: string;
  onReset?: () => void;
  resetLabel?: string;
  footer?: ReactNode;
};

export default function NttFilterPanel({
  children,
  title = "Bộ lọc dữ liệu",
  onReset,
  resetLabel = "Đặt lại",
  footer,
}: NttFilterPanelProps) {
  return (
    <section className="ntt-filter-panel">
      <div className="ntt-filter-panel-heading">
        <div><Filter size={16} /><strong>{title}</strong></div>
        {onReset && (
          <button type="button" className="ntt-quiet-button" onClick={onReset}>
            <RotateCcw size={14} /> {resetLabel}
          </button>
        )}
      </div>
      <div className="ntt-filter-grid">{children}</div>
      {footer && <div className="ntt-filter-footer">{footer}</div>}
    </section>
  );
}
