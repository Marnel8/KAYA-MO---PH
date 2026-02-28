import { create } from "zustand";

interface ExamState {
  currentIndex: number;
  markedIds: Set<string>;
  localAnswers: Map<string, string>; // questionId → choiceId
  lastSyncedAt: number | null;

  setCurrentIndex: (i: number) => void;
  toggleMark: (questionId: string) => void;
  setAnswer: (questionId: string, choiceId: string) => void;
  setSyncedAt: (t: number) => void;
  hydrate: (answers: Map<string, string>) => void;
  reset: () => void;
}

export const useExamStore = create<ExamState>((set) => ({
  currentIndex: 0,
  markedIds: new Set(),
  localAnswers: new Map(),
  lastSyncedAt: null,

  setCurrentIndex: (i) => set({ currentIndex: i }),

  toggleMark: (questionId) =>
    set((s) => {
      const next = new Set(s.markedIds);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return { markedIds: next };
    }),

  setAnswer: (questionId, choiceId) =>
    set((s) => {
      const next = new Map(s.localAnswers);
      next.set(questionId, choiceId);
      return { localAnswers: next };
    }),

  setSyncedAt: (t) => set({ lastSyncedAt: t }),

  hydrate: (answers) =>
    set({ localAnswers: new Map(answers), lastSyncedAt: Date.now() }),

  reset: () =>
    set({
      currentIndex: 0,
      markedIds: new Set(),
      localAnswers: new Map(),
      lastSyncedAt: null,
    }),
}));
