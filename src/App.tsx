
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

import Login from "./components/Login";
import Register from "./components/Register";

import Sidebar, { type TabType } from "./components/Sidebar";
import "./App.css";

const VALID_TABS: TabType[] = [
  "dashboard",
  "checklist",
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
  units: "/hoc-tieng-anh/luyen-tap-1500-cau",
  listening: "/hoc-tieng-anh/luyen-nghe",
  flashcards: "/hoc-tieng-anh/flashcard-tu-vung",
  cefr: "/hoc-tieng-anh/tu-vung-cefr",
  "my-vocabulary": "/hoc-tieng-anh/tu-vung-cua-toi",
  profile: "/tai-khoan/ho-so-ca-nhan",
  information: "/gioi-thieu-ntt-group",
};

function getTabFromUrl(): TabType {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const routeMatch = (Object.entries(TAB_ROUTES) as [TabType, string][])
    .find(([, route]) => route === pathname);

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
    dashboard: "Tổng quan NTT GROUP",
    checklist: "Tổng quan học tập",
    units: "Luyện tập 1.500 câu",
    listening: "Luyện nghe",
    flashcards: "Flashcard từ vựng",
    cefr: "Flashcard CEFR",
    "my-vocabulary": "Từ vựng của tôi",
    information: "Thông tin ứng dụng",
    profile: "Hồ sơ tài khoản",
  };

  const pageDescriptions: Record<TabType, string> = {
    dashboard: "Không gian tổng quan và truy cập các phân hệ trong hệ sinh thái NTT GROUP.",
    checklist: "Theo dõi tiến độ học tiếng Anh của bạn.",
    units: "Luyện dịch câu tiếng Việt sang tiếng Anh theo từng Unit.",
    listening: "Nghe và luyện phát âm theo từng câu trong mỗi Unit.",
    flashcards: "Học và ghi nhớ từ vựng theo 50 Unit.",
    cefr: "Học từ vựng theo sáu cấp độ A1, A2, B1, B2, C1 và C2.",
    "my-vocabulary":
      "Tạo bộ từ vựng riêng và luyện tập theo cách của bạn.",
    information: "Thông tin về NTT GROUP và hệ thống học tập.",
    profile: "Quản lý thông tin cá nhân, công việc, học vấn và gia đình.",
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((previous) => !previous);
  };

  if (checkingAuth) {
    return <div className="auth-loading">Đang tải NTT GROUP...</div>;
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
              <nav className="topbar-breadcrumb" aria-label="Đường dẫn trang">
                <button
                  type="button"
                  className="breadcrumb-home"
                  onClick={() => setActiveTab("dashboard")}
                  title="Trang chủ NTT GROUP"
                >
                  <span className="breadcrumb-home-mark">N</span>
                  <span>NTT GROUP</span>
                </button>
                <span className="breadcrumb-separator">›</span>
                {activeTab === "dashboard" ? (
                  <strong className="breadcrumb-current">Trung tâm điều hành</strong>
                ) : activeTab === "profile" ? (
                  <>
                    <button type="button" className="breadcrumb-parent" onClick={() => setActiveTab("dashboard")}>Không gian cá nhân</button>
                    <span className="breadcrumb-separator">›</span>
                    <strong className="breadcrumb-current">Hồ sơ cá nhân</strong>
                  </>
                ) : activeTab === "information" ? (
                  <>
                    <strong className="breadcrumb-current">Về NTT GROUP</strong>
                  </>
                ) : (
                  <>
                    <button type="button" className="breadcrumb-parent" onClick={() => setActiveTab("dashboard")}>Học viện ngoại ngữ</button>
                    <span className="breadcrumb-separator">›</span>
                    <strong className="breadcrumb-current">{pageTitles[activeTab]}</strong>
                  </>
                )}
              </nav>
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
