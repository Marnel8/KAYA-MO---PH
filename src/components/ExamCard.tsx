"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useQuestionBank } from "@/queries/questions";
import { useCreateAttempt } from "@/queries/attempts";
import type { ExamType, ExamMode, Blueprint } from "@/types";

interface ExamCardProps {
  examType: ExamType;
  title: string;
  description: string;
  blueprint: Blueprint;
}

export default function ExamCard({
  examType,
  title,
  description,
  blueprint,
}: ExamCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: questionIds } = useQuestionBank(examType);
  const createAttempt = useCreateAttempt();

  const handleStart = async (mode: ExamMode) => {
    if (!user) {
      router.push(`/login?redirect=/`);
      return;
    }
    if (!questionIds || questionIds.length === 0) {
      alert("No questions available. Please seed the database first.");
      return;
    }
    try {
      const attempt = await createAttempt.mutateAsync({
        examType,
        mode,
        allQuestionIds: questionIds,
      });
      router.push(`/exam/${attempt.id}`);
    } catch (err) {
      console.error("Failed to create attempt:", err);
      alert("Failed to start exam. Please try again.");
    }
  };

  const sim = blueprint.simulation;
  const prac = blueprint.practice;

  return (
    <div className="exam-card">
      <span className="exam-badge">{examType === "CSC_PRO" ? "Professional" : "Sub-Professional"}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="exam-meta">
        <span>📝 {sim.questionCount} items (sim)</span>
        <span>⏱ {sim.timeLimitMinutes} min</span>
      </div>
      <div className="exam-actions">
        <button
          className="btn btn-primary"
          disabled={createAttempt.isPending}
          onClick={() => handleStart("simulation")}
        >
          {createAttempt.isPending ? "Starting..." : "Simulation"}
        </button>
        <button
          className="btn btn-secondary"
          disabled={createAttempt.isPending}
          onClick={() => handleStart("practice")}
        >
          Practice ({prac.questionCount})
        </button>
      </div>
    </div>
  );
}
