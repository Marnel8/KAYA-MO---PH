"use client";

interface BottomNavProps {
  currentIndex: number;
  total: number;
  isMarked: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleMark: () => void;
  onToggleOMR: () => void;
  onSubmit: () => void;
  showSubmit?: boolean;
}

export default function BottomNav({
  currentIndex,
  total,
  isMarked,
  onPrev,
  onNext,
  onToggleMark,
  onToggleOMR,
  onSubmit,
  showSubmit,
}: BottomNavProps) {
  return (
    <div className="bottom-nav">
      <button
        className="btn btn-ghost btn-sm"
        disabled={currentIndex <= 0}
        onClick={onPrev}
      >
        ← Prev
      </button>

      <div className="nav-center">
        <button
          className={`btn btn-sm ${isMarked ? "btn-warning" : "btn-ghost"}`}
          onClick={onToggleMark}
          title="Mark for review"
        >
          {isMarked ? "★" : "☆"}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onToggleOMR}>
          OMR
        </button>
        <span className="position-indicator">
          {currentIndex + 1}/{total}
        </span>
      </div>

      {showSubmit ? (
        <button className="btn btn-accent btn-sm" onClick={onSubmit}>
          Submit
        </button>
      ) : (
        <button
          className="btn btn-primary btn-sm"
          disabled={currentIndex >= total - 1}
          onClick={onNext}
        >
          Next →
        </button>
      )}
    </div>
  );
}
