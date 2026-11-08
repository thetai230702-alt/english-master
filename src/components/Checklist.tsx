
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Search,
  BookOpen,
  CheckCircle2,
  Clock3,
  RotateCcw,
  ArrowRight,
  Headphones,
  Layers,
  Sparkles,
  Target,
  CalendarDays,
  Download,
  Filter,
  X,
} from "lucide-react";
import type { TabType } from "./Sidebar";
import "./Checklist.css";

type Status = "Chưa học" | "Đang học" | "Đã học";

type Unit = {
  id: number;
  topic: string;
  status: Status;
  date: string;
  exercise: boolean;
  review: boolean;
  note: string;
};

const topics = [
  "Greetings & Introductions",
  "Personal Information",
  "Family & Home",
  "Daily Routine",
  "Time & Date",
  "Weather & Seasons",
  "Colors & Shapes",
  "Emotions & Feelings",
  "Personality Traits",
  "Physical Appearance",
  "Friends & Friendship",
  "Hobbies & Free Time",
  "Shopping",
  "Food & Drinks",
  "At the Restaurant",
  "Cooking & Recipes",
  "Home & Furniture",
  "Neighborhood & Town",
  "Directions & Asking for the Way",
  "Transportation & Travel",
  "Education & School",
  "Professions & Jobs",
  "At the Office",
  "Meetings & Presentations",
  "Job Interview",
  "Business Travel",
  "Technology & Gadgets",
  "Computers & Internet",
  "Money & Banking",
  "Telephone & Email Communication",
  "Sports & Athletics",
  "Movies & Cinema",
  "Music & Instruments",
  "Books & Reading",
  "Health & Symptoms",
  "At the Hospital / Pharmacy",
  "Body Parts",
  "Holidays & Celebrations",
  "Pets & Animals",
  "Nature & Environment",
  "Giving Opinions",
  "Agreeing & Disagreeing",
  "Making Suggestions",
  "Asking for Help",
  "Complaints & Apologies",
  "Booking & Reservations",
  "At the Airport",
  "At the Hotel",
  "Emergencies & Safety",
  "Culture & Traditions",
];

const initialUnits: Unit[] = topics.map((topic, index) => ({
  id: index + 1,
  topic,
  status: "Chưa học",
  date: "",
  exercise: false,
  review: false,
  note: "",
}));

const STORAGE_KEY = "english-master-checklist";

type ChecklistProps = { onNavigate?: (tab: TabType) => void };

