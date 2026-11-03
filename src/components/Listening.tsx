
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Maximize2,
  Minimize2,
  X,
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

function getWordIndexAtChar(text: string, charIndex: number): number {
  const matches = [...text.matchAll(/\\S+/g)];
  const found = matches.findIndex((match) => {
    const start = match.index ?? 0;
    return charIndex >= start && charIndex < start + match[0].length;
  });
  return found;
}

function renderHighlightedSentence(
  text: string,
  activeIndex: number,
  large = false
) {
  const matches = [...text.matchAll(/\\S+/g)];
  if (matches.length === 0) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    const start = match.index ?? 0;
    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }
    parts.push(
      <span
        key={`${start}-${index}`}
        style={{
          color: index === activeIndex ? "#F59E0B" : "inherit",
          background:
            index === activeIndex
              ? "rgba(245, 158, 11, 0.18)"
              : "transparent",
          borderRadius: large ? 8 : 5,
          padding: large ? "0 4px" : "0 2px",
                  WebkitBoxDecorationBreak: "clone",
          transition: "background 120ms ease, color 120ms ease",
          fontWeight: index === activeIndex ? 800 : "inherit",
        }}
      >
        {match[0]}
      </span>
    );
    cursor = start + match[0].length;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

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

  useEffect(() => {
    if (!focusMode) return;

    const handleFocusEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFocusMode(false);
        if (document.fullscreenElement && document.exitFullscreen) {
          void document.exitFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener("keydown", handleFocusEscape);
    return () => window.removeEventListener("keydown", handleFocusEscape);
  }, [focusMode]);

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
    setActiveWordIndex(-1);

    const utterance = new SpeechSynthesisUtterance(
    `${sentence.english.trim()}`
    );

    utterance.lang =
      voiceTypeRef.current === "UK" ? "en-GB" : "en-US";
    utterance.rate = speedRef.current;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voice = getSelectedVoice();

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onboundary = (event) => {
      if (runId !== runIdRef.current || !playingRef.current) return;
      if (event.name && event.name !== "word") return;
      const wordIndex = getWordIndexAtChar(
        sentence.english.trim(),
        event.charIndex
      );
      if (wordIndex >= 0) setActiveWordIndex(wordIndex);
    };

    utterance.onend = () => {
      setActiveWordIndex(-1);
      if (runId !== runIdRef.current || !playingRef.current) {
        return;
      }

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

  const currentSentence = selectedUnit.sentences[currentIndex];
  const totalSentences = selectedUnit.sentences.length;

  const progress = totalSentences
    ? ((currentIndex + 1) / totalSentences) * 100
    : 0;



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
            <span className="listening-current-position">Câu {currentIndex + 1} / {totalSentences}</span>
            <button
              type="button"
              onClick={() => {
                setFocusMode(true);
                const root = document.documentElement as HTMLElement & {
                  requestFullscreen?: () => Promise<void>;
                };
                if (root.requestFullscreen) {
                  void root.requestFullscreen().catch(() => {
                    // Chế độ phủ toàn màn hình trong trang vẫn hoạt động nếu API bị chặn.
                  });
                }
              }}
              aria-label="Phóng to màn hình"
              title="Phóng to"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                border: "1px solid #dbe3f0",
                borderRadius: 10,
                padding: "8px 12px",
                background: "#fff",
                color: "#334155",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Maximize2 size={16} />
              <span>Phóng to</span>
            </button>
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
            <p>{renderHighlightedSentence(currentSentence.english, activeWordIndex)}</p>
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

      {focusMode && currentSentence && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chế độ luyện nghe toàn màn hình"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            width: "100vw",
            height: "100dvh",
            overflowY: "auto",
            boxSizing: "border-box",
            background: "radial-gradient(circle at top, #263b67 0%, #101827 58%, #080d18 100%)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(20px, 5vw, 64px)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setFocusMode(false);
              if (document.fullscreenElement && document.exitFullscreen) {
                void document.exitFullscreen().catch(() => {});
              }
            }}
            aria-label="Thoát chế độ phóng to"
            title="Thoát"
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid rgba(255,255,255,.25)",
              borderRadius: 12,
              padding: "10px 14px",
              background: "rgba(255,255,255,.1)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            <X size={18} />
            <span>Thoát</span>
            <Minimize2 size={16} />
          </button>

          <div style={{ width: "min(1100px, 100%)", textAlign: "center" }}>
            <div
              style={{
                color: "#a5b4fc",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 3,
                marginBottom: 24,
              }}
            >
              UNIT {selectedUnit.unitNumber} · {selectedUnit.title}
            </div>

            <div
              style={{
                fontSize: "clamp(30px, 5.2vw, 68px)",
                lineHeight: 1.45,
                fontWeight: 750,
                overflowWrap: "break-word",
                marginBottom: 30,
              }}
            >
              {renderHighlightedSentence(
                currentSentence.english,
                activeWordIndex,
                true
              )}
            </div>

            <div
              style={{
                color: "#a5b4fc",
                fontSize: "clamp(17px, 2.4vw, 28px)",
                lineHeight: 1.7,
                marginBottom: 22,
                overflowWrap: "break-word",
              }}
            >
              {currentSentence.ipa || "Chưa có phiên âm"}
            </div>

            <div
              style={{
                color: "#e2e8f0",
                fontSize: "clamp(18px, 2.5vw, 30px)",
                lineHeight: 1.6,
                marginBottom: 32,
              }}
            >
              {currentSentence.vietnamese}
            </div>

            <div
              style={{
                color: "#94a3b8",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 24,
              }}
            >
              CÂU {currentIndex + 1} / {totalSentences}
              {playing && !paused ? " · ĐANG PHÁT" : paused ? " · TẠM DỪNG" : ""}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                aria-label="Câu trước"
                style={focusControlStyle}
              >
                <SkipBack size={22} />
              </button>
              <button
                type="button"
                onClick={handlePlayPause}
                aria-label={playing && !paused ? "Tạm dừng" : "Phát"}
                style={{ ...focusControlStyle, width: 66, height: 66, background: "#6366f1", borderColor: "#818cf8" }}
              >
                {playing && !paused ? <Pause size={27} /> : <Play size={27} />}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex >= totalSentences - 1}
                aria-label="Câu tiếp theo"
                style={focusControlStyle}
              >
                <SkipForward size={22} />
              </button>
              <button
                type="button"
                onClick={handleReplay}
                aria-label="Nghe lại câu hiện tại"
                style={focusControlStyle}
              >
                <RotateCcw size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const focusControlStyle: CSSProperties = {
  width: 52,
  height: 52,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 16,
  background: "rgba(255,255,255,.1)",
  color: "#fff",
  cursor: "pointer",
};

export default Listening;
