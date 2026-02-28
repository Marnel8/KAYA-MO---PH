import { useQuery } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  getDocs,
  documentId,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Question, ExamType } from "@/types";

/* ── Fetch questions by IDs (batched in chunks of 30) ── */
export function useQuestions(questionIds: string[] | undefined) {
  return useQuery<Question[]>({
    queryKey: ["questions", questionIds],
    enabled: !!questionIds && questionIds.length > 0,
    queryFn: async () => {
      if (!questionIds || questionIds.length === 0) return [];

      // Firestore 'in' queries support max 30 items
      const chunks: string[][] = [];
      for (let i = 0; i < questionIds.length; i += 30) {
        chunks.push(questionIds.slice(i, i + 30));
      }

      const allQuestions: Question[] = [];
      for (const chunk of chunks) {
        const q = query(
          collection(db, "questions"),
          where(documentId(), "in", chunk)
        );
        const snap = await getDocs(q);
        snap.docs.forEach((d) => {
          allQuestions.push({ id: d.id, ...d.data() } as Question);
        });
      }

      // Sort by the original order in questionIds
      const orderMap = new Map(questionIds.map((id, idx) => [id, idx]));
      allQuestions.sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
      );

      return allQuestions;
    },
    staleTime: 10 * 60 * 1000, // questions don't change often
  });
}

/* ── Fetch all question IDs for an exam type ── */
export function useQuestionBank(examType: ExamType | undefined) {
  return useQuery<string[]>({
    queryKey: ["questionBank", examType],
    enabled: !!examType,
    queryFn: async () => {
      if (!examType) return [];
      const q = query(
        collection(db, "questions"),
        where("examType", "==", examType)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.id);
    },
    staleTime: 10 * 60 * 1000,
  });
}
