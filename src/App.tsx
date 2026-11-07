
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
import MyVocabulary from "./components/MyVocabulary";
import Information from "./components/Information";
import Profile from "./components/Profile";
import Dashboard from "./components/Dashboard";
import Statistics from "./components/Statistics";
import { useLearningProgressSync } from "./services/learningProgressSync";

import Login from "./components/Login";
import Register from "./components/Register";

import Sidebar, { type TabType } from "./components/Sidebar";
import "./App.css";

const VALID_TABS: TabType[] = [
  "dashboard",
  "checklist",
  "statistics",
  "units",
  "listening",
  "flashcards",
  "cefr",
  "my-vocabulary",
  "information",
  "profile",
];

const TAB_ROUTES: Record<TabType, string> = {
  dashboard: "/dashboard",
  checklist: "/hoc-tieng-anh/tong-quan",
  statistics: "/hoc-tieng-anh/thong-ke",
  units: "/hoc-tieng-anh/luyen-tap-1500-cau",
  listening: "/hoc-tieng-anh/luyen-nghe",
  flashcards: "/hoc-tieng-anh/flashcard-tu-vung",
  cefr: "/hoc-tieng-anh/tu-vung-cefr",
  "my-vocabulary": "/hoc-tieng-anh/tu-vung-cua-toi",
  profile: "/tai-khoan/ho-so-ca-nhan",
  information: "/gioi-thieu-t-ai-group",
};

function getTabFromUrl(): TabType {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const routeMatch = (Object.entries(TAB_ROUTES) as [TabType, string][])
    .find(([, route]) => route === pathname)
    ?? (pathname === "/gioi-thieu-ntt-group" ? ["information", TAB_ROUTES.information] as [TabType, string] : undefined);

  if (routeMatch) return routeMatch[0];

  // Compatibility with links created by older versions that used URL hashes.
  const tabFromHash = window.location.hash.replace(/^#\/?/, "") as TabType;
  return VALID_TABS.includes(tabFromHash) ? tabFromHash : "dashboard";
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>(() => getTabFromUrl());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useLearningProgressSync(user);

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

  useEffect(() => {
    const syncTabFromUrl = () => {
      setActiveTab(getTabFromUrl());
    };

    window.addEventListener("popstate", syncTabFromUrl);
    window.addEventListener("hashchange", syncTabFromUrl);

    return () => {
      window.removeEventListener("popstate", syncTabFromUrl);
      window.removeEventListener("hashchange", syncTabFromUrl);
    };
  }, []);

  useEffect(() => {
    const nextPath = TAB_ROUTES[activeTab];

    if (window.location.pathname !== nextPath || window.location.hash) {
      window.history.pushState(null, "", nextPath);
    }
  }, [activeTab]);

  const handleLogout = async () => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn đăng xuất?");

    if (!confirmed) return;

    try {
      await signOut(auth);
      setActiveTab("dashboard");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Đăng xuất thất bại. Vui lòng thử lại.");
    }
  };

  const pageTitles: Record<TabType, string> = {
    dashboard: "Tổng quan ATI Group",
    checklist: "Tổng quan học tập",
    statistics: "Báo cáo học tập",
    units: "Luyện tập 1.500 câu",
    listening: "Luyện nghe",
    flashcards: "Flashcard từ vựng",
    cefr: "Flashcard CEFR",
    "my-vocabulary": "Từ vựng của tôi",
    information: "Thông tin ứng dụng",
    profile: "Hồ sơ tài khoản",
  };



  const toggleSidebar = () => {
    setSidebarCollapsed((previous) => !previous);
  };

  if (checkingAuth) {
    return <div className="auth-loading">Đang tải ATI Group...</div>;
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
          <div className="topbar-brand">
            <button
              className="topbar-logo-button"
              type="button"
              onClick={() => setActiveTab("dashboard")}
              aria-label="ATI – Trang chủ"
              title="ATI – Trang chủ"
            >
              <img className="topbar-ati-logo" src="/ati-approved-logo.png" alt="ATI" />
            </button>
            <div className="topbar-page-info">
              <h1>{pageTitles[activeTab]}</h1>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-user">
              <button
                className="topbar-avatar"
                type="button"
                onClick={() => setActiveTab("profile")}
                title="Mở hồ sơ tài khoản"
                aria-label="Mở hồ sơ tài khoản"
              >
                {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
              </button>

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
          {activeTab === "dashboard" && (
            <Dashboard
              displayName={user.displayName || "bạn"}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === "checklist" && <Checklist onNavigate={setActiveTab} />}
          {activeTab === "statistics" && <Statistics />}
          {activeTab === "units" && <Units />}
          {activeTab === "listening" && <Listening />}
          {activeTab === "flashcards" && <Flashcards />}
          {activeTab === "cefr" && <CefrFlashcards />}

          {activeTab === "my-vocabulary" && <MyVocabulary />}

          {activeTab === "information" && <Information />}
          {activeTab === "profile" && <Profile />}
        </section>
      </main>
    </div>
  );
}

export default App;
