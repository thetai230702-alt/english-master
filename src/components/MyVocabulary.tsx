
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  BookPlus,
  Volume2,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Layers,
  Keyboard,
  ListChecks,
  BookOpen,
  ArrowLeft,
  Search,
} from "lucide-react";

import { auth, db } from "../firebase";
import "./MyVocabulary.css";

type StudyMode = "flashcard" | "typing" | "quiz";

interface VocabularyTopic {
  id: string;
  name: string;
  description: string;
  createdAt?: unknown;
}

interface VocabularyWord {
  id: string;
  english: string;
  ipa: string;
  meaning: string;
  remembered: boolean;
}

const COLORS = {
  primary: "#6656d9",
  primaryLight: "#f0edff",
  text: "#20243a",
  muted: "#777d91",
  border: "#e8e9f1",
  background: "#f8f9fd",
  green: "#16a36a",
  red: "#e05260",
};

const buttonStyle = (
  background: string,
  color = "#ffffff"
): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "10px 15px",
  border: "none",
  borderRadius: 11,
  background,
  color,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 11,
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
  background: "#ffffff",
  color: COLORS.text,
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 16,
  padding: 20,
};

function MyVocabulary() {
  const user = auth.currentUser;

  const [topics, setTopics] = useState<VocabularyTopic[]>([]);
  const [selectedTopic, setSelectedTopic] =
    useState<VocabularyTopic | null>(null);

  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [topicName, setTopicName] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  const [english, setEnglish] = useState("");
  const [ipa, setIpa] = useState("");
  const [meaning, setMeaning] = useState("");
  const [editingWordId, setEditingWordId] = useState<string | null>(null);

  const [bulkText, setBulkText] = useState("");
  const [showBulkForm, setShowBulkForm] = useState(false);

  const [search, setSearch] = useState("");
  const [studyMode, setStudyMode] = useState<StudyMode>("flashcard");
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showStudy, setShowStudy] = useState(false);

  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState("");
  const [quizResult, setQuizResult] = useState<boolean | null>(null);

  const userId = user?.uid;

  const topicCollection = useMemo(() => {
    if (!userId) return null;
    return collection(db, "users", userId, "vocabularyTopics");
  }, [userId]);

  // Theo dõi danh sách chủ đề của tài khoản hiện tại
  useEffect(() => {
    if (!topicCollection) {
      setTopics([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const topicQuery = query(topicCollection, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      topicQuery,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          name: item.data().name ?? "",
          description: item.data().description ?? "",
          createdAt: item.data().createdAt,
        }));

        setTopics(data);
        setLoading(false);
      },
      (err) => {
        console.error("Lỗi tải chủ đề:", err);
        setError("Không thể tải chủ đề. Vui lòng kiểm tra Firestore Rules.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [topicCollection]);

  // Theo dõi từ vựng trong chủ đề đang chọn
  useEffect(() => {
    if (!userId || !selectedTopic) {
      setWords([]);
      return;
    }

    const wordsRef = collection(
      db,
      "users",
      userId,
      "vocabularyTopics",
      selectedTopic.id,
      "words"
    );

    const unsubscribe = onSnapshot(
      query(wordsRef, orderBy("english", "asc")),
      (snapshot) => {
        const data: VocabularyWord[] = snapshot.docs.map((item) => ({
          id: item.id,
          english: item.data().english ?? "",
          ipa: item.data().ipa ?? "",
          meaning: item.data().meaning ?? "",
          remembered: item.data().remembered ?? false,
        }));

        setWords(data);
      },
      (err) => {
        console.error("Lỗi tải từ vựng:", err);
        setError("Không thể tải từ vựng của chủ đề này.");
      }
    );

    return unsubscribe;
  }, [userId, selectedTopic]);

  const wordsRef = useMemo(() => {
    if (!userId || !selectedTopic) return null;

    return collection(
      db,
      "users",
      userId,
      "vocabularyTopics",
      selectedTopic.id,
      "words"
    );
  }, [userId, selectedTopic]);

  const resetWordForm = () => {
    setEnglish("");
    setIpa("");
    setMeaning("");
    setEditingWordId(null);
  };

  const resetTopicForm = () => {
    setTopicName("");
    setTopicDescription("");
    setEditingTopicId(null);
    setShowTopicForm(false);
  };

  // Tạo hoặc cập nhật chủ đề
  const saveTopic = async () => {
    if (!topicCollection || !topicName.trim()) {
      setError("Vui lòng nhập tên chủ đề.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingTopicId) {
        await updateDoc(doc(topicCollection, editingTopicId), {
          name: topicName.trim(),
          description: topicDescription.trim(),
          updatedAt: serverTimestamp(),
        });

        setSelectedTopic((current) =>
          current?.id === editingTopicId
            ? {
                ...current,
                name: topicName.trim(),
                description: topicDescription.trim(),
              }
            : current
        );
      } else {
        await addDoc(topicCollection, {
          name: topicName.trim(),
          description: topicDescription.trim(),
          createdAt: serverTimestamp(),
        });
      }

      resetTopicForm();
    } catch (err) {
      console.error(err);
      setError("Không thể lưu chủ đề. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const editTopic = (topic: VocabularyTopic) => {
    setTopicName(topic.name);
    setTopicDescription(topic.description);
    setEditingTopicId(topic.id);
    setShowTopicForm(true);
  };

  // Xóa chủ đề và toàn bộ từ bên trong
  const removeTopic = async (topic: VocabularyTopic) => {
    if (!userId) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa chủ đề "${topic.name}" không? Toàn bộ từ vựng trong chủ đề cũng sẽ bị xóa.`
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      const topicWordsRef = collection(
        db,
        "users",
        userId,
        "vocabularyTopics",
        topic.id,
        "words"
      );

      const snapshot = await getDocs(topicWordsRef);

      // Firestore không tự xóa collection con khi xóa tài liệu cha.
      // Vì vậy cần xóa từng từ trước.
      for (const wordDoc of snapshot.docs) {
        await deleteDoc(wordDoc.ref);
      }

      await deleteDoc(
        doc(db, "users", userId, "vocabularyTopics", topic.id)
      );

      if (selectedTopic?.id === topic.id) {
        setSelectedTopic(null);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể xóa chủ đề. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // Thêm hoặc cập nhật một từ
  const saveWord = async () => {
    if (!wordsRef) return;

    if (!english.trim() || !meaning.trim()) {
      setError("Vui lòng nhập từ tiếng Anh và nghĩa tiếng Việt.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const data = {
        english: english.trim(),
        ipa: ipa.trim(),
        meaning: meaning.trim(),
      };

      if (editingWordId) {
        await updateDoc(doc(wordsRef, editingWordId), data);
      } else {
        await addDoc(wordsRef, {
          ...data,
          remembered: false,
          createdAt: serverTimestamp(),
        });
      }

      resetWordForm();
    } catch (err) {
      console.error(err);
      setError("Không thể lưu từ vựng. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const editWord = (word: VocabularyWord) => {
    setEnglish(word.english);
    setIpa(word.ipa);
    setMeaning(word.meaning);
    setEditingWordId(word.id);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeWord = async (word: VocabularyWord) => {
    if (!wordsRef) return;

    if (!window.confirm(`Xóa từ "${word.english}"?`)) return;

    try {
      await deleteDoc(doc(wordsRef, word.id));
    } catch (err) {
      console.error(err);
      setError("Không thể xóa từ vựng.");
    }
  };

  // Nhập hàng loạt: English | IPA | Nghĩa tiếng Việt
  const importBulkWords = async () => {
    if (!wordsRef || !bulkText.trim()) return;

    const lines = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const parsed = lines
      .map((line) => {
        const parts = line.split("|").map((part) => part.trim());

        return {
          english: parts[0] ?? "",
          ipa: parts[1] ?? "",
          meaning: parts.slice(2).join(" | "),
        };
      })
      .filter((item) => item.english && item.meaning);

    if (parsed.length === 0) {
      setError("Không tìm thấy dòng hợp lệ. Hãy kiểm tra định dạng nhập.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Chia lô nhỏ để tránh giới hạn số thao tác trong một batch.
      for (let i = 0; i < parsed.length; i += 400) {
        const batchItems = parsed.slice(i, i + 400);

        await Promise.all(
          batchItems.map((item) =>
            addDoc(wordsRef, {
              ...item,
              remembered: false,
              createdAt: serverTimestamp(),
            })
          )
        );
      }

      setBulkText("");
      setShowBulkForm(false);
    } catch (err) {
      console.error(err);
      setError("Có lỗi khi nhập từ. Vui lòng kiểm tra lại dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  const toggleRemembered = async (word: VocabularyWord) => {
    if (!wordsRef) return;

    try {
      await updateDoc(doc(wordsRef, word.id), {
        remembered: !word.remembered,
      });
    } catch (err) {
      console.error(err);
      setError("Không thể cập nhật tiến độ học.");
    }
  };

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      setError("Trình duyệt của bạn không hỗ trợ phát âm.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const americanVoice = voices.find(
      (voice) => voice.lang === "en-US"
    );

    if (americanVoice) utterance.voice = americanVoice;

    window.speechSynthesis.speak(utterance);
  }, []);

  const filteredWords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return words;

    return words.filter(
      (word) =>
        word.english.toLowerCase().includes(keyword) ||
        word.meaning.toLowerCase().includes(keyword)
    );
  }, [words, search]);

  const studyWords = useMemo(
    () => words,
    [words]
  );

  const currentWord = studyWords[studyIndex];

  const nextWord = () => {
    setStudyIndex((index) =>
      studyWords.length ? (index + 1) % studyWords.length : 0
    );
    setFlipped(false);
    setAnswer("");
    setChecked(false);
    setSelectedChoice("");
    setQuizResult(null);
  };

  const previousWord = () => {
    setStudyIndex((index) =>
      studyWords.length
        ? (index - 1 + studyWords.length) % studyWords.length
        : 0
    );
    setFlipped(false);
    setAnswer("");
    setChecked(false);
    setSelectedChoice("");
    setQuizResult(null);
  };

  const shuffleStudy = () => {
    setStudyIndex(Math.floor(Math.random() * studyWords.length));
    setFlipped(false);
    setAnswer("");
    setChecked(false);
    setSelectedChoice("");
    setQuizResult(null);
  };

  const checkTypingAnswer = () => {
    setChecked(true);
  };

  const isTypingCorrect =
    currentWord &&
    answer.trim().toLowerCase() ===
      currentWord.english.trim().toLowerCase();

  const quizChoices = useMemo(() => {
    if (!currentWord) return [];

    const others = studyWords.filter(
      (word) => word.id !== currentWord.id
    );

    const shuffled = [...others].sort(() => Math.random() - 0.5);
    const options = [currentWord, ...shuffled.slice(0, 3)];

    return options.sort(() => Math.random() - 0.5);
  }, [currentWord, studyWords]);

  const selectQuizChoice = (choice: string) => {
    if (quizResult !== null || !currentWord) return;

    setSelectedChoice(choice);
    setQuizResult(
      choice.trim().toLowerCase() ===
        currentWord.english.trim().toLowerCase()
    );
  };

  const rememberedCount = words.filter((word) => word.remembered).length;

  if (!user) {
    return (
      <div className="mv-card mv-login-card" style={{ ...cardStyle, textAlign: "center", margin: 20 }}>
        <BookPlus size={36} color={COLORS.primary} />
        <h2>Vui lòng đăng nhập</h2>
        <p style={{ color: COLORS.muted }}>
          Bạn cần đăng nhập để sử dụng không gian từ vựng cá nhân.
        </p>
      </div>
    );
  }

  return (
    <div className="my-vocabulary"
      style={{
        maxWidth: 1150,
        margin: "0 auto",
        padding: "24px 20px 50px",
        color: COLORS.text,
      }}
    >
      <div className="mv-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 25,
        }}
      >
        <div className="mv-header-icon"
          style={{
            width: 52,
            height: 52,
            borderRadius: 15,
            background: COLORS.primaryLight,
            color: COLORS.primary,
            display: "grid",
            placeItems: "center",
          }}
        >
          <BookPlus size={27} />
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: 25 }}>
            Từ vựng của tôi
          </h1>
          <p style={{ margin: "5px 0 0", color: COLORS.muted }}>
            Tạo bộ từ vựng riêng và học theo cách của bạn.
          </p>
        </div>
      </div>

      {error && (
        <div className="mv-error"
          style={{
            padding: 13,
            marginBottom: 16,
            borderRadius: 10,
            background: "#fff0f0",
            color: COLORS.red,
            fontSize: 13,
          }}
        >
          {error}
          <button
            onClick={() => setError("")}
            style={{
              float: "right",
              border: 0,
              background: "transparent",
              cursor: "pointer",
              color: COLORS.red,
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {!selectedTopic ? (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 19 }}>
                Chủ đề của bạn
              </h2>
              <p style={{ color: COLORS.muted, fontSize: 13 }}>
                {topics.length} chủ đề từ vựng
              </p>
            </div>

            <button
              style={buttonStyle(COLORS.primary)}
              onClick={() => {
                resetTopicForm();
                setShowTopicForm(true);
              }}
            >
              <Plus size={17} />
              Tạo chủ đề mới
            </button>
          </div>

          {showTopicForm && (
            <div className="mv-card" style={{ ...cardStyle, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>
                {editingTopicId ? "Sửa chủ đề" : "Tạo chủ đề mới"}
              </h3>

              <div style={{ display: "grid", gap: 12 }}>
                <input
                  style={inputStyle}
                  placeholder="Tên chủ đề, ví dụ: English for Banking"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                />

                <textarea
                  style={{ ...inputStyle, minHeight: 85, resize: "vertical" }}
                  placeholder="Mô tả chủ đề (không bắt buộc)"
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                />

                <div style={{ display: "flex", gap: 9 }}>
                  <button
                    style={buttonStyle(COLORS.primary)}
                    onClick={saveTopic}
                    disabled={saving}
                  >
                    <Check size={16} />
                    {saving ? "Đang lưu..." : "Lưu chủ đề"}
                  </button>

                  <button
                    style={buttonStyle("#eef0f5", COLORS.text)}
                    onClick={resetTopicForm}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="mv-card mv-empty-state" style={{ ...cardStyle, textAlign: "center", color: COLORS.muted }}>
              Đang tải chủ đề...
            </div>
          ) : topics.length === 0 ? (
            <div
              style={{
                ...cardStyle,
                textAlign: "center",
                padding: "55px 20px",
              }}
            >
              <BookOpen size={42} color={COLORS.primary} />
              <h3>Chưa có chủ đề nào</h3>
              <p style={{ color: COLORS.muted }}>
                Hãy tạo chủ đề đầu tiên, ví dụ: English for Banking.
              </p>
              <button
                style={buttonStyle(COLORS.primary)}
                onClick={() => setShowTopicForm(true)}
              >
                <Plus size={17} />
                Tạo chủ đề đầu tiên
              </button>
            </div>
          ) : (
            <div className="mv-topic-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(245px, 1fr))",
                gap: 16,
              }}
            >
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="mv-topic-card"
                  style={{
                    ...cardStyle,
                    cursor: "pointer",
                    transition: "transform .2s",
                  }}
                  onClick={() => setSelectedTopic(topic)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 43,
                        height: 43,
                        borderRadius: 12,
                        background: COLORS.primaryLight,
                        color: COLORS.primary,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <BookOpen size={22} />
                    </div>

                    <div style={{ display: "flex", gap: 5 }}>
                      <button
                        title="Sửa chủ đề"
                        onClick={(e) => {
                          e.stopPropagation();
                          editTopic(topic);
                        }}
                        style={{
                          border: 0,
                          background: "#f3f4f8",
                          borderRadius: 8,
                          padding: 8,
                          cursor: "pointer",
                        }}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        title="Xóa chủ đề"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTopic(topic);
                        }}
                        style={{
                          border: 0,
                          background: "#fff0f0",
                          color: COLORS.red,
                          borderRadius: 8,
                          padding: 8,
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ margin: "17px 0 7px", fontSize: 17 }}>
                    {topic.name}
                  </h3>

                  <p
                    style={{
                      color: COLORS.muted,
                      fontSize: 13,
                      minHeight: 38,
                      marginBottom: 15,
                    }}
                  >
                    {topic.description || "Chưa có mô tả"}
                  </p>

                  <div
                    style={{
                      color: COLORS.primary,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Mở chủ đề <ChevronRight size={15} style={{ verticalAlign: "middle" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => {
              setSelectedTopic(null);
              setShowStudy(false);
              resetWordForm();
              setSearch("");
              setError("");
            }}
            style={{
              ...buttonStyle("#eef0f5", COLORS.text),
              marginBottom: 18,
            }}
          >
            <ArrowLeft size={16} />
            Danh sách chủ đề
          </button>

          <div className="mv-card" style={{ ...cardStyle, marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 15,
              }}
            >
              <div>
                <h2 style={{ margin: "0 0 7px", fontSize: 22 }}>
                  {selectedTopic.name}
                </h2>
                <p style={{ margin: 0, color: COLORS.muted, fontSize: 13 }}>
                  {selectedTopic.description || "Bộ từ vựng cá nhân"}
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ textAlign: "center" }}>
                  <strong style={{ fontSize: 21 }}>{words.length}</strong>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Tổng số từ</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <strong style={{ fontSize: 21, color: COLORS.green }}>
                    {rememberedCount}
                  </strong>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Đã nhớ</div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 9,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <button
              style={buttonStyle(COLORS.primary)}
              onClick={() => setShowStudy(!showStudy)}
              disabled={words.length === 0}
            >
              <BookOpen size={16} />
              {showStudy ? "Đóng chế độ học" : "Bắt đầu học"}
            </button>

            <button
              style={buttonStyle("#eeeaff", COLORS.primary)}
              onClick={() => setShowBulkForm(!showBulkForm)}
            >
              <Layers size={16} />
              Nhập nhiều từ
            </button>
          </div>

          {showStudy && words.length > 0 && (
            <div className="mv-card" style={{ ...cardStyle, marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                <h3 style={{ margin: 0 }}>Chế độ học tập</h3>
                <button
                  onClick={() => setShowStudy(false)}
                  style={{
                    border: 0,
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <X size={19} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 20,
                }}
              >
                <button
                  style={buttonStyle(
                    studyMode === "flashcard" ? COLORS.primary : "#f0f1f6",
                    studyMode === "flashcard" ? "#fff" : COLORS.text
                  )}
                  onClick={() => {
                    setStudyMode("flashcard");
                    setStudyIndex(0);
                    setFlipped(false);
                  }}
                >
                  <Layers size={16} />
                  Flashcard
                </button>

                <button
                  style={buttonStyle(
                    studyMode === "typing" ? COLORS.primary : "#f0f1f6",
                    studyMode === "typing" ? "#fff" : COLORS.text
                  )}
                  onClick={() => {
                    setStudyMode("typing");
                    setStudyIndex(0);
                    setAnswer("");
                    setChecked(false);
                  }}
                >
                  <Keyboard size={16} />
                  Nhập từ
                </button>

                <button
                  style={buttonStyle(
                    studyMode === "quiz" ? COLORS.primary : "#f0f1f6",
                    studyMode === "quiz" ? "#fff" : COLORS.text
                  )}
                  onClick={() => {
                    setStudyMode("quiz");
                    setStudyIndex(0);
                    setSelectedChoice("");
                    setQuizResult(null);
                  }}
                >
                  <ListChecks size={16} />
                  Trắc nghiệm
                </button>
              </div>

              {currentWord && (
                <>
                  <div
                    style={{
                      background: "linear-gradient(135deg, #f5f2ff, #eef5ff)",
                      border: "1px solid #e7e2ff",
                      borderRadius: 18,
                      padding: "35px 20px",
                      textAlign: "center",
                      minHeight: 190,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {studyMode === "flashcard" && (
                      <>
                        {!flipped ? (
                          <>
                            <h2 style={{ fontSize: 31, margin: "0 0 10px" }}>
                              {currentWord.english}
                            </h2>
                            <p style={{ color: COLORS.primary, fontSize: 18 }}>
                              {currentWord.ipa || "Chưa có IPA"}
                            </p>
                            <button
                              onClick={() => speak(currentWord.english)}
                              style={buttonStyle("#ffffff", COLORS.primary)}
                            >
                              <Volume2 size={18} />
                              Phát âm
                            </button>
                          </>
                        ) : (
                          <>
                            <p style={{ color: COLORS.muted, margin: 0 }}>
                              Nghĩa tiếng Việt
                            </p>
                            <h2 style={{ fontSize: 25 }}>
                              {currentWord.meaning}
                            </h2>
                          </>
                        )}

                        <button
                          onClick={() => setFlipped(!flipped)}
                          style={{
                            ...buttonStyle(COLORS.primary),
                            marginTop: 18,
                          }}
                        >
                          <RotateCcw size={16} />
                          {flipped ? "Xem mặt trước" : "Lật thẻ"}
                        </button>
                      </>
                    )}

                    {studyMode === "typing" && (
                      <>
                        <p style={{ color: COLORS.muted, margin: 0 }}>
                          Hãy nhập từ tiếng Anh tương ứng:
                        </p>
                        <h2 style={{ fontSize: 24 }}>
                          {currentWord.meaning}
                        </h2>

                        <input
                          style={{ ...inputStyle, maxWidth: 390, textAlign: "center" }}
                          placeholder="Nhập từ tiếng Anh..."
                          value={answer}
                          onChange={(e) => {
                            setAnswer(e.target.value);
                            setChecked(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") checkTypingAnswer();
                          }}
                        />

                        <button
                          onClick={checkTypingAnswer}
                          style={{ ...buttonStyle(COLORS.primary), marginTop: 12 }}
                          disabled={!answer.trim()}
                        >
                          Kiểm tra
                        </button>

                        {checked && (
                          <div style={{ marginTop: 15 }}>
                            {isTypingCorrect ? (
                              <strong style={{ color: COLORS.green }}>
                                Chính xác! Bạn đã trả lời đúng.
                              </strong>
                            ) : (
                              <div style={{ color: COLORS.red }}>
                                Chưa chính xác. Đáp án:{" "}
                                <strong>{currentWord.english}</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {studyMode === "quiz" && (
                      <>
                        <p style={{ color: COLORS.muted, margin: 0 }}>
                          Chọn từ tiếng Anh đúng:
                        </p>
                        <h2 style={{ fontSize: 24 }}>
                          {currentWord.meaning}
                        </h2>

                        <div
                          style={{
                            width: "100%",
                            maxWidth: 450,
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: 10,
                            marginTop: 15,
                          }}
                        >
                          {quizChoices.map((choice) => {
                            const isCorrect =
                              choice.english === currentWord.english;

                            let background = "#ffffff";
                            let color = COLORS.text;

                            if (quizResult !== null && isCorrect) {
                              background = "#e5f8ee";
                              color = COLORS.green;
                            } else if (
                              selectedChoice === choice.english &&
                              quizResult === false
                            ) {
                              background = "#fff0f0";
                              color = COLORS.red;
                            }

                            return (
                              <button
                                key={choice.id}
                                onClick={() => selectQuizChoice(choice.english)}
                                style={{
                                  padding: 13,
                                  borderRadius: 10,
                                  border: `1px solid ${COLORS.border}`,
                                  background,
                                  color,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                {choice.english}
                              </button>
                            );
                          })}
                        </div>

                        {quizResult !== null && (
                          <strong
                            style={{
                              marginTop: 15,
                              color: quizResult ? COLORS.green : COLORS.red,
                            }}
                          >
                            {quizResult ? "Chính xác!" : `Đáp án: ${currentWord.english}`}
                          </strong>
                        )}
                      </>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 10,
                      marginTop: 18,
                    }}
                  >
                    <span style={{ color: COLORS.muted, fontSize: 13 }}>
                      Từ {studyIndex + 1} / {studyWords.length}
                    </span>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        style={buttonStyle("#f0f1f6", COLORS.text)}
                        onClick={previousWord}
                      >
                        <ChevronLeft size={17} />
                        Trước
                      </button>

                      <button
                        style={buttonStyle("#eeeaff", COLORS.primary)}
                        onClick={shuffleStudy}
                      >
                        <RotateCcw size={16} />
                        Ngẫu nhiên
                      </button>

                      <button
                        style={buttonStyle(COLORS.primary)}
                        onClick={nextWord}
                      >
                        Tiếp
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginTop: 15,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      style={buttonStyle(
                        currentWord.remembered ? "#e5f8ee" : "#f0f1f6",
                        currentWord.remembered ? COLORS.green : COLORS.text
                      )}
                      onClick={() => toggleRemembered(currentWord)}
                    >
                      <Check size={16} />
                      {currentWord.remembered ? "Đã ghi nhớ" : "Đánh dấu đã nhớ"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {showBulkForm && (
            <div className="mv-card" style={{ ...cardStyle, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>Nhập nhiều từ vựng</h3>
              <p style={{ color: COLORS.muted, fontSize: 13 }}>
                Mỗi dòng một từ theo định dạng: English | IPA | Nghĩa tiếng Việt
              </p>

              <textarea
                style={{
                  ...inputStyle,
                  minHeight: 170,
                  resize: "vertical",
                  fontFamily: "monospace",
                }}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`deposit | /dɪˈpɒzɪt/ | tiền gửi\nwithdraw | /wɪðˈdrɔː/ | rút tiền\ninterest | /ˈɪntrəst/ | tiền lãi`}
              />

              <div style={{ display: "flex", gap: 9, marginTop: 12 }}>
                <button
                  style={buttonStyle(COLORS.primary)}
                  onClick={importBulkWords}
                  disabled={saving || !bulkText.trim()}
                >
                  <Plus size={16} />
                  {saving ? "Đang nhập..." : "Thêm từ vựng"}
                </button>

                <button
                  style={buttonStyle("#eef0f5", COLORS.text)}
                  onClick={() => setShowBulkForm(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          )}

          <div className="mv-card" style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 17,
              }}
            >
              <h3 style={{ margin: 0 }}>
                Danh sách từ vựng ({words.length})
              </h3>

              <div style={{ position: "relative", width: "min(100%, 260px)" }}>
                <Search
                  size={17}
                  color={COLORS.muted}
                  style={{
                    position: "absolute",
                    left: 11,
                    top: 12,
                  }}
                />
                <input
                  style={{ ...inputStyle, paddingLeft: 36 }}
                  placeholder="Tìm từ vựng..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 9,
                flexWrap: "wrap",
                marginBottom: 17,
              }}
            >
              <input
                style={{ ...inputStyle, flex: "1 1 150px" }}
                placeholder="Từ tiếng Anh *"
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
              />

              <input
                style={{ ...inputStyle, flex: "1 1 130px" }}
                placeholder="IPA"
                value={ipa}
                onChange={(e) => setIpa(e.target.value)}
              />

              <input
                style={{ ...inputStyle, flex: "1 1 170px" }}
                placeholder="Nghĩa tiếng Việt *"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveWord();
                }}
              />

              <button
                style={buttonStyle(COLORS.primary)}
                onClick={saveWord}
                disabled={saving}
              >
                {editingWordId ? <Check size={16} /> : <Plus size={16} />}
                {editingWordId ? "Cập nhật" : "Thêm từ"}
              </button>

              {editingWordId && (
                <button
                  style={buttonStyle("#eef0f5", COLORS.text)}
                  onClick={resetWordForm}
                >
                  <X size={16} />
                  Hủy sửa
                </button>
              )}
            </div>

            {filteredWords.length === 0 ? (
              <div
                style={{
                  padding: 35,
                  textAlign: "center",
                  color: COLORS.muted,
                }}
              >
                {words.length === 0
                  ? "Chủ đề chưa có từ vựng. Hãy thêm từ đầu tiên nhé!"
                  : "Không tìm thấy từ phù hợp."}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {filteredWords.map((word) => (
                  <div
                    key={word.id}
                    className="mv-word-item"
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 12,
                      padding: 13,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: "1 1 200px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          flexWrap: "wrap",
                        }}
                      >
                        <strong style={{ fontSize: 16 }}>
                          {word.english}
                        </strong>

                        {word.ipa && (
                          <span style={{ color: COLORS.primary, fontSize: 13 }}>
                            {word.ipa}
                          </span>
                        )}

                        {word.remembered && (
                          <span
                            style={{
                              fontSize: 10,
                              background: "#e5f8ee",
                              color: COLORS.green,
                              padding: "3px 7px",
                              borderRadius: 20,
                            }}
                          >
                            Đã nhớ
                          </span>
                        )}
                      </div>

                      <p style={{ margin: "5px 0 0", color: COLORS.muted, fontSize: 13 }}>
                        {word.meaning}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        title="Nghe phát âm"
                        onClick={() => speak(word.english)}
                        style={{
                          border: 0,
                          background: "#eeeaff",
                          color: COLORS.primary,
                          padding: 9,
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        <Volume2 size={16} />
                      </button>

                      <button
                        title="Sửa từ"
                        onClick={() => editWord(word)}
                        style={{
                          border: 0,
                          background: "#f0f1f6",
                          padding: 9,
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        title="Xóa từ"
                        onClick={() => removeWord(word)}
                        style={{
                          border: 0,
                          background: "#fff0f0",
                          color: COLORS.red,
                          padding: 9,
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MyVocabulary;
