
import {
  ClipboardCheck,
  BookOpen,
  Headphones,
  Layers,
  Award,
  Info,
  GraduationCap,
  BookPlus,
} from "lucide-react";

import "./Sidebar.css";

export type TabType =
  | "checklist"
  | "units"
  | "listening"
  | "flashcards"
  | "cefr"
  | "my-vocabulary"
  | "information";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  {
    id: "checklist" as TabType,
    label: "Checklist",
    description: "Theo dõi tiến độ học tập",
    icon: ClipboardCheck,
    color: "blue",
  },
  {
    id: "units" as TabType,
    label: "Các Unit",
    description: "Luyện tập 1.500 câu",
    icon: BookOpen,
    color: "sky",
  },
  {
    id: "listening" as TabType,
    label: "Luyện nghe",
    description: "Nghe & luyện phát âm",
    icon: Headphones,
    color: "violet",
  },
  {
    id: "flashcards" as TabType,
    label: "Flashcard",
    description: "Từ vựng theo 50 Unit",
    icon: Layers,
    color: "orange",
  },
  {
    id: "cefr" as TabType,
    label: "Flashcard CEFR",
    description: "Từ vựng A1 đến C2",
    icon: Award,
    color: "indigo",
  },
  {
    id: "my-vocabulary" as TabType,
    label: "Từ vựng của tôi",
    description: "Tạo chủ đề và bộ từ riêng",
    icon: BookPlus,
    color: "green",
  },
  {
    id: "information" as TabType,
    label: "Information",
    description: "Thông tin ứng dụng",
    icon: Info,
    color: "cyan",
  },
];

function Sidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggle,
}: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <button
        className="sidebar-logo"
        onClick={onToggle}
        title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        type="button"
      >
        <span className="logo-icon">
          <GraduationCap size={29} strokeWidth={2.1} />
          <span className="logo-sparkle">✦</span>
        </span>

        {!collapsed && (
          <span className="logo-text">
            <strong>English Master</strong>
            <small>LEARN ENGLISH EVERY DAY</small>
          </span>
        )}
      </button>

      <div className="sidebar-menu">
        {!collapsed && <p className="menu-heading">KHÔNG GIAN HỌC TẬP</p>}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              className={`menu-item ${isActive ? "active" : ""} icon-${item.color}`}
              onClick={() => onTabChange(item.id)}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
              type="button"
            >
              <span className="menu-icon">
                <Icon size={21} strokeWidth={2.15} />
              </span>

              {!collapsed && (
                <span className="menu-item-text">
                  <span>{item.label}</span>
                  <small>{item.description}</small>
                </span>
              )}

              {isActive && <span className="active-indicator" />}
            </button>
          );
        })}
      </div>

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="footer-art">
            <BookOpen size={23} />
            <span>✦</span>
          </div>

          <div className="sidebar-footer-text">
            <strong>Keep learning!</strong>
            <p>Mỗi ngày tiến bộ một chút.</p>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
