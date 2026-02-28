/* ── Exam Types ── */
export type ExamType = "CSC_PRO" | "CSC_SUBPRO";
export type ExamMode = "simulation" | "practice";
export type AttemptStatus = "in_progress" | "submitted";

/* ── Blueprint ── */
export interface BlueprintMode {
  questionCount: number;
  timeLimitMinutes: number | null;
}

export interface Blueprint {
  examType: ExamType;
  simulation: BlueprintMode;
  practice: BlueprintMode;
}

/* ── Question ── */
export interface Choice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  examType: ExamType;
  category: string;
  text: string;
  choices: Choice[];
  correctChoiceId: string;
  explanation?: string;
}

/* ── Attempt ── */
export interface CategoryBreakdown {
  category: string;
  correct: number;
  total: number;
}

export interface Attempt {
  id: string;
  userId: string;
  examType: ExamType;
  mode: ExamMode;
  questionIds: string[];
  startedAt: number;          // epoch ms
  expiresAt: number | null;   // epoch ms, simulation only
  status: AttemptStatus;
  score: number | null;       // percentage 0-100
  correctCount: number | null;
  wrongCount: number | null;
  unansweredCount: number | null;
  breakdown: CategoryBreakdown[] | null;
  submittedAt: number | null; // epoch ms
}

/* ── Answer ── */
export interface Answer {
  questionId: string;
  choiceId: string;
  updatedAt: number; // epoch ms
}

/* ── User Profile ── */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  provider: string;
  createdAt: number; // epoch ms
}
