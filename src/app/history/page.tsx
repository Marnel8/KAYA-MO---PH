"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useAttempts } from "@/queries/attempts";
import AuthGuard from "@/components/AuthGuard";
import PageTransition from "@/components/PageTransition";

const examLabels: Record<string, string> = {
  CSC_PRO: "CSC Professional",
  CSC_SUBPRO: "CSC Sub-Professional",
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HistoryContent() {
  const { user } = useAuth();
  const { data: attempts, isLoading } = useAttempts(user?.uid);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <p>Loading history...</p>
      </div>
    );
  }

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
        <h2 style={{ marginBottom: "var(--sp-5)" }}>Exam History</h2>

        {!attempts || attempts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No exam attempts yet.</p>
            <Link href="/" className="btn btn-primary">
              Start an Exam
            </Link>
          </div>
        ) : (
          <div className="stack">
            {attempts.map((a) => {
              const href =
                a.status === "submitted"
                  ? `/results/${a.id}`
                  : `/exam/${a.id}`;

              return (
                <Link key={a.id} href={href} className="history-item">
                  <div className="hi-left">
                    <span className="hi-type">
                      {examLabels[a.examType] || a.examType}
                    </span>
                    <span className="text-xs text-secondary" style={{ textTransform: "capitalize" }}>
                      {a.mode}
                    </span>
                    <span className="hi-date">{formatDate(a.startedAt)}</span>
                  </div>
                  <div className="hi-right">
                    {a.status === "submitted" && a.score !== null ? (
                      <span
                        className="hi-score"
                        style={{
                          color:
                            a.score >= 80
                              ? "var(--accent)"
                              : "var(--danger)",
                        }}
                      >
                        {a.score.toFixed(1)}%
                      </span>
                    ) : null}
                    <div
                      className={`hi-status ${
                        a.status === "submitted" ? "submitted" : "in-progress"
                      }`}
                    >
                      {a.status === "submitted" ? "Completed" : "In Progress"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </PageTransition>
  );
}

export default function HistoryPage() {
  return (
    <AuthGuard>
      <HistoryContent />
    </AuthGuard>
  );
}
