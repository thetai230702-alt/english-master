
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";

import { auth, authPersistence } from "./firebase";

import Checklist from "./components/Checklist";
import Units from "./components/Units";
import Listening from "./components/Listening";
import Flashcards from "./components/Flashcards";
import CefrFlashcards from "./components/CefrFlashcards";
import Information from "./components/Information";

import Login from "./components/Login";
import Register from "./components/Register";

import Sidebar, { type TabType } from "./components/Sidebar";
import "./App.css";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>("checklist");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    authPersistence
      .then(() => {
        if (cancelled) return;

        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setCheckingAuth(false);
        });
      })
      .catch((error) => {
        console.error("Firebase Authentication error:", error);
        if (!cancelled) {
          setCheckingAuth(false);
        }
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const handleLogout = async () => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn đăng xuất?");

    if (!confirmed) return;

    try {
      await signOut(auth);
      setActiveTab("checklist");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Đăng xuất thất bại. Vui lòng thử lại.");
    }
  };

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

  const toggleSidebar = () => {
    setSidebarCollapsed((previous) => !previous);
  };

  if (checkingAuth) {
    return <div className="auth-loading">Đang tải English Master...</div>;
  }

  if (!user) {
    return showRegister ? (
      <Register onSwitch={() => setShowRegister(false)} />
    ) : (
      <Login onSwitch={() => setShowRegister(true)} />
    );
  }

  return (
    <div
      className={`app-container ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
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
              aria-label="Đóng hoặc mở Sidebar"
              title="Đóng hoặc mở Sidebar"
            >
              <span className="topbar-menu-lines">
                <span />
                <span />
                <span />
              </span>
            </button>

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
              <div className="topbar-avatar">
                {(user.displayName || user.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="topbar-user-info">
                <strong>{user.displayName || "Học viên"}</strong>
                <span>{user.email}</span>
              </div>

              <button
                className="auth-logout"
                onClick={handleLogout}
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </header>

        <section className="page-content">
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
