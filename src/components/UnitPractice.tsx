
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Volume2,
  Pause,
  Play,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import type { Unit } from "../types/unit";
import "./UnitPractice.css";

interface UnitPracticeProps {
  unit: Unit;
  onBack: () => void;
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"“”‘’]/g, "")
    .replace(/\s+/g, " ");
}

const START_DELAY = 250;

function UnitPractice({ unit, onBack }: UnitPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerTouched, setAnswerTouched] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [voiceType, setVoiceType] = useState<"US" | "UK">("US");
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [audioMessage, setAudioMessage] = useState("");

  const runIdRef = useRef(0);
  const delayTimerRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  const sentence = unit.sentences[currentIndex];

  const isCorrect =
    answer.trim().length > 0 &&
    normalizeText(answer) === normalizeText(sentence?.english ?? "");

  const clearDelay = () => {
    if (delayTimerRef.current !== null) {
      window.clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  };

  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      runIdRef.current += 1;
      playingRef.current = false;
      clearDelay();
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    setAnswer("");
    setShowAnswer(false);
    setAnswerTouched(false);
    setPlaying(false);
    setPaused(false);
    setAudioMessage("");

    playingRef.current = false;
    runIdRef.current += 1;
    clearDelay();
    window.speechSynthesis.cancel();
  }, [currentIndex]);

  function stopAudio() {
    runIdRef.current += 1;
    playingRef.current = false;
    clearDelay();

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setPlaying(false);
    setPaused(false);
  }

  function playAnswer() {
    if (!("speechSynthesis" in window)) {
      setAudioMessage("Trình duyệt không hỗ trợ phát âm thanh.");
      return;
    }

    if (paused) {
      window.speechSynthesis.resume();
      playingRef.current = true;
      setPaused(false);
      setPlaying(true);
      setAudioMessage("Đang tiếp tục phát âm thanh...");
      return;
    }

    if (!sentence?.english?.trim()) {
      setAudioMessage("Câu này chưa có nội dung tiếng Anh.");
      return;
    }

    // Hủy lượt đọc cũ và tạo mã mới.
    runIdRef.current += 1;
    const currentRunId = runIdRef.current;

    playingRef.current = false;
    clearDelay();
    window.speechSynthesis.cancel();

    setPlaying(false);
    setPaused(false);
    setAudioMessage("Đang chuẩn bị phát...");

    // Chờ trình duyệt giải phóng hàng đợi TTS.
    delayTimerRef.current = window.setTimeout(() => {
      delayTimerRef.current = null;

      if (currentRunId !== runIdRef.current) return;

      const utterance = new SpeechSynthesisUtterance(
        `"A" ${sentence.english.trim()}`
      );

      const language = voiceType === "US" ? "en-US" : "en-GB";

      const preferredVoice =
        voicesRef.current.find(
          (voice) => voice.lang.toLowerCase() === language.toLowerCase()
        ) ||
        voicesRef.current.find((voice) =>
          voice.lang.toLowerCase().startsWith(language.slice(0, 2))
        );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.lang = language;
      utterance.rate = speed;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        if (currentRunId !== runIdRef.current) return;

        playingRef.current = true;
        setPlaying(true);
        setPaused(false);
        setAudioMessage("Đang phát âm thanh...");
      };

      utterance.onend = () => {
        if (currentRunId !== runIdRef.current) return;

        playingRef.current = false;
        setPlaying(false);
        setPaused(false);
        setAudioMessage("Đã phát xong.");
      };

      utterance.onerror = (event) => {
        if (currentRunId !== runIdRef.current) return;

        if (
          event.error === "canceled" ||
          event.error === "interrupted"
        ) {
          return;
        }

        playingRef.current = false;
        setPlaying(false);
        setPaused(false);
        setAudioMessage("Không thể phát âm thanh. Bạn hãy thử lại.");
      };

      playingRef.current = true;
      window.speechSynthesis.speak(utterance);
    }, START_DELAY);
  }

  function pauseAudio() {
    if (
      "speechSynthesis" in window &&
      window.speechSynthesis.speaking
    ) {
      window.speechSynthesis.pause();
      setPaused(true);
      setPlaying(false);
      setAudioMessage("Đã tạm dừng.");
    }
  }

  function handleAnswerChange(value: string) {
    setAnswer(value);
    setAnswerTouched(false);
  }

  function goToPrevious() {
    if (currentIndex > 0) {
      stopAudio();
      setCurrentIndex((index) => index - 1);
    }
  }

  function goToNext() {
    if (currentIndex < unit.sentences.length - 1) {
      stopAudio();
      setCurrentIndex((index) => index + 1);
    }
  }

  function resetAnswer() {
    setAnswer("");
    setAnswerTouched(false);
    setShowAnswer(false);
  }

  if (!sentence) {
    return <div className="practice-message">Unit này chưa có câu hỏi.</div>;
  }

  return (
    <div className="practice-page">
      {/* HEADER */}
      <div className="practice-topbar">
        <button className="practice-back-button" onClick={() => {
          stopAudio();
          onBack();
        }}>
          <ArrowLeft size={18} />
          Danh sách Unit
        </button>

        <div className="practice-unit-title">
          <span>UNIT {String(unit.unitNumber).padStart(2, "0")}</span>
          <h2>{unit.title}</h2>
        </div>
      </div>

      {/* PROGRESS */}
      <div className="practice-progress-card">
        <div className="practice-progress-info">
          <span>Tiến độ luyện tập</span>
          <strong>
            {currentIndex + 1} / {unit.sentences.length}
          </strong>
        </div>

        <div className="practice-progress-track">
          <div
            className="practice-progress-fill"
            style={{
              width: `${
                ((currentIndex + 1) / unit.sentences.length) * 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* 1. AUDIO */}
      <div className="practice-audio">
        <div className="practice-audio-heading">
          <div className="practice-audio-icon">
            <Volume2 size={22} />
          </div>

          <div>
            <strong>1. Nghe đáp án tiếng Anh</strong>
            <p>Nghe kỹ câu tiếng Anh trước khi thực hành dịch.</p>
          </div>
        </div>

        <div className="practice-audio-controls">
          <button
            className="practice-play-button"
            onClick={playing ? pauseAudio : playAnswer}
            title={playing ? "Tạm dừng" : "Nghe đáp án"}
          >
            {playing ? <Pause size={22} /> : <Play size={22} />}
          </button>

          <span className="practice-audio-status">
            {audioMessage || "Nhấn nút để nghe câu tiếng Anh"}
          </span>

          <button
            className="practice-replay-button"
            onClick={playAnswer}
            title="Nghe lại từ đầu"
          >
            <RotateCcw size={18} />
            Nghe lại
          </button>
        </div>

        <div className="practice-audio-settings">
          <div>
            <label htmlFor="voice-type">Giọng đọc</label>
            <select
              id="voice-type"
              value={voiceType}
              onChange={(event) => {
                stopAudio();
                setVoiceType(event.target.value as "US" | "UK");
              }}
            >
              <option value="US">English (US)</option>
              <option value="UK">English (UK)</option>
            </select>
          </div>

          <div>
            <label>Tốc độ đọc</label>
            <div className="practice-speed-options">
              {[0.5, 0.8, 1, 1.25, 1.5, 2].map((value) => (
                <button
                  key={value}
                  className={speed === value ? "active" : ""}
                  onClick={() => {
                    stopAudio();
                    setSpeed(value);
                  }}
                >
                  {value}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. VIETNAMESE SENTENCE */}
      <div className="practice-question-card">
        <div className="practice-section-label">
          <span>2. CÂU TIẾNG VIỆT</span>
          <span className="practice-question-number">
            Câu {currentIndex + 1}
          </span>
        </div>

        <div className="practice-vietnamese">
          {sentence.vietnamese}
        </div>
      </div>

      {/* 3. ENGLISH ANSWER INPUT */}
      <div className="practice-question-card">
        <div className="practice-section-label">
          <span>3. NHẬP CÂU TIẾNG ANH</span>
        </div>

        <div className="practice-answer-section">
          <label htmlFor="english-answer">
            Hãy dịch câu tiếng Việt sang tiếng Anh
          </label>

          <textarea
            id="english-answer"
            value={answer}
            onChange={(event) => handleAnswerChange(event.target.value)}
            onBlur={() => {
              if (answer.trim()) {
                setAnswerTouched(true);
              }
            }}
            placeholder="Type your English answer here..."
            rows={3}
            className={
              isCorrect
                ? "answer-correct"
                : answerTouched && answer.trim()
                  ? "answer-incorrect"
                  : ""
            }
          />

          {answer.trim() && isCorrect && (
            <div className="practice-result correct">
              <CheckCircle2 size={20} />
              Chính xác! Bạn làm rất tốt.
            </div>
          )}

          {answer.trim() && !isCorrect && answerTouched && (
            <div className="practice-result incorrect">
              <XCircle size={20} />
              Chưa chính xác. Bạn hãy kiểm tra lại câu trả lời nhé.
            </div>
          )}

          <div className="practice-actions">
            <button
              className="practice-show-button"
              onClick={() => setShowAnswer((value) => !value)}
            >
              {showAnswer ? <EyeOff size={18} /> : <Eye size={18} />}
              {showAnswer ? "Ẩn đáp án" : "Xem đáp án"}
            </button>

            <button
              className="practice-reset-button"
              onClick={resetAnswer}
              title="Làm lại"
            >
              <RotateCcw size={18} />
              Làm lại
            </button>
          </div>
        </div>
      </div>

      {/* ANSWER DETAILS */}
      {showAnswer && (
        <div className="practice-detail-card">
          <div className="practice-detail-heading">
            <div>
              <span>ĐÁP ÁN TIẾNG ANH</span>
              <h3>{sentence.english}</h3>
            </div>
          </div>

          {sentence.ipa && (
            <div className="practice-ipa">
              <span>PHIÊN ÂM IPA</span>
              <p>{sentence.ipa}</p>
            </div>
          )}

          {sentence.vocabulary && (
            <div className="practice-vocabulary">
              <span>TỪ VỰNG GỢI Ý</span>
              <p>{sentence.vocabulary}</p>
            </div>
          )}
        </div>
      )}

      {/* NAVIGATION */}
      <div className="practice-navigation">
        <button
          className="practice-nav-button"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
        >
          <ArrowLeft size={18} />
          Câu trước
        </button>

        <span>
          {currentIndex + 1} / {unit.sentences.length}
        </span>

        <button
          className="practice-nav-button next"
          onClick={goToNext}
          disabled={currentIndex === unit.sentences.length - 1}
        >
          Câu tiếp theo
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default UnitPractice;
