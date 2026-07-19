"use client";

import { useState } from "react";
import Link from "next/link";
import { PathTrail } from "@/components/PathTrail";
import { formatTime } from "@/lib/format";
import type { PathNode } from "@/lib/types";

type Props = {
  status: "won" | "dnf";
  clicks: number;
  timeMs: number;
  playerPath: PathNode[];
  shortestClicks: number;
  shortestPath: PathNode[];
  startTitle: string;
  targetTitle: string;
  onPlayAgain: () => void;
};

export function ResultPanel({
  status,
  clicks,
  timeMs,
  playerPath,
  shortestClicks,
  shortestPath,
  startTitle,
  targetTitle,
  onPlayAgain,
}: Props) {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submitScore() {
    if (status !== "won" || saved) return;
    setSaving(true);
    try {
      await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          clicks,
          timeMs,
          startTitle,
          targetTitle,
          status: "completed",
        }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="animate-fade-up max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-lg)]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted-fg)]">
          {status === "won" ? "Finished" : "Gave up"}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl">
          {status === "won" ? "You made it" : "Run ended"}
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-3 font-[family-name:var(--font-mono)] text-sm">
          <div className="rounded-lg bg-[var(--muted)] p-3">
            <p className="text-[var(--muted-fg)]">Your clicks</p>
            <p className="text-2xl font-semibold">{clicks}</p>
          </div>
          <div className="rounded-lg bg-[var(--muted)] p-3">
            <p className="text-[var(--muted-fg)]">Your time</p>
            <p className="text-2xl font-semibold tabular-nums">{formatTime(timeMs)}</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-fg)]">
            Your path
          </p>
          <div className="mt-2">
            <PathTrail path={playerPath} />
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-fg)]">
            Shortest known · {shortestClicks} clicks
          </p>
          <div className="mt-2">
            <PathTrail path={shortestPath} />
          </div>
        </div>

        {status === "won" ? (
          <div className="mt-6 space-y-2">
            <label className="block text-sm text-[var(--muted-fg)]" htmlFor="name">
              Name for leaderboard
            </label>
            <div className="flex gap-2">
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                placeholder="Anonymous"
                disabled={saved}
                className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={submitScore}
                disabled={saving || saved}
                className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] disabled:opacity-50"
              >
                {saved ? "Saved" : saving ? "Saving…" : "Submit"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded-md bg-[var(--fg)] px-4 py-2 text-sm font-medium text-[var(--bg)]"
          >
            Play again
          </button>
          <Link
            href="/leaderboard"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm"
          >
            Leaderboard
          </Link>
          <Link href="/" className="rounded-md px-4 py-2 text-sm text-[var(--muted-fg)]">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
