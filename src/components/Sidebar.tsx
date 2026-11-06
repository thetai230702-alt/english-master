import {
  Award,
  BookOpen,
  BookPlus,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Info,
  Layers,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import "./Sidebar.css";

export type TabType =
  | "dashboard"
  | "checklist"
  | "units"
  | "listening"
  | "flashcards"
  | "cefr"
  | "my-vocabulary"
  | "information"
  | "profile";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const learningItems = [
  { id: "checklist" as TabType, label: "Tổng quan học tập", description: "Tiến độ và mục tiêu", icon: ClipboardCheck },
  { id: "units" as TabType, label: "Luyện tập 1.500 câu", description: "Thực hành theo Unit", icon: BookOpen },
  { id: "listening" as TabType, label: "Luyện nghe", description: "Nghe và luyện phát âm", icon: Headphones },
  { id: "flashcards" as TabType, label: "Flashcard từ vựng", description: "Từ vựng theo chủ đề", icon: Layers },
  { id: "cefr" as TabType, label: "Flashcard CEFR", description: "Từ A1 đến C2", icon: Award },
  { id: "my-vocabulary" as TabType, label: "Từ vựng của tôi", description: "Bộ từ vựng cá nhân", icon: BookPlus },
];

function Sidebar({ activeTab, onTabChange, collapsed, onToggle }: SidebarProps) {
  const [learningOpen, setLearningOpen] = useState(true);
  const isLearningActive = learningItems.some((item) => item.id === activeTab);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand-row">
        <button
          className="sidebar-logo"
          type="button"
          onClick={onToggle}
          title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        >
          <span className="ntt-mark">NTT</span>
          {!collapsed && (
            <span className="logo-text">
              <strong>NTT GROUP</strong>
              <small>ONE PLATFORM · MULTIPLE POSSIBILITIES</small>
            </span>
          )}
        </button>
        {!collapsed && (
          <button className="sidebar-collapse-button" type="button" onClick={onToggle} aria-label="Thu gọn menu">
            <PanelLeftClose size={17} />
          </button>
        )}
        {collapsed && (
          <button className="sidebar-expand-button" type="button" onClick={onToggle} aria-label="Mở rộng menu">
            <PanelLeftOpen size={16} />
          </button>
        )}
      </div>

      <div className="sidebar-scroll">
        {!collapsed && <p className="menu-heading">KHÔNG GIAN LÀM VIỆC</p>}

        <button
          type="button"
          className={`menu-item dashboard-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => onTabChange("dashboard")}
          title={collapsed ? "Tổng quan NTT GROUP" : undefined}
          aria-current={activeTab === "dashboard" ? "page" : undefined}
        >
          <span className="menu-icon"><LayoutDashboard size={18} strokeWidth={2} /></span>
          {!collapsed && (
            <span className="menu-item-text">
              <span>Tổng quan NTT GROUP</span>
              <small>Trung tâm điều hành</small>
            </span>
          )}
          {activeTab === "dashboard" && <span className="active-indicator" />}
        </button>

        {!collapsed && <p className="menu-heading module-menu-heading">PHÂN HỆ</p>}
        <button
          type="button"
          className={`module-heading ${isLearningActive ? "module-active" : ""}`}
          onClick={() => collapsed ? onToggle() : setLearningOpen((value) => !value)}
          title={collapsed ? "Học tiếng Anh" : undefined}
          aria-expanded={learningOpen}
        >
          <span className="module-heading-icon"><GraduationCap size={19} /></span>
          {!collapsed && <span className="module-heading-label">HỌC TIẾNG ANH</span>}
          {!collapsed && <ChevronDown size={16} className={`module-chevron ${learningOpen ? "open" : ""}`} />}
        </button>

        {learningOpen && (
          <nav className="sidebar-menu" aria-label="Các chức năng học tiếng Anh">
            {learningItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`menu-item ${isActive ? "active" : ""}`}
                  onClick={() => onTabChange(item.id)}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  type="button"
                >
                  <span className="menu-icon"><Icon size={18} strokeWidth={2} /></span>
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
          </nav>
        )}

        <div className="sidebar-account-section">
          {!collapsed && <p className="menu-heading account-heading">TÀI KHOẢN</p>}
          <button
            type="button"
            className={`menu-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => onTabChange("profile")}
            title={collapsed ? "Hồ sơ tài khoản" : undefined}
            aria-current={activeTab === "profile" ? "page" : undefined}
          >
            <span className="menu-icon"><UserRound size={18} strokeWidth={2} /></span>
            {!collapsed && (
              <span className="menu-item-text">
                <span>Hồ sơ tài khoản</span>
                <small>Thông tin cá nhân & cài đặt</small>
              </span>
            )}
            {activeTab === "profile" && <span className="active-indicator" />}
          </button>
        </div>

        <div className="sidebar-platform-section">
          {!collapsed && <p className="menu-heading platform-heading">NỀN TẢNG</p>}
          <button
            type="button"
            className={`menu-item ${activeTab === "information" ? "active" : ""}`}
            onClick={() => onTabChange("information")}
            title={collapsed ? "Về NTT GROUP" : undefined}
            aria-current={activeTab === "information" ? "page" : undefined}
          >
            <span className="menu-icon"><Info size={18} strokeWidth={2} /></span>
            {!collapsed && (
              <span className="menu-item-text">
                <span>Về NTT GROUP</span>
                <small>Giới thiệu nền tảng</small>
              </span>
            )}
            {activeTab === "information" && <span className="active-indicator" />}
          </button>
        </div>

        {!collapsed && (
          <>
            <p className="menu-heading future-heading">CÁC PHÂN HỆ KHÁC</p>
            <div className="future-module">
              <span className="future-module-icon"><Mic size={17} /></span>
              <span><strong>NTT Studio</strong><small>Sáng tạo nội dung</small></span>
              <em>Sắp ra mắt</em>
            </div>
          </>
        )}
      </div>

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-footer-mark">N</div>
          <div className="sidebar-footer-text">
            <strong>NTT GROUP</strong>
            <p>Phát triển không giới hạn.</p>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
