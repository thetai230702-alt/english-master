export const STUDY_GOALS_KEY = "ati-learning-daily-goals-v1";
export const STUDY_ACTIVITY_KEY = "ati-learning-daily-activity-v1";
export const STUDY_ACTIVITY_EVENT = "ati-learning-activity-updated";

export type StudyActivity = Record<string, number>;

export function localDay(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyGoal(): number {
  try {
    const value = Number(localStorage.getItem(STUDY_GOALS_KEY));
    return Number.isInteger(value) && value >= 1 && value <= 100 ? value : 10;
  } catch { return 10; }
}

export function setDailyGoal(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 100) return;
  try {
    localStorage.setItem(STUDY_GOALS_KEY, String(value));
    window.dispatchEvent(new Event(STUDY_ACTIVITY_EVENT));
  } catch { /* Browser storage unavailable. */ }
}

export function getStudyActivity(): StudyActivity {
  try {
    const raw = localStorage.getItem(STUDY_ACTIVITY_KEY);
    const value: unknown = raw ? JSON.parse(raw) : {};
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([day, count]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(day) && typeof count === "number" && Number.isFinite(count) && count >= 0
    ));
  } catch { return {}; }
}

export function recordCheckedSentence(): void {
  try {
    const history = getStudyActivity();
    const today = localDay();
    history[today] = (history[today] ?? 0) + 1;
    localStorage.setItem(STUDY_ACTIVITY_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event(STUDY_ACTIVITY_EVENT));
  } catch { /* Practice still works if storage is unavailable. */ }
}

export function getStudyStreak(activity: StudyActivity, today = new Date()): number {
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!(activity[localDay(day)] > 0)) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (activity[localDay(day)] > 0) {
    streak += 1;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

export function getLastSevenDays(activity: StudyActivity, today = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    day.setDate(day.getDate() - (6 - index));
    return { date: localDay(day), count: activity[localDay(day)] ?? 0, label: `${day.getDate()}/${day.getMonth() + 1}` };
  });
}
