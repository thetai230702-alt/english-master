
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  CheckCircle2,
  Clock3,
  RotateCcw,
} from "lucide-react";
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

export default function Checklist() {
  const [units, setUnits] = useState<Unit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialUnits;
    } catch {
      return initialUnits;
    }
  });

  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("Tất cả");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
  }, [units]);

  const completed = units.filter(
    (unit) => unit.status === "Đã học"
  ).length;

  const studying = units.filter(
    (unit) => unit.status === "Đang học"
  ).length;

  const reviewed = units.filter((unit) => unit.review).length;

  const progress = Math.round((completed / units.length) * 100);

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesKeyword =
        `unit ${unit.id}`.includes(keyword.toLowerCase()) ||
        unit.topic.toLowerCase().includes(keyword.toLowerCase());

      const matchesFilter =
        filter === "Tất cả" || unit.status === filter;

      return matchesKeyword && matchesFilter;
    });
  }, [units, keyword, filter]);

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
          <span>50 Units</span>
        </div>
      </div>

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
          <span>{completed}/50 Unit đã học</span>
          <span>{50 - completed} Unit còn lại</span>
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

      <div className="checklist-table-card">
        <div className="table-heading">
          <div>
            <h3>Danh sách 50 Unit</h3>
            <p>Cập nhật trạng thái học tập của bạn.</p>
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

        <div className="filter-buttons">
          {["Tất cả", "Chưa học", "Đang học", "Đã học"].map(
            (item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            )
          )}
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
