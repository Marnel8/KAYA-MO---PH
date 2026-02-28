import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import type { Attempt, Answer, ExamType, ExamMode } from "@/types";
import { blueprints } from "@/data/blueprints";

/* ── Fetch single attempt ── */
export function useAttempt(attemptId: string | undefined) {
  return useQuery<Attempt | null>({
    queryKey: ["attempt", attemptId],
    enabled: !!attemptId,
    queryFn: async () => {
      if (!attemptId) return null;
      const snap = await getDoc(doc(db, "attempts", attemptId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Attempt;
    },
  });
}

/* ── Fetch user attempt history ── */
export function useAttempts(userId: string | undefined) {
  return useQuery<Attempt[]>({
    queryKey: ["attempts", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const q = query(
        collection(db, "attempts"),
        where("userId", "==", userId),
        orderBy("startedAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Attempt);
    },
  });
}

/* ── Fetch answers subcollection ── */
export function useAnswers(attemptId: string | undefined) {
  return useQuery<Answer[]>({
    queryKey: ["answers", attemptId],
    enabled: !!attemptId,
    queryFn: async () => {
      if (!attemptId) return [];
      const snap = await getDocs(
        collection(db, "attempts", attemptId, "answers")
      );
      return snap.docs.map((d) => d.data() as Answer);
    },
  });
}

/* ── Save single answer (debounced via caller) ── */
export function useSaveAnswer(attemptId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      questionId,
      choiceId,
    }: {
      questionId: string;
      choiceId: string;
    }) => {
      if (!attemptId) throw new Error("No attempt");
      const ref = doc(db, "attempts", attemptId, "answers", questionId);
      const answer: Answer = {
        questionId,
        choiceId,
        updatedAt: Date.now(),
      };
      await setDoc(ref, answer);
      return answer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["answers", attemptId] });
    },
  });
}

/* ── Create attempt ── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useCreateAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      examType,
      mode,
      allQuestionIds,
    }: {
      examType: ExamType;
      mode: ExamMode;
      allQuestionIds: string[];
    }) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const bp = blueprints.find((b) => b.examType === examType);
      if (!bp) throw new Error("Blueprint not found");

      const needed = mode === "simulation" ? bp.simulation.questionCount : bp.practice.questionCount;

      // Shuffle and cycle to fill
      let pool = shuffle(allQuestionIds);
      const questionIds: string[] = [];
      while (questionIds.length < needed) {
        if (pool.length === 0) pool = shuffle(allQuestionIds);
        questionIds.push(pool.shift()!);
      }

      const now = Date.now();
      const timeLimitMs =
        mode === "simulation" && bp.simulation.timeLimitMinutes
          ? bp.simulation.timeLimitMinutes * 60 * 1000
          : null;

      const attempt: Omit<Attempt, "id"> = {
        userId: user.uid,
        examType,
        mode,
        questionIds,
        startedAt: now,
        expiresAt: timeLimitMs ? now + timeLimitMs : null,
        status: "in_progress",
        score: null,
        correctCount: null,
        wrongCount: null,
        unansweredCount: null,
        breakdown: null,
        submittedAt: null,
      };

      const ref = await addDoc(collection(db, "attempts"), attempt);
      return { id: ref.id, ...attempt } as Attempt;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attempts"] });
    },
  });
}

/* ── Finalize attempt (calls API route) ── */
export function useFinalizeAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attemptId: string) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      const res = await fetch("/api/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attemptId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to finalize");
      }
      return res.json();
    },
    onSuccess: (_data, attemptId) => {
      qc.invalidateQueries({ queryKey: ["attempt", attemptId] });
      qc.invalidateQueries({ queryKey: ["attempts"] });
    },
  });
}

/* ── Update attempt (for timer-based expiry update) ── */
export function useUpdateAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      attemptId,
      data,
    }: {
      attemptId: string;
      data: Partial<Attempt>;
    }) => {
      await updateDoc(doc(db, "attempts", attemptId), data);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["attempt", vars.attemptId] });
    },
  });
}
