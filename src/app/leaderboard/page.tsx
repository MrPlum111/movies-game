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
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:h-16">
          <p className="font-[family-name:var(--font-display)] text-base font-black uppercase md:text-lg">
            Reel Speedruns
          </p>
          <Link
            href="/"
            className="border-2 border-white px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase hover:bg-white hover:text-black md:px-4 md:py-2"
          >
            ← Home
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div className="border-4 border-black bg-[#6657e8] p-4 text-white shadow-[6px_6px_0_#000] md:p-6 md:shadow-[8px_8px_0_#000]">
          <p className="font-[family-name:var(--font-mono)] text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd52e]">
            Hall of fame
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-black uppercase leading-none sm:text-4xl md:text-6xl">
            Leaderboard
          </h1>
          <p className="mt-3 max-w-xl font-[family-name:var(--font-mono)] text-[11px] font-bold md:text-xs">
            Completed classic runs only. Give-ups are stored as DNF and never
            ranked.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 md:mt-8 md:flex md:gap-3">
          <button
            type="button"
            onClick={() => setBoard("clicks")}
            className={`border-3 border-black px-3 py-3 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase shadow-[3px_3px_0_#000] md:px-4 md:shadow-[4px_4px_0_#000] ${
              board === "clicks" ? "bg-[#ffd52e]" : "bg-[#fffdf7]"
            }`}
          >
            Fewest clicks
          </button>
          <button
            type="button"
            onClick={() => setBoard("time")}
            className={`border-3 border-black px-3 py-3 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase shadow-[3px_3px_0_#000] md:px-4 md:shadow-[4px_4px_0_#000] ${
              board === "time" ? "bg-[#36ad72]" : "bg-[#fffdf7]"
            }`}
          >
            Fastest time
          </button>
        </div>

        {loading ? (
          <p className="mt-6 border-4 border-black bg-[#fffdf7] p-5 font-[family-name:var(--font-mono)] text-xs font-black uppercase shadow-[5px_5px_0_#000]">
            Loading scores…
          </p>
        ) : entries.length === 0 ? (
          <p className="mt-6 border-4 border-black bg-[#fffdf7] p-5 font-[family-name:var(--font-mono)] text-xs font-black shadow-[5px_5px_0_#000]">
            No scores yet — finish a run to appear here.
          </p>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="mt-5 space-y-3 md:hidden">
              {entries.map((e, i) => (
                <li
                  key={e.id}
                  className="border-4 border-black bg-[#fffdf7] shadow-[4px_4px_0_#000]"
                >
                  <div className="flex items-stretch border-b-3 border-black">
                    <div className="grid min-w-14 place-items-center bg-[#ef4438] px-2 font-[family-name:var(--font-mono)] text-lg font-black">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1 px-3 py-2">
                      <p className="truncate font-black">{e.name}</p>
                      <p className="mt-0.5 truncate font-[family-name:var(--font-mono)] text-[10px] font-bold text-[#6b645a]">
                        {e.startTitle} → {e.targetTitle}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 font-[family-name:var(--font-mono)] text-xs font-black">
                    <div className="border-r-3 border-black bg-[#ffd52e] px-3 py-2">
                      <span className="text-[9px] uppercase">Clicks</span>
                      <p className="text-xl leading-none">{e.clicks}</p>
                    </div>
                    <div className="bg-[#6657e8] px-3 py-2 text-white">
                      <span className="text-[9px] uppercase">Time</span>
                      <p className="text-xl leading-none tabular-nums">
                        {formatTime(e.timeMs)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="mt-8 hidden overflow-x-auto border-4 border-black bg-[#fffdf7] shadow-[8px_8px_0_#000] md:block">
              <table className="w-full text-left text-sm">
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
                    <tr
                      key={e.id}
                      className="border-b-2 border-black last:border-b-0 odd:bg-[#f4f0e8] hover:bg-[#ffd52e]"
                    >
                      <td className="p-3 font-[family-name:var(--font-mono)] font-black">
                        {i + 1}
                      </td>
                      <td className="p-3 font-black">{e.name}</td>
                      <td className="p-3 font-[family-name:var(--font-mono)] font-black">
                        {e.clicks}
                      </td>
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
            </div>
          </>
        )}
      </div>
    </main>
  );
}
