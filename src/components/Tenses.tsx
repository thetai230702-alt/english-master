import { useState } from "react";
import { BookOpen, ChevronDown, Clock3, Lightbulb } from "lucide-react";
import "./Tenses.css";

type Tense = {
  name: string;
  group: "Present" | "Past" | "Future";
  usage: string;
  positive: string;
  negative: string;
  question: string;
  signals: string[];
  example: string;
  translation: string;
};

const tenses: Tense[] = [
  {
    name: "Present Simple",
    group: "Present",
    usage: "Habits, routines, facts, and things that are generally true.",
    positive: "S + V(s/es) + O",
    negative: "S + do/does + not + V + O",
    question: "Do/Does + S + V + O?",
    signals: ["always", "usually", "often", "sometimes", "every day"],
    example: "She works at a bank.",
    translation: "Cô ấy làm việc tại một ngân hàng."
  },
  {
    name: "Present Continuous",
    group: "Present",
    usage: "Actions happening now or around the present time; temporary situations.",
    positive: "S + am/is/are + V-ing + O",
    negative: "S + am/is/are + not + V-ing + O",
    question: "Am/Is/Are + S + V-ing + O?",
    signals: ["now", "right now", "at the moment", "currently"],
    example: "I am studying English now.",
    translation: "Bây giờ tôi đang học tiếng Anh."
  },
  {
    name: "Present Perfect",
    group: "Present",
    usage: "Past actions connected to the present, life experiences, or actions continuing until now.",
    positive: "S + have/has + V3/ed + O",
    negative: "S + have/has + not + V3/ed + O",
    question: "Have/Has + S + V3/ed + O?",
    signals: ["already", "just", "yet", "ever", "never", "since", "for"],
    example: "They have lived here for five years.",
    translation: "Họ đã sống ở đây được năm năm."
  },
  {
    name: "Present Perfect Continuous",
    group: "Present",
    usage: "An action that started in the past and has continued until now, emphasizing duration.",
    positive: "S + have/has + been + V-ing + O",
    negative: "S + have/has + not + been + V-ing + O",
    question: "Have/Has + S + been + V-ing + O?",
    signals: ["since", "for", "all day", "lately", "recently"],
    example: "She has been learning English for two hours.",
    translation: "Cô ấy đã học tiếng Anh suốt hai tiếng đồng hồ."
  },
  {
    name: "Past Simple",
    group: "Past",
    usage: "Completed actions at a definite time in the past.",
    positive: "S + V2/ed + O",
    negative: "S + did + not + V + O",
    question: "Did + S + V + O?",
    signals: ["yesterday", "last week", "ago", "in 2020"],
    example: "We visited Da Lat last summer.",
    translation: "Chúng tôi đã đến Đà Lạt vào mùa hè năm ngoái."
  },
  {
    name: "Past Continuous",
    group: "Past",
    usage: "An action in progress at a specific time in the past, often interrupted by another action.",
    positive: "S + was/were + V-ing + O",
    negative: "S + was/were + not + V-ing + O",
    question: "Was/Were + S + V-ing + O?",
    signals: ["at that time", "at 8 p.m. yesterday", "while", "when"],
    example: "I was cooking when he called.",
    translation: "Tôi đang nấu ăn thì anh ấy gọi."
  },
  {
    name: "Past Perfect",
    group: "Past",
    usage: "An action completed before another action or time in the past.",
    positive: "S + had + V3/ed + O",
    negative: "S + had + not + V3/ed + O",
    question: "Had + S + V3/ed + O?",
    signals: ["before", "after", "by the time", "already"],
    example: "The train had left before we arrived.",
    translation: "Tàu đã rời đi trước khi chúng tôi đến."
  },
  {
    name: "Past Perfect Continuous",
    group: "Past",
    usage: "An action that continued for a period before another past event.",
    positive: "S + had + been + V-ing + O",
    negative: "S + had + not + been + V-ing + O",
    question: "Had + S + been + V-ing + O?",
    signals: ["for", "since", "before", "until then"],
    example: "He had been working for three hours before lunch.",
    translation: "Anh ấy đã làm việc được ba tiếng trước bữa trưa."
  },
  {
    name: "Future Simple",
    group: "Future",
    usage: "Predictions, spontaneous decisions, promises, and offers.",
    positive: "S + will + V + O",
    negative: "S + will + not + V + O",
    question: "Will + S + V + O?",
    signals: ["tomorrow", "next week", "soon", "in the future"],
    example: "I will call you tomorrow.",
    translation: "Tôi sẽ gọi cho bạn vào ngày mai."
  },
  {
    name: "Future Continuous",
    group: "Future",
    usage: "An action that will be in progress at a specific time in the future.",
    positive: "S + will + be + V-ing + O",
    negative: "S + will + not + be + V-ing + O",
    question: "Will + S + be + V-ing + O?",
    signals: ["at this time tomorrow", "at 8 p.m. tomorrow"],
    example: "This time tomorrow, I will be flying to London.",
    translation: "Giờ này ngày mai, tôi sẽ đang bay đến London."
  },
  {
    name: "Future Perfect",
    group: "Future",
    usage: "An action that will be completed before a specific time in the future.",
    positive: "S + will + have + V3/ed + O",
    negative: "S + will + not + have + V3/ed + O",
    question: "Will + S + have + V3/ed + O?",
    signals: ["by", "by the time", "before", "by next year"],
    example: "She will have finished the report by Friday.",
    translation: "Cô ấy sẽ hoàn thành báo cáo trước thứ Sáu."
  },
  {
    name: "Future Perfect Continuous",
    group: "Future",
    usage: "Emphasizes how long an action will have continued up to a point in the future.",
    positive: "S + will + have + been + V-ing + O",
    negative: "S + will + not + have + been + V-ing + O",
    question: "Will + S + have + been + V-ing + O?",
    signals: ["for", "by", "by the time", "by next month"],
    example: "By June, I will have been working here for two years.",
    translation: "Đến tháng Sáu, tôi sẽ làm việc ở đây được hai năm."
  }
];

