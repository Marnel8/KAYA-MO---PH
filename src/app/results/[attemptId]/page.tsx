"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAttempt, useAnswers } from "@/queries/attempts";
import { useQuestions } from "@/queries/questions";
import AuthGuard from "@/components/AuthGuard";
import PageTransition from "@/components/PageTransition";
import QuestionCard from "@/components/QuestionCard";
import OMRSheet from "@/components/OMRSheet";

function ResultsContent() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const { data: attempt, isLoading: attemptLoading } = useAttempt(attemptId);
  const { data: questions, isLoading: questionsLoading } = useQuestions(
    attempt?.questionIds
  );
  const { data: answers } = useAnswers(attemptId);

  const [showOMR, setShowOMR] = useState(false);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  if (attemptLoading || questionsLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <p>Loading results...</p>
      </div>
    );
  }

  if (!attempt || attempt.status !== "submitted") {
    return (
      <div className="loading-screen">
        <p>Results not available.</p>
        <button className="btn btn-primary" onClick={() => router.push("/")}>
          Back to Catalog
        </button>
      </div>
    );
  }

  if (!questions) return null;

  const answersMap = new Map<string, string>();
  answers?.forEach((a) => answersMap.set(a.questionId, a.choiceId));

  const score = attempt.score ?? 0;
  const pass = score >= 80;
  const total = questions.length;

  return (
    <PageTransition>
      <header className="app-header">
        <div className="app-logo">
          <Image
            src="/logo.svg"
            alt="KayaMo logo"
            width={120}
            height={32}
            style={{ height: "auto" }}
          />
        </div>
        <Link href="/" className="btn btn-ghost btn-sm">
          Catalog
        </Link>
      </header>

      <main className="container" style={{ paddingTop: "var(--sp-6)", paddingBottom: "var(--sp-8)" }}>
        {/* Score Card */}
        <div className="score-card" style={{ marginBottom: "var(--sp-6)" }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: "var(--sp-3)", display: "inline-block" }}>
              {attempt.examType === "CSC_PRO" ? "Professional" : "Sub-Professional"} · {attempt.mode}
            </span>
          </div>
          <div className={`score-value ${pass ? "pass" : "fail"}`}>
            {score.toFixed(1)}%
          </div>
          <div className="score-label">
            {pass ? "Passed! 🎉" : "Keep Practicing"}
          </div>
          <div className="score-stats">
            <div className="score-stat stat-correct">
              <div className="stat-value">{attempt.correctCount ?? 0}</div>
              <div className="stat-label">Correct</div>
            </div>
            <div className="score-stat stat-wrong">
              <div className="stat-value">{attempt.wrongCount ?? 0}</div>
              <div className="stat-label">Wrong</div>
            </div>
            <div className="score-stat stat-unanswered">
              <div className="stat-value">{attempt.unansweredCount ?? 0}</div>
              <div className="stat-label">Unanswered</div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {attempt.breakdown && attempt.breakdown.length > 0 && (
          <div className="card" style={{ marginBottom: "var(--sp-6)" }}>
            <h3 style={{ marginBottom: "var(--sp-4)" }}>Category Breakdown</h3>
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Score</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {attempt.breakdown.map((b) => (
                  <tr key={b.category}>
                    <td>{b.category}</td>
                    <td>
                      {b.correct}/{b.total}
                    </td>
                    <td>
                      {b.total > 0
                        ? ((b.correct / b.total) * 100).toFixed(0)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* OMR Sheet button */}
        <div style={{ textAlign: "center", marginBottom: "var(--sp-6)" }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowOMR(true)}
          >
            View Answer Sheet
          </button>
        </div>

        {showOMR && (
          <OMRSheet
            questions={questions}
            currentIndex={reviewIndex ?? 0}
            localAnswers={answersMap}
            markedIds={new Set()}
            onJump={(idx) => {
              setReviewIndex(idx);
              setShowOMR(false);
            }}
            onClose={() => setShowOMR(false)}
            isReview
          />
        )}

        {/* Question Review */}
        <div style={{ marginBottom: "var(--sp-6)" }}>
          <h3 style={{ marginBottom: "var(--sp-4)" }}>Question Review</h3>
          {reviewIndex !== null && questions[reviewIndex] ? (
            <>
              <QuestionCard
                question={questions[reviewIndex]}
                index={reviewIndex}
                total={total}
                selectedChoiceId={answersMap.get(questions[reviewIndex].id)}
                onSelect={() => {}}
                isReview
              />
              <div className="flex gap-3 justify-center">
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={reviewIndex <= 0}
                  onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
                >
                  ← Previous
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={reviewIndex >= total - 1}
                  onClick={() =>
                    setReviewIndex(Math.min(total - 1, reviewIndex + 1))
                  }
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <div className="card" style={{ textAlign: "center" }}>
              <p className="text-secondary">
                Tap a question number in the Answer Sheet above, or start from
                the first question.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: "var(--sp-3)" }}
                onClick={() => setReviewIndex(0)}
              >
                Review from Q1
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn btn-primary">
            Back to Catalog
          </Link>
          <Link href="/history" className="btn btn-ghost">
            View History
          </Link>
        </div>
      </main>
    </PageTransition>
  );
}

export default function ResultsPage() {
  return (
    <AuthGuard>
      <ResultsContent />
    </AuthGuard>
  );
}
