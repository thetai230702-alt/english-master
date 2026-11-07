import { useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, CheckCircle2, Clock3, Target, TrendingUp, RotateCcw } from "lucide-react";
import "./Statistics.css";

type ChecklistItem = { id: number; topic?: string; status?: string; date?: string; review?: boolean };
type PracticeMap = Record<string, Record<string, boolean>>;
const CHECKLIST_KEY = "english-master-checklist";
const PRACTICE_KEY = "ntt-unit-practice-progress-v1";
const FLASHCARD_KEY = "english-master-flashcard-progress";

function readJson<T,>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}

function getLastSevenDays(items: ChecklistItem[]) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    return {
      key,
      label: new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(date),
      count: items.filter(item => item.date === key).length,
    };
  });
}

export default function Statistics() {
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const update = () => setRefresh(value => value + 1);
    window.addEventListener("storage", update);
    window.addEventListener("ntt-unit-progress-updated", update);
    window.addEventListener("focus", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("ntt-unit-progress-updated", update);
      window.removeEventListener("focus", update);
    };
  }, []);

  const checklist = useMemo(() => readJson<ChecklistItem[]>(CHECKLIST_KEY, []), [refresh]);
  const practice = useMemo(() => readJson<PracticeMap>(PRACTICE_KEY, {}), [refresh]);
  const flashcards = useMemo(() => readJson<Record<string, unknown>>(FLASHCARD_KEY, {}), [refresh]);
  const completed = checklist.filter(item => item.status === "Đã học").length;
  const studying = checklist.filter(item => item.status === "Đang học").length;
  const attempted = Object.values(practice).reduce((sum, unit) => sum + Object.keys(unit).length, 0);
  const correct = Object.values(practice).reduce((sum, unit) => sum + Object.values(unit).filter(Boolean).length, 0);
  const accuracy = attempted ? Math.round(correct / attempted * 100) : 0;
  const reviewed = checklist.filter(item => item.review).length;
  const flashcardCount = Object.keys(flashcards).length;
  const daily = getLastSevenDays(checklist);
  const maxDaily = Math.max(1, ...daily.map(day => day.count));

  return (
    <div className="statistics-page">
      <section className="statistics-hero">
        <div><span className="statistics-eyebrow"><Activity size={14}/> ATI LEARNING · PERFORMANCE</span>
          <h2>Báo cáo học tập</h2>
          <p>Tổng hợp tiến độ Checklist và kết quả luyện câu; dữ liệu được lưu trên thiết bị và đồng bộ theo tài khoản khi đăng nhập.</p>
        </div>
        <div className="statistics-hero-mark"><TrendingUp size={28}/><strong>{accuracy}%</strong><small>Độ chính xác</small></div>
      </section>

      <section className="statistics-kpis">
        <article><span className="statistics-kpi-icon blue"><BookOpen size={19}/></span><div><small>Unit hoàn thành</small><strong>{completed}<em>/ 50</em></strong><span>{studying} Unit đang học</span></div></article>
        <article><span className="statistics-kpi-icon cyan"><Target size={19}/></span><div><small>Câu đã kiểm tra</small><strong>{attempted.toLocaleString("vi-VN")}</strong><span>{correct} câu trả lời đúng</span></div></article>
        <article><span className="statistics-kpi-icon green"><CheckCircle2 size={19}/></span><div><small>Độ chính xác</small><strong>{accuracy}%</strong><span>{attempted - correct} câu cần ôn lại</span></div></article>
        <article><span className="statistics-kpi-icon amber"><RotateCcw size={19}/></span><div><small>Unit đánh dấu ôn tập</small><strong>{reviewed}</strong><span>{flashcardCount} mục dữ liệu flashcard</span></div></article>
      </section>

      <div className="statistics-content-grid">
        <section className="statistics-panel">
          <div className="statistics-panel-heading"><div><span>LEARNING ACTIVITY</span><h3>Hoạt động 7 ngày gần nhất</h3></div><small><Clock3 size={13}/> Theo ngày học đã ghi trong Checklist</small></div>
          <div className="statistics-chart" role="img" aria-label="Số Unit có ngày học được ghi trong 7 ngày gần nhất">
            {daily.map(day => <div className="statistics-chart-column" key={day.key}>
              <strong>{day.count || ""}</strong><div className="statistics-chart-track"><span style={{height:`${day.count / maxDaily * 100}%`}}/></div><small>{day.label}</small>
            </div>)}
          </div>
          <p className="statistics-note">Biểu đồ này đếm số Unit có ngày học được ghi trong Checklist; không đại diện cho tổng thời lượng học.</p>
        </section>

        <section className="statistics-panel statistics-breakdown">
          <div className="statistics-panel-heading"><div><span>UNIT OVERVIEW</span><h3>Phân bổ trạng thái</h3></div></div>
          <div className="statistics-donut" style={{"--done":`${completed/50*100}%`,"--learning":`${studying/50*100}%`} as React.CSSProperties}><div><strong>{Math.round(completed/50*100)}%</strong><small>Hoàn thành</small></div></div>
          <div className="statistics-legend"><span><i className="done"/>Đã học <b>{completed}</b></span><span><i className="learning"/>Đang học <b>{studying}</b></span><span><i className="pending"/>Chưa học <b>{Math.max(0,50-completed-studying)}</b></span></div>
        </section>
      </div>

      <section className="statistics-panel statistics-practice-panel">
        <div className="statistics-panel-heading"><div><span>PRACTICE QUALITY</span><h3>Kết quả luyện dịch câu</h3></div><small>{Object.keys(practice).length} Unit có dữ liệu luyện tập</small></div>
        <div className="statistics-practice-summary">
          <div><strong>{attempted.toLocaleString("vi-VN")}</strong><span>Lượt câu đã kiểm tra</span></div>
          <div><strong>{correct.toLocaleString("vi-VN")}</strong><span>Trả lời chính xác</span></div>
          <div><strong>{attempted-correct}</strong><span>Cần luyện lại</span></div>
          <div><strong>{accuracy}%</strong><span>Tỷ lệ chính xác</span></div>
        </div>
        {attempted === 0 && <p className="statistics-empty">Bạn chưa có kết quả kiểm tra câu nào. Hãy vào Luyện tập 1.500 câu để bắt đầu ghi nhận kết quả.</p>}
      </section>
      <p className="statistics-disclaimer">Tiến độ Checklist và kết quả luyện tập được lưu cục bộ để sử dụng liên tục, đồng thời đồng bộ lên Firestore theo tài khoản khi đăng nhập. Nếu đồng bộ gặp lỗi, dữ liệu trên thiết bị vẫn được giữ lại.</p>
    </div>
  );
}
