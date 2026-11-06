
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Volume2,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Check,
  X,
  Layers,
  BookOpen,
  Search,
} from "lucide-react";
import "./Flashcards.css";

interface Flashcard {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
  sourceSentenceId: number;
}

interface FlashcardUnit {
  unitNumber: number;
  title: string;
  cards: Flashcard[];
}

type LearningStatus = Record<string, "remembered" | "learning">;

const STORAGE_KEY = "english-master-flashcard-progress";

function normalizePartOfSpeech(value: string) {
  const labels: Record<string, string> = {
    n: "Danh từ",
    noun: "Danh từ",
    v: "Động từ",
    verb: "Động từ",
    adj: "Tính từ",
    adjective: "Tính từ",
    adv: "Trạng từ",
    adverb: "Trạng từ",
    pron: "Đại từ",
    interj: "Thán từ",
    prep: "Giới từ",
    conj: "Liên từ",
    phrase: "Cụm từ",
    det: "Từ hạn định",
  };

  return labels[value?.toLowerCase()] || value || "Từ vựng";
}

function speakWord(
  text: string,
  voiceType: "uk" | "us",
  speed: number
) {
  if (!("speechSynthesis" in window)) {
    alert("Trình duyệt của bạn không hỗ trợ phát âm.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  const preferredVoice = voices.find((voice) => {
    const lang = voice.lang.toLowerCase();

    if (voiceType === "uk") {
      return lang === "en-gb";
    }

    return lang === "en-us";
  });

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.lang = voiceType === "uk" ? "en-GB" : "en-US";
  utterance.rate = speed;

  window.speechSynthesis.speak(utterance);
}

