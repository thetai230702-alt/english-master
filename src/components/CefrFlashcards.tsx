import { useEffect, useMemo, useState } from "react";
import {
  Volume2,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Check,
  X,
  Search,
  BookOpen,
  Layers,
} from "lucide-react";
import "./CefrFlashcards.css";

type LevelName = "A1" | "A2" | "B1";

interface VocabularyCard {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
  exampleTranslation: string;
}

interface Topic {
  id: string;
  name: string;
  cards: VocabularyCard[];
}

interface Level {
  level: LevelName;
  topics: Topic[];
}

interface VocabularyData {
  source: string;
  includedLevels: LevelName[];
  pronunciation: string;
  note: string;
  levels: Level[];
}

const LEVELS: LevelName[] = ["A1", "A2", "B1"];
const PROGRESS_KEY = "oxford3000-cefr-remembered-v1";

function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function readRemembered(): string[] {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function CefrFlashcards() {
  const [data, setData] = useState<VocabularyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedLevel, setSelectedLevel] = useState<LevelName>("A1");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "learning" | "remembered">("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [remembered, setRemembered] = useState<string[]>(readRemembered);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<VocabularyCard[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadVocabulary() {
      try {
        const response = await fetch("/data/oxford3000_A1_B1_topics_IPA.json");

        if (!response.ok) {
          throw new Error(
            "Không thể tải dữ liệu. Hãy kiểm tra file JSON trong thư mục public/data."
          );
        }

        const result = (await response.json()) as VocabularyData;

        if (!result.levels || !Array.isArray(result.levels)) {
          throw new Error("Cấu trúc JSON chưa đúng định dạng cấp độ → chủ đề → từ vựng.");
        }

        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải từ vựng."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadVocabulary();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(remembered));
  }, [remembered]);

  const currentLevel = data?.levels.find(
    (item) => item.level === selectedLevel
  );

  const topics = currentLevel?.topics ?? [];

  const selectedTopicData = topics.find((topic) => topic.id === selectedTopic);

  const filteredCards = useMemo(() => {
    const sourceCards =
      selectedTopic === "all"
        ? topics.flatMap((topic) => topic.cards)
        : selectedTopicData?.cards ?? [];

    const keyword = search.trim().toLocaleLowerCase();

    if (!keyword) return sourceCards;

    return sourceCards.filter((card) => {
      return (
        card.word.toLocaleLowerCase().includes(keyword) ||
        card.meaning.toLocaleLowerCase().includes(keyword) ||
        card.ipa.toLocaleLowerCase().includes(keyword)
      );
    });
  }, [topics, selectedTopic, selectedTopicData, search]);

  const studyCards = useMemo(() => {
    if (statusFilter === "all") return filteredCards;
    return filteredCards.filter((card) =>
      statusFilter === "remembered"
        ? remembered.includes(card.id)
        : !remembered.includes(card.id)
    );
  }, [filteredCards, statusFilter, remembered]);

  const displayedCards = isShuffled ? shuffledCards : studyCards;
  const currentCard = displayedCards[currentIndex];

  const levelCardCount = currentLevel
    ? currentLevel.topics.reduce((total, topic) => total + topic.cards.length, 0)
    : 0;

  const rememberedCount = filteredCards.filter((card) =>
    remembered.includes(card.id)
  ).length;

  const allRememberedCount = topics
    .flatMap((topic) => topic.cards)
    .filter((card) => remembered.includes(card.id)).length;

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(false);
    setShuffledCards([]);
  }, [selectedLevel, selectedTopic, search, statusFilter, remembered]);

  function chooseLevel(level: LevelName) {
    setSelectedLevel(level);
    setSelectedTopic("all");
    setSearch("");
  }

  function toggleShuffle() {
    if (isShuffled) {
      setIsShuffled(false);
      setShuffledCards([]);
      setCurrentIndex(0);
      setIsFlipped(false);
      return;
    }

    setShuffledCards(shuffleArray(studyCards));
    setIsShuffled(true);
    setCurrentIndex(0);
    setIsFlipped(false);
  }

  function changeCard(direction: number) {
    if (displayedCards.length === 0) return;

    setCurrentIndex((previous) => {
      return (
        (previous + direction + displayedCards.length) %
        displayedCards.length
      );
    });

    setIsFlipped(false);
  }

  function toggleRemembered() {
    if (!currentCard) return;

    setRemembered((previous) =>
      previous.includes(currentCard.id)
        ? previous.filter((id) => id !== currentCard.id)
        : [...previous, currentCard.id]
    );
  }

  function speakWord() {
    if (!currentCard) return;

    if (!("speechSynthesis" in window)) {
      setError("Trình duyệt này chưa hỗ trợ đọc phát âm.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentCard.word);
    utterance.lang = "en-GB";
    utterance.rate = 0.85;

    window.speechSynthesis.speak(utterance);
  }

  if (loading) {
    return (
      <div className="cefr-container">
        <div className="cefr-state">Đang tải Oxford 3000...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="cefr-container">
        <div className="cefr-error">
          <strong>Không tải được dữ liệu từ vựng</strong>
          <p>{error}</p>
          <small>
            Đường dẫn cần có: public/data/oxford3000_A1_B1_topics_IPA.json
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className="cefr-container">
      <section className="cefr-intro">
        <div className="cefr-intro-icon">
          <BookOpen size={23} />
        </div>
        <div className="cefr-intro-copy">
          <span className="cefr-eyebrow">OXFORD 3000 · BRITISH ENGLISH</span>
          <h2>Học từ vựng theo cấp độ CEFR</h2>
          <p>
            Chọn cấp độ, chọn chủ đề và luyện nhớ từng từ bằng flashcard.
          </p>
        </div>
      </section>

      <div className="cefr-level-list">
        {LEVELS.map((level) => {
          const levelData = data?.levels.find((item) => item.level === level);
          const count =
            levelData?.topics.reduce(
              (total, topic) => total + topic.cards.length,
              0
            ) ?? 0;

          return (
            <button
              key={level}
              type="button"
              className={`cefr-level-button ${
                selectedLevel === level ? "active" : ""
              }`}
              onClick={() => chooseLevel(level)}
            >
              <strong>{level}</strong>
              <span>{count.toLocaleString("vi-VN")} từ</span>
            </button>
          );
        })}
      </div>

      <section className="cefr-filter-panel">
        <div className="cefr-filter-heading">
          <div>
            <span className="cefr-eyebrow">YOUR STUDY LIST</span>
            <h3>
              <Layers size={18} /> Chủ đề {selectedLevel}
            </h3>
          </div>
          <span className="cefr-total-count">
            {levelCardCount.toLocaleString("vi-VN")} từ
          </span>
        </div>

        <div className="cefr-topic-grid">
          <button
            type="button"
            className={`cefr-topic-button ${
              selectedTopic === "all" ? "active" : ""
            }`}
            onClick={() => setSelectedTopic("all")}
          >
            <span>Tất cả chủ đề</span>
            <small>{levelCardCount} từ</small>
          </button>

          {topics.map((topic) => (
            <button
              type="button"
              key={topic.id}
              className={`cefr-topic-button ${
                selectedTopic === topic.id ? "active" : ""
              }`}
              onClick={() => setSelectedTopic(topic.id)}
            >
              <span>{topic.name}</span>
              <small>{topic.cards.length} từ</small>
            </button>
          ))}
        </div>

        <div className="cefr-toolbar">
          <label className="cefr-search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm từ tiếng Anh, IPA hoặc nghĩa..."
            />
            {search && (
              <button
                type="button"
                aria-label="Xóa tìm kiếm"
                onClick={() => setSearch("")}
              >
                <X size={16} />
              </button>
            )}
          </label>

          <label className="cefr-status-filter">
            <span>Trạng thái học</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "learning" | "remembered")}
            >
              <option value="all">Tất cả từ</option>
              <option value="learning">Chưa nhớ</option>
              <option value="remembered">Đã nhớ</option>
            </select>
          </label>

          <button
            type="button"
            className={`cefr-shuffle-button ${isShuffled ? "active" : ""}`}
            onClick={toggleShuffle}
            disabled={studyCards.length < 2}
          >
            <Shuffle size={17} />
            {isShuffled ? "Tắt trộn" : "Trộn từ"}
          </button>
        </div>
      </section>

      <section className="cefr-progress-card">
        <div className="cefr-progress-info">
          <div>
            <strong>Tiến độ ghi nhớ</strong>
            <span>
              Đã nhớ {rememberedCount}/{filteredCards.length} từ trong danh sách
              hiện tại
            </span>
          </div>
          <strong className="cefr-progress-percent">
            {filteredCards.length
              ? Math.round((rememberedCount / filteredCards.length) * 100)
              : 0}
            %
          </strong>
        </div>
        <div className="cefr-progress-track">
          <div
            className="cefr-progress-fill"
            style={{
              width: `${
                filteredCards.length
                  ? (rememberedCount / filteredCards.length) * 100
                  : 0
              }%`,
            }}
          />
        </div>
        <small>
          Cấp độ {selectedLevel}: {allRememberedCount}/{levelCardCount} từ đã
          nhớ
        </small>
      </section>

      {currentCard ? (
        <>
          <div className="cefr-card-counter">
            <span>
              TỪ {String(currentIndex + 1).padStart(2, "0")} /{" "}
              {displayedCards.length.toLocaleString("vi-VN")}
            </span>
            <span>
              {selectedTopic === "all"
                ? "Tất cả chủ đề"
                : selectedTopicData?.name}
              {" · "}
              {statusFilter === "all" ? "Tất cả từ" : statusFilter === "remembered" ? "Đã nhớ" : "Chưa nhớ"}
            </span>
          </div>

          <button
            type="button"
            className={`cefr-flashcard ${isFlipped ? "flipped" : ""}`}
            onClick={() => setIsFlipped((previous) => !previous)}
            aria-label={isFlipped ? "Hiện mặt trước thẻ" : "Xem nghĩa của từ"}
          >
            {!isFlipped ? (
              <div className="cefr-card-front">
                <span className="cefr-card-level">{selectedLevel}</span>
                <span className="cefr-card-topic">
                  {selectedTopicData?.name ?? "Oxford 3000"}
                </span>
                <h2>{currentCard.word}</h2>
                <p className="cefr-card-ipa">{currentCard.ipa || "Chưa có IPA"}</p>
                <span className="cefr-card-hint">Nhấn vào thẻ để xem nghĩa</span>
              </div>
            ) : (
              <div className="cefr-card-back">
                <span className="cefr-card-level">{selectedLevel}</span>
                <h2>
                  {currentCard.meaning || "Chưa bổ sung nghĩa tiếng Việt"}
                </h2>
                <p className="cefr-part-of-speech">
                  {currentCard.partOfSpeech || "Chưa phân loại từ"}
                </p>
                {currentCard.example ? (
                  <div className="cefr-example">
                    <strong>Ví dụ:</strong>
                    <p>{currentCard.example}</p>
                    {currentCard.exampleTranslation && (
                      <small>{currentCard.exampleTranslation}</small>
                    )}
                  </div>
                ) : (
                  <div className="cefr-example cefr-example-empty">
                    Câu ví dụ sẽ được bổ sung ở bước hoàn thiện dữ liệu.
                  </div>
                )}
                <span className="cefr-card-hint">Nhấn vào thẻ để quay lại</span>
              </div>
            )}
          </button>

          <div className="cefr-card-actions">
            <button type="button" onClick={speakWord}>
              <Volume2 size={18} />
              Nghe UK
            </button>

            <button
              type="button"
              onClick={() => setIsFlipped((previous) => !previous)}
            >
              <RotateCw size={18} />
              Lật thẻ
            </button>

            <button
              type="button"
              className={
                remembered.includes(currentCard.id) ? "remembered" : ""
              }
              onClick={toggleRemembered}
            >
              {remembered.includes(currentCard.id) ? (
                <Check size={18} />
              ) : (
                <X size={18} />
              )}
              {remembered.includes(currentCard.id) ? "Đã nhớ" : "Chưa nhớ"}
            </button>
          </div>

          <div className="cefr-navigation">
            <button
              type="button"
              onClick={() => changeCard(-1)}
              disabled={displayedCards.length < 2}
            >
              <ChevronLeft size={20} />
              Trước
            </button>

            <span>
              {currentIndex + 1} / {displayedCards.length}
            </span>

            <button
              type="button"
              onClick={() => changeCard(1)}
              disabled={displayedCards.length < 2}
            >
              Tiếp
              <ChevronRight size={20} />
            </button>
          </div>
        </>
      ) : (
        <div className="cefr-empty">
          <Search size={26} />
          <strong>Không tìm thấy từ vựng phù hợp</strong>
          <p>Hãy đổi chủ đề hoặc xóa nội dung tìm kiếm.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedTopic("all");
              setStatusFilter("all");
            }}
          >
            Hiển thị tất cả từ
          </button>
        </div>
      )}

      <p className="cefr-data-note">
        * IPA sử dụng giọng Anh–Anh (UK). Danh sách từ và từ loại lấy từ tài
        liệu Oxford bạn cung cấp; nghĩa tiếng Việt và câu ví dụ hiện chưa có
        trong PDF gốc nên chưa được tự điền.
      </p>
    </div>
  );
}

export default CefrFlashcards;