export default function Checklist({ onNavigate }: ChecklistProps) {
  const [units, setUnits] = useState<Unit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return initialUnits;
      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) return initialUnits;
      const existing = new Map<number, Partial<Unit>>();
      for (const item of parsed) {
        if (item && typeof item === "object" && "id" in item && typeof item.id === "number") {
          existing.set(item.id, item as Partial<Unit>);
        }
      }
      return initialUnits.map((unit) => {
        const savedUnit = existing.get(unit.id);
        if (!savedUnit) return unit;
        return {
          ...unit,
          status: savedUnit.status === "Đã học" || savedUnit.status === "Đang học" ? savedUnit.status : "Chưa học",
          date: typeof savedUnit.date === "string" ? savedUnit.date : "",
          exercise: savedUnit.exercise === true,
          review: savedUnit.review === true,
          note: typeof savedUnit.note === "string" ? savedUnit.note : "",
        };
      });
    } catch {
      return initialUnits;
    }
  });

  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("Tất cả");
  const [reviewOnly, setReviewOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Apply progress received from Firestore to the visible checklist.
  // The sync service writes localStorage and emits this event after a cloud update.
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        const parsed: unknown = JSON.parse(saved);
        if (!Array.isArray(parsed)) return;

        const existing = new Map<number, Partial<Unit>>();
        for (const item of parsed) {
          if (item && typeof item === "object" && "id" in item && typeof item.id === "number") {
            existing.set(item.id, item as Partial<Unit>);
          }
        }

        setUnits(initialUnits.map((unit) => {
          const savedUnit = existing.get(unit.id);
          if (!savedUnit) return unit;
          return {
            ...unit,
            status: savedUnit.status === "Đã học" || savedUnit.status === "Đang học" ? savedUnit.status : "Chưa học",
            date: typeof savedUnit.date === "string" ? savedUnit.date : "",
            exercise: savedUnit.exercise === true,
            review: savedUnit.review === true,
            note: typeof savedUnit.note === "string" ? savedUnit.note : "",
          };
        }));
      } catch (error) {
        console.error("Không thể cập nhật Checklist từ dữ liệu đồng bộ:", error);
      }
    };

    window.addEventListener("ntt-unit-progress-updated", syncFromStorage);
    return () => window.removeEventListener("ntt-unit-progress-updated", syncFromStorage);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
    window.dispatchEvent(new CustomEvent("ntt-learning-progress-local-updated"));
  }, [units]);

  const completed = units.filter(
    (unit) => unit.status === "Đã học"
  ).length;

  const studying = units.filter(
    (unit) => unit.status === "Đang học"
  ).length;

  const reviewed = units.filter((unit) => unit.review).length;

  const progress = Math.round((completed / units.length) * 100);
  const nextUnit = units.find((unit) => unit.status === "Đang học")
    ?? units.find((unit) => unit.status !== "Đã học");
  const exerciseCount = units.filter((unit) => unit.exercise).length;
  const today = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date());

  const filteredUnits = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase("vi");
    return units
      .filter((unit) => {
        const matchesKeyword =
          `unit ${unit.id}`.includes(normalizedKeyword) ||
          unit.topic.toLocaleLowerCase("vi").includes(normalizedKeyword);
        const matchesFilter =
          filter === "Tất cả" || unit.status === filter;
        const matchesReview = !reviewOnly || unit.review;
        return matchesKeyword && matchesFilter && matchesReview;
      })
      .sort((a, b) => sortOrder === "asc" ? a.id - b.id : b.id - a.id);
  }, [units, keyword, filter, reviewOnly, sortOrder]);

  const statusCounts = useMemo(() => ({
    all: units.length,
    notStarted: units.filter((unit) => unit.status === "Chưa học").length,
    studying: units.filter((unit) => unit.status === "Đang học").length,
    completed: units.filter((unit) => unit.status === "Đã học").length,
  }), [units]);

  function clearFilters() {
    setKeyword("");
    setFilter("Tất cả");
    setReviewOnly(false);
    setSortOrder("asc");
  }

  function exportChecklist() {
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ["Unit", "Topic", "Status", "Study date", "Exercise", "Reviewed", "Note"],
      ...units.map((unit) => [
        `Unit ${unit.id}`, unit.topic, unit.status, unit.date,
        unit.exercise ? "Yes" : "No", unit.review ? "Yes" : "No", unit.note,
      ]),
    ];
    const csv = "\uFEFF" + rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ntt-learning-checklist.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function updateUnit(id: number, changes: Partial<Unit>) {
    setUnits((current) =>
      current.map((unit) =>
        unit.id === id ? { ...unit, ...changes } : unit
      )
    );
  }

  return (
    <div className="checklist-page">
      <div className="checklist-heading">
        <div>
          <h2>Checklist học tập</h2>
          <p>Theo dõi tiến độ học tiếng Anh qua 50 Unit.</p>
        </div>
        <div className="unit-total">
          <BookOpen size={20} />
          <span>{units.length} Units</span>
        </div>
      </div>

      <section className="learning-hero" aria-label="Trung tâm học tập">
        <div className="learning-hero-copy">
          <span className="learning-hero-eyebrow"><Sparkles size={14} /> ATI LEARNING · YOUR STUDY SPACE</span>
          <h2>Học mỗi ngày, tiến bộ từng bước.</h2>
          <p>Theo dõi hành trình 50 Unit, chọn bài học tiếp theo và truy cập nhanh các công cụ luyện tập.</p>
          <div className="learning-hero-actions">
            <button type="button" className="learning-hero-primary" onClick={() => onNavigate?.("units")}>
              <BookOpen size={17} /> {nextUnit ? `Tiếp tục Unit ${nextUnit.id}` : "Ôn lại các Unit"} <ArrowRight size={16} />
            </button>
            <button type="button" className="learning-hero-secondary" onClick={() => onNavigate?.("listening")}>
              <Headphones size={17} /> Luyện nghe
            </button>
          </div>
        </div>
        <div className="learning-hero-side">
          <span className="learning-hero-date"><CalendarDays size={14} /> {today}</span>
          <div className="learning-hero-ring" style={{ "--learning-progress": `${progress}%` } as CSSProperties}>
            <div><strong>{progress}%</strong><small>Hoàn thành</small></div>
          </div>
          <span className="learning-hero-counter">{completed} / {units.length} Unit</span>
        </div>
      </section>

      <section className="learning-quick-section" aria-label="Truy cập nhanh">
        <div className="learning-section-title"><div><span>YOUR LEARNING PATH</span><h3>Tiếp tục hành trình</h3></div><small>{units.length} chủ đề tiếng Anh</small></div>
        <div className="learning-quick-grid">
          <button type="button" className="learning-quick-card" onClick={() => onNavigate?.("units")}>
            <span className="learning-quick-icon blue"><Target size={21} /></span>
            <span><small>BÀI HỌC TIẾP THEO</small><strong>{nextUnit ? `Unit ${nextUnit.id} · ${nextUnit.topic}` : "Đã hoàn thành 50 Unit"}</strong><em>Vào trang luyện tập <ArrowRight size={13} /></em></span>
          </button>
          <button type="button" className="learning-quick-card" onClick={() => onNavigate?.("listening")}>
            <span className="learning-quick-icon cyan"><Headphones size={21} /></span>
            <span><small>LUYỆN NGHE</small><strong>Nghe và phát âm</strong><em>Mở trình luyện nghe <ArrowRight size={13} /></em></span>
          </button>
          <button type="button" className="learning-quick-card" onClick={() => onNavigate?.("flashcards")}>
            <span className="learning-quick-icon purple"><Layers size={21} /></span>
            <span><small>GHI NHỚ TỪ VỰNG</small><strong>Ôn tập với Flashcard</strong><em>Ôn từ vựng <ArrowRight size={13} /></em></span>
          </button>
        </div>
      </section>

      <div className="progress-card">
        <div className="progress-top">
          <div>
            <span className="progress-label">Tiến độ tổng thể</span>
            <h3>{progress}% hoàn thành</h3>
          </div>
          <div className="progress-icon">
            <CheckCircle2 size={25} />
          </div>
        </div>

        <div className="progress-track">
          <div
            className="progress-value"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="progress-caption">
          <span>{completed}/{units.length} Unit đã học</span>
          <span>{units.length - completed} Unit còn lại</span>
        </div>
        <div className="progress-segments" aria-label={`Đã học ${completed}, đang học ${studying}, chưa học ${units.length - completed - studying}`}>
          <span className="segment-done" style={{ width: `${completed / units.length * 100}%` }} />
          <span className="segment-learning" style={{ width: `${studying / units.length * 100}%` }} />
          <span className="segment-pending" />
        </div>
      </div>

      <div className="checklist-stats">
        <div className="stat-card">
          <div className="stat-icon learned">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Đã học</span>
            <strong>{completed}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon learning">
            <Clock3 size={21} />
          </div>
          <div>
            <span>Đang học</span>
            <strong>{studying}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon reviewed">
            <RotateCcw size={21} />
          </div>
          <div>
            <span>Đã ôn tập</span>
            <strong>{reviewed}</strong>
          </div>
        </div>
      </div>

      <div className="learning-insight-row"><span><CheckCircle2 size={15} /> {exerciseCount} Unit đã đánh dấu làm bài tập</span><span><RotateCcw size={15} /> {reviewed} Unit đã ôn tập</span></div>

      <div className="checklist-table-card">
        <div className="table-heading">
          <div>
            <h3>Danh sách 50 Unit</h3>
            <p>Đang hiển thị {filteredUnits.length}/{units.length} Unit · Tiến độ được lưu trên thiết bị này.</p>
          </div>

          <div className="checklist-search">
            <Search size={18} />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm Unit..."
            />
          </div>
        </div>

        <div className="checklist-toolbar">
          <div className="filter-buttons" role="group" aria-label="Lọc trạng thái Unit">
            {[
              { label: "Tất cả", count: statusCounts.all },
              { label: "Chưa học", count: statusCounts.notStarted },
              { label: "Đang học", count: statusCounts.studying },
              { label: "Đã học", count: statusCounts.completed },
            ].map((item) => (
              <button
                type="button"
                key={item.label}
                className={filter === item.label ? "active" : ""}
                aria-pressed={filter === item.label}
                onClick={() => setFilter(item.label)}
              >
                {item.label}<span>{item.count}</span>
              </button>
            ))}
          </div>
          <div className="checklist-extra-filters">
            <button
              type="button"
              className={`review-filter ${reviewOnly ? "active" : ""}`}
              aria-pressed={reviewOnly}
              onClick={() => setReviewOnly((value) => !value)}
            >
              <Filter size={14} /> Đã đánh dấu ôn tập
            </button>
            <select
              aria-label="Sắp xếp danh sách Unit"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as "asc" | "desc")}
            >
              <option value="asc">Unit tăng dần</option>
              <option value="desc">Unit giảm dần</option>
            </select>
            <button type="button" className="checklist-export" onClick={exportChecklist}>
              <Download size={14} /> Xuất CSV
            </button>
            {(keyword || filter !== "Tất cả" || reviewOnly || sortOrder !== "asc") && (
              <button type="button" className="checklist-clear" onClick={clearFilters}>
                <X size={14} /> Xóa lọc
              </button>
            )}
          </div>
        </div>

        <div className="checklist-table-wrapper">
          <table className="checklist-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Chủ đề</th>
                <th>Trạng thái</th>
                <th>Ngày học</th>
                <th>Bài tập</th>
                <th>Ôn tập</th>
                <th>Ghi chú</th>
              </tr>
            </thead>

            <tbody>
              {filteredUnits.map((unit) => (
                <tr key={unit.id}>
                  <td className="unit-number">
                    Unit {unit.id}
                  </td>

                  <td>{unit.topic}</td>

                  <td>
                    <select
                      className={`status-select ${
                        unit.status === "Đã học"
                          ? "status-done"
                          : unit.status === "Đang học"
                          ? "status-learning"
                          : "status-not-started"
                      }`}
                      value={unit.status}
                      onChange={(e) =>
                        updateUnit(unit.id, {
                          status: e.target.value as Status,
                        })
                      }
                    >
                      <option>Chưa học</option>
                      <option>Đang học</option>
                      <option>Đã học</option>
                    </select>
                  </td>

                  <td>
                    <input
                      className="date-input"
                      type="date"
                      value={unit.date}
                      onChange={(e) =>
                        updateUnit(unit.id, {
                          date: e.target.value,
                        })
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="checkbox"
                      checked={unit.exercise}
                      onChange={(e) =>
                        updateUnit(unit.id, {
                          exercise: e.target.checked,
                        })
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="checkbox"
                      checked={unit.review}
                      onChange={(e) =>
                        updateUnit(unit.id, {
                          review: e.target.checked,
                        })
                      }
                    />
                  </td>

                  <td>
                    <input
                      className="note-input"
                      value={unit.note}
                      onChange={(e) =>
                        updateUnit(unit.id, {
                          note: e.target.value,
                        })
                      }
                      placeholder="Ghi chú..."
                    />
                  </td>
                </tr>
              ))}

              {filteredUnits.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-result">
                    Không tìm thấy Unit phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
