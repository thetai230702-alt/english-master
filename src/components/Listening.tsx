
import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  Headphones,
  Repeat,
  BookOpen,
  Languages,
  Gauge,
  ChevronDown,
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
  const [voiceType, setVoiceType] = useState<VoiceType>("UK");
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("1");
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedRounds, setCompletedRounds] = useState(0);

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const playingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const completedRoundsRef = useRef(0);
  const selectedUnitRef = useRef<Unit | null>(null);
  const repeatModeRef = useRef<RepeatMode>("1");
  const speedRef = useRef(1);
  const voiceTypeRef = useRef<VoiceType>("UK");
  const runIdRef = useRef(0);
  const delayTimerRef = useRef<number | null>(null);

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

    const utterance = new SpeechSynthesisUtterance(
    `,' ${sentence.english.trim()}`
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

      <div className="listening-player-card">
        <div className="listening-player-title">
          <Volume2 size={19} />
          <span>Trình phát âm thanh</span>
        </div>

        <div className="listening-controls">
          <button
            className="listening-control-button secondary"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            title="Câu trước"
          >
            <SkipBack size={20} />
          </button>

          <button
            className="listening-control-button secondary"
            onClick={handleReplay}
            title="Nghe lại câu hiện tại"
          >
            <RotateCcw size={19} />
          </button>

          <button
            className="listening-control-button primary"
            onClick={handlePlayPause}
            title={
              playing && !paused ? "Tạm dừng" : "Phát"
            }
          >
            {playing && !paused ? (
              <Pause size={23} />
            ) : (
              <Play size={23} />
            )}
          </button>

          <button
            className="listening-control-button secondary"
            onClick={handleNext}
            disabled={currentIndex >= totalSentences - 1}
            title="Câu tiếp theo"
          >
            <SkipForward size={20} />
          </button>
        </div>

        <div className="listening-player-status">
          {playing
            ? paused
              ? "Đang tạm dừng"
              : "Đang phát tự động các câu trong Unit..."
            : completedRounds > 0
              ? `Đã hoàn thành ${completedRounds} lượt nghe`
              : "Nhấn nút Phát để nghe toàn bộ Unit"}
        </div>

        {error && (
          <p className="listening-inline-error">{error}</p>
        )}

        <p className="listening-repeat-note">
          Chế độ hiện tại:{" "}
          <strong>{repeatLabel[repeatMode]}</strong>
        </p>
      </div>
    </div>
  );
}

export default Listening;
