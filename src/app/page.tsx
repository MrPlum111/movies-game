"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EndpointSettingsPanel } from "@/components/EndpointSettingsPanel";
import {
  defaultChallengeSettings,
  difficultyLabel,
  parseChallengeSettings,
  type ChallengeSettings,
  type Difficulty,
} from "@/lib/challenge-settings";
import { createSession, saveSession } from "@/lib/game-session";

const SETTINGS_KEY = "moviesgame:settings";

export default function HomePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<ChallengeSettings>(defaultChallengeSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        setSettings(parseChallengeSettings(JSON.parse(raw)));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, hydrated]);

  async function startClassic() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate challenge");
      const session = createSession(data);
      saveSession(session);
      router.push("/play");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(196,74,54,0.12),_transparent_55%),linear-gradient(180deg,#f3efe6_0%,#e8e2d6_45%,#ddd5c6_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(90deg,transparent,transparent_11px,#1a1714_11px,#1a1714_12px)]" />

      <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted-fg)]">
          Film graph speedrun
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl leading-[0.95] tracking-tight md:text-7xl">
          Movies
          <span className="text-[var(--accent)]">Game</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--fg)]/80">
          Start on one title. Reach another. Move only{" "}
          <span className="font-medium text-[var(--fg)]">Movie → Person → Movie</span>.
          Tune how hard the path is, and shape the start and finish separately.
        </p>

        <section className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 p-4 backdrop-blur-sm md:p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-[var(--muted-fg)]">
                Difficulty
              </label>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl">
                {difficultyLabel(settings.difficulty)}
              </p>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={settings.difficulty}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  difficulty: Number(e.target.value) as Difficulty,
                }))
              }
              className="w-full max-w-md accent-[var(--accent)]"
            />
          </div>
          <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={settings.includeTv}
              onChange={(e) =>
                setSettings((s) => ({ ...s, includeTv: e.target.checked }))
              }
              className="size-4 accent-[var(--accent)]"
            />
            Include TV series as title nodes
          </label>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <EndpointSettingsPanel
            title="Start title"
            subtitle="Where your run begins"
            value={settings.start}
            onChange={(start) => setSettings((s) => ({ ...s, start }))}
          />
          <EndpointSettingsPanel
            title="End title"
            subtitle="The target you must reach"
            value={settings.end}
            onChange={(end) => setSettings((s) => ({ ...s, end }))}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void startClassic()}
            disabled={loading}
            className="rounded-md bg-[var(--fg)] px-5 py-3 text-sm font-semibold text-[var(--bg)] transition hover:bg-[var(--accent)] disabled:opacity-60"
          >
            {loading ? "Finding a route…" : "Play classic"}
          </button>
          <Link
            href="/leaderboard"
            className="rounded-md border border-[var(--border)] bg-[var(--bg)]/50 px-5 py-3 text-sm backdrop-blur-sm"
          >
            Leaderboard
          </Link>
          <button
            type="button"
            onClick={() => setSettings(defaultChallengeSettings())}
            className="px-3 py-3 text-sm text-[var(--muted-fg)] hover:text-[var(--fg)]"
          >
            Reset settings
          </button>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-[var(--accent)]" role="alert">
            {error}
          </p>
        ) : null}

        <p className="mt-10 text-xs text-[var(--muted-fg)]">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </main>
  );
}
