"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/auth";
import ExamCard from "@/components/ExamCard";
import PageTransition from "@/components/PageTransition";
import { blueprints } from "@/data/blueprints";

const examInfo = {
  CSC_PRO: {
    title: "CSC Professional",
    description:
      "Full-scope civil service exam covering Numerical Ability, Analytical Ability, Verbal Ability, and General Information including the Philippine Constitution and RA 6713.",
  },
  CSC_SUBPRO: {
    title: "CSC Sub-Professional",
    description:
      "Clerical-level civil service exam covering Clerical Ability, Spelling, Grammar, Vocabulary, Numerical Reasoning, and General Information.",
  },
} as const;

export default function CatalogPage() {
  const { user, loading } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Seed failed");
      }
      alert(
        `Seed complete: ${data.seeded} questions (${data.pro} Professional, ${data.subPro} Sub-Professional).`
      );
    } catch (err) {
      alert((err as Error).message || "Failed to seed questions.");
    } finally {
      setSeeding(false);
    }
  };

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
        <div className="flex gap-3 items-center">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? "Seeding..." : "Seed Questions"}
          </button>
          {loading ? null : user ? (
            <>
              <Link href="/history" className="btn btn-ghost btn-sm">
                History
              </Link>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => signOutUser()}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="container" style={{ paddingTop: "var(--sp-6)", paddingBottom: "var(--sp-8)" }}>
        <div style={{ marginBottom: "var(--sp-6)" }}>
          <h1 style={{ marginBottom: "var(--sp-2)" }}>CSC Exam Simulator</h1>
          <p className="text-secondary">
            Practice and simulate the Philippine Civil Service Commission exams.
            Choose an exam type below to get started.
          </p>
        </div>

        <div className="grid-2">
          {blueprints.map((bp) => {
            const info = examInfo[bp.examType as keyof typeof examInfo];
            return (
              <ExamCard
                key={bp.examType}
                examType={bp.examType}
                title={info.title}
                description={info.description}
                blueprint={bp}
              />
            );
          })}
        </div>

        {user && (
          <div style={{ marginTop: "var(--sp-6)", textAlign: "center" }}>
            <p className="text-sm text-secondary">
              Signed in as {user.displayName || user.email}
            </p>
          </div>
        )}
      </main>
    </PageTransition>
  );
}
