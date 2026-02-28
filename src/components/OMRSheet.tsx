"use client";

import type { Question } from "@/types";

interface OMRSheetProps {
  questions: Question[];
  currentIndex: number;
  localAnswers: Map<string, string>;
  markedIds: Set<string>;
  onJump: (index: number) => void;
  onClose: () => void;
  isReview?: boolean;
}

const letters = ["A", "B", "C", "D"];

export default function OMRSheet({
  questions,
  currentIndex,
  localAnswers,
  markedIds,
  onJump,
  onClose,
  isReview,
}: OMRSheetProps) {
  return (
    <>
      <div className="omr-overlay" onClick={onClose} />
      <div className="omr-panel">
        <div className="omr-panel-header">
          <h4>Answer Sheet</h4>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="omr-grid">
          {questions.map((q, idx) => {
            const answer = localAnswers.get(q.id);
            const isMarked = markedIds.has(q.id);
            const isCurrent = idx === currentIndex;

            let itemClass = "omr-item";
            if (isCurrent) itemClass += " omr-item--active";
            if (isMarked) itemClass += " omr-item--marked";

            return (
              <div
                key={q.id}
                className={itemClass}
                onClick={() => {
                  onJump(idx);
                  onClose();
                }}
              >
                <span className="q-num">{idx + 1}</span>
                <div className="circles">
                  {q.choices.map((c, ci) => {
                    const isSelected = answer === c.id;
                    const isCorrectChoice =
                      isReview && c.id === q.correctChoiceId;
                    const isWrongChoice =
                      isReview && isSelected && c.id !== q.correctChoiceId;

                    let circleClass = "omr-circle";
                    if (isCorrectChoice && isReview)
                      circleClass += " omr-circle--correct";
                    else if (isWrongChoice)
                      circleClass += " omr-circle--wrong";
                    else if (isSelected)
                      circleClass += " omr-circle--selected";
                    else if (isMarked && !isReview)
                      circleClass += " omr-circle--marked";

                    return (
                      <span key={c.id} className={circleClass}>
                        {letters[ci]}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
