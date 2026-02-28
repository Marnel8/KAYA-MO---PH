"use client";

import { useEffect, useState, useCallback } from "react";

interface TimerProps {
  expiresAt: number;
  onExpire: () => void;
}

export default function Timer({ expiresAt, onExpire }: TimerProps) {
  const calcRemaining = useCallback(
    () => Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
    [expiresAt]
  );

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const r = calcRemaining();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [calcRemaining, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const timeClass =
    remaining <= 60
      ? "time danger"
      : remaining <= 300
        ? "time warning"
        : "time";

  return (
    <div className="timer-bar">
      <span style={{ color: "var(--text-secondary)" }}>Time Remaining</span>
      <span className={timeClass}>{formatted}</span>
    </div>
  );
}