function Flashcards() {
  const [units, setUnits] = useState<FlashcardUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "learning" | "remembered">("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [voiceType, setVoiceType] = useState<"uk" | "us">("us");
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState<LearningStatus>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFlashcards() {
      try {
        const response = await fetch("/data/flashcards.json");

        if (!response.ok) {
          throw new Error("Không thể tải dữ liệu flashcards.json.");
        }

        const data: FlashcardUnit[] = await response.json();

        if (isMounted) {
          setUnits(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Đã xảy ra lỗi khi tải từ vựng."
          );
          setIsLoading(false);
        }
      }
    }

    loadFlashcards();

    try {
      const savedProgress = localStorage.getItem(STORAGE_KEY);

      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    return () => {
      isMounted = false;
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const unitCards = useMemo(() => {
    if (selectedUnit === "all") {
      return units.flatMap((unit) => unit.cards || []);
    }

    const unit = units.find(
      (item) => item.unitNumber === Number(selectedUnit)
    );

    return unit?.cards || [];
  }, [units, selectedUnit]);

  const allCards = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    return unitCards.filter((card) => {
      const matchesSearch = !keyword || [
        card.word, card.ipa, card.meaning, card.example,
      ].some((value) => value?.toLocaleLowerCase().includes(keyword));
      const status = progress[card.id] === "remembered" ? "remembered" : "learning";
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [unitCards, search, statusFilter, progress]);

  const currentCard = allCards[currentIndex];

  const rememberedCount = allCards.filter(
    (card) => progress[card.id] === "remembered"
  ).length;

  const learningCount = allCards.filter(
    (card) => progress[card.id] !== "remembered"
  ).length;

  const progressPercent =
    allCards.length > 0
      ? Math.round((rememberedCount / allCards.length) * 100)
      : 0;

  function changeUnit(value: string) {
    setSelectedUnit(value);
    setSearch("");
    setStatusFilter("all");
    setCurrentIndex(0);
    setIsFlipped(false);
    window.speechSynthesis?.cancel();
  }

  function goToCard(index: number) {
    if (allCards.length === 0) return;

    const nextIndex =
      (index + allCards.length) % allCards.length;

    setCurrentIndex(nextIndex);
    setIsFlipped(false);
    window.speechSynthesis?.cancel();
  }

  function shuffleCards() {
    if (allCards.length <= 1) return;

    const candidates = allCards.map((_, index) => index).filter((index) => index !== currentIndex);
    const randomIndex = candidates[Math.floor(Math.random() * candidates.length)];
    goToCard(randomIndex);
  }

  function markRemembered() {
    if (!currentCard) return;

    setProgress((previous) => ({
      ...previous,
      [currentCard.id]: "remembered",
    }));

    goToCard(currentIndex + 1);
  }

  function markLearning() {
    if (!currentCard) return;

    setProgress((previous) => ({
      ...previous,
      [currentCard.id]: "learning",
    }));

    goToCard(currentIndex + 1);
  }

  function resetProgress() {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa toàn bộ tiến độ học Flashcard không?"
    );

    if (confirmed) {
      setProgress({});
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flashcards-message">
        <div className="flashcards-loader" />
        <p>Đang tải dữ liệu từ vựng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flashcards-message flashcards-error">
        <h3>Không thể tải Flashcard</h3>
        <p>{error}</p>
        <p>
          Hãy kiểm tra file public/data/flashcards.json.
        </p>
      </div>
    );
  }

  return (
    <div className="flashcards-page">
      {/* Thống kê */}
      <div className="flashcards-stats">
        <div className="flashcard-stat-card">
          <div className="flashcard-stat-icon purple">
            <Layers size={22} />
          </div>
          <div>
            <span>Tổng số từ</span>
            <strong>{allCards.length}</strong>
          </div>
        </div>

        <div className="flashcard-stat-card">
          <div className="flashcard-stat-icon green">
            <Check size={22} />
          </div>
          <div>
            <span>Đã nhớ</span>
            <strong>{rememberedCount}</strong>
          </div>
        </div>

        <div className="flashcard-stat-card">
          <div className="flashcard-stat-icon orange">
            <BookOpen size={22} />
          </div>
          <div>
            <span>Chưa nhớ</span>
            <strong>{learningCount}</strong>
          </div>
        </div>
      </div>

      {/* Chọn Unit và cài đặt */}
      <div className="flashcards-toolbar">
        <div className="flashcard-select-group">
          <label>Chọn Unit</label>
          <select
            value={selectedUnit}
            onChange={(event) => changeUnit(event.target.value)}
          >
            <option value="all">Tất cả 50 Unit</option>

            {units.map((unit) => (
              <option
                key={unit.unitNumber}
                value={String(unit.unitNumber)}
              >
                {unit.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flashcard-search-group">
          <label htmlFor="flashcard-search">Tìm từ vựng</label>
          <div className="flashcard-search-input">
            <Search size={16} />
            <input
              id="flashcard-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              placeholder="Từ, IPA, nghĩa tiếng Việt..."
            />
          </div>
        </div>

        <div className="flashcard-filter-group">
          <label htmlFor="flashcard-status-filter">Trạng thái</label>
          <select
            id="flashcard-status-filter"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "all" | "learning" | "remembered");
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
          >
            <option value="all">Tất cả từ</option>
            <option value="learning">Chưa nhớ</option>
            <option value="remembered">Đã nhớ</option>
          </select>
        </div>

        <div className="flashcard-settings">
          <div>
            <label>Giọng đọc</label>
            <select
              value={voiceType}
              onChange={(event) =>
                setVoiceType(event.target.value as "uk" | "us")
              }
            >
              <option value="uk">Anh - Anh (UK)</option>
              <option value="us">Anh - Mỹ (US)</option>
            </select>
          </div>

          <div>
            <label>Tốc độ</label>
            <select
              value={speed}
              onChange={(event) =>
                setSpeed(Number(event.target.value))
              }
            >
              <option value={0.5}>0.5x</option>
              <option value={0.8}>0.8x</option>
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2.0x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tiến độ */}
      <div className="flashcards-progress">
        <div className="flashcards-progress-heading">
          <span>Tiến độ ghi nhớ</span>
          <strong>{progressPercent}%</strong>
        </div>

        <div className="flashcards-progress-track">
          <div
            className="flashcards-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {currentCard ? (
        <>
          {/* Thẻ từ vựng */}
          <div className="flashcard-area">
            <div className="flashcard-counter">
              <span>
                Thẻ {currentIndex + 1} / {allCards.length}
              </span>

              {progress[currentCard.id] === "remembered" ? (
                <span className="flashcard-status remembered">
                  <Check size={14} /> Đã nhớ
                </span>
              ) : (
                <span className="flashcard-status learning">
                  Chưa nhớ
                </span>
              )}
            </div>

            <div
              ref={cardRef}
              className={`flashcard ${isFlipped ? "flipped" : ""}`}
              onClick={() => setIsFlipped((value) => !value)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setIsFlipped((value) => !value);
                }
              }}
            >
              {!isFlipped ? (
                <div className="flashcard-face flashcard-front">
                  <span className="flashcard-face-label">
                    {selectedUnit === "all"
                      ? "ENGLISH MASTER · 50 UNITS"
                      : units.find((unit) => unit.unitNumber === Number(selectedUnit))?.title || "ENGLISH WORD / PHRASE"}
                  </span>

                  <h2>{currentCard.word}</h2>

                  {currentCard.ipa && (
                    <p className="flashcard-ipa">
                      {currentCard.ipa}
                    </p>
                  )}

                  <span className="flashcard-hint">
                    Nhấn vào thẻ để xem nghĩa
                  </span>
                </div>
              ) : (
                <div className="flashcard-face flashcard-back">
                  <span className="flashcard-face-label">
                    NGHĨA TIẾNG VIỆT
                  </span>

                  <h2>{currentCard.meaning}</h2>

                  <span className="flashcard-pos">
                    {normalizePartOfSpeech(
                      currentCard.partOfSpeech
                    )}
                  </span>

                  {currentCard.example && (
                    <div className="flashcard-example">
                      <strong>Ví dụ:</strong>
                      <p>{currentCard.example}</p>
                    </div>
                  )}

                  <span className="flashcard-hint">
                    Nhấn vào thẻ để quay lại
                  </span>
                </div>
              )}
            </div>

            <div className="flashcard-flip-control">
              <button
                className="flashcard-listen-button"
                onClick={() => speakWord(currentCard.word, voiceType, speed)}
                title="Nghe phát âm từ vựng"
              >
                <Volume2 size={18} />
                Nghe {voiceType.toUpperCase()}
              </button>
              <button
                onClick={() => setIsFlipped((value) => !value)}
              >
                <RotateCw size={18} />
                Lật thẻ
              </button>
            </div>

            {/* Điều hướng */}
            <div className="flashcard-navigation">
              <button
                className="flashcard-nav-button"
                onClick={() => goToCard(currentIndex - 1)}
              >
                <ChevronLeft size={20} />
                Trước
              </button>

              <button
                className="flashcard-shuffle-button"
                onClick={shuffleCards}
              >
                <Shuffle size={18} />
                Ngẫu nhiên
              </button>

              <button
                className="flashcard-nav-button"
                onClick={() => goToCard(currentIndex + 1)}
              >
                Tiếp theo
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Đánh dấu */}
            <div className="flashcard-answer-actions">
              <button
                className="flashcard-learning-button"
                onClick={markLearning}
              >
                <X size={18} />
                Chưa nhớ
              </button>

              <button
                className="flashcard-remembered-button"
                onClick={markRemembered}
              >
                <Check size={18} />
                Đã nhớ
              </button>
            </div>
          </div>

          <div className="flashcards-bottom">
            <span>
              Đã ghi nhớ {rememberedCount}/{allCards.length} từ
            </span>

            <button onClick={resetProgress}>
              Đặt lại tiến độ
            </button>
          </div>
        </>
      ) : (
        <div className="flashcards-message">
          <BookOpen size={38} />
          <h3>Chưa có từ vựng trong chủ đề này</h3>
          <p>Hãy chọn một Unit khác để bắt đầu học.</p>
        </div>
      )}
    </div>
  );
}

export default Flashcards;
