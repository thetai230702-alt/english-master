import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Award,
  BookOpen,
  BookPlus,
  BookMarked,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Flame,
  Save,
  GraduationCap,
  Headphones,
  Layers,
  Play,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  X,
  ChartNoAxesCombined,
} from "lucide-react";
import type { TabType } from "./Sidebar";
import { getDailyGoal, getLastSevenDays, getStudyActivity, getStudyStreak, localDay, setDailyGoal, STUDY_ACTIVITY_EVENT } from "../services/studyGoals";
import "./LearningDashboard.css";

type DashboardProps = {
  displayName: string;
  onNavigate: (tab: TabType) => void;
};

type ChecklistItem = {
  id: number;
  topic?: string;
  status?: string;
  date?: string;
  review?: boolean;
};

type PracticeMap = Record<string, Record<string, boolean>>;

const CHECKLIST_KEY = "english-master-checklist";
const PRACTICE_KEY = "ntt-unit-practice-progress-v1";

const learningModules: {
  id: TabType;
  title: string;
  description: string;
  detail: string;
  icon: typeof BookOpen;
  tone: string;
}[] = [
  { id: "units", title: "Luyện tập 1.500 câu", description: "Thực hành dịch câu theo từng Unit.", detail: "1500 SENTENCES", icon: BookOpen, tone: "blue" },
  { id: "listening", title: "Luyện nghe", description: "Nghe câu mẫu và luyện phát âm.", detail: "LISTENING PRACTICE", icon: Headphones, tone: "cyan" },
  { id: "flashcards", title: "Flashcard từ vựng", description: "Ghi nhớ từ vựng theo chủ đề.", detail: "VOCABULARY", icon: Layers, tone: "violet" },
  { id: "cefr", title: "Từ vựng CEFR", description: "Học từ vựng theo cấp độ A1 đến C2.", detail: "CEFR LEVELS", icon: Award, tone: "amber" },
  { id: "my-vocabulary", title: "Từ vựng của tôi", description: "Quản lý bộ từ vựng cá nhân.", detail: "MY COLLECTION", icon: BookPlus, tone: "teal" },
  { id: "tenses", title: "12 English Tenses", description: "Học cấu trúc và cách sử dụng 12 thì tiếng Anh.", detail: "ENGLISH GRAMMAR", icon: BookMarked, tone: "blue" },
  { id: "checklist", title: "Tiến độ học tập", description: "Theo dõi trạng thái 50 Unit.", detail: "LEARNING PLAN", icon: ClipboardCheck, tone: "blue" },
  { id: "statistics", title: "Báo cáo học tập", description: "Phân tích kết quả và độ chính xác.", detail: "LEARNING ANALYTICS", icon: ChartNoAxesCombined, tone: "green" },
];

