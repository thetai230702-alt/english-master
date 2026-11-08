import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const CHECKLIST_KEY = "english-master-checklist";
const PRACTICE_KEY = "ntt-unit-practice-progress-v1";
const SYNC_EVENT = "ntt-learning-progress-local-updated";

type ChecklistEntry = {
  id: number;
  [key: string]: unknown;
};

type PracticeMap = Record<string, Record<string, boolean>>;

type CloudProgress = {
  checklist?: ChecklistEntry[];
  practice?: PracticeMap;
  updatedAt?: number;
};

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function readLocal(): CloudProgress {
  return {
    checklist: parseJson<ChecklistEntry[]>(localStorage.getItem(CHECKLIST_KEY), []),
    practice: parseJson<PracticeMap>(localStorage.getItem(PRACTICE_KEY), {}),
  };
}

function mergeProgress(local: CloudProgress, cloud: CloudProgress, localWins = true): CloudProgress {
  const localChecklist = Array.isArray(local.checklist) ? local.checklist : [];
  const cloudChecklist = Array.isArray(cloud.checklist) ? cloud.checklist : [];
  const checklistById = new Map<number, ChecklistEntry>();

  const firstChecklist = localWins ? cloudChecklist : localChecklist;
  const secondChecklist = localWins ? localChecklist : cloudChecklist;
  firstChecklist.forEach((item) => {
    if (item && Number.isFinite(item.id)) checklistById.set(item.id, item);
  });
  secondChecklist.forEach((item) => {
    if (item && Number.isFinite(item.id)) {
      checklistById.set(item.id, {
        ...checklistById.get(item.id),
        ...item,
      });
    }
  });

  const practice: PracticeMap = {};
  const cloudPractice = cloud.practice && typeof cloud.practice === "object"
    ? cloud.practice : {};
  const localPractice = local.practice && typeof local.practice === "object"
    ? local.practice : {};

  for (const unitId of new Set([
    ...Object.keys(cloudPractice),
    ...Object.keys(localPractice),
  ])) {
    practice[unitId] = localWins
      ? { ...(cloudPractice[unitId] ?? {}), ...(localPractice[unitId] ?? {}) }
      : { ...(localPractice[unitId] ?? {}), ...(cloudPractice[unitId] ?? {}) };
  }

  return {
    checklist: [...checklistById.values()].sort((a, b) => a.id - b.id),
    practice,
    updatedAt: Date.now(),
  };
}

function writeLocal(progress: CloudProgress) {
  if (Array.isArray(progress.checklist)) {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(progress.checklist));
  }
  if (progress.practice && typeof progress.practice === "object") {
    localStorage.setItem(PRACTICE_KEY, JSON.stringify(progress.practice));
  }
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("ntt-unit-progress-updated"));
}

export function notifyLearningProgressChanged() {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

export type LearningSyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

export function useLearningProgressSync(user: User | null): LearningSyncStatus {
  const [status, setStatus] = useState<LearningSyncStatus>("idle");
  const applyingCloud = useRef(false);
  const lastWritten = useRef("");

  useEffect(() => {
    if (!user) {
      setStatus("idle");
      return;
    }

    if (!navigator.onLine) setStatus("offline");

    const progressRef = doc(db, "users", user.uid, "learningProgress", "main");
    let active = true;
    let initialSnapshotHandled = false;

    const uploadLocal = async () => {
      if (!active || applyingCloud.current) return;
      if (!navigator.onLine) {
        setStatus("offline");
        return;
      }
      const payload = readLocal();
      const signature = JSON.stringify(payload);
      if (signature === lastWritten.current) return;

      try {
        setStatus("syncing");
        await setDoc(progressRef, {
          ...payload,
          updatedAt: Date.now(),
        }, { merge: true });
        lastWritten.current = signature;
        if (active) setStatus("synced");
      } catch (error) {
        console.error("Không thể đồng bộ tiến độ học tập lên Firestore:", error);
        if (active) setStatus(navigator.onLine ? "error" : "offline");
      }
    };

    const unsubscribe = onSnapshot(
      progressRef,
      async (snapshot) => {
        if (!active) return;

        const local = readLocal();
        const cloud = snapshot.exists()
          ? snapshot.data() as CloudProgress
          : {};

        if (!initialSnapshotHandled) {
          initialSnapshotHandled = true;
          if (snapshot.exists()) {
            const merged = mergeProgress(local, cloud);
            applyingCloud.current = true;
            writeLocal(merged);
            applyingCloud.current = false;
            await uploadLocal();
          } else {
            await uploadLocal();
          }
          if (active && navigator.onLine) setStatus("synced");
          return;
        }

        if (!snapshot.metadata.hasPendingWrites) {
          const merged = mergeProgress(local, cloud, false);
          const signature = JSON.stringify({
            checklist: merged.checklist,
            practice: merged.practice,
          });
          const currentSignature = JSON.stringify({
            checklist: local.checklist,
            practice: local.practice,
          });
          if (signature !== currentSignature) {
            applyingCloud.current = true;
            writeLocal(merged);
            applyingCloud.current = false;
          }
          if (active) setStatus(navigator.onLine ? "synced" : "offline");
        }
      },
      (error) => {
        console.error("Không thể tải tiến độ học tập từ Firestore:", error);
        if (active) setStatus(navigator.onLine ? "error" : "offline");
      }
    );

    const handleLocalChange = () => {
      void uploadLocal();
    };

    const handleOnline = () => {
      setStatus("syncing");
      void uploadLocal();
    };
    const handleOffline = () => setStatus("offline");

    window.addEventListener(SYNC_EVENT, handleLocalChange);
    window.addEventListener("storage", handleLocalChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener(SYNC_EVENT, handleLocalChange);
      window.removeEventListener("storage", handleLocalChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);

  return status;
}
