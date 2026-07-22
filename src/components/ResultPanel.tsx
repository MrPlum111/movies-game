"use client";

import { useState } from "react";
import Link from "next/link";
import { PathTrail } from "@/components/PathTrail";
import { formatTime } from "@/lib/format";
import {
  absoluteShareUrl,
  canShareChallenge,
  encodeSharedChallenge,
} from "@/lib/share-challenge";
import type { ChallengeEndpoint, PathNode } from "@/lib/types";
import { challengeEndpointLabel } from "@/lib/types";

type Props = {
  status: "won" | "dnf";
  clicks: number;
  timeMs: number;
  playerPath: PathNode[];
  shortestClicks: number;
  shortestPath: PathNode[];
  start: ChallengeEndpoint;
  target: ChallengeEndpoint;
  includeTv: boolean;
  onPlayAgain: () => void;
};

export function ResultPanel({
  status,
  clicks,
  timeMs,
  playerPath,
  shortestClicks,
  shortestPath,
  start,
  target,
  includeTv,
  onPlayAgain,
}: Props) {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

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
          startTitle: challengeEndpointLabel(start),
          targetTitle: challengeEndpointLabel(target),
          status: "completed",
        }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function copyShareLink() {
    if (start.kind !== "title" || target.kind !== "title") return;
    const url = absoluteShareUrl(
      encodeSharedChallenge(start, target, includeTv),
    );
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this challenge link:", url);
    }
  }

  return (
    <div className="nb-dot-grid fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="animate-fade-up max-h-[90vh] w-full max-w-xl overflow-y-auto border-4 border-black bg-[#fffdf7] shadow-[10px_10px_0_#000]">
        <div
          className={`border-b-4 border-black p-5 ${
            status === "won" ? "bg-[#36ad72]" : "bg-[#ef4438]"
          }`}
        >
          <p className="font-[family-name:var(--font-mono)] text-[10px] font-black uppercase tracking-[0.2em]">
            {status === "won" ? "Run complete" : "Run terminated"}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-black uppercase leading-none">
            {status === "won" ? "You made it!" : "Run ended"}
          </h2>
        </div>

        <div className="grid grid-cols-2 border-b-4 border-black font-[family-name:var(--font-mono)] text-sm">
          <div className="border-r-4 border-black bg-[#ffd52e] p-4">
            <p className="text-[10px] font-black uppercase">Your clicks</p>
            <p className="text-3xl font-black">{clicks}</p>
          </div>
          <div className="bg-[#6657e8] p-4 text-white">
            <p className="text-[10px] font-black uppercase">Your time</p>
            <p className="text-3xl font-black tabular-nums">
              {formatTime(timeMs)}
            </p>
          </div>
        </div>

        <div className="border-b-3 border-black p-5">
          <p className="font-[family-name:var(--font-mono)] text-[10px] font-black uppercase tracking-[0.16em]">
            Your path · tap a name to peek
          </p>
          <div className="mt-2">
            <PathTrail
              path={playerPath}
              interactive
              includeTv={includeTv}
            />
          </div>
        </div>

        <div className="border-b-3 border-black p-5">
          <p className="font-[family-name:var(--font-mono)] text-[10px] font-black uppercase tracking-[0.16em]">
            Shortest known · {shortestClicks} clicks · tap to peek
          </p>
          <div className="mt-2">
            <PathTrail
              path={shortestPath}
              interactive
              includeTv={includeTv}
            />
          </div>
        </div>

        {status === "won" ? (
          <div className="space-y-2 border-b-3 border-black bg-[#f4f0e8] p-5">
            <label
              className="block font-[family-name:var(--font-mono)] text-[10px] font-black uppercase"
              htmlFor="name"
            >
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
                className="min-w-0 flex-1 border-3 border-black bg-[#fffdf7] px-3 py-2 font-[family-name:var(--font-mono)] text-sm outline-none focus:bg-[#ffd52e]"
              />
              <button
                type="button"
                onClick={submitScore}
                disabled={saving || saved}
                className="border-3 border-black bg-[#36ad72] px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
              >
                {saved ? "Saved" : saving ? "Saving…" : "Submit"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 p-5">
          <button
            type="button"
            onClick={onPlayAgain}
            className="border-3 border-black bg-black px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase text-white shadow-[3px_3px_0_#6657e8]"
          >
            Play again
          </button>
          {canShareChallenge(start, target) ? (
          <button
            type="button"
            onClick={() => void copyShareLink()}
            className="border-3 border-black bg-[#9a57dc] px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase text-white shadow-[3px_3px_0_#000]"
          >
            {copied ? "Link copied" : "Share challenge"}
          </button>
          ) : null}
          <Link
            href="/leaderboard"
            className="border-3 border-black bg-[#ffd52e] px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase shadow-[3px_3px_0_#000]"
          >
            Leaderboard
          </Link>
          <Link
            href="/"
            className="border-3 border-black bg-[#fffdf7] px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
