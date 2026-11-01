
import {
  ClipboardCheck,
  BookOpen,
  Headphones,
  GraduationCap,
} from "lucide-react";

import "./Sidebar.css";

// Các trang trong website
export type TabType = "checklist" | "units" | "listening";

// Dữ liệu truyền từ App.tsx vào Sidebar
interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

// Danh sách menu
const menuItems = [
  {
    id: "checklist" as TabType,
    label: "Checklist",
    description: "Theo dõi tiến độ học tập",
    icon: ClipboardCheck,
  },
  {
    id: "units" as TabType,
    label: "Các Unit",
    description: "Luyện tập 1.500 câu",
    icon: BookOpen,
  },
  {
    id: "listening" as TabType,
    label: "Luyện nghe",
    description: "Listening practice",
    icon: Headphones,
  },
];

function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <GraduationCap size={28} />
        </div>

        <div className="logo-text">
          <h2>English Master</h2>
          <span>LEARN ENGLISH EVERY DAY</span>
        </div>
      </div>

      {/* Menu */}
      <div className="sidebar-menu">
        <p className="menu-heading">HỌC TẬP</p>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              className={`menu-item ${isActive ? "active" : ""}`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={21} />

              <div className="menu-item-text">
                <span>{item.label}</span>
                <small>{item.description}</small>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="footer-icon">
          <GraduationCap size={23} />
        </div>

        <div>
          <strong>Keep learning!</strong>
          <p>Mỗi ngày tiến bộ một chút.</p>
        </div>
      </div>

    </aside>
  );
}

export default Sidebar;
