
import { useEffect, useState } from "react";
import { BookOpen, Search, ChevronRight } from "lucide-react";
import { getUnits } from "../services/unitService";
import type { Unit } from "../types/unit";
import UnitPractice from "./UnitPractice";
import "./Units.css";

function Units() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadUnits() {
      try {
        const data = await getUnits();
        setUnits(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Có lỗi khi tải dữ liệu."
        );
      } finally {
        setLoading(false);
      }
    }

    loadUnits();
  }, []);

  const filteredUnits = units.filter((unit) =>
    unit.title.toLowerCase().includes(search.toLowerCase()) ||
    `unit ${unit.unitNumber}`.includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="units-message">Đang tải dữ liệu 50 Unit...</div>;
  }

  if (error) {
    return <div className="units-error">{error}</div>;
  }

  if (selectedUnit) {
    return (
      <UnitPractice
        unit={selectedUnit}
        onBack={() => setSelectedUnit(null)}
      />
    );
  }

  return (
    <div className="units-page">
      <div className="units-overview">
        <div className="units-overview-icon">
          <BookOpen size={28} />
        </div>

        <div>
          <h2>Kho bài học tiếng Anh</h2>
          <p>
            Chọn một Unit để bắt đầu luyện tập 1.500 câu tiếng Anh.
          </p>
        </div>
      </div>

      <div className="units-summary">
        <div className="units-summary-card">
          <span>Tổng số Unit</span>
          <strong>{units.length}</strong>
        </div>

        <div className="units-summary-card">
          <span>Tổng số câu</span>
          <strong>
            {units.reduce(
              (total, unit) => total + unit.sentences.length,
              0
            )}
          </strong>
        </div>

        <div className="units-summary-card">
          <span>Trung bình mỗi Unit</span>
          <strong>
            {units.length > 0
              ? Math.round(
                  units.reduce(
                    (total, unit) => total + unit.sentences.length,
                    0
                  ) / units.length
                )
              : 0}
          </strong>
        </div>
      </div>

      <div className="units-toolbar">
        <div>
          <h2>Danh sách bài học</h2>
          <p>Chọn chủ đề bạn muốn học hôm nay.</p>
        </div>

        <div className="units-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm Unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="units-grid">
        {filteredUnits.map((unit) => (
          <div className="unit-card" key={unit.unitNumber}>
            <div className="unit-card-top">
              <span className="unit-number">
                UNIT {String(unit.unitNumber).padStart(2, "0")}
              </span>
              <BookOpen size={20} />
            </div>

            <h3>{unit.title}</h3>

            <div className="unit-card-bottom">
              <span>{unit.sentences.length} câu luyện tập</span>

              <button
                type="button"
                className="unit-open-button"
                onClick={() => setSelectedUnit(unit)}
              >
                Học ngay <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUnits.length === 0 && (
        <div className="units-message">
          Không tìm thấy Unit phù hợp.
        </div>
      )}
    </div>
  );
}

export default Units;
