import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Volume2, Pause, Play, Eye, EyeOff,
  CheckCircle2, XCircle, RotateCcw, SkipForward,
} from "lucide-react";
import type { Unit } from "../types/unit";
import { recordCheckedSentence as recordStudyAttempt } from "../services/studyGoals";
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
const CHECKLIST_STORAGE_KEY = "english-master-checklist";
const PRACTICE_PROGRESS_KEY = "ntt-unit-practice-progress-v1";

function updateChecklistStatus(unitNumber: number, status: "Đang học" | "Đã học") {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const entries = Array.isArray(parsed) ? parsed : [];
    const next = Array.from({ length: 50 }, (_, index) => {
      const id = index + 1;
      const current = entries.find(
        (entry: unknown) =>
          typeof entry === "object" &&
          entry !== null &&
          "id" in entry &&
          (entry as { id?: unknown }).id === id
      ) as Record<string, unknown> | undefined;
      return {
        id,
        topic: typeof current?.topic === "string" ? current.topic : "",
        status: id === unitNumber ? status : current?.status ?? "Chưa học",
        date: typeof current?.date === "string" ? current.date : "",
        exercise: current?.exercise === true,
        review: current?.review === true,
        note: typeof current?.note === "string" ? current.note : "",
      };
    });
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("ntt-learning-progress-local-updated"));
  } catch {
    // Keep the practice flow working even if browser storage is unavailable.
  }
}


function saveUnitPracticeProgress(unitNumber: number, results: Record<number, boolean>) {
  try {
    const raw = localStorage.getItem(PRACTICE_PROGRESS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const all = parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown> : {};
    all[String(unitNumber)] = results;
    localStorage.setItem(PRACTICE_PROGRESS_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent("ntt-unit-progress-updated"));
    window.dispatchEvent(new CustomEvent("ntt-learning-progress-local-updated"));
  } catch { /* Keep practice available if storage is unavailable. */ }
}

function readUnitPracticeProgress(unitNumber: number): Record<number, boolean> {
  try {
    const raw = localStorage.getItem(PRACTICE_PROGRESS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const value = (parsed as Record<string, unknown>)[String(unitNumber)];
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<number, boolean> : {};
  } catch { return {}; }
}

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
  const [checkedResults, setCheckedResults] = useState<Record<number, boolean>>(() => readUnitPracticeProgress(unit.unitNumber));
  const [showSummary, setShowSummary] = useState(false);

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
    setCheckedResults(readUnitPracticeProgress(unit.unitNumber));
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

  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;
  const attemptedCount = Object.keys(checkedResults).length;
  const correctCount = Object.values(checkedResults).filter(Boolean).length;
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  useEffect(() => {
    if (total > 0) updateChecklistStatus(unit.unitNumber, "Đang học");
  }, [unit.unitNumber, total]);

  useEffect(() => {
    if (showSummary && attemptedCount === total && total > 0) {
      updateChecklistStatus(unit.unitNumber, "Đã học");
    }
  }, [showSummary, attemptedCount, total, unit.unitNumber]);

  if (!sentence) return <div className="practice-message">Unit này chưa có câu hỏi.</div>;

  function handleCheck() {
    setChecked(true);
    if (answer.trim()) {
      if (!Object.prototype.hasOwnProperty.call(checkedResults, currentIndex)) {
        recordStudyAttempt();
      }
      setCheckedResults((current) => {
        const next = { ...current, [currentIndex]: isCorrect };
        saveUnitPracticeProgress(unit.unitNumber, next);
        return next;
      });
    }
  }

  function restartUnit() {
    stopAudio();
    setCurrentIndex(0);
    setCheckedResults({});
    saveUnitPracticeProgress(unit.unitNumber, {});
    setShowSummary(false);
  }

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
          <div className="practice-progress-labels">
            <span>Tiến độ luyện tập</span>
            <small>{attemptedCount} câu đã kiểm tra · {correctCount} câu chính xác</small>
          </div>
          <strong>{currentIndex + 1} / {total}</strong>
        </div>
        <div className="practice-progress-track" role="progressbar"
          aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={total}>
          <div className="practice-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <nav className="practice-question-map" aria-label="Chọn câu luyện tập">
        <div className="practice-question-map-heading">
          <span>TIẾN ĐỘ CÂU HỎI</span>
          <small>{attemptedCount}/{total} đã kiểm tra</small>
        </div>
        <div className="practice-question-map-list">
          {unit.sentences.map((item, index) => {
            const result = checkedResults[index];
            const current = index === currentIndex;
            return (
              <button
                key={item.id ?? index}
                type="button"
                className={`practice-question-dot ${current ? "current" : ""} ${result === true ? "correct" : result === false ? "incorrect" : ""}`}
                onClick={() => goTo(index)}
                aria-label={`Đến câu ${index + 1}${result === true ? ", chính xác" : result === false ? ", cần xem lại" : ""}`}
                aria-current={current ? "step" : undefined}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </nav>

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
            <button className="practice-check-button" type="button" onClick={handleCheck}>
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
          onClick={() => currentIndex === total - 1 ? setShowSummary(true) : goTo(currentIndex + 1)}>
          {currentIndex === total - 1 ? "Tổng kết Unit" : "Câu tiếp theo"}
          {currentIndex === total - 1 ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
        </button>
      </div>

      {showSummary && (
        <div className="practice-summary-backdrop" role="presentation">
          <section className="practice-summary-modal" role="dialog" aria-modal="true" aria-labelledby="practice-summary-title">
            <div className="practice-summary-icon"><CheckCircle2 size={27}/></div>
            <span className="practice-summary-eyebrow">UNIT COMPLETION</span>
            <h2 id="practice-summary-title">Bạn đã đi hết Unit này!</h2>
            <p>Đây là kết quả luyện tập trong phiên hiện tại.</p>
            <div className="practice-summary-score">
              <strong>{accuracy}%</strong>
              <span>Tỷ lệ chính xác</span>
            </div>
            <div className="practice-summary-stats">
              <div><strong>{total}</strong><span>Tổng số câu</span></div>
              <div><strong>{attemptedCount}</strong><span>Đã kiểm tra</span></div>
              <div><strong>{correctCount}</strong><span>Chính xác</span></div>
            </div>
            <div className="practice-summary-actions">
              <button type="button" className="practice-summary-secondary" onClick={() => setShowSummary(false)}>Xem lại câu hỏi</button>
              <button type="button" className="practice-summary-primary" onClick={restartUnit}><RotateCcw size={15}/> Luyện lại Unit</button>
              <button type="button" className="practice-summary-primary" onClick={() => { stopAudio(); setShowSummary(false); onBack(); }}>Về danh sách Unit</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default UnitPractice;
