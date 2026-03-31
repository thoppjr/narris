import { useEffect, useState, useMemo } from "react";
import { useGoalsStore } from "../stores/goalsStore";
import { useChapterStore } from "../stores/chapterStore";
import type { WritingGoal } from "../lib/commands";

interface WritingHabitsProps {
  projectId: string;
  onClose: () => void;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(deadline: string): number {
  if (!deadline) return 0;
  const now = new Date();
  const target = new Date(deadline + "T23:59:59");
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDate(d: string): string {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function WritingHabits({ projectId, onClose }: WritingHabitsProps) {
  const { goal, logs, loadGoal, saveGoal, loadLogs, logWords, clear } = useGoalsStore();
  const chapters = useChapterStore((s) => s.chapters);
  const [activeTab, setActiveTab] = useState<"overview" | "goals" | "history">("overview");

  const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);

  useEffect(() => {
    loadGoal(projectId);
    loadLogs(projectId);
    return () => clear();
  }, [projectId, loadGoal, loadLogs, clear]);

  // Auto-log today's word count on load
  useEffect(() => {
    if (totalWords > 0) {
      const today = todayStr();
      const todayLog = logs.find((l) => l.date === today);
      const wordsWritten = todayLog ? Math.max(0, totalWords - (todayLog.word_count - todayLog.words_written)) : 0;
      logWords(projectId, today, totalWords, wordsWritten, 0);
    }
  }, [totalWords]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabBtn = (tab: typeof activeTab, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
        activeTab === tab
          ? "bg-sage-600 text-white"
          : "bg-sand-100 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="h-screen flex flex-col bg-sand-50 dark:bg-stone-900">
      <div className="px-6 py-4 border-b border-sand-200 dark:border-stone-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-sand-200">Writing Habits</h2>
        <button
          onClick={onClose}
          className="px-4 py-1.5 text-sm rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-300 transition-colors"
        >
          Done
        </button>
      </div>

      <div className="px-6 py-3 border-b border-sand-200 dark:border-stone-700 flex gap-2">
        {tabBtn("overview", "Overview")}
        {tabBtn("goals", "Goal Setting")}
        {tabBtn("history", "History")}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === "overview" && <OverviewTab totalWords={totalWords} goal={goal} logs={logs} />}
        {activeTab === "goals" && <GoalsTab projectId={projectId} goal={goal} totalWords={totalWords} saveGoal={saveGoal} />}
        {activeTab === "history" && <HistoryTab logs={logs} />}
      </div>
    </div>
  );
}

function OverviewTab({ totalWords, goal, logs }: {
  totalWords: number;
  goal: WritingGoal | null;
  logs: import("../lib/commands").DailyLog[];
}) {
  const today = todayStr();
  const todayLog = logs.find((l) => l.date === today);
  const wordsToday = todayLog?.words_written ?? 0;

  // Calculate streak
  const streak = useMemo(() => {
    let count = 0;
    const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = d.toISOString().slice(0, 10);
      const log = sortedLogs.find((l) => l.date === dateStr);
      if (log && log.words_written > 0) {
        count++;
      } else if (i > 0) {
        break;
      }
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [logs]);

  // Last 7 days avg
  const weekAvg = useMemo(() => {
    const d = new Date();
    let total = 0;
    let days = 0;
    for (let i = 0; i < 7; i++) {
      const dateStr = d.toISOString().slice(0, 10);
      const log = logs.find((l) => l.date === dateStr);
      if (log) {
        total += log.words_written;
        days++;
      }
      d.setDate(d.getDate() - 1);
    }
    return days > 0 ? Math.round(total / days) : 0;
  }, [logs]);

  const daysLeft = goal ? daysUntil(goal.deadline) : 0;
  const wordsRemaining = goal ? Math.max(0, goal.target_word_count - totalWords) : 0;
  const dailyTarget = goal && daysLeft > 0 ? Math.ceil(wordsRemaining / daysLeft) : 0;
  const progress = goal && goal.target_word_count > 0 ? Math.min(100, (totalWords / goal.target_word_count) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Words" value={totalWords.toLocaleString()} />
        <StatCard label="Words Today" value={wordsToday.toLocaleString()} />
        <StatCard label="Writing Streak" value={`${streak} day${streak !== 1 ? "s" : ""}`} />
        <StatCard label="7-Day Average" value={`${weekAvg.toLocaleString()} /day`} />
      </div>

      {/* Goal progress */}
      {goal && goal.target_word_count > 0 && (
        <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-sand-200 dark:border-stone-700">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-stone-800 dark:text-sand-200">Manuscript Goal</h3>
            <span className="text-xs text-ink-muted dark:text-sand-400">
              {totalWords.toLocaleString()} / {goal.target_word_count.toLocaleString()} words
            </span>
          </div>
          <div className="w-full h-3 bg-sand-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-ink-muted dark:text-sand-400">
            <span>{progress.toFixed(1)}% complete</span>
            <span>{wordsRemaining.toLocaleString()} remaining</span>
          </div>
          {goal.deadline && daysLeft > 0 && (
            <div className="mt-3 p-3 bg-sand-50 dark:bg-stone-900 rounded-lg">
              <div className="text-xs text-ink-muted dark:text-sand-400">
                {daysLeft} days until deadline ({goal.deadline})
              </div>
              <div className="text-sm font-medium text-sage-700 dark:text-sage-300 mt-1">
                Write ~{dailyTarget.toLocaleString()} words/day to finish on time
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mini chart - last 14 days */}
      <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-sand-200 dark:border-stone-700">
        <h3 className="text-sm font-medium text-stone-800 dark:text-sand-200 mb-4">Last 14 Days</h3>
        <MiniChart logs={logs} days={14} />
      </div>

      {/* Page estimate */}
      <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-sand-200 dark:border-stone-700">
        <h3 className="text-sm font-medium text-stone-800 dark:text-sand-200 mb-2">Estimates</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-stone-800 dark:text-sand-200">{Math.ceil(totalWords / 250)}</div>
            <div className="text-xs text-ink-muted dark:text-sand-400">Pages (print)</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-stone-800 dark:text-sand-200">{Math.ceil(totalWords / 275)}</div>
            <div className="text-xs text-ink-muted dark:text-sand-400">Pages (ebook)</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-stone-800 dark:text-sand-200">
              {totalWords < 40000 ? "Novella" : totalWords < 80000 ? "Short Novel" : totalWords < 120000 ? "Novel" : "Epic"}
            </div>
            <div className="text-xs text-ink-muted dark:text-sand-400">Category</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalsTab({ projectId, goal, totalWords, saveGoal }: {
  projectId: string;
  goal: WritingGoal | null;
  totalWords: number;
  saveGoal: (goal: WritingGoal) => Promise<void>;
}) {
  const [target, setTarget] = useState(goal?.target_word_count ?? 80000);
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");

  useEffect(() => {
    if (goal) {
      setTarget(goal.target_word_count);
      setDeadline(goal.deadline);
    }
  }, [goal]);

  const handleSave = () => {
    saveGoal({
      id: goal?.id ?? generateId(),
      project_id: projectId,
      target_word_count: target,
      deadline,
      created_at: goal?.created_at ?? new Date().toISOString(),
    });
  };

  const presets = [
    { label: "Novella", words: 30000 },
    { label: "Short Novel", words: 60000 },
    { label: "Novel", words: 80000 },
    { label: "Epic", words: 120000 },
  ];

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <label className="block text-xs font-medium text-stone-600 dark:text-sand-400 mb-2">Target Word Count</label>
        <input
          type="number"
          value={target}
          onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
          className="input-field mb-3"
          min={1000}
          step={1000}
        />
        <div className="flex gap-2 flex-wrap">
          {presets.map((p) => (
            <button
              key={p.words}
              onClick={() => setTarget(p.words)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                target === p.words
                  ? "border-sage-500 bg-sage-50 dark:bg-sage-900/30 text-sage-700"
                  : "border-sand-200 dark:border-stone-700 text-stone-600 dark:text-sand-400 hover:border-sage-300"
              }`}
            >
              {p.label} ({p.words.toLocaleString()})
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-600 dark:text-sand-400 mb-2">Deadline (optional)</label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="input-field"
          min={todayStr()}
        />
      </div>

      {deadline && target > totalWords && (
        <div className="p-4 bg-sage-50 dark:bg-sage-900/20 rounded-xl border border-sage-200 dark:border-sage-800">
          <div className="text-sm text-sage-800 dark:text-sage-200">
            {daysUntil(deadline)} days remaining. Write{" "}
            <strong>~{Math.ceil((target - totalWords) / Math.max(1, daysUntil(deadline))).toLocaleString()}</strong>{" "}
            words per day to reach your goal.
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        className="px-6 py-2.5 rounded-lg bg-sage-600 text-white text-sm font-medium hover:bg-sage-700 transition-colors"
      >
        Save Goal
      </button>
    </div>
  );
}

function HistoryTab({ logs }: { logs: import("../lib/commands").DailyLog[] }) {
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const totalWritten = logs.reduce((sum, l) => sum + l.words_written, 0);
  const activeDays = logs.filter((l) => l.words_written > 0).length;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex gap-4 text-sm text-ink-muted dark:text-sand-400">
        <span>{activeDays} active days</span>
        <span>{totalWritten.toLocaleString()} total words written</span>
        <span>{activeDays > 0 ? Math.round(totalWritten / activeDays).toLocaleString() : 0} avg/day</span>
      </div>

      {/* 30-day chart */}
      <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-sand-200 dark:border-stone-700">
        <h3 className="text-sm font-medium text-stone-800 dark:text-sand-200 mb-4">Last 30 Days</h3>
        <MiniChart logs={logs} days={30} />
      </div>

      {/* Log table */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 dark:border-stone-700">
              <th className="text-left px-4 py-2 text-xs font-medium text-ink-muted dark:text-sand-400">Date</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-ink-muted dark:text-sand-400">Words Written</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-ink-muted dark:text-sand-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.slice(0, 50).map((log) => (
              <tr key={log.date} className="border-b border-sand-100 dark:border-stone-700/50 last:border-0">
                <td className="px-4 py-2 text-stone-700 dark:text-sand-300">{formatDate(log.date)}</td>
                <td className="px-4 py-2 text-right">
                  <span className={log.words_written > 0 ? "text-sage-600 dark:text-sage-400 font-medium" : "text-ink-muted dark:text-sand-500"}>
                    {log.words_written > 0 ? `+${log.words_written.toLocaleString()}` : "0"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right text-stone-600 dark:text-sand-400">{log.word_count.toLocaleString()}</td>
              </tr>
            ))}
            {sortedLogs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-ink-muted dark:text-sand-400">
                  No writing history yet. Start writing to track your progress!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniChart({ logs, days }: { logs: import("../lib/commands").DailyLog[]; days: number }) {
  const chartData = useMemo(() => {
    const data: { date: string; words: number }[] = [];
    const d = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date(d);
      dt.setDate(dt.getDate() - i);
      const dateStr = dt.toISOString().slice(0, 10);
      const log = logs.find((l) => l.date === dateStr);
      data.push({ date: dateStr, words: log?.words_written ?? 0 });
    }
    return data;
  }, [logs, days]);

  const maxWords = Math.max(1, ...chartData.map((d) => d.words));

  return (
    <div className="flex items-end gap-1 h-24">
      {chartData.map((d) => {
        const height = d.words > 0 ? Math.max(4, (d.words / maxWords) * 100) : 0;
        return (
          <div
            key={d.date}
            className="flex-1 flex flex-col items-center justify-end group relative"
          >
            <div
              className={`w-full rounded-t transition-all ${
                d.words > 0 ? "bg-sage-400 dark:bg-sage-600" : "bg-sand-200 dark:bg-stone-700"
              }`}
              style={{ height: `${height}%`, minHeight: d.words > 0 ? "4px" : "2px" }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 hidden group-hover:block bg-stone-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
              {formatDate(d.date)}: {d.words.toLocaleString()} words
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl p-4 border border-sand-200 dark:border-stone-700">
      <div className="text-xs text-ink-muted dark:text-sand-400 mb-1">{label}</div>
      <div className="text-xl font-semibold text-stone-800 dark:text-sand-200">{value}</div>
    </div>
  );
}
