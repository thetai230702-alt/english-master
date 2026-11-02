import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Volume2, Pause, Play, Eye, EyeOff,
  CheckCircle2, XCircle, RotateCcw, SkipForward,
} from "lucide-react";
import type { Unit } from "../types/unit";
import "./UnitPractice.css";

interface UnitPracticeProps {
  unit: Unit;
  onBack: () => void;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
    .replace(/[.,!?;:'"“”‘’]/g, "")
    .replace(/\s+/g, " ");
}

const START_DELAY = 180;
const SPEEDS = [0.5, 0.8, 1, 1.25, 1.5, 2];

function UnitPractice({ unit, onBack }: UnitPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [checked, setChecked] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [voiceType, setVoiceType] = useState<"US" | "UK">("US");
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [audioMessage, setAudioMessage] = useState("");

  const runIdRef = useRef(0);
  const delayTimerRef = useRef<number | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const sentence = unit.sentences[currentIndex];
  const total = unit.sentences.length;
  const isCorrect = answer.trim().length > 0 &&
    normalizeText(answer) === normalizeText(sentence?.english ?? "");

  function clearDelay() {
    if (delayTimerRef.current !== null) {
      window.clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    loadVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
    return () => {
      runIdRef.current += 1;
      clearDelay();
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener?.("voiceschanged", loadVoices);
    };
  }, []);

  useEffect(() => {
    setAnswer("");
    setShowAnswer(false);
    setChecked(false);
    setPlaying(false);
    setPaused(false);
    setAudioMessage("");
    runIdRef.current += 1;
    clearDelay();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, [currentIndex, unit.unitNumber]);

  function stopAudio() {
    runIdRef.current += 1;
    clearDelay();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
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
      setPaused(false);
      setPlaying(true);
      setAudioMessage("Đang tiếp tục phát...");
      return;
    }
    if (!sentence?.english?.trim()) {
      setAudioMessage("Câu này chưa có nội dung tiếng Anh.");
      return;
    }

    runIdRef.current += 1;
    const runId = runIdRef.current;
    clearDelay();
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    setAudioMessage("Đang chuẩn bị phát...");

    delayTimerRef.current = window.setTimeout(() => {
      delayTimerRef.current = null;
      if (runId !== runIdRef.current) return;
      const utterance = new SpeechSynthesisUtterance(sentence.english.trim());
      const language = voiceType === "US" ? "en-US" : "en-GB";
      const exactVoice = voicesRef.current.find(
        voice => voice.lang.toLowerCase() === language.toLowerCase()
      );
      const regionalVoice = voicesRef.current.find(
        voice => voice.lang.toLowerCase().startsWith(language.slice(0, 2))
      );
      utterance.voice = exactVoice || regionalVoice || null;
      utterance.lang = language;
      utterance.rate = speed;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onstart = () => {
        if (runId !== runIdRef.current) return;
        setPlaying(true);
        setPaused(false);
        setAudioMessage(`Đang phát · English (${voiceType})`);
      };
      utterance.onend = () => {
        if (runId !== runIdRef.current) return;
        setPlaying(false);
        setPaused(false);
        setAudioMessage("Đã phát xong.");
      };
      utterance.onerror = event => {
        if (runId !== runIdRef.current) return;
        if (event.error === "canceled" || event.error === "interrupted") return;
        setPlaying(false);
        setPaused(false);
        setAudioMessage("Không thể phát âm thanh. Bạn hãy thử lại.");
      };
      window.speechSynthesis.speak(utterance);
    }, START_DELAY);
  }

  function pauseAudio() {
    if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setPaused(true);
      setPlaying(false);
      setAudioMessage("Đã tạm dừng.");
    }
  }

  function goTo(index: number) {
    if (index < 0 || index >= total) return;
    stopAudio();
    setCurrentIndex(index);
  }

  function resetAnswer() {
    setAnswer("");
    setChecked(false);
    setShowAnswer(false);
  }

  function skipQuestion() {
    if (currentIndex < total - 1) goTo(currentIndex + 1);
    else setAudioMessage("Bạn đã đến câu cuối cùng của Unit.");
  }

  if (!sentence) return <div className="practice-message">Unit này chưa có câu hỏi.</div>;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  return (
    <div className="practice-page">
      <div className="practice-topbar">
        <button className="practice-back-button" type="button" onClick={() => {
          stopAudio();
          onBack();
        }}>
          <ArrowLeft size={18} /> Danh sách Unit
        </button>
        <div className="practice-unit-title">
          <span>UNIT {String(unit.unitNumber).padStart(2, "0")}</span>
          <h2>{unit.title}</h2>
        </div>
      </div>

      <div className="practice-progress-card">
        <div className="practice-progress-info">
          <span>Tiến độ luyện tập</span>
          <strong>{currentIndex + 1} / {total}</strong>
        </div>
        <div className="practice-progress-track" role="progressbar"
          aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={total}>
          <div className="practice-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <section className="practice-combined-card">
        <div className="practice-combined-heading">
          <div className="practice-vietnamese">{sentence.vietnamese}</div>
          <span className="practice-answer-language">English</span>
        </div>

        <div className="practice-audio-row">
          <div className="practice-audio-label">
            <Volume2 size={18} />
            <span>Nghe câu mẫu</span>
          </div>
          <button className="practice-play-button" type="button"
            onClick={playing ? pauseAudio : playAnswer}
            title={playing ? "Tạm dừng" : paused ? "Tiếp tục phát" : "Nghe câu mẫu"}
            aria-label={playing ? "Tạm dừng" : paused ? "Tiếp tục phát" : "Nghe câu mẫu"}>
            {playing ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <label className="practice-select-wrap" aria-label="Giọng đọc">
            <select value={voiceType} onChange={event => {
              stopAudio();
              setVoiceType(event.target.value as "US" | "UK");
            }}>
              <option value="US">English (US)</option>
              <option value="UK">English (UK)</option>
            </select>
          </label>
          <label className="practice-select-wrap practice-speed-select" aria-label="Tốc độ đọc">
            <select value={speed} onChange={event => {
              stopAudio();
              setSpeed(Number(event.target.value));
            }}>
              {SPEEDS.map(value => <option key={value} value={value}>{value}x</option>)}
            </select>
          </label>
          <span className="practice-audio-status" aria-live="polite">{audioMessage}</span>
        </div>

        <div className="practice-answer-section">
          <textarea id="english-answer" value={answer}
            onChange={event => {
              setAnswer(event.target.value);
              setChecked(false);
            }}
            onKeyDown={event => {
              if ((event.ctrlKey || event.metaKey) && event.key === "Enter") setChecked(true);
            }}
            placeholder="Type your English answer here..." rows={3}
            aria-label="Your English translation"
            className={answer.trim() ? (isCorrect ? "answer-correct" : checked ? "answer-incorrect" : "") : ""} />

          {checked && !answer.trim() && (
            <div className="practice-result incorrect">
              <XCircle size={19} /> Bạn hãy nhập câu trả lời trước khi kiểm tra.
            </div>
          )}
          {answer.trim() && isCorrect && (
            <div className="practice-result correct">
              <CheckCircle2 size={19} /> Chính xác! Bạn làm rất tốt.
            </div>
          )}
          {checked && answer.trim() && !isCorrect && (
            <div className="practice-result incorrect">
              <XCircle size={19} /> Chưa khớp hoàn toàn. Hãy thử lại hoặc xem đáp án mẫu.
            </div>
          )}

          <div className="practice-actions">
            <button className="practice-check-button" type="button" onClick={() => setChecked(true)}>
              <CheckCircle2 size={18} /> Kiểm tra đáp án
            </button>
            <button className="practice-skip-button" type="button" onClick={skipQuestion}>
              <SkipForward size={18} /> Bỏ qua
            </button>
            <button className="practice-reset-button" type="button" onClick={resetAnswer}>
              <RotateCcw size={17} /> Làm lại
            </button>
            <button className="practice-show-button" type="button"
              onClick={() => setShowAnswer(value => !value)}>
              {showAnswer ? <EyeOff size={17} /> : <Eye size={17} />}
              {showAnswer ? "Ẩn đáp án" : "Xem đáp án"}
            </button>
          </div>
        </div>

        {showAnswer && (
          <div className="practice-inline-answer">
            <span>ĐÁP ÁN TIẾNG ANH THAM KHẢO</span>
            <h3>{sentence.english}</h3>
            {sentence.ipa && <p><strong>IPA:</strong> {sentence.ipa}</p>}
            {sentence.vocabulary && <p><strong>Từ vựng:</strong> {sentence.vocabulary}</p>}
          </div>
        )}
      </section>

      <div className="practice-navigation">
        <button className="practice-nav-button" type="button"
          onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
          <ArrowLeft size={18} /> Câu trước
        </button>
        <span>{currentIndex + 1} / {total}</span>
        <button className="practice-nav-button next" type="button"
          onClick={() => goTo(currentIndex + 1)} disabled={currentIndex === total - 1}>
          Câu tiếp theo <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default UnitPractice;
