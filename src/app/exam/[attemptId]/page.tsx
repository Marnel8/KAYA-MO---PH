"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useAttempt, useAnswers, useSaveAnswer, useFinalizeAttempt } from "@/queries/attempts";
import { useQuestions } from "@/queries/questions";
import { useExamStore } from "@/store/examStore";
import AuthGuard from "@/components/AuthGuard";
import Timer from "@/components/Timer";
import QuestionCard from "@/components/QuestionCard";
import OMRSheet from "@/components/OMRSheet";
import BottomNav from "@/components/BottomNav";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageTransition from "@/components/PageTransition";

function ExamRunner() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;
  const { user } = useAuth();

  const { data: attempt, isLoading: attemptLoading } = useAttempt(attemptId);
  const { data: questions, isLoading: questionsLoading } = useQuestions(
    attempt?.questionIds
  );
  const { data: savedAnswers } = useAnswers(attemptId);
  const saveAnswer = useSaveAnswer(attemptId);
  const finalizeAttempt = useFinalizeAttempt();

  const {
    currentIndex,
    markedIds,
    localAnswers,
    setCurrentIndex,
    toggleMark,
    setAnswer,
    hydrate,
    reset,
  } = useExamStore();

  const [showOMR, setShowOMR] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const hydratedRef = useRef(false);

  // Derive hydrated from savedAnswers (undefined while loading)
  const hydrated = savedAnswers !== undefined;

  // Hydrate store with saved answers once
  useEffect(() => {
    if (!hydratedRef.current && savedAnswers) {
      if (savedAnswers.length > 0) {
        const map = new Map<string, string>();
        savedAnswers.forEach((a) => map.set(a.questionId, a.choiceId));
        hydrate(map);
      }
      hydratedRef.current = true;
    }
  }, [savedAnswers, hydrate]);

  // Reset store on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  // Redirect if attempt is submitted
  useEffect(() => {
    if (attempt && attempt.status === "submitted") {
      router.replace(`/results/${attemptId}`);
    }
  }, [attempt, attemptId, router]);

  // Debounced autosave
  const handleSelectChoice = useCallback(
    (questionId: string, choiceId: string) => {
      setAnswer(questionId, choiceId);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveAnswer.mutate({ questionId, choiceId });
      }, 500);
    },
    [setAnswer, saveAnswer]
  );

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirm(false);

    try {
      // Save any pending answers first
      const pending: Promise<unknown>[] = [];
      localAnswers.forEach((choiceId, questionId) => {
        pending.push(
          saveAnswer.mutateAsync({ questionId, choiceId }).catch(() => {})
        );
      });
      await Promise.all(pending);

      // Finalize
      await finalizeAttempt.mutateAsync(attemptId);
      router.replace(`/results/${attemptId}`);
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Failed to submit. Please try again.");
      setSubmitting(false);
    }
  }, [submitting, localAnswers, saveAnswer, finalizeAttempt, attemptId, router]);

  // Auto-submit on timer expiry
  const handleTimerExpire = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  // Loading states
  if (attemptLoading || questionsLoading || !hydrated) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <p>Loading exam...</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="loading-screen">
        <p>Attempt not found.</p>
        <button className="btn btn-primary" onClick={() => router.push("/")}>
          Back to Catalog
        </button>
      </div>
    );
  }

  // Auth check
  if (user && attempt.userId !== user.uid) {
    return (
      <div className="loading-screen">
        <p>You do not have access to this exam attempt.</p>
        <button className="btn btn-primary" onClick={() => router.push("/")}>
          Back to Catalog
        </button>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="loading-screen">
        <p>No questions found. Please seed the database.</p>
        <button className="btn btn-primary" onClick={() => router.push("/")}>
          Back to Catalog
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const isSimulation = attempt.mode === "simulation";
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <PageTransition>
      <div className="exam-body">
        {/* Header */}
        <header className="app-header">
          <div className="app-logo">
            <Image
              src="/logo.svg"
              alt="KayaMo logo"
              width={120}
              height={32}
              className="brand-logo"
              style={{ height: "auto" }}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-primary" style={{ fontSize: "var(--fs-xs)" }}>
              {attempt.examType === "CSC_PRO" ? "Professional" : "Sub-Professional"}
            </span>
            <span className="badge badge-warning" style={{ fontSize: "var(--fs-xs)" }}>
              {attempt.mode}
            </span>
          </div>
        </header>

        {/* Timer */}
        {isSimulation && attempt.expiresAt && (
          <Timer expiresAt={attempt.expiresAt} onExpire={handleTimerExpire} />
        )}

        {/* Question */}
        <div className="container" style={{ paddingTop: "var(--sp-4)" }}>
          {/* Progress bar */}
          <div
            style={{
              width: "100%",
              height: "4px",
              background: "var(--border)",
              borderRadius: "2px",
              marginBottom: "var(--sp-4)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${((localAnswers.size) / questions.length) * 100}%`,
                background: "var(--primary)",
                borderRadius: "2px",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <QuestionCard
            question={currentQuestion}
            index={currentIndex}
            total={questions.length}
            selectedChoiceId={localAnswers.get(currentQuestion.id)}
            onSelect={(choiceId) =>
              handleSelectChoice(currentQuestion.id, choiceId)
            }
          />

          {/* Submit button for non-last questions */}
          <div style={{ textAlign: "center", marginTop: "var(--sp-4)" }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Exam"}
            </button>
          </div>
        </div>

        {/* OMR Sheet */}
        {showOMR && (
          <OMRSheet
            questions={questions}
            currentIndex={currentIndex}
            localAnswers={localAnswers}
            markedIds={markedIds}
            onJump={setCurrentIndex}
            onClose={() => setShowOMR(false)}
          />
        )}

        {/* Bottom Nav */}
        <BottomNav
          currentIndex={currentIndex}
          total={questions.length}
          isMarked={markedIds.has(currentQuestion.id)}
          onPrev={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          onNext={() =>
            setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))
          }
          onToggleMark={() => toggleMark(currentQuestion.id)}
          onToggleOMR={() => setShowOMR(!showOMR)}
          onSubmit={() => setShowConfirm(true)}
          showSubmit={isLastQuestion}
        />

        {/* Confirm Dialog */}
        {showConfirm && (
          <ConfirmDialog
            title="Submit Exam?"
            message={`You have answered ${localAnswers.size} out of ${questions.length} questions. ${questions.length - localAnswers.size} will be marked as unanswered. This action cannot be undone.`}
            confirmLabel={submitting ? "Submitting..." : "Submit"}
            onConfirm={handleSubmit}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
    </PageTransition>
  );
}

export default function ExamPage() {
  return (
    <AuthGuard>
      <ExamRunner />
    </AuthGuard>
  );
}
