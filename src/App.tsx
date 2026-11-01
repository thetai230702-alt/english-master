
import { useState } from "react";
import Checklist from "./components/Checklist";
import Units from "./components/Units";
import Listening from "./components/Listening";
import Flashcards from "./components/Flashcards";
import Sidebar, { type TabType } from "./components/Sidebar";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("checklist");

  const pageTitles: Record<TabType, string> = {
    checklist: "Checklist học tập",
    units: "Luyện tập 1.500 câu",
    listening: "Luyện nghe",
    flashcards: "Flashcard từ vựng",
  };

  const pageDescriptions: Record<TabType, string> = {
    checklist: "Theo dõi tiến độ học tiếng Anh của bạn.",
    units: "Luyện dịch câu tiếng Việt sang tiếng Anh theo từng Unit.",
    listening: "Nghe và luyện phát âm theo từng câu trong mỗi Unit.",
    flashcards: "Học và ghi nhớ từ vựng theo từng chủ đề.",
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="main-content">
        <header className="main-header">
          <div>
            <h1>{pageTitles[activeTab]}</h1>
            <p>{pageDescriptions[activeTab]}</p>
          </div>

          <div className="user-profile">
            <div className="user-avatar">M</div>
            <span>My Learning</span>
          </div>
        </header>

        <section className="page-content">
          {activeTab === "checklist" && <Checklist />}
          {activeTab === "units" && <Units />}
          {activeTab === "listening" && <Listening />}
          {activeTab === "flashcards" && <Flashcards />}
        </section>
      </main>
    </div>
  );
}

export default App;
