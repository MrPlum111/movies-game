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
    <main className="nb-dot-grid min-h-screen bg-[#f4f0e8] text-black">
      <nav className="border-b-4 border-black bg-black text-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <p className="font-[family-name:var(--font-display)] text-lg font-black uppercase">
            Reel Speedruns
          </p>
          <Link
            href="/"
            className="border-2 border-white px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase hover:bg-white hover:text-black"
          >
            ← Home
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="border-4 border-black bg-[#6657e8] p-6 text-white shadow-[8px_8px_0_#000]">
          <p className="font-[family-name:var(--font-mono)] text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd52e]">
            Hall of fame
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-black uppercase leading-none sm:text-6xl">
            Leaderboard
          </h1>
          <p className="mt-3 max-w-xl font-[family-name:var(--font-mono)] text-xs font-bold">
            Completed classic runs only. Give-ups are stored as DNF and never ranked.
          </p>
        </div>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => setBoard("clicks")}
          className={`border-3 border-black px-4 py-3 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase shadow-[4px_4px_0_#000] ${
            board === "clicks"
              ? "bg-[#ffd52e]"
              : "bg-[#fffdf7]"
          }`}
        >
          Fewest clicks
        </button>
        <button
          type="button"
          onClick={() => setBoard("time")}
          className={`border-3 border-black px-4 py-3 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase shadow-[4px_4px_0_#000] ${
            board === "time"
              ? "bg-[#36ad72]"
              : "bg-[#fffdf7]"
          }`}
        >
          Fastest time
        </button>
      </div>

      <div className="mt-8 overflow-x-auto border-4 border-black bg-[#fffdf7] shadow-[8px_8px_0_#000]">
        {loading ? (
          <p className="p-6 font-[family-name:var(--font-mono)] text-xs font-black uppercase">Loading scores…</p>
        ) : entries.length === 0 ? (
          <p className="p-6 font-[family-name:var(--font-mono)] text-xs font-black">No scores yet — finish a run to appear here.</p>
        ) : (
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b-4 border-black bg-[#ef4438] font-[family-name:var(--font-mono)] text-[10px] uppercase">
              <tr>
                <th className="p-3 font-black">#</th>
                <th className="p-3 font-black">Name</th>
                <th className="p-3 font-black">Clicks</th>
                <th className="p-3 font-black">Time</th>
                <th className="p-3 font-black">Route</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} className="border-b-2 border-black last:border-b-0 odd:bg-[#f4f0e8] hover:bg-[#ffd52e]">
                  <td className="p-3 font-[family-name:var(--font-mono)] font-black">{i + 1}</td>
                  <td className="p-3 font-black">{e.name}</td>
                  <td className="p-3 font-[family-name:var(--font-mono)] font-black">{e.clicks}</td>
                  <td className="p-3 font-[family-name:var(--font-mono)] font-black tabular-nums">
                    {formatTime(e.timeMs)}
                  </td>
                  <td className="p-3 font-[family-name:var(--font-mono)] text-xs">
                    {e.startTitle} → {e.targetTitle}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </main>
  );
}
