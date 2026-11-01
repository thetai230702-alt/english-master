import { useState } from "react";
import {
  ClipboardCheck,
  BookOpen,
  Headphones,
  Layers,
  Award,
  Info,
} from "lucide-react";

import Checklist from "./components/Checklist";
import Units from "./components/Units";
import Listening from "./components/Listening";
import Flashcards from "./components/Flashcards";
import CefrFlashcards from "./components/CefrFlashcards";
import Information from "./components/Information";

import Sidebar, { type TabType } from "./components/Sidebar";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("checklist");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const pageTitles: Record<TabType, string> = {
    checklist: "Checklist học tập",
    units: "Luyện tập 1.500 câu",
    listening: "Luyện nghe",
    flashcards: "Flashcard từ vựng",
    cefr: "Flashcard CEFR",
    information: "Information",
  };

  const pageDescriptions: Record<TabType, string> = {
    checklist: "Theo dõi tiến độ học tiếng Anh của bạn.",
    units: "Luyện dịch câu tiếng Việt sang tiếng Anh theo từng Unit.",
    listening: "Nghe và luyện phát âm theo từng câu trong mỗi Unit.",
    flashcards: "Học và ghi nhớ từ vựng theo 50 Unit.",
    cefr: "Học từ vựng theo sáu cấp độ A1, A2, B1, B2, C1 và C2.",
    information: "Thông tin về ứng dụng và người phát triển.",
  };

  const pageIcons = {
    checklist: ClipboardCheck,
    units: BookOpen,
    listening: Headphones,
    flashcards: Layers,
    cefr: Award,
    information: Info,
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((previous) => !previous);
  };

  const ActivePageIcon = pageIcons[activeTab];

  return (
    <div className={`app-container ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="topbar-menu-button"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
              title={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
              type="button"
            >
              <span className="topbar-menu-lines">
                <span />
                <span />
                <span />
              </span>
            </button>

            <div className="topbar-divider" />

            <div className="topbar-page-icon">
              <ActivePageIcon size={22} strokeWidth={2.2} />
            </div>

            <div className="topbar-page-info">
              <h1>{pageTitles[activeTab]}</h1>
              <p>{pageDescriptions[activeTab]}</p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-version">
              <span className="version-dot" />
              <span>Version 1.0.0</span>
            </div>

            <div className="topbar-user">
              <div className="topbar-avatar" aria-label="Avatar Thế Tài">
                T
              </div>
              <div className="topbar-user-info">
                <strong>Thế Tài</strong>
                <span>English Master</span>
              </div>
            </div>
          </div>
        </header>

        <section className="page-content" key={activeTab}>
          {activeTab === "checklist" && <Checklist />}
          {activeTab === "units" && <Units />}
          {activeTab === "listening" && <Listening />}
          {activeTab === "flashcards" && <Flashcards />}
          {activeTab === "cefr" && <CefrFlashcards />}
          {activeTab === "information" && <Information />}
        </section>
      </main>
    </div>
  );
}

export default App;