function readJson<T,>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function LearningDashboard({ displayName, onNavigate }: DashboardProps) {
  const firstName = displayName.trim().split(/\s+/).slice(-1)[0] || "bạn";
  const [moduleSearch, setModuleSearch] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [dailyGoal, setGoal] = useState(() => getDailyGoal());
  const [goalInput, setGoalInput] = useState(() => String(getDailyGoal()));
  const [showGoalEditor, setShowGoalEditor] = useState(false);

  useEffect(() => {
    const update = () => setRefresh((value) => value + 1);
    window.addEventListener("storage", update);
    window.addEventListener("ntt-learning-progress-local-updated", update);
    window.addEventListener("ntt-unit-progress-updated", update);
    window.addEventListener("focus", update);
    window.addEventListener(STUDY_ACTIVITY_EVENT, update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("ntt-learning-progress-local-updated", update);
      window.removeEventListener("ntt-unit-progress-updated", update);
      window.removeEventListener("focus", update);
      window.removeEventListener(STUDY_ACTIVITY_EVENT, update);
    };
  }, []);

  const checklist = useMemo(
    () => readJson<ChecklistItem[]>(CHECKLIST_KEY, []),
    [refresh],
  );
  const practice = useMemo(
    () => readJson<PracticeMap>(PRACTICE_KEY, {}),
    [refresh],
  );

  const activity = useMemo(() => getStudyActivity(), [refresh]);
  const todayCount = activity[localDay()] ?? 0;
  const streak = getStudyStreak(activity);
  const lastSevenDays = getLastSevenDays(activity);
  const maxDailyCount = Math.max(dailyGoal, ...lastSevenDays.map((day) => day.count), 1);
  const goalPercent = Math.min(100, Math.round((todayCount / dailyGoal) * 100));

  const completed = checklist.filter((item) => item.status === "Đã học").length;
  const studying = checklist.filter((item) => item.status === "Đang học").length;
  const remaining = Math.max(0, 50 - completed - studying);
  const attempted = Object.values(practice).reduce((sum, unit) => sum + Object.keys(unit ?? {}).length, 0);
  const correct = Object.values(practice).reduce(
    (sum, unit) => sum + Object.values(unit ?? {}).filter(Boolean).length,
    0,
  );
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const activeUnit = checklist.find((item) => item.status === "Đang học");
  const nextUnit = activeUnit ?? checklist.find((item) => item.status !== "Đã học");
  const activeUnitAttempted = nextUnit ? Object.keys(practice[String(nextUnit.id)] ?? {}).length : 0;
  const activeUnitPercent = nextUnit ? Math.min(100, Math.round((activeUnitAttempted / 30) * 100)) : 0;
  const progressPercent = Math.round((completed / 50) * 100);

  const recentDatedUnits = useMemo(() => checklist
    .filter((item) => typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 4), [checklist]);

  const filteredModules = useMemo(() => {
    const keyword = moduleSearch.trim().toLocaleLowerCase("vi");
    if (!keyword) return learningModules;
    return learningModules.filter((module) =>
      [module.title, module.description, module.detail].join(" ").toLocaleLowerCase("vi").includes(keyword)
    );
  }, [moduleSearch]);

  const formatDate = (value: string) => new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

  return (
    <div className="ntt-dashboard ati-dashboard">
      <section className="dashboard-welcome dashboard-welcome-premium">
        <div className="dashboard-welcome-copy">
          <span className="dashboard-eyebrow"><Sparkles size={13} /> ATI LEARNING · YOUR STUDY SPACE</span>
          <h2>Chào mừng trở lại, {firstName}!</h2>
          <p>Hôm nay là một cơ hội mới để tiến gần hơn đến mục tiêu chinh phục 1.500 câu tiếng Anh.</p>
          <div className="dashboard-welcome-actions">
            <button type="button" className="dashboard-primary-action" onClick={() => onNavigate("units")}>
              Tiếp tục học <ArrowRight size={16} />
            </button>
            <button type="button" className="dashboard-secondary-action" onClick={() => onNavigate("checklist")}>
              Xem lộ trình
            </button>
          </div>
        </div>
        <div className="dashboard-welcome-visual" aria-hidden="true">
          <div className="welcome-glow" />
          <div className="welcome-book-stack"><BookOpen size={58} /><span>ENGLISH</span></div>
          <div className="welcome-headphones"><Headphones size={58} /></div>
          <div className="welcome-pencil"><Sparkles size={24} /></div>
          <div className="welcome-orbit welcome-orbit-one" />
          <div className="welcome-orbit welcome-orbit-two" />
        </div>
      </section>

      <section className="dashboard-study-habit" aria-label="Mục tiêu và thói quen học tập">
        <article className="dashboard-habit-card dashboard-habit-goal">
          <div className="dashboard-habit-heading"><span><Target size={18} /> Mục tiêu hôm nay</span><button type="button" onClick={() => setShowGoalEditor((value) => !value)}>{showGoalEditor ? "Đóng" : "Điều chỉnh"}</button></div>
          <div className="dashboard-habit-number"><strong>{todayCount}</strong><span>/ {dailyGoal} lượt kiểm tra câu</span></div>
          <div className="dashboard-habit-progress"><span style={{ width: `${goalPercent}%` }} /></div>
          <p>{todayCount >= dailyGoal ? "Bạn đã đạt mục tiêu hôm nay!" : `Còn ${dailyGoal - todayCount} lượt kiểm tra để đạt mục tiêu.`}</p>
          {showGoalEditor && <form className="dashboard-goal-editor" onSubmit={(event) => {
            event.preventDefault();
            const value = Number(goalInput);
            if (Number.isInteger(value) && value >= 1 && value <= 100) {
              setDailyGoal(value);
              setGoal(value);
              setShowGoalEditor(false);
            }
          }}>
            <label htmlFor="ati-goal-input">Số lượt kiểm tra mỗi ngày (1–100)</label>
            <input id="ati-goal-input" type="number" min="1" max="100" step="1" required value={goalInput} onChange={(event) => setGoalInput(event.target.value)} />
            <button type="submit"><Save size={14} /> Lưu</button>
          </form>}
        </article>
        <article className="dashboard-habit-card dashboard-habit-streak">
          <div className="dashboard-habit-heading"><span><Flame size={18} /> Chuỗi ngày học</span></div>
          <div className="dashboard-habit-number"><strong>{streak}</strong><span>ngày liên tiếp</span></div>
          <p>{streak > 0 ? "Duy trì thói quen luyện tập mỗi ngày!" : "Kiểm tra một câu hôm nay để bắt đầu chuỗi ngày học."}</p>
          <small>Chỉ tính từ khi V32 bắt đầu ghi nhận lượt kiểm tra câu.</small>
        </article>
        <article className="dashboard-habit-card dashboard-habit-week">
          <div className="dashboard-habit-heading"><span><CalendarDays size={18} /> Hoạt động 7 ngày</span></div>
          <div className="dashboard-week-bars">
            {lastSevenDays.map((day) => <div className="dashboard-week-day" key={day.date} title={`${day.date}: ${day.count} lượt kiểm tra`}>
              <strong>{day.count}</strong><div><span style={{ height: `${Math.max(day.count > 0 ? 8 : 0, Math.round((day.count / maxDailyCount) * 100))}%` }} /></div><small>{day.label}</small>
            </div>)}
          </div>
        </article>
      </section>

      <section className="dashboard-kpi-grid" aria-label="Tổng quan kết quả học tập">
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-icon kpi-blue"><Target size={22} /></span>
          <div><small>Tổng số Unit</small><strong>50</strong><span>Trong lộ trình học</span></div>
        </article>
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-icon kpi-green"><CheckCircle2 size={22} /></span>
          <div><small>Unit đã hoàn thành</small><strong>{completed}</strong><span>{studying} Unit đang học</span></div>
        </article>
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-icon kpi-violet"><Play size={21} /></span>
          <div><small>Câu đã kiểm tra</small><strong>{attempted.toLocaleString("vi-VN")}</strong><span>{correct.toLocaleString("vi-VN")} câu đúng</span></div>
        </article>
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-icon kpi-orange"><Flame size={22} /></span>
          <div><small>Chuỗi ngày học</small><strong>{streak} ngày</strong><span>{todayCount} câu mới hôm nay · chính xác {accuracy}%</span></div>
        </article>
      </section>

      <section className="dashboard-focus-grid">
        <article className="dashboard-panel dashboard-overall-panel">
          <div className="dashboard-panel-heading">
            <div><span className="dashboard-panel-kicker">YOUR JOURNEY</span><h3><TrendingUp size={18} /> Tiến độ tổng thể</h3></div>
            <button type="button" className="dashboard-inline-link" onClick={() => onNavigate("checklist")}>Chi tiết <ArrowRight size={14} /></button>
          </div>
          <div className="dashboard-progress-layout">
            <div className="dashboard-progress-ring" style={{ "--progress": `${progressPercent}%` } as React.CSSProperties}>
              <div><strong>{progressPercent}%</strong><span>{completed}/50 Unit</span></div>
            </div>
            <div className="dashboard-progress-legend">
              <div><i className="legend-dot legend-done" /><span>Đã hoàn thành</span><strong>{completed}</strong></div>
              <div><i className="legend-dot legend-active" /><span>Đang học</span><strong>{studying}</strong></div>
              <div><i className="legend-dot legend-pending" /><span>Còn lại</span><strong>{remaining}</strong></div>
            </div>
          </div>
          <div className="dashboard-progress-foot"><span>Hành trình 1.500 câu</span><strong>{completed * 30} / 1.500 câu (ước tính theo Unit)</strong></div>
        </article>

        <article className="dashboard-panel dashboard-active-panel">
          <div className="dashboard-panel-heading">
            <div><span className="dashboard-panel-kicker">PICK UP WHERE YOU LEFT OFF</span><h3><BookOpen size={18} /> Unit tiếp theo</h3></div>
            <span className="dashboard-status-pill"><i /> {nextUnit ? (activeUnit ? "Đang học" : "Sẵn sàng") : "Hoàn thành"}</span>
          </div>
          {nextUnit ? (
            <div className="dashboard-active-content">
              <div className="dashboard-unit-badge"><BookOpen size={27} /><strong>{String(nextUnit.id).padStart(2, "0")}</strong></div>
              <div className="dashboard-active-copy">
                <small>UNIT {nextUnit.id}</small>
                <h4>{nextUnit.topic || `Unit ${nextUnit.id}`}</h4>
                <p>{activeUnitAttempted} câu đã có kết quả luyện tập</p>
                <div className="dashboard-unit-progress"><span style={{ width: `${activeUnitPercent}%` }} /></div>
                <small className="dashboard-unit-percent">{activeUnitPercent}% tiến độ câu đã kiểm tra (mốc tham chiếu 30 câu)</small>
              </div>
            </div>
          ) : (
            <div className="dashboard-empty-state">Bạn đã hoàn thành toàn bộ lộ trình 50 Unit. Tuyệt vời!</div>
          )}
          <button type="button" className="dashboard-continue-button" onClick={() => onNavigate("units")}>
            {nextUnit ? "Tiếp tục luyện tập" : "Ôn tập lại"} <ArrowRight size={16} />
          </button>
        </article>

      </section>

      <section className="dashboard-bottom-grid">
        <article className="dashboard-panel dashboard-shortcuts-panel">
          <div className="dashboard-panel-heading">
            <div><span className="dashboard-panel-kicker">LEARNING TOOLS</span><h3><GraduationCap size={18} /> Truy cập nhanh</h3></div>
            <label className="dashboard-module-search">
              <Search size={15} />
              <input value={moduleSearch} onChange={(event) => setModuleSearch(event.target.value)} placeholder="Tìm chức năng..." aria-label="Tìm chức năng học tập" />
              {moduleSearch && <button type="button" onClick={() => setModuleSearch("")} aria-label="Xóa tìm kiếm"><X size={14} /></button>}
            </label>
          </div>
          <div className="dashboard-quick-grid">
            {filteredModules.map((module) => {
              const Icon = module.icon;
              return <button type="button" className={`dashboard-quick-card tone-${module.tone}`} key={module.id} onClick={() => onNavigate(module.id)}>
                <span className="dashboard-quick-icon"><Icon size={20} /></span>
                <span className="dashboard-quick-copy"><strong>{module.title}</strong><em>{module.description}</em></span>
                <ArrowRight className="dashboard-quick-arrow" size={15} />
              </button>;
            })}
            {filteredModules.length === 0 && <div className="dashboard-no-results"><Search size={18} /><strong>Không tìm thấy chức năng</strong><button type="button" onClick={() => setModuleSearch("")}>Xóa tìm kiếm</button></div>}
          </div>
        </article>

        <article className="dashboard-panel dashboard-recent-panel">
          <div className="dashboard-panel-heading">
            <div><span className="dashboard-panel-kicker">STUDY PLAN</span><h3><Clock3 size={18} /> Ngày học đã ghi nhận</h3></div>
            <button type="button" className="dashboard-inline-link" onClick={() => onNavigate("checklist")}>Mở Checklist <ArrowRight size={14} /></button>
          </div>
          {recentDatedUnits.length ? (
            <div className="dashboard-recent-list">
              {recentDatedUnits.map((item) => <div className="dashboard-recent-item" key={item.id}>
                <span className={item.status === "Đã học" ? "recent-check is-done" : "recent-check"}>{item.status === "Đã học" ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}</span>
                <div><strong>Unit {item.id} · {item.topic || "Chưa đặt tên"}</strong><small>{item.status || "Chưa học"}</small></div>
                <time>{formatDate(item.date!)}</time>
              </div>)}
            </div>
          ) : (
            <div className="dashboard-recent-empty"><Clock3 size={24} /><strong>Chưa có ngày học được ghi nhận</strong><span>Cập nhật ngày học trong Checklist để theo dõi lịch sử tại đây.</span><button type="button" onClick={() => onNavigate("checklist")}>Mở Checklist <ArrowRight size={14} /></button></div>
          )}
        </article>
      </section>

      <section className="dashboard-account-strip">
        <div className="dashboard-account-icon"><UserRound size={19} /></div>
        <div><strong>Không gian cá nhân</strong><p>Quản lý hồ sơ và thông tin tài khoản ATI Group.</p></div>
        <button type="button" onClick={() => onNavigate("profile")}>Hồ sơ tài khoản <ArrowRight size={15} /></button>
      </section>
    </div>
  );
}

export default LearningDashboard;
