import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  BookOpen, Search, ChevronRight, CheckCircle2, Clock3,
  CircleDashed, Filter, X, GraduationCap, Headphones,
} from "lucide-react";
import { getUnits } from "../services/unitService";
import type { Unit } from "../types/unit";
import UnitPractice from "./UnitPractice";
import "./Units.css";

type StudyStatus = "Chưa học" | "Đang học" | "Đã học";
type ChecklistEntry = { id: number; status?: StudyStatus };
type StatusFilter = "Tất cả" | StudyStatus;

const CHECKLIST_STORAGE_KEY = "english-master-checklist";
const PRACTICE_PROGRESS_KEY = "ntt-unit-practice-progress-v1";

function readStudyStatuses(): Map<number, StudyStatus> {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return new Map();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Map();
    const result = new Map<number, StudyStatus>();
    for (const entry of parsed as ChecklistEntry[]) {
      if (!entry || typeof entry.id !== "number") continue;
      const status = entry.status;
      result.set(entry.id,
        status === "Đang học" || status === "Đã học" ? status : "Chưa học"
      );
    }
    return result;
  } catch {
    return new Map();
  }
}


function readUnitProgress(unitNumber: number): { attempted: number; correct: number } {
  try {
    const raw = localStorage.getItem(PRACTICE_PROGRESS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { attempted: 0, correct: 0 };
    const record = (parsed as Record<string, unknown>)[String(unitNumber)];
    if (!record || typeof record !== "object" || Array.isArray(record)) return { attempted: 0, correct: 0 };
    const values = Object.values(record as Record<string, unknown>).filter((value) => typeof value === "boolean");
    return { attempted: values.length, correct: values.filter(Boolean).length };
  } catch { return { attempted: 0, correct: 0 }; }
}

function Units() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Tất cả");
  const [studyStatuses, setStudyStatuses] = useState<Map<number, StudyStatus>>(readStudyStatuses);

  useEffect(() => {
    let active = true;
    async function loadUnits() {
      try {
        const data = await getUnits();
        if (active) setUnits(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Có lỗi khi tải dữ liệu.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadUnits();
    const refreshStatuses = () => setStudyStatuses(readStudyStatuses());
    window.addEventListener("storage", refreshStatuses);
    window.addEventListener("ntt-unit-progress-updated", refreshStatuses);
    window.addEventListener("focus", refreshStatuses);
    return () => {
      active = false;
      window.removeEventListener("storage", refreshStatuses);
      window.removeEventListener("ntt-unit-progress-updated", refreshStatuses);
      window.removeEventListener("focus", refreshStatuses);
    };
  }, []);

  const totalSentences = units.reduce((total, unit) => total + unit.sentences.length, 0);
  const completedCount = units.filter((unit) => studyStatuses.get(unit.unitNumber) === "Đã học").length;
  const studyingCount = units.filter((unit) => studyStatuses.get(unit.unitNumber) === "Đang học").length;
  const notStartedCount = Math.max(0, units.length - completedCount - studyingCount);
  const completion = units.length ? Math.round((completedCount / units.length) * 100) : 0;

  const filteredUnits = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("vi");
    return units.filter((unit) => {
      const matchesSearch = !normalizedSearch ||
        unit.title.toLocaleLowerCase("vi").includes(normalizedSearch) ||
        `unit ${unit.unitNumber}`.includes(normalizedSearch);
      const status = studyStatuses.get(unit.unitNumber) ?? "Chưa học";
      return matchesSearch && (statusFilter === "Tất cả" || status === statusFilter);
    });
  }, [units, search, statusFilter, studyStatuses]);

  if (loading) {
    return <div className="units-message"><span className="units-loading-dot" />Đang tải dữ liệu bài học...</div>;
  }

  if (error) {
    return <div className="units-error"><strong>Không thể tải danh sách Unit</strong><p>{error}</p><button type="button" onClick={() => window.location.reload()}>Thử tải lại</button></div>;
  }

  if (selectedUnit) {
    return <UnitPractice unit={selectedUnit} onBack={() => {
      setSelectedUnit(null);
      setStudyStatuses(readStudyStatuses());
    }} />;
  }

  const statusMeta = (unitNumber: number) => {
    const status = studyStatuses.get(unitNumber) ?? "Chưa học";
    if (status === "Đã học") return { label: "Đã hoàn thành", className: "completed", icon: <CheckCircle2 size={13}/> };
    if (status === "Đang học") return { label: "Đang học", className: "in-progress", icon: <Clock3 size={13}/> };
    return { label: "Chưa bắt đầu", className: "not-started", icon: <CircleDashed size={13}/> };
  };

  return (
    <div className="units-page units-page-premium">
      <section className="units-hero">
        <div className="units-hero-copy">
          <span className="units-hero-eyebrow"><GraduationCap size={14}/> ATI LEARNING / PRACTICE LIBRARY</span>
          <h2>Kho bài học tiếng Anh</h2>
          <p>Chinh phục 1.500 câu qua 50 chủ đề. Học theo lộ trình của bạn, từng Unit một.</p>
          <div className="units-hero-actions">
            <span><BookOpen size={14}/> {units.length} chủ đề</span>
            <span><Headphones size={14}/> Nghe câu mẫu</span>
          </div>
        </div>
        <div className="units-hero-progress">
          <div className="units-hero-progress-ring" style={{ "--units-progress": `${completion}%` } as CSSProperties}>
            <div><strong>{completion}%</strong><small>Hoàn thành</small></div>
          </div>
          <span>{completedCount} / {units.length} Unit</span>
        </div>
      </section>

      <section className="units-summary units-summary-premium">
        <article className="units-summary-card"><span className="units-summary-icon blue"><BookOpen size={17}/></span><div><span>Tổng số câu</span><strong>{totalSentences.toLocaleString("vi-VN")}</strong><small>Trong toàn bộ chương trình</small></div></article>
        <article className="units-summary-card"><span className="units-summary-icon green"><CheckCircle2 size={17}/></span><div><span>Đã hoàn thành</span><strong>{completedCount}</strong><small>Unit đã học xong</small></div></article>
        <article className="units-summary-card"><span className="units-summary-icon amber"><Clock3 size={17}/></span><div><span>Đang học</span><strong>{studyingCount}</strong><small>Unit đang thực hiện</small></div></article>
        <article className="units-summary-card"><span className="units-summary-icon slate"><CircleDashed size={17}/></span><div><span>Chưa bắt đầu</span><strong>{notStartedCount}</strong><small>Unit đang chờ khám phá</small></div></article>
      </section>

      <section className="units-library-panel">
        <div className="units-toolbar units-toolbar-premium">
          <div className="units-toolbar-title">
            <span className="units-section-eyebrow">LEARNING PATH</span>
            <h2>Danh sách bài học</h2>
            <p>Chọn chủ đề muốn luyện tập hoặc lọc theo tiến độ của bạn.</p>
          </div>
          <label className="units-search units-search-premium">
            <Search size={17}/>
            <input type="search" placeholder="Tìm Unit hoặc chủ đề..." value={search} onChange={(event) => setSearch(event.target.value)} />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Xóa tìm kiếm"><X size={15}/></button>}
          </label>
        </div>

        <div className="units-filter-row">
          <span><Filter size={14}/> Lọc tiến độ</span>
          <div className="units-status-filters">
            {(["Tất cả", "Chưa học", "Đang học", "Đã học"] as StatusFilter[]).map((status) => (
              <button key={status} type="button" className={statusFilter === status ? "active" : ""} onClick={() => setStatusFilter(status)}>
                {status === "Tất cả" ? `Tất cả (${units.length})` : status === "Đã học" ? `Hoàn thành (${completedCount})` : status === "Đang học" ? `Đang học (${studyingCount})` : `Chưa học (${notStartedCount})`}
              </button>
            ))}
          </div>
        </div>

        <div className="units-grid units-grid-premium">
          {filteredUnits.map((unit) => {
            const meta = statusMeta(unit.unitNumber);
            const practiceProgress = readUnitProgress(unit.unitNumber);
            const sentencePercent = unit.sentences.length
              ? Math.round((practiceProgress.attempted / unit.sentences.length) * 100) : 0;
            return (
              <article className={`unit-card unit-card-premium ${meta.className}`} key={unit.unitNumber}>
                <div className="unit-card-top">
                  <span className="unit-number">UNIT {String(unit.unitNumber).padStart(2, "0")}</span>
                  <span className={`unit-status-pill ${meta.className}`}>{meta.icon}{meta.label}</span>
                </div>
                <h3>{unit.title}</h3>
                <div className="unit-card-meta"><BookOpen size={14}/><span>{unit.sentences.length} câu luyện tập</span><span className="unit-card-dot"/> <span>{Math.max(1, Math.ceil(unit.sentences.length * 1.2))} phút dự kiến</span></div>
                <div className="unit-sentence-progress">
                  <div className="unit-sentence-progress-label">
                    <span>Tiến độ câu hỏi</span>
                    <strong>{practiceProgress.attempted}/{unit.sentences.length} · {sentencePercent}%</strong>
                  </div>
                  <div className="unit-sentence-progress-track"><span style={{ width: `${sentencePercent}%` }} /></div>
                  <small>{practiceProgress.correct} câu trả lời chính xác</small>
                </div>
                <div className="unit-card-bottom">
                  <span>{meta.className === "completed" ? "Bạn đã hoàn thành chủ đề này" : meta.className === "in-progress" ? "Tiếp tục hành trình học" : "Sẵn sàng bắt đầu?"}</span>
                  <button type="button" className="unit-open-button" onClick={() => setSelectedUnit(unit)}>
                    {meta.className === "completed" ? "Ôn tập" : meta.className === "in-progress" ? "Tiếp tục" : "Học ngay"} <ChevronRight size={15}/>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {filteredUnits.length === 0 && (
          <div className="units-empty-state"><div><Search size={22}/></div><strong>Không tìm thấy bài học phù hợp</strong><p>Thử từ khóa khác hoặc thay đổi bộ lọc tiến độ.</p><button type="button" onClick={() => { setSearch(""); setStatusFilter("Tất cả"); }}>Xóa bộ lọc</button></div>
        )}
        <div className="units-library-footer"><span>Đang hiển thị {filteredUnits.length} / {units.length} Unit</span><span><CheckCircle2 size={13}/> Tiến độ lấy từ Checklist học tập</span></div>
      </section>
    </div>
  );
}

export default Units;
