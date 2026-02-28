import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import proQuestions from "../../../../data/questions.csc_pro.json";
import subProQuestions from "../../../../data/questions.csc_subpro.json";

export async function POST() {
  try {
    const adminDb = getAdminDb();
    const allQuestions = [...proQuestions, ...subProQuestions];
    const batch = adminDb.batch();
    let count = 0;

    for (const q of allQuestions) {
      const ref = adminDb.collection("questions").doc(q.id);
      batch.set(ref, {
        id: q.id,
        examType: q.examType,
        category: q.category,
        text: q.text,
        choices: q.choices,
        correctChoiceId: q.correctChoiceId,
        explanation: q.explanation || "",
      });
      count++;
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      seeded: count,
      pro: proQuestions.length,
      subPro: subProQuestions.length,
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { error: "Seed failed", details: String(err) },
      { status: 500 }
    );
  }
}
