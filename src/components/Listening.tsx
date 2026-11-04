
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
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
  Maximize2,
  X,
  ListMusic,
} from "lucide-react";
import { getUnits } from "../services/unitService";
import type { Unit } from "../types/unit";
import "./Listening.css";

type RepeatMode = "1" | "2" | "3" | "infinite";
type VoiceType = "US" | "UK";

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
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("1");
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedRounds, setCompletedRounds] = useState(0);
  // Mảng rỗng có nghĩa là phát tất cả câu trong Unit.
  const [selectedSentenceIndexes, setSelectedSentenceIndexes] = useState<number[]>([]);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);

  const selectedSentenceIndexesRef = useRef<number[]>([]);
  const focusContainerRef = useRef<HTMLDivElement | null>(null);

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

  const getPlaybackQueue = (unit = selectedUnitRef.current) => {
    if (!unit) return [];
  const selected = selectedSentenceIndexesRef.current;

  if (selected.length === 0) {
    return unit.sentences.map((_, index) => index);
  }

  if (selected.includes(-1)) {
    return [];
  }

  return [...selected]
    .filter((index) => index >= 0 && index < unit.sentences.length)
    .sort((a, b) => a - b);
  };

  const getNextQueueIndex = (index: number) => {
    const queue = getPlaybackQueue();
    const position = queue.indexOf(index);
    return position >= 0 && position < queue.length - 1 ? queue[position + 1] : -1;
  };

  const getPreviousQueueIndex = (index: number) => {
    const queue = getPlaybackQueue();
    const position = queue.indexOf(index);
    return position > 0 ? queue[position - 1] : -1;
  };

  const getFirstQueueIndex = () => getPlaybackQueue()[0] ?? 0;

  const getWordIndexAtChar = (sentence: string, charIndex: number) => {
    const expression = /\S+/g;
    let match: RegExpExecArray | null;
    let wordIndex = 0;
    while ((match = expression.exec(sentence)) !== null) {
      const start = match.index;
      if (charIndex >= start && charIndex < start + match[0].length) return wordIndex;
      wordIndex += 1;
    }
    return -1;
  };

  const renderHighlightedSentence = (sentence: string) => {
    const expression = /\S+/g;
    const parts: ReactNode[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;
    let index = 0;
    while ((match = expression.exec(sentence)) !== null) {
      const start = match.index;
      const word = match[0];
      if (start > cursor) parts.push(sentence.slice(cursor, start));
      parts.push(
        <span key={`${start}-${index}`} className={index === activeWordIndex ? "listening-focus-word active" : "listening-focus-word"}>
          {word}
        </span>
      );
      cursor = start + word.length;
      index += 1;
    }
    if (index === 0) return sentence;
    if (cursor < sentence.length) parts.push(sentence.slice(cursor));
    return parts;
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

    return () => {
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
        const firstIndex = getFirstQueueIndex();
        currentIndexRef.current = firstIndex;
        setCurrentIndex(firstIndex);
        scheduleSentence(firstIndex, runId, 800);
      } else {
        playingRef.current = false;
        setPlaying(false);
        setPaused(false);
        setCurrentIndex(unit.sentences.length - 1);
      }

      return;
    }

    const sentence = unit.sentences[index];

    if (!sentence?.english?.trim()) {
      const nextIndex = getNextQueueIndex(index);
      scheduleSentence(nextIndex === -1 ? unit.sentences.length : nextIndex, runId, SENTENCE_DELAY);
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

    utterance.onend = () => {
      if (runId !== runIdRef.current || !playingRef.current) {
        return;
      }

      const nextIndex = getNextQueueIndex(index);
      scheduleSentence(nextIndex === -1 ? unit.sentences.length : nextIndex, runId, SENTENCE_DELAY);
    };

    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (runId !== runIdRef.current || !playingRef.current) return;
      if (event.name && event.name !== "word") return;
      const wordIndex = getWordIndexAtChar(sentence.english.trim(), event.charIndex);
      if (wordIndex >= 0) setActiveWordIndex(wordIndex);
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

    const queue = getPlaybackQueue();
    if (queue.length === 0) return;
    if (!queue.includes(fromIndex)) fromIndex = queue[0];

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
    setPlaying(true);
    setPaused(false);
    setError("");

    // Chờ Chrome giải phóng hoàn toàn bộ đọc.
    scheduleSentence(fromIndex, runId, START_DELAY);
  };

  const handlePlayPause = () => {
    if (playing && !paused) {
      window.speechSynthesis.pause();
      setPaused(true);
      return;
    }

    if (playing && paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      return;
    }

    startPlayback(currentIndex, true);
  };

  const handleReplay = () => {
    startPlayback(currentIndex, true);
  };

  const handlePrevious = () => {
    const previousIndex = getPreviousQueueIndex(currentIndex);
    startPlayback(previousIndex === -1 ? getFirstQueueIndex() : previousIndex, true);
  };

  const handleNext = () => {
    if (!selectedUnitRef.current) return;

    const nextIndex = getNextQueueIndex(currentIndex);
    if (nextIndex !== -1) startPlayback(nextIndex, true);
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
    selectedSentenceIndexesRef.current = [];
    setSelectedSentenceIndexes([]);
    setShowPlaylist(false);
    setActiveWordIndex(-1);
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

  const handleToggleSentence = (index: number) => {
    if (!selectedUnit) return;
    const allIndexes = selectedUnit.sentences.map((_, itemIndex) => itemIndex);
    const currentSelection = selectedSentenceIndexesRef.current.includes(-1)
      ? []
      : selectedSentenceIndexesRef.current;
    const nextSelection = currentSelection.length === 0
      ? allIndexes.filter((itemIndex) => itemIndex !== index)
      : currentSelection.includes(index)
        ? currentSelection.filter((itemIndex) => itemIndex !== index)
        : [...currentSelection, index].sort((a, b) => a - b);
    const normalized = nextSelection.length === allIndexes.length ? [] : nextSelection;
    selectedSentenceIndexesRef.current = normalized;
    setSelectedSentenceIndexes(normalized);
    stopAudio();
    const nextStart = normalized.length > 0 ? normalized[0] : 0;
    currentIndexRef.current = nextStart;
    setCurrentIndex(nextStart);
    completedRoundsRef.current = 0;
    setCompletedRounds(0);
  };

  const handleSelectAllSentences = () => {
    selectedSentenceIndexesRef.current = [];
    setSelectedSentenceIndexes([]);
    stopAudio();
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    completedRoundsRef.current = 0;
    setCompletedRounds(0);
  };

  const handleDeselectAllSentences = () => {
    selectedSentenceIndexesRef.current = [-1];
    setSelectedSentenceIndexes([-1]);

    stopAudio();

    currentIndexRef.current = 0;
    setCurrentIndex(0);

    completedRoundsRef.current = 0;
    setCompletedRounds(0);
  };
  const handleToggleFocus = async () => {
    if (focusMode) {
      setFocusMode(false);
      if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch { /* Safari có thể không hỗ trợ */ }
      }
      return;
    }
    setFocusMode(true);
    window.setTimeout(async () => {
      const element = focusContainerRef.current;
      if (element?.requestFullscreen) {
        try { await element.requestFullscreen(); } catch { /* Vẫn hiển thị overlay cố định */ }
      }
    }, 80);
  };

  useEffect(() => {
    if (!focusMode) return;
    const previousBackground = document.body.style.background;
    const previousOverflow = document.body.style.overflow;
    document.body.style.background = "#080d1c";
    document.body.style.overflow = "hidden";
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setFocusMode(false);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.body.style.background = previousBackground;
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [focusMode]);

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

  const playbackQueue = getPlaybackQueue(selectedUnit);
  const queuePosition = Math.max(0, playbackQueue.indexOf(currentIndex));
  const progress = playbackQueue.length
    ? ((queuePosition + 1) / playbackQueue.length) * 100
    : 0;
  const playlistCount = playbackQueue.length;
  const isAllSentences = selectedSentenceIndexes.length === 0;

  const repeatLabel: Record<RepeatMode, string> = {
    "1": "1 lần",
    "2": "2 lần",
    "3": "3 lần",
    infinite: "Vô hạn",
  };

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

      <div className="listening-settings-card">
        <div className="listening-setting">
          <label htmlFor="listening-unit">
            <BookOpen size={16} />
            <span>NỘI DUNG HỌC</span>
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
                <option
                  key={unit.unitNumber}
                  value={unit.unitNumber}
                >
                  Unit {unit.unitNumber} - {unit.title}
                </option>
              ))}
            </select>

            <ChevronDown
              className="select-chevron"
              size={17}
            />
          </div>

          <small>Chọn bài học muốn luyện nghe</small>
        </div>

        <div className="listening-setting">
          <label htmlFor="listening-repeat">
            <Repeat size={16} />
            <span>CHẾ ĐỘ LẶP LẠI</span>
          </label>

          <div className="listening-select-wrap">
            <select
              id="listening-repeat"
              value={repeatMode}
              onChange={(event) =>
                handleRepeatChange(
                  event.target.value as RepeatMode
                )
              }
            >
              <option value="1">Nghe 1 lần</option>
              <option value="2">Lặp lại 2 lần</option>
              <option value="3">Lặp lại 3 lần</option>
              <option value="infinite">Lặp vô hạn</option>
            </select>

            <ChevronDown
              className="select-chevron"
              size={17}
            />
          </div>

          <small>Tự động phát lại toàn bộ Unit</small>
        </div>

        <div className="listening-setting">
          <label htmlFor="listening-voice">
            <Languages size={16} />
            <span>GIỌNG ĐỌC</span>
          </label>

          <div className="listening-select-wrap">
            <select
              id="listening-voice"
              value={voiceType}
              onChange={(event) =>
                handleVoiceChange(
                  event.target.value as VoiceType
                )
              }
            >
              <option value="UK">
                English - United Kingdom
              </option>
              <option value="US">
                English - United States
              </option>
            </select>

            <ChevronDown
              className="select-chevron"
              size={17}
            />
          </div>

          <small>Chọn giọng Anh - Anh hoặc Anh - Mỹ</small>
        </div>

        <div className="listening-setting">
          <label htmlFor="listening-speed">
            <Gauge size={16} />
            <span>TỐC ĐỘ ĐỌC</span>
          </label>

          <div className="listening-select-wrap">
            <select
              id="listening-speed"
              value={speed}
              onChange={(event) =>
                handleSpeedChange(
                  Number(event.target.value)
                )
              }
            >
              <option value="0.5">0.5x - Rất chậm</option>
              <option value="0.8">0.8x - Chậm</option>
              <option value="1">1.0x - Bình thường</option>
              <option value="1.25">1.25x - Nhanh</option>
              <option value="1.5">1.5x - Rất nhanh</option>
              <option value="2">2.0x - Cực nhanh</option>
            </select>

            <ChevronDown
              className="select-chevron"
              size={17}
            />
          </div>

          <small>Điều chỉnh tốc độ phát âm</small>
        </div>
      </div>

      <div className="listening-progress-card">
        <div className="listening-progress-top">
          <div>
            <span className="listening-unit-label">
              UNIT {selectedUnit.unitNumber}
            </span>
            <h3>{selectedUnit.title}</h3>
          </div>

          <div className="listening-progress-count">
            Câu <strong>{currentIndex + 1}</strong> /{" "}
            {totalSentences}
          </div>
        </div>

        <div className="listening-progress-track">
          <div
            className="listening-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="listening-progress-bottom">
          <span>
            {Math.round(progress)}% hoàn thành lượt hiện tại
          </span>
          <span>Đã hoàn thành: {completedRounds} lượt</span>
        </div>
      </div>

      <div className="listening-extra-toolbar">
        <button className="listening-outline-button" onClick={() => setShowPlaylist((value) => !value)}>
          <ListMusic size={17} />
          {showPlaylist ? "Ẩn danh sách câu" : "Danh sách phát"}
          <span>{playlistCount}/{totalSentences}</span>
        </button>
        <button className="listening-outline-button listening-focus-launch" onClick={handleToggleFocus}>
          <Maximize2 size={16} /> Phóng to
        </button>
      </div>

      {showPlaylist && (
        <div className="listening-playlist-card">
          <div className="listening-playlist-header">
            <div>
              <strong>Chọn câu muốn phát</strong>
              <small>Mặc định phát tất cả câu trong Unit.</small>
            </div>
            <div className="listening-playlist-actions">
              <button
                type="button"
                className="listening-text-button"
                onClick={handleSelectAllSentences}
              >
                Chọn tất cả
              </button>

              <button
                type="button"
                className="listening-text-button"
                onClick={handleDeselectAllSentences}
              >
                Bỏ chọn tất cả
              </button>
            </div>
          </div>
          <div className="listening-playlist-grid">
            {selectedUnit.sentences.map((sentence, index) => {
              const checked =
                !selectedSentenceIndexes.includes(-1) &&
                (isAllSentences || selectedSentenceIndexes.includes(index));
              return (
                <label key={`${selectedUnit.unitNumber}-${index}`} className={`listening-playlist-item ${checked ? "selected" : ""}`}>
                  <input type="checkbox" checked={checked} onChange={() => handleToggleSentence(index)} />
                  <span>Câu {index + 1}</span>
                  <small>{sentence.english}</small>
                </label>
              );
            })}
          </div>
          <div className="listening-playlist-footer">
            <span>Đang chọn {playlistCount} / {totalSentences} câu</span>
            <button
              type="button"
              className="listening-playlist-play"
              disabled={playlistCount === 0}
              onClick={() => startPlayback(getFirstQueueIndex(), true)}
            >
              <Play size={15} /> Phát danh sách đã chọn
            </button>
          </div>
        </div>
      )}

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
            <p>{renderHighlightedSentence(currentSentence.english)}</p>
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

      <div className="listening-player-card">
        <div className="listening-player-left">
          <div className="listening-player-title">Nghe bài học</div>
          <div className="listening-controls">
            <button
              className="listening-control-button secondary"
              onClick={handlePrevious}
              disabled={getPreviousQueueIndex(currentIndex) === -1}
              title="Câu trước"
              aria-label="Câu trước"
            >
              <SkipBack size={20} />
            </button>

            <button
              className="listening-control-button primary"
              onClick={handlePlayPause}
              title={playing && !paused ? "Tạm dừng" : "Nghe bài học"}
              aria-label={playing && !paused ? "Tạm dừng" : "Nghe bài học"}
            >
              {playing && !paused ? <Pause size={23} /> : <Play size={23} />}
            </button>

            <button
              className="listening-control-button secondary"
              onClick={handleNext}
              disabled={getNextQueueIndex(currentIndex) === -1}
              title="Câu tiếp theo"
              aria-label="Câu tiếp theo"
            >
              <SkipForward size={20} />
            </button>

            <button
              className="listening-control-button secondary"
              onClick={handleReplay}
              title="Nghe lại câu hiện tại"
              aria-label="Nghe lại câu hiện tại"
            >
              <RotateCcw size={19} />
            </button>
          </div>
        </div>
        <div className="listening-player-meta">
          <span>{playing ? (paused ? "Đang tạm dừng" : "Đang phát") : "Sẵn sàng"}</span>
          <span>•</span>
          <span>{playlistCount} câu trong danh sách phát</span>
          <span>•</span>
          <span>Lặp {repeatLabel[repeatMode]}</span>
        </div>
        {error && <p className="listening-inline-error">{error}</p>}
      </div>

      {focusMode && createPortal(
        <div className="listening-focus-overlay" ref={focusContainerRef}>
          <header className="listening-focus-header">
            <div className="listening-focus-title-wrap">
              <div className="listening-focus-title">UNIT {selectedUnit.unitNumber} · {selectedUnit.title}</div>
              <div className="listening-focus-count">CÂU {currentIndex + 1} / {totalSentences}</div>
            </div>
            <button className="listening-focus-close" onClick={handleToggleFocus} aria-label="Thoát phóng to"><X size={26} /></button>
          </header>

          <main className="listening-focus-content" key={`${selectedUnit.unitNumber}-${currentIndex}`}>
            <div className="listening-focus-english">{currentSentence ? renderHighlightedSentence(currentSentence.english) : ""}</div>
            <div className="listening-focus-ipa">{currentSentence?.ipa || ""}</div>
            <div className="listening-focus-vietnamese">{currentSentence?.vietnamese || ""}</div>
            <div className="listening-focus-status">{playing ? (paused ? "Đang tạm dừng" : "Đang phát · Từ đang đọc được tô sáng") : "Sẵn sàng luyện nghe"}</div>
          </main>

          <footer className="listening-focus-footer">
            <div className="listening-focus-controls">
              <button className="listening-focus-control" onClick={handlePrevious} title="Câu trước"><SkipBack size={27} /></button>
              <button className="listening-focus-control primary" onClick={handlePlayPause} title={playing && !paused ? "Tạm dừng" : "Phát"}>{playing && !paused ? <Pause size={31} /> : <Play size={31} />}</button>
              <button className="listening-focus-control" onClick={handleNext} title="Câu tiếp"><SkipForward size={27} /></button>
              <button className="listening-focus-control" onClick={handleReplay} title="Nghe lại"><RotateCcw size={27} /></button>
            </div>
            <div className="listening-focus-progress"><span style={{ width: `${progress}%` }} /></div>
          </footer>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Listening;
