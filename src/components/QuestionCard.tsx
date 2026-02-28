"use client";

import { motion } from "framer-motion";
import type { Question } from "@/types";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  selectedChoiceId: string | undefined;
  onSelect: (choiceId: string) => void;
  isReview?: boolean;
}

const letters = ["A", "B", "C", "D"];

export default function QuestionCard({
  question,
  index,
  total,
  selectedChoiceId,
  onSelect,
  isReview,
}: QuestionCardProps) {
  const correctChoice = question.choices.find(
    (choice) => choice.id === question.correctChoiceId
  );

  return (
    <motion.div
      className="question-card"
      key={question.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.15 }}
    >
      <div className="q-category">{question.category}</div>
      <div className="q-number">
        Question {index + 1} of {total}
      </div>
      <div className="q-text">{question.text}</div>
      <div className="choices-list">
        {question.choices.map((choice, i) => {
          const isSelected = selectedChoiceId === choice.id;
          const isCorrect = isReview && choice.id === question.correctChoiceId;
          const isWrong =
            isReview && isSelected && choice.id !== question.correctChoiceId;

          let className = "choice-btn";
          if (isCorrect) className += " choice-btn--correct";
          else if (isWrong) className += " choice-btn--wrong";
          else if (isSelected) className += " choice-btn--selected";

          return (
            <button
              key={choice.id}
              className={className}
              onClick={() => !isReview && onSelect(choice.id)}
              disabled={isReview}
            >
              <span className="choice-letter">{letters[i]}</span>
              <span>{choice.text}</span>
            </button>
          );
        })}
      </div>

      {isReview && (
        <div
          style={{
            marginTop: "var(--sp-4)",
            padding: "var(--sp-3)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            background: "var(--surface)",
          }}
        >
          <p style={{ fontSize: "var(--fs-sm)", marginBottom: "var(--sp-2)" }}>
            <strong>Correct answer:</strong> {correctChoice?.text || "N/A"}
          </p>
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            <strong>Explanation:</strong> {question.explanation || "No explanation available."}
          </p>
        </div>
      )}
    </motion.div>
  );
}