const groups = ["All", "Present", "Past", "Future"] as const;

export default function Tenses() {
  const [activeGroup, setActiveGroup] = useState<(typeof groups)[number]>("All");
  const [openTenses, setOpenTenses] = useState<string[]>(["Present Simple"]);

  const visibleTenses = activeGroup === "All"
    ? tenses
    : tenses.filter((tense) => tense.group === activeGroup);

  const toggleTense = (name: string) => {
    setOpenTenses((current) => current.includes(name)
      ? current.filter((item) => item !== name)
      : [...current, name]);
  };

  const expandAll = () => {
    setOpenTenses((current) => visibleTenses.every((tense) => current.includes(tense.name))
      ? current.filter((name) => !visibleTenses.some((tense) => tense.name === name))
      : [...new Set([...current, ...visibleTenses.map((tense) => tense.name)])]);
  };

  return (
    <div className="tenses-page">
      <section className="tenses-intro">
        <div className="tenses-intro-icon"><BookOpen size={25} /></div>
        <div>
          <span className="tenses-eyebrow">ENGLISH GRAMMAR</span>
          <h2>12 English Tenses</h2>
          <p>Learn the forms, uses, signal words, and examples of all twelve English tenses.</p>
        </div>
      </section>

      <section className="tenses-toolbar" aria-label="Filter tenses">
        <div className="tenses-filters">
          {groups.map((group) => (
            <button
              type="button"
              key={group}
              className={activeGroup === group ? "active" : ""}
              onClick={() => setActiveGroup(group)}
            >
              {group}
              {group !== "All" && <span>{tenses.filter((tense) => tense.group === group).length}</span>}
            </button>
          ))}
        </div>
        <button className="tenses-expand-button" type="button" onClick={expandAll}>
          {visibleTenses.every((tense) => openTenses.includes(tense.name)) ? "Collapse all" : "Expand all"}
        </button>
      </section>

      <div className="tenses-list">
        {visibleTenses.map((tense) => {
          const isOpen = openTenses.includes(tense.name);
          return (
            <article className={`tense-card ${isOpen ? "is-open" : ""}`} key={tense.name}>
              <button
                className="tense-card-trigger"
                type="button"
                onClick={() => toggleTense(tense.name)}
                aria-expanded={isOpen}
              >
                <span className="tense-number">{String(tenses.indexOf(tense) + 1).padStart(2, "0")}</span>
                <span className="tense-trigger-copy">
                  <strong>{tense.name}</strong>
                  <small>{tense.group} Tense</small>
                </span>
                <ChevronDown className="tense-chevron" size={19} />
              </button>

              {isOpen && (
                <div className="tense-card-content">
                  <p className="tense-usage"><Lightbulb size={16} /> {tense.usage}</p>
                  <div className="tense-formula-grid">
                    <div><span>Positive</span><code>{tense.positive}</code></div>
                    <div><span>Negative</span><code>{tense.negative}</code></div>
                    <div><span>Question</span><code>{tense.question}</code></div>
                  </div>
                  <div className="tense-signals">
                    <strong><Clock3 size={15} /> Signal words</strong>
                    <div>{tense.signals.map((word) => <span key={word}>{word}</span>)}</div>
                  </div>
                  <div className="tense-example">
                    <strong>{tense.example}</strong>
                    <p>{tense.translation}</p>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className="tenses-note">S = Subject · V = Verb · O = Object · V2 = past form · V3 = past participle</p>
    </div>
  );
}
