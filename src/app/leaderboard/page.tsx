"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatTime } from "@/lib/format";
import type { ScoreEntry } from "@/lib/types";

export default function LeaderboardPage() {
  const [board, setBoard] = useState<"clicks" | "time">("clicks");
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/scores?board=${board}`)
      .then((r) => r.json())
      .then((data: { entries: ScoreEntry[] }) => {
        if (!cancelled) setEntries(data.entries ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [board]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-[var(--muted-fg)] hover:text-[var(--accent)]">
        ← Home
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl">
        Leaderboard
      </h1>
      <p className="mt-2 text-[var(--muted-fg)]">
        Completed classic runs only. Give-ups are stored as DNF and never ranked.
      </p>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setBoard("clicks")}
          className={`rounded-md px-3 py-1.5 text-sm ${
            board === "clicks"
              ? "bg-[var(--fg)] text-[var(--bg)]"
              : "border border-[var(--border)]"
          }`}
        >
          Fewest clicks
        </button>
        <button
          type="button"
          onClick={() => setBoard("time")}
          className={`rounded-md px-3 py-1.5 text-sm ${
            board === "time"
              ? "bg-[var(--fg)] text-[var(--bg)]"
              : "border border-[var(--border)]"
          }`}
        >
          Fastest time
        </button>
      </div>

      <div className="mt-8 overflow-x-auto">
        {loading ? (
          <p className="text-[var(--muted-fg)]">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-[var(--muted-fg)]">No scores yet — finish a run to appear here.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-[var(--muted-fg)]">
              <tr>
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Clicks</th>
                <th className="py-2 pr-3 font-medium">Time</th>
                <th className="py-2 font-medium">Route</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} className="border-b border-[var(--border)]/70">
                  <td className="py-3 pr-3 font-[family-name:var(--font-mono)]">{i + 1}</td>
                  <td className="py-3 pr-3 font-medium">{e.name}</td>
                  <td className="py-3 pr-3 font-[family-name:var(--font-mono)]">{e.clicks}</td>
                  <td className="py-3 pr-3 font-[family-name:var(--font-mono)] tabular-nums">
                    {formatTime(e.timeMs)}
                  </td>
                  <td className="py-3 text-[var(--muted-fg)]">
                    {e.startTitle} → {e.targetTitle}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
