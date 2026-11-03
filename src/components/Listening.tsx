
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Headphones,
  Repeat,
  BookOpen,
  Languages,
  Gauge,
  ChevronDown,
  ListMusic,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";
import { getUnits } from "../services/unitService";
import type { Unit } from "../types/unit";
import "./Listening.css";

type RepeatMode = "1" | "2" | "3" | "infinite";
type VoiceType = "US" | "UK";

type ScreenWakeLock = {
  release: () => Promise<void>;
  addEventListener?: (type: "release", listener: () => void) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<ScreenWakeLock>;
  };
};

// Tăng thời gian chờ để Chrome giải phóng bộ đọc trước khi phát.
const START_DELAY = 700;
const SENTENCE_DELAY = 600;
const RETRY_DELAY = 150;

function Listening() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [voiceType, setVoiceType] = useState<VoiceType>("US");
  const [showSentenceList, setShowSentenceList] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("1");
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedRounds, setCompletedRounds] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const playingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const completedRoundsRef = useRef(0);
  const selectedUnitRef = useRef<Unit | null>(null);
  const repeatModeRef = useRef<RepeatMode>("1");
  const speedRef = useRef(1);
  const voiceTypeRef = useRef<VoiceType>("US");
  const runIdRef = useRef(0);
  const delayTimerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<ScreenWakeLock | null>(null);

  // Giữ màn hình sáng trong lúc đang phát audio (nếu trình duyệt hỗ trợ).
  const requestScreenWakeLock = async () => {
    if (wakeLockRef.current || document.visibilityState !== "visible") return;

    const wakeLockNavigator = navigator as WakeLockNavigator;
    if (!wakeLockNavigator.wakeLock) return;

    try {
      const sentinel = await wakeLockNavigator.wakeLock.request("screen");
      wakeLockRef.current = sentinel;
      sentinel.addEventListener?.("release", () => {
        if (wakeLockRef.current === sentinel) {
          wakeLockRef.current = null;
        }
      });
    } catch (error) {
      // Audio vẫn hoạt động bình thường nếu trình duyệt không hỗ trợ Wake Lock.
      console.warn("Không thể bật Screen Wake Lock:", error);
    }
  };

  const releaseScreenWakeLock = async () => {
    const wakeLock = wakeLockRef.current;
    wakeLockRef.current = null;

    if (wakeLock) {
      try {
        await wakeLock.release();
      } catch {
        // Trình duyệt có thể đã tự giải phóng Wake Lock.
      }
    }
  };

  const clearDelay = () => {
    if (delayTimerRef.current !== null) {
      window.clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  };

  useEffect(() => {
    getUnits()
      .then((data) => {
        setUnits(data);

        if (data.length > 0) {
          setSelectedUnit(data[0]);
          selectedUnitRef.current = data[0];
        }
      })
      .catch(() => {
        setError(
          "Không thể tải dữ liệu Unit. Vui lòng kiểm tra file units.json."
        );
      })
      .finally(() => setLoading(false));

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        playingRef.current &&
        !window.speechSynthesis.paused
      ) {
        void requestScreenWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void releaseScreenWakeLock();
      runIdRef.current += 1;
      clearDelay();
      playingRef.current = false;
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (!focusMode) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusMode(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [focusMode]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    selectedUnitRef.current = selectedUnit;
  }, [selectedUnit]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    voiceTypeRef.current = voiceType;
  }, [voiceType]);

  const getSelectedVoice = () => {
    const language =
      voiceTypeRef.current === "UK" ? "en-GB" : "en-US";

    return (
      voicesRef.current.find(
        (voice) =>
          voice.lang.toLowerCase() === language.toLowerCase()
      ) ||
      voicesRef.current.find((voice) =>
        voice.lang.toLowerCase().startsWith(language.slice(0, 2))
      ) ||
      null
    );
  };

  const stopAudio = () => {
    runIdRef.current += 1;
    clearDelay();
    playingRef.current = false;
    window.speechSynthesis.cancel();
    void releaseScreenWakeLock();
    setPlaying(false);
    setPaused(false);
    setActiveWordIndex(-1);
  };

  const scheduleSentence = (
    index: number,
    runId: number,
    delay: number
  ) => {
    clearDelay();

    delayTimerRef.current = window.setTimeout(() => {
      delayTimerRef.current = null;

      if (runId !== runIdRef.current || !playingRef.current) {
        return;
      }

      speakSentence(index, runId);
    }, delay);
  };

  const speakSentence = (index: number, runId: number) => {
    const unit = selectedUnitRef.current;

    if (!unit || runId !== runIdRef.current || !playingRef.current) {
      return;
    }

    if (index >= unit.sentences.length) {
      const nextRound = completedRoundsRef.current + 1;
      const mode = repeatModeRef.current;

      completedRoundsRef.current = nextRound;
      setCompletedRounds(nextRound);

      const shouldRepeat =
        mode === "infinite" || nextRound < Number(mode);

      if (shouldRepeat) {
        currentIndexRef.current = 0;
        setCurrentIndex(0);
        scheduleSentence(0, runId, 800);
      } else {
        playingRef.current = false;
        void releaseScreenWakeLock();
        setPlaying(false);
        setPaused(false);
        setCurrentIndex(unit.sentences.length - 1);
      }

      return;
    }

    const sentence = unit.sentences[index];

    if (!sentence?.english?.trim()) {
      scheduleSentence(index + 1, runId, SENTENCE_DELAY);
      return;
    }

    // Không phát câu mới khi Chrome vẫn đang xử lý câu trước.
    if (
      window.speechSynthesis.speaking ||
      window.speechSynthesis.pending
    ) {
      scheduleSentence(index, runId, RETRY_DELAY);
      return;
    }

    currentIndexRef.current = index;
    setCurrentIndex(index);

    const spokenText = sentence.english.trim();
    const wordMatches: Array<{ 0: string; index: number }> = [];
    const spokenWordRegex = /[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g;
    let spokenWordMatch: RegExpExecArray | null;
    while ((spokenWordMatch = spokenWordRegex.exec(spokenText)) !== null) {
      wordMatches.push({ 0: spokenWordMatch[0], index: spokenWordMatch.index });
    }
    setActiveWordIndex(-1);

    const utterance = new SpeechSynthesisUtterance(spokenText);

    utterance.lang =
      voiceTypeRef.current === "UK" ? "en-GB" : "en-US";
    utterance.rate = speedRef.current;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voice = getSelectedVoice();

    if (voice) {
      utterance.voice = voice;
    }

    // Đồng bộ màu từ đang đọc bằng sự kiện word-boundary của SpeechSynthesis.
    // Một số trình duyệt không phát sự kiện này; khi đó câu vẫn được đọc bình thường.
    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (runId !== runIdRef.current || !playingRef.current) return;
      if (event.name && event.name !== "word") return;

      const charIndex = event.charIndex ?? 0;
      const wordIndex = wordMatches.findIndex((match) => {
        const start = match.index ?? 0;
        return charIndex >= start && charIndex < start + match[0].length;
      });

      if (wordIndex >= 0) setActiveWordIndex(wordIndex);
    };

    utterance.onend = () => {
      if (runId !== runIdRef.current || !playingRef.current) {
        return;
      }

      setActiveWordIndex(-1);
      scheduleSentence(index + 1, runId, SENTENCE_DELAY);
    };

    utterance.onerror = (event) => {
      if (runId !== runIdRef.current) return;

      if (
        event.error === "canceled" ||
        event.error === "interrupted"
      ) {
        return;
      }

      setError(
        "Không thể phát câu này. Bạn hãy thử nhấn Nghe lại."
      );
      playingRef.current = false;
      void releaseScreenWakeLock();
      setPlaying(false);
      setPaused(false);
      setActiveWordIndex(-1);
    };

    // Phát câu sau khi đã kiểm tra bộ đọc sẵn sàng.
    window.speechSynthesis.speak(utterance);
  };

  const startPlayback = (
    fromIndex = currentIndexRef.current,
    resetRounds = false
  ) => {
    if (!selectedUnitRef.current) return;

    runIdRef.current += 1;
    const runId = runIdRef.current;

    clearDelay();
    playingRef.current = false;

    // Hủy hàng đợi cũ và yêu cầu Chrome tiếp tục trạng thái đọc bình thường.
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    if (resetRounds) {
      completedRoundsRef.current = 0;
      setCompletedRounds(0);
    }

    playingRef.current = true;
    void requestScreenWakeLock();
    setPlaying(true);
    setPaused(false);
    setActiveWordIndex(-1);
    setError("");

    // Chờ Chrome giải phóng hoàn toàn bộ đọc.
    scheduleSentence(fromIndex, runId, START_DELAY);
  };

  const handlePlayPause = () => {
    if (playing && !paused) {
      window.speechSynthesis.pause();
      void releaseScreenWakeLock();
      setPaused(true);
      return;
    }

    if (playing && paused) {
      window.speechSynthesis.resume();
      void requestScreenWakeLock();
      setPaused(false);
      return;
    }

    startPlayback(currentIndex, true);
  };

  const handleReplay = () => {
    startPlayback(currentIndex, true);
  };

  const handlePrevious = () => {
    startPlayback(Math.max(0, currentIndex - 1), true);
  };

  const handleNext = () => {
    if (!selectedUnitRef.current) return;

    const nextIndex = Math.min(
      selectedUnitRef.current.sentences.length - 1,
      currentIndex + 1
    );

    startPlayback(nextIndex, true);
  };

  const handleSelectUnit = (unitNumber: number) => {
    const unit = units.find(
      (item) => item.unitNumber === unitNumber
    );

    if (!unit) return;

    stopAudio();

    selectedUnitRef.current = unit;
    setSelectedUnit(unit);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    completedRoundsRef.current = 0;
    setCompletedRounds(0);
    setError("");
  };

  const handleRepeatChange = (value: RepeatMode) => {
    repeatModeRef.current = value;
    setRepeatMode(value);
  };

  const handleSpeedChange = (value: number) => {
    speedRef.current = value;
    setSpeed(value);
  };

  const handleVoiceChange = (value: VoiceType) => {
    voiceTypeRef.current = value;
    setVoiceType(value);
  };

  if (loading) {
    return (
      <div className="listening-loading">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (error && units.length === 0) {
    return <div className="listening-error">{error}</div>;
  }

  if (!selectedUnit) {
    return (
      <div className="listening-loading">
        Không có dữ liệu Unit.
      </div>
    );
  }

  const totalSentences = selectedUnit.sentences?.length ?? 0;
  const currentSentence = selectedUnit.sentences?.[currentIndex];

  // Tránh crash nếu Unit chưa có câu hoặc index không còn hợp lệ.
  if (!currentSentence || typeof currentSentence.english !== "string") {
    return (
      <div className="listening-loading">
        Unit này chưa có câu luyện nghe hợp lệ.
      </div>
    );
  }

  const progress = totalSentences
    ? ((currentIndex + 1) / totalSentences) * 100
    : 0;

  // Dùng regex ASCII để tương thích với cấu hình TypeScript/JavaScript cũ hơn.
  const displayWords: Array<{ 0: string; index: number }> = [];
  const displayWordRegex = /[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g;
  let displayWordMatch: RegExpExecArray | null;
  while ((displayWordMatch = displayWordRegex.exec(currentSentence.english)) !== null) {
    displayWords.push({ 0: displayWordMatch[0], index: displayWordMatch.index });
  }

  const highlightedEnglish = (() => {
    let cursor = 0;
    return displayWords.map((match, index) => {
      const start = match.index ?? 0;
      const word = match[0];
      const before = currentSentence.english.slice(cursor, start);
      cursor = start + word.length;
      return (
        <span key={`${index}-${start}`}>
          {before}
          <span
            className={index === activeWordIndex ? "listening-word-active" : ""}
            style={{
              color: activeWordIndex >= 0 && index < activeWordIndex
                ? "#6ee7b7"
                : index === activeWordIndex
                  ? "#ffffff"
                  : "#dbe4f3",
              background: index === activeWordIndex
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "transparent",
              borderRadius: "0.3em",
              padding: index === activeWordIndex ? "0.02em 0.12em" : "0",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
              transition: "background 120ms ease, color 120ms ease",
            }}
          >
            {word}
          </span>
        </span>
      );
    }).concat(
      currentSentence.english.slice(cursor)
        ? [<span key="tail">{currentSentence.english.slice(cursor)}</span>]
        : []
    );
  })();

  return (
    <div className="listening-page">
      <div className="listening-heading">
        <div className="listening-heading-icon">
          <Headphones size={25} />
        </div>

        <div>
          <h2>Luyện nghe theo Unit</h2>
          <p>
            Nghe tự động toàn bộ câu trong Unit và luyện phát âm.
          </p>
        </div>
      </div>

      <section className="listening-toolbar-panel">
        {/* Dòng 1: Chọn Unit và tiến độ */}
        <div className="listening-unit-progress-row">
          <div className="listening-setting listening-unit-setting">
            <label htmlFor="listening-unit">
              <BookOpen size={16} />
              <span>UNIT ĐANG HỌC</span>
            </label>
            <div className="listening-select-wrap">
              <select
                id="listening-unit"
                value={selectedUnit.unitNumber}
                onChange={(event) =>
                  handleSelectUnit(Number(event.target.value))
                }
              >
                {units.map((unit) => (
                  <option key={unit.unitNumber} value={unit.unitNumber}>
                    Unit {unit.unitNumber} - {unit.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-chevron" size={17} />
            </div>
          </div>

          <div className="listening-compact-progress">
            <div className="listening-compact-progress-heading">
              <div>
                <span>UNIT {selectedUnit.unitNumber}</span>
                <strong>{selectedUnit.title}</strong>
              </div>
              <small>
                Câu <b>{currentIndex + 1}</b> / {totalSentences}
              </small>
            </div>
            <div className="listening-progress-track">
              <div
                className="listening-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="listening-compact-progress-footer">
              <span>{Math.round(progress)}% hoàn thành</span>
              <span>Đã hoàn thành: {completedRounds} lượt</span>
            </div>
          </div>
        </div>

        {/* Dòng 2: Nghe nhanh bên trái, cài đặt gọn bên phải */}
        <div className="listening-actions-row">
          <div className="listening-quick-play">
            <button
              type="button"
              className="listening-quick-nav"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              title="Câu trước"
              aria-label="Câu trước"
            >
              <SkipBack size={16} />
            </button>
            <button
              type="button"
              className="listening-quick-play-button"
              onClick={handlePlayPause}
              title={playing && !paused ? "Tạm dừng" : "Nghe toàn bộ Unit"}
              aria-label={playing && !paused ? "Tạm dừng" : "Nghe toàn bộ Unit"}
            >
              {playing && !paused ? <Pause size={19} /> : <Play size={19} />}
            </button>
            <div className="listening-quick-play-text">
              <strong>
                {playing ? (paused ? "Đang tạm dừng" : "Đang phát") : "Nghe bài học"}
              </strong>
              <span>
                {playing
                  ? "Phát lần lượt các câu trong Unit"
                  : "Nhấn để nghe toàn bộ Unit"}
              </span>
            </div>
            <button
              type="button"
              className="listening-quick-nav"
              onClick={handleNext}
              disabled={currentIndex >= totalSentences - 1}
              title="Câu tiếp theo"
              aria-label="Câu tiếp theo"
            >
              <SkipForward size={16} />
            </button>
            <button
              type="button"
              className="listening-quick-replay"
              onClick={handleReplay}
              title="Nghe lại từ câu hiện tại"
              aria-label="Nghe lại"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="listening-compact-settings">
            <div className="listening-setting">
              <label htmlFor="listening-repeat">
                <Repeat size={14} />
                <span>LẶP</span>
              </label>
              <div className="listening-select-wrap">
                <select
                  id="listening-repeat"
                  value={repeatMode}
                  onChange={(event) =>
                    handleRepeatChange(event.target.value as RepeatMode)
                  }
                >
                  <option value="1">1 lần</option>
                  <option value="2">2 lần</option>
                  <option value="3">3 lần</option>
                  <option value="infinite">Vô hạn</option>
                </select>
                <ChevronDown className="select-chevron" size={15} />
              </div>
            </div>

            <div className="listening-setting">
              <label htmlFor="listening-voice">
                <Languages size={14} />
                <span>GIỌNG ĐỌC</span>
              </label>
              <div className="listening-select-wrap">
                <select
                  id="listening-voice"
                  value={voiceType}
                  onChange={(event) =>
                    handleVoiceChange(event.target.value as VoiceType)
                  }
                >
                  <option value="US">English (US)</option>
                  <option value="UK">English (UK)</option>
                </select>
                <ChevronDown className="select-chevron" size={15} />
              </div>
            </div>

            <div className="listening-setting">
              <label htmlFor="listening-speed">
                <Gauge size={14} />
                <span>TỐC ĐỘ</span>
              </label>
              <div className="listening-select-wrap">
                <select
                  id="listening-speed"
                  value={speed}
                  onChange={(event) =>
                    handleSpeedChange(Number(event.target.value))
                  }
                >
                  <option value="0.5">0.5x</option>
                  <option value="0.8">0.8x</option>
                  <option value="1">1.0x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2.0x</option>
                </select>
                <ChevronDown className="select-chevron" size={15} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="listening-workspace">
        {showSentenceList && (
          <aside id="listening-sentence-list" className="listening-sentence-list" aria-label="Danh sách câu trong Unit">
            <div className="listening-list-header">
              <div>
                <span className="listening-list-eyebrow">UNIT {selectedUnit.unitNumber}</span>
                <h3>Danh sách câu</h3>
                <p>{totalSentences} câu luyện nghe</p>
              </div>
              <button
                type="button"
                className="listening-list-close"
                onClick={() => setShowSentenceList(false)}
                aria-label="Ẩn danh sách câu"
                title="Ẩn danh sách câu"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="listening-list-items">
              {selectedUnit.sentences.map((sentence, index) => (
                <button
                  type="button"
                  key={`${selectedUnit.unitNumber}-${index}`}
                  className={`listening-list-item ${index === currentIndex ? "active" : ""}`}
                  onClick={() => {
                    stopAudio();
                    currentIndexRef.current = index;
                    setCurrentIndex(index);
                    setError("");
                  }}
                  aria-current={index === currentIndex ? "true" : undefined}
                >
                  <span className="listening-list-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="listening-list-text">
                    <strong>{sentence.english}</strong>
                    <small>{sentence.vietnamese}</small>
                  </span>
                  {index === currentIndex && <span className="listening-list-active-dot" />}
                </button>
              ))}
            </div>
          </aside>
        )}

        <div className="listening-main-column">
          <div className="listening-workspace-toolbar">
            <button
              type="button"
              className={`listening-list-toggle ${showSentenceList ? "is-open" : ""}`}
              onClick={() => setShowSentenceList((visible) => !visible)}
              aria-expanded={showSentenceList}
              aria-controls="listening-sentence-list"
            >
              <ListMusic size={17} />
              <span>{showSentenceList ? "Ẩn danh sách câu" : "Danh sách câu"}</span>
              <span className="listening-list-total">{totalSentences}</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="listening-current-position">Câu {currentIndex + 1} / {totalSentences}</span>
              <button
                type="button"
                className="listening-list-toggle"
                onClick={() => {
                  setFocusMode(true);
                  const root = document.documentElement as HTMLElement & { requestFullscreen?: () => Promise<void> };
                  if (root.requestFullscreen) {
                    void root.requestFullscreen().catch(() => {
                      // Overlay vẫn hiển thị toàn màn hình cửa sổ nếu trình duyệt từ chối fullscreen.
                    });
                  }
                }}
                title="Mở chế độ trình chiếu"
                aria-label="Phóng to câu đang học"
              >
                <Maximize2 size={16} />
                <span>Phóng to</span>
              </button>
            </div>
          </div>

          {currentSentence && (
        <div className="listening-sentence-card">
          <div className="listening-sentence-top">
            <span className="listening-sentence-number">
              SENTENCE {currentIndex + 1}
            </span>

            {playing && !paused && (
              <span className="listening-speaking">
                <span className="speaking-dot" />
                Đang phát
              </span>
            )}

            {paused && (
              <span className="listening-paused">
                Đang tạm dừng
              </span>
            )}
          </div>

          <div className="listening-english">
            <span>English</span>
            <p>{currentSentence.english}</p>
          </div>

          <div className="listening-ipa">
            <span>IPA</span>
            <p>
              {currentSentence.ipa || "Chưa có phiên âm"}
            </p>
          </div>

          <div className="listening-vietnamese">
            <span>Tiếng Việt</span>
            <p>{currentSentence.vietnamese}</p>
          </div>

          {currentSentence.vocabulary && (
            <div className="listening-vocabulary">
              <span>Từ vựng gợi ý</span>
              <p>{currentSentence.vocabulary}</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="listening-inline-error">{error}</p>
      )}

        </div>
      </div>

      {focusMode && currentSentence && selectedUnit && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chế độ luyện nghe toàn màn hình"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483000,
            width: "100%",
            maxWidth: "100%",
            height: "100dvh",
            minHeight: "100svh",
            boxSizing: "border-box",
            overflow: "hidden",
            overscrollBehavior: "none",
            background: "radial-gradient(ellipse at 50% 20%, #202b52 0%, #10182d 48%, #070b16 100%)",
            color: "#fff",
            display: "grid",
            gridTemplateRows: "auto minmax(0, 1fr) auto",
            padding: "max(12px, env(safe-area-inset-top)) clamp(12px, 4vw, 56px) 0 max(12px, env(safe-area-inset-left))",
            textAlign: "center",
          }}
        >
          {/* Header cố định: tiêu đề Unit và số câu luôn ở cùng một vị trí */}
          <header style={{
            position: "relative",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 64,
            padding: "8px 48px 10px 8px",
            boxSizing: "border-box",
            borderBottom: "1px solid rgba(255,255,255,.10)",
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#a5b4fc", fontSize: "clamp(10px, 2.4vw, 15px)", fontWeight: 800, letterSpacing: ".08em", whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.35, maxWidth: "100%" }}>
                UNIT {selectedUnit.unitNumber} · {selectedUnit.title.toUpperCase()}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "clamp(11px, 2.5vw, 13px)", marginTop: 5, fontVariantNumeric: "tabular-nums" }}>
                CÂU {currentIndex + 1} / {totalSentences}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFocusMode(false);
                if (document.fullscreenElement && document.exitFullscreen) {
                  void document.exitFullscreen().catch(() => {});
                }
              }}
              aria-label="Thoát chế độ toàn màn hình"
              title="Thoát (Esc)"
              style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 42, height: 42, borderRadius: 13, border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.08)", color: "white", display: "grid", placeItems: "center", cursor: "pointer" }}
            >
              <X size={20} />
            </button>
          </header>

          {/* Vùng nội dung có kích thước ổn định, chỉ nội dung câu thay đổi */}
          <main style={{
            width: "100%",
            maxWidth: 1180,
            minWidth: 0,
            minHeight: 0,
            margin: "0 auto",
            alignSelf: "stretch",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "clamp(14px, 2.6vh, 28px)",
            padding: "clamp(12px, 3vh, 30px) 0 clamp(12px, 2vh, 24px)",
            boxSizing: "border-box",
            overflowY: "auto",
            overflowX: "hidden",
          }}>
            <div style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              fontSize: "clamp(26px, 5.2vw, 68px)",
              lineHeight: 1.35,
              fontWeight: 750,
              letterSpacing: "-.035em",
              overflowWrap: "break-word",
              wordBreak: "normal",
              textAlign: "center",
              minHeight: "2.5em",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <div>{highlightedEnglish}</div>
            </div>
            <div style={{ color: "#a5b4fc", fontSize: "clamp(15px, 2.2vw, 27px)", lineHeight: 1.5, minHeight: "1.5em", maxWidth: "100%", overflowWrap: "anywhere" }}>
              {currentSentence.ipa || "Chưa có phiên âm"}
            </div>
            <div style={{ color: "#e2e8f0", fontSize: "clamp(17px, 2.8vw, 34px)", lineHeight: 1.5, minHeight: "1.5em", maxWidth: "100%", overflowWrap: "anywhere" }}>
              {currentSentence.vietnamese}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 13, minHeight: 20 }}>
              {playing ? (paused ? "Đang tạm dừng" : "Đang phát · Từ đang đọc được tô sáng") : "Nhấn phát để bắt đầu luyện nghe"}
            </div>
          </main>

          {/* Bộ điều khiển cố định ở đáy như trình phát video */}
          <footer style={{
            position: "relative",
            width: "100%",
            maxWidth: "100%",
            marginLeft: 0,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "12px 12px max(16px, env(safe-area-inset-bottom))",
            boxSizing: "border-box",
            background: "linear-gradient(180deg, rgba(10,15,30,0) 0%, rgba(10,15,30,.72) 25%, rgba(10,15,30,.98) 100%)",
            borderTop: "1px solid rgba(255,255,255,.08)",
            backdropFilter: "blur(14px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(8px, 2.5vw, 14px)", width: "100%", flexWrap: "nowrap" }}>
              <button type="button" onClick={handlePrevious} disabled={currentIndex === 0} aria-label="Câu trước" style={focusControlStyle}>
                <SkipBack size={21} />
              </button>
              <button type="button" onClick={handlePlayPause} aria-label={playing && !paused ? "Tạm dừng" : "Phát"} style={{ ...focusControlStyle, width: 62, height: 62, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: 0 }}>
                {playing && !paused ? <Pause size={25} /> : <Play size={25} />}
              </button>
              <button type="button" onClick={handleNext} disabled={currentIndex >= totalSentences - 1} aria-label="Câu tiếp theo" style={focusControlStyle}>
                <SkipForward size={21} />
              </button>
              <button type="button" onClick={handleReplay} aria-label="Phát lại câu hiện tại" title="Phát lại" style={focusControlStyle}>
                <RotateCcw size={20} />
              </button>
            </div>
            <div style={{ width: "min(520px, 92%)", height: 3, borderRadius: 99, background: "rgba(255,255,255,.16)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #818cf8, #c084fc)", transition: "width 220ms ease" }} />
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

const focusControlStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.2)",
  background: "rgba(255,255,255,.09)",
  color: "white",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

export default Listening;
