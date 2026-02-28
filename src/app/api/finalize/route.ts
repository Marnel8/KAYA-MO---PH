import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebaseAdmin";
import type { CategoryBreakdown } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    // Verify auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Parse body
    const { attemptId } = await req.json();
    if (!attemptId) {
      return NextResponse.json(
        { error: "attemptId is required" },
        { status: 400 }
      );
    }

    // Load attempt
    const attemptRef = adminDb.collection("attempts").doc(attemptId);
    const attemptSnap = await attemptRef.get();
    if (!attemptSnap.exists) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }

    const attempt = attemptSnap.data()!;

    // Verify ownership
    if (attempt.userId !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify status
    if (attempt.status === "submitted") {
      return NextResponse.json(
        { error: "Attempt already submitted" },
        { status: 400 }
      );
    }

    const questionIds: string[] = attempt.questionIds;

    // Load questions (batched)
    const questionsMap = new Map<
      string,
      { correctChoiceId: string; category: string }
    >();
    const chunks: string[][] = [];
    for (let i = 0; i < questionIds.length; i += 30) {
      chunks.push(questionIds.slice(i, i + 30));
    }
    for (const chunk of chunks) {
      const snap = await adminDb
        .collection("questions")
        .where("__name__", "in", chunk)
        .get();
      snap.docs.forEach((d) => {
        const data = d.data();
        questionsMap.set(d.id, {
          correctChoiceId: data.correctChoiceId,
          category: data.category,
        });
      });
    }

    // Load answers
    const answersSnap = await attemptRef.collection("answers").get();
    const answersMap = new Map<string, string>();
    answersSnap.docs.forEach((d) => {
      const data = d.data();
      answersMap.set(data.questionId, data.choiceId);
    });

    // Compute score
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    const categoryStats = new Map<
      string,
      { correct: number; total: number }
    >();

    for (const qId of questionIds) {
      const qData = questionsMap.get(qId);
      if (!qData) continue;

      const cat = qData.category;
      if (!categoryStats.has(cat)) {
        categoryStats.set(cat, { correct: 0, total: 0 });
      }
      const stats = categoryStats.get(cat)!;
      stats.total++;

      const userAnswer = answersMap.get(qId);
      if (!userAnswer) {
        unansweredCount++;
      } else if (userAnswer === qData.correctChoiceId) {
        correctCount++;
        stats.correct++;
      } else {
        wrongCount++;
      }
    }

    const totalQuestions = questionIds.length;
    const score =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    const breakdown: CategoryBreakdown[] = Array.from(
      categoryStats.entries()
    ).map(([category, stats]) => ({
      category,
      correct: stats.correct,
      total: stats.total,
    }));

    // Update attempt
    const updateData = {
      status: "submitted",
      submittedAt: Date.now(),
      score: Math.round(score * 10) / 10,
      correctCount,
      wrongCount,
      unansweredCount,
      breakdown,
    };

    await attemptRef.update(updateData);

    return NextResponse.json({
      success: true,
      score: updateData.score,
      correctCount,
      wrongCount,
      unansweredCount,
      breakdown,
    });
  } catch (err) {
    console.error("Finalize error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
