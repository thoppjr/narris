import { useState, useEffect, useRef, useCallback } from "react";

interface SprintTimerProps {
  isOpen: boolean;
  onClose: () => void;
  currentWordCount: number;
}

type TimerState = "idle" | "running" | "paused" | "done";

export default function SprintTimer({ isOpen, onClose, currentWordCount }: SprintTimerProps) {
  const [duration, setDuration] = useState(25); // minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [state, setState] = useState<TimerState>("idle");
  const [startWords, setStartWords] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const wordsWritten = currentWordCount - startWords;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const handleStart = () => {
    setStartWords(currentWordCount);
    setTimeLeft(duration * 60);
    setState("running");
    clearTimer();
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setState("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePause = () => {
    clearTimer();
    setState("paused");
  };

  const handleResume = () => {
    setState("running");
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setState("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleReset = () => {
    clearTimer();
    setState("idle");
    setTimeLeft(duration * 60);
    setStartWords(0);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = state === "idle" ? 0 : 1 - timeLeft / (duration * 60);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 right-4 z-50 bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 shadow-lg p-5 w-72">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-stone-700 dark:text-sand-200">Sprint Timer</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-sand-100 dark:hover:bg-stone-700 text-ink-muted transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Timer display */}
      <div className="text-center mb-4">
        <div className="text-4xl font-light text-stone-800 dark:text-sand-100 tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-sand-200 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage-500 rounded-full transition-all duration-1000"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Duration selector (only when idle) */}
      {state === "idle" && (
        <div className="flex gap-2 mb-4 justify-center">
          {[10, 15, 25, 30, 45].map((m) => (
            <button
              key={m}
              onClick={() => {
                setDuration(m);
                setTimeLeft(m * 60);
              }}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors
                ${duration === m
                  ? "bg-sage-600 text-white"
                  : "bg-sand-100 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-200"
                }`}
            >
              {m}m
            </button>
          ))}
        </div>
      )}

      {/* Stats (when running or done) */}
      {state !== "idle" && (
        <div className="text-center mb-4 text-sm text-ink-muted dark:text-sand-400">
          {wordsWritten > 0 ? `${wordsWritten.toLocaleString()} words written` : "Start writing!"}
        </div>
      )}

      {/* Done message */}
      {state === "done" && (
        <div className="text-center mb-4 px-3 py-2 bg-sage-50 dark:bg-sage-900 rounded-lg">
          <div className="text-sage-700 dark:text-sage-300 font-medium text-sm">Sprint complete!</div>
          <div className="text-sage-600 dark:text-sage-400 text-xs mt-0.5">
            You wrote {wordsWritten.toLocaleString()} words
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {state === "idle" && (
          <button
            onClick={handleStart}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-sage-600 text-white font-medium
                       hover:bg-sage-700 transition-colors"
          >
            Start Sprint
          </button>
        )}
        {state === "running" && (
          <button
            onClick={handlePause}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-700 dark:text-sand-200 font-medium
                       hover:bg-sand-300 transition-colors"
          >
            Pause
          </button>
        )}
        {state === "paused" && (
          <>
            <button
              onClick={handleResume}
              className="flex-1 px-4 py-2 text-sm rounded-lg bg-sage-600 text-white font-medium
                         hover:bg-sage-700 transition-colors"
            >
              Resume
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-700 dark:text-sand-200 font-medium
                         hover:bg-sand-300 transition-colors"
            >
              Reset
            </button>
          </>
        )}
        {state === "done" && (
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-sage-600 text-white font-medium
                       hover:bg-sage-700 transition-colors"
          >
            New Sprint
          </button>
        )}
      </div>
    </div>
  );
}
