import {
  Award,
  BookOpen,
  BookPlus,
  BookMarked,
  ChevronDown,
  ClipboardCheck,
  ChartNoAxesCombined,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Info,
  Layers,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import "./Sidebar.css";

export type TabType =
  | "dashboard"
  | "learning-dashboard"
  | "checklist"
  | "statistics"
  | "units"
  | "listening"
  | "flashcards"
  | "cefr"
  | "tenses"
  | "my-vocabulary"
  | "information"
  | "profile";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  collapsed: boolean;
  onToggle: () => void;
}

type LearningItem = {
  id: TabType;
  label: string;
  description: string;
  icon: typeof GraduationCap;
};

type LearningGroup = {
  id: "overview" | "practice" | "vocabulary";
  label: string;
  items: LearningItem[];
};

const learningGroups: LearningGroup[] = [
  {
    id: "overview",
    label: "OVERVIEW",
    items: [
      { id: "learning-dashboard", label: "Learning Overview", description: "Your learning dashboard", icon: GraduationCap },
      { id: "checklist", label: "Learning Checklist", description: "Progress and daily goals", icon: ClipboardCheck },
      { id: "statistics", label: "Learning Statistics", description: "Track your results", icon: ChartNoAxesCombined },
    ],
  },
  {
    id: "practice",
    label: "PRACTICE",
    items: [
      { id: "units", label: "1,500 Sentences", description: "Practice English by unit", icon: BookOpen },
      { id: "listening", label: "Listening Practice", description: "Listening and pronunciation", icon: Headphones },
      { id: "tenses", label: "12 English Tenses", description: "Grammar rules and examples", icon: BookMarked },
    ],
  },
  {
    id: "vocabulary",
    label: "VOCABULARY",
    items: [
      { id: "flashcards", label: "Vocabulary Flashcards", description: "Learn words by topic", icon: Layers },
      { id: "cefr", label: "CEFR Vocabulary", description: "Build A1–C2 vocabulary", icon: Award },
      { id: "my-vocabulary", label: "My Vocabulary", description: "Your saved words", icon: BookPlus },
    ],
  },
];

function Sidebar({ activeTab, onTabChange, collapsed, onToggle }: SidebarProps) {
  const [learningOpen, setLearningOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<LearningGroup["id"], boolean>>({
    overview: true,
    practice: true,
    vocabulary: true,
  });

  const activeGroup = learningGroups.find((group) =>
    group.items.some((item) => item.id === activeTab)
  );

  useEffect(() => {
    if (activeGroup) {
      setLearningOpen(true);
      setOpenGroups((current) => ({ ...current, [activeGroup.id]: true }));
    }
  }, [activeTab]);

  const toggleGroup = (groupId: LearningGroup["id"]) => {
    setOpenGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  };

  const renderLearningItem = (item: LearningItem) => {
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
  };

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
          <img className="ntt-mark" src="/ati-approved-logo.png" alt="ATI" />
          {!collapsed && (
            <span className="logo-text">
              <strong>GROUP</strong>
              <small>TECHNOLOGY · AI · MANUFACTURING</small>
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
          title={collapsed ? "Tổng quan ATI Group" : undefined}
          aria-current={activeTab === "dashboard" ? "page" : undefined}
        >
          <span className="menu-icon"><LayoutDashboard size={18} strokeWidth={2} /></span>
          {!collapsed && (
            <span className="menu-item-text">
              <span>Tổng quan ATI Group</span>
              <small>Trung tâm điều hành</small>
            </span>
          )}
          {activeTab === "dashboard" && <span className="active-indicator" />}
        </button>

        {!collapsed && <p className="menu-heading module-menu-heading">HỌC TIẾNG ANH</p>}
        <button
          type="button"
          className={`module-heading ${activeGroup ? "module-active" : ""}`}
          onClick={() => collapsed ? onToggle() : setLearningOpen((value) => !value)}
          title={collapsed ? "English Learning" : undefined}
          aria-expanded={learningOpen}
        >
          <span className="module-heading-icon"><GraduationCap size={19} /></span>
          {!collapsed && <span className="module-heading-label">ENGLISH LEARNING</span>}
          {!collapsed && <ChevronDown size={16} className={`module-chevron ${learningOpen ? "open" : ""}`} />}
        </button>

        {learningOpen && (
          <nav className="sidebar-menu learning-groups" aria-label="English learning features">
            {learningGroups.map((group) => {
              const groupIsActive = group.items.some((item) => item.id === activeTab);
              const groupIsOpen = openGroups[group.id];
              return (
                <section className={`learning-nav-group ${groupIsActive ? "has-active-item" : ""}`} key={group.id}>
                  {!collapsed && (
                    <button
                      type="button"
                      className="learning-group-toggle"
                      onClick={() => toggleGroup(group.id)}
                      aria-expanded={groupIsOpen}
                    >
                      <span>{group.label}</span>
                      <ChevronDown size={13} className={groupIsOpen ? "group-chevron open" : "group-chevron"} />
                    </button>
                  )}
                  {(collapsed || groupIsOpen) && (
                    <div className="learning-group-items">
                      {group.items.map(renderLearningItem)}
                    </div>
                  )}
                </section>
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
            title={collapsed ? "Về ATI Group" : undefined}
            aria-current={activeTab === "information" ? "page" : undefined}
          >
            <span className="menu-icon"><Info size={18} strokeWidth={2} /></span>
            {!collapsed && (
              <span className="menu-item-text">
                <span>Về ATI Group</span>
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
              <span><strong>ATI Studio</strong><small>Sáng tạo nội dung</small></span>
              <em>Sắp ra mắt</em>
            </div>
          </>
        )}
      </div>

      {!collapsed && (
        <div className="sidebar-footer">
          <img className="sidebar-footer-mark" src="/ati-approved-logo.png" alt="ATI" />
          <div className="sidebar-footer-text">
            <strong>ATI Group</strong>
            <p>Phát triển không giới hạn.</p>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
