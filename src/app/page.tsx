"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChallengeLaunchSequence } from "@/components/ChallengeLaunchSequence";
import {
  defaultChallengeSettings,
  endpointKindLabel,
  parseChallengeSettings,
  pathFilterLabel,
  randomChallengeSettings,
  type ChallengeSettings,
  type Difficulty,
  type EndpointKind,
  type PathFilter,
} from "@/lib/challenge-settings";
import { createSession, saveSession } from "@/lib/game-session";
import { parseSharedChallenge } from "@/lib/share-challenge";
import type { Challenge } from "@/lib/types";

const SETTINGS_KEY = "moviesgame:settings:v2";

export default function HomePage() {
  const router = useRouter();
  const sharedBootstrapped = useRef(false);
  const [settings, setSettings] = useState<ChallengeSettings>(() =>
    defaultChallengeSettings(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [pendingChallenge, setPendingChallenge] =
    useState<Challenge | null>(null);

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

  const startFromBody = useCallback(async (body: unknown) => {
    setLoading(true);
    setError(null);
    setPendingChallenge(null);
    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as Challenge & { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not generate challenge");
      setPendingChallenge(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || sharedBootstrapped.current) return;
    const shared = parseSharedChallenge(
      new URLSearchParams(window.location.search),
    );
    if (!shared) return;
    sharedBootstrapped.current = true;
    void startFromBody({
      startRef: shared.start,
      targetRef: shared.target,
      includeTv: shared.includeTv,
    });
  }, [hydrated, startFromBody]);

  async function startClassic() {
    await startFromBody(settings);
  }

  async function startRandom() {
    const randomized = randomChallengeSettings();
    setSettings(randomized);
    await startFromBody(randomized);
  }

  const finishLaunch = useCallback(() => {
    if (!pendingChallenge) return;
    const session = createSession(pendingChallenge);
    saveSession(session);
    sessionStorage.setItem("moviesgame:opening", "1");
    router.push("/play");
  }, [pendingChallenge, router]);

  function setYears(field: "yearFrom" | "yearTo", value: number | null) {
    setSettings((current) => ({
      ...current,
      start: { ...current.start, [field]: value },
      end: { ...current.end, [field]: value },
    }));
  }

  function setMinimumRating(value: number) {
    setSettings((current) => ({
      ...current,
      start: { ...current.start, minRating: value },
      end: { ...current.end, minRating: value },
    }));
  }

  const difficulties: {
    value: Difficulty;
    label: string;
    mark: string;
  }[] = [
    { value: 2, label: "Normal", mark: "★" },
    { value: 3, label: "Hard", mark: "★★" },
    { value: 4, label: "Expert", mark: "★★★" },
  ];

  const endpointKinds: EndpointKind[] = ["title", "actor", "director"];
  const pathFilters: PathFilter[] = ["any", "acting", "directing"];
  const rating = settings.start.minRating;

  const pathBlurb =
    settings.endpointKind === "title"
      ? "Start on one title. Reach another through people."
      : settings.endpointKind === "actor"
        ? "Start on one actor. Reach another through titles."
        : "Start on one director. Reach another through titles.";

  return (
    <main className="nb-dot-grid min-h-screen overflow-x-hidden bg-[#f4f0e8] text-black">
      <nav className="border-b-4 border-black bg-black text-white">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <span className="h-1 w-14 bg-white" />
            <h1 className="font-[family-name:var(--font-display)] text-xl font-black uppercase tracking-tight">
              Reel Speedruns
            </h1>
          </div>
          <Link
            href="/leaderboard"
            className="border-2 border-white px-4 py-2 font-[family-name:var(--font-mono)] text-xs font-bold uppercase transition hover:bg-white hover:text-black"
          >
            Leaderboard
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-[1400px] px-8 py-5">
        <header className="grid grid-cols-[0.9fr_1.1fr] items-center gap-5">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(2.15rem,3.5vw,3.8rem)] font-black uppercase leading-[0.9] tracking-[-0.055em]">
              <span className="block whitespace-nowrap">How fast can</span>
              <span className="block whitespace-nowrap">you connect</span>
              <span className="block whitespace-nowrap text-[#ef4438]">
                the movies?
              </span>
            </h2>
            <div className="mt-4 inline-flex flex-col items-start font-[family-name:var(--font-mono)] text-xs font-bold uppercase">
              <span className="bg-black px-3 py-0.5 text-white">
                Pick two endpoints.
              </span>
              <span className="-mt-px border-2 border-black bg-[#ffd52e] px-3 py-0.5">
                Bridge them through the graph.
              </span>
            </div>
            <p className="mt-3 max-w-sm font-[family-name:var(--font-mono)] text-[11px] leading-relaxed">
              {pathBlurb} Find the shortest path before the clock gets away
              from you.
            </p>
          </div>

          <div className="relative border-4 border-black bg-[#fffdf7] p-5 shadow-[8px_8px_0_#000]">
            <div className="flex items-center justify-center gap-2 xl:gap-4">
              <div className="grid size-20 shrink-0 place-items-center border-4 border-black bg-[#ef4438] xl:size-24">
                <span className="text-2xl xl:text-3xl" aria-hidden>
                  🎬
                </span>
                <span className="font-[family-name:var(--font-mono)] text-xs font-black uppercase">
                  Movie
                </span>
              </div>
              <span className="text-2xl font-black xl:text-3xl" aria-hidden>
                →
              </span>
              <div className="grid size-20 shrink-0 place-items-center border-4 border-black bg-[#6657e8] text-white xl:size-24">
                <span className="text-2xl xl:text-3xl" aria-hidden>
                  ●
                </span>
                <span className="font-[family-name:var(--font-mono)] text-xs font-black uppercase">
                  Person
                </span>
              </div>
              <span className="text-2xl font-black xl:text-3xl" aria-hidden>
                →
              </span>
              <div className="grid size-20 shrink-0 place-items-center border-4 border-black bg-[#ef4438] xl:size-24">
                <span className="text-2xl xl:text-3xl" aria-hidden>
                  🎬
                </span>
                <span className="font-[family-name:var(--font-mono)] text-xs font-black uppercase">
                  Movie
                </span>
              </div>
            </div>
            <div className="nb-starburst absolute right-1 top-1 grid size-20 place-items-center bg-[#ffd52e] p-3 text-center font-[family-name:var(--font-mono)] text-[8px] font-black uppercase leading-tight xl:size-24 xl:text-[10px]">
              Every path is a story.
            </div>
          </div>
        </header>

        <div className="mt-5 grid grid-cols-12 gap-4">
          <section className="col-span-7 border-4 border-black bg-[#fffdf7] shadow-[7px_7px_0_#000]">
            <div className="flex items-center gap-3 border-b-4 border-black bg-[#6657e8] px-5 py-3 text-white">
              <span className="text-xl" aria-hidden>
                ▥
              </span>
              <h3 className="font-[family-name:var(--font-mono)] text-sm font-black uppercase">
                Game settings
              </h3>
            </div>
            <div className="grid grid-cols-[1.45fr_0.85fr]">
              <div className="border-r-4 border-black p-5">
                <p className="font-[family-name:var(--font-mono)] text-xs font-black uppercase">
                  Difficulty
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {difficulties.map((item) => {
                    const active = settings.difficulty === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setSettings((current) => ({
                            ...current,
                            difficulty: item.value,
                          }))
                        }
                        className={`min-h-28 border-3 border-black p-2 text-center shadow-[3px_3px_0_#000] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                          active ? "bg-[#36ad72]" : "bg-[#fffdf7]"
                        }`}
                      >
                        <span className="block text-xl font-black">
                          {item.mark}
                        </span>
                        <span className="mt-3 block font-[family-name:var(--font-mono)] text-[11px] font-black uppercase">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 font-[family-name:var(--font-mono)] text-[10px]">
                  Difficulty controls the expected shortest path length.
                </p>
              </div>
              <div className="divide-y-2 divide-black">
                <label className="flex cursor-pointer items-center justify-between gap-4 p-5">
                  <span>
                    <span className="block font-[family-name:var(--font-mono)] text-xs font-black uppercase">
                      Include TV series
                    </span>
                    <span className="mt-1 block font-[family-name:var(--font-mono)] text-[9px]">
                      Add TV titles to the graph.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.includeTv}
                    onChange={(e) =>
                      setSettings((current) => ({
                        ...current,
                        includeTv: e.target.checked,
                      }))
                    }
                    className="size-6 accent-[#36ad72]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setSettings(defaultChallengeSettings())}
                  className="flex w-full items-center justify-between p-5 text-left hover:bg-[#ffd52e]"
                >
                  <span>
                    <span className="block font-[family-name:var(--font-mono)] text-xs font-black uppercase">
                      Reset settings
                    </span>
                    <span className="mt-1 block font-[family-name:var(--font-mono)] text-[9px]">
                      Restore the standard round.
                    </span>
                  </span>
                  <span className="text-2xl" aria-hidden>
                    ↺
                  </span>
                </button>
              </div>
            </div>
          </section>

          <div className="col-span-5 grid gap-4">
            <section className="border-4 border-black bg-[#ef4438] p-4 shadow-[7px_7px_0_#000]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-[family-name:var(--font-mono)] text-sm font-black uppercase">
                    ⚑ Endpoint type
                  </h3>
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-[9px]">
                    Both ends use the same kind.
                  </p>
                </div>
                <span className="text-4xl" aria-hidden>
                  ↔
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {endpointKinds.map((kind) => {
                  const active = settings.endpointKind === kind;
                  return (
                    <button
                      key={kind}
                      type="button"
                      onClick={() =>
                        setSettings((current) => ({
                          ...current,
                          endpointKind: kind,
                        }))
                      }
                      className={`border-3 border-black py-4 font-[family-name:var(--font-mono)] text-[11px] font-black uppercase shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                        active
                          ? "bg-black text-white"
                          : "bg-[#fffdf7] text-black"
                      }`}
                    >
                      {endpointKindLabel(kind)}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="border-4 border-black bg-[#6657e8] p-4 text-white shadow-[7px_7px_0_#000]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-[family-name:var(--font-mono)] text-sm font-black uppercase">
                    ▣ Path filter
                  </h3>
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-[9px]">
                    Who you can travel through.
                  </p>
                </div>
                <span className="text-4xl" aria-hidden>
                  ●
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {pathFilters.map((filter) => {
                  const active = settings.pathFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() =>
                        setSettings((current) => ({
                          ...current,
                          pathFilter: filter,
                        }))
                      }
                      className={`border-3 border-black py-4 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                        active
                          ? "bg-[#ffd52e] text-black"
                          : "bg-[#fffdf7] text-black"
                      }`}
                    >
                      {pathFilterLabel(filter)}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="col-span-4 border-4 border-black bg-[#9a57dc] p-4 shadow-[6px_6px_0_#000]">
            <h3 className="font-[family-name:var(--font-mono)] text-sm font-black uppercase">
              ▣ Era filter
            </h3>
            <p className="mt-1 font-[family-name:var(--font-mono)] text-[9px]">
              Limit titles by release year.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <label className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase">
                From
                <input
                  type="number"
                  min={1900}
                  max={2030}
                  placeholder="Any"
                  value={settings.start.yearFrom ?? ""}
                  onChange={(e) =>
                    setYears(
                      "yearFrom",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  className="h-10 w-24 border-3 border-black bg-[#fffdf7] px-2 text-center text-xs"
                />
              </label>
              <span className="font-black">—</span>
              <label className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase">
                To
                <input
                  type="number"
                  min={1900}
                  max={2030}
                  placeholder="Any"
                  value={settings.start.yearTo ?? ""}
                  onChange={(e) =>
                    setYears(
                      "yearTo",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  className="h-10 w-24 border-3 border-black bg-[#fffdf7] px-2 text-center text-xs"
                />
              </label>
            </div>
          </section>

          <section className="col-span-3 border-4 border-black bg-[#ffd52e] p-4 shadow-[6px_6px_0_#000]">
            <h3 className="font-[family-name:var(--font-mono)] text-sm font-black uppercase">
              ★ Minimum rating
            </h3>
            <p className="mt-1 font-[family-name:var(--font-mono)] text-[9px]">
              Filter out lower-rated titles.
            </p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {[0, 5, 6, 7, 8].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMinimumRating(value)}
                  className={`border-3 border-black py-2 font-[family-name:var(--font-mono)] text-[10px] font-black ${
                    rating === value
                      ? "bg-black text-white"
                      : "bg-[#fffdf7] text-black"
                  }`}
                >
                  {value === 0 ? "Any" : `${value}+`}
                </button>
              ))}
            </div>
          </section>

          <div className="relative col-span-5">
            <button
              type="button"
              onClick={() => void startClassic()}
              disabled={loading}
              className="flex h-full min-h-28 w-full items-center justify-center gap-5 border-4 border-black bg-[#36ad72] px-6 shadow-[7px_7px_0_#000] transition hover:bg-[#2ecb7a] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60"
            >
              <span className="text-6xl font-black" aria-hidden>
                →
              </span>
              <span className="text-left">
                <span className="block font-[family-name:var(--font-display)] text-3xl font-black uppercase tracking-tight">
                  {loading ? "Building route…" : "Start speedrun"}
                </span>
                <span className="block font-[family-name:var(--font-mono)] text-[10px] font-black uppercase">
                  Find the shortest path
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => void startRandom()}
              disabled={loading}
              className="absolute bottom-3 right-3 border-3 border-black bg-[#ffd52e] px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase shadow-[3px_3px_0_#000] transition hover:bg-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
            >
              Start random
            </button>
          </div>
        </div>

        {error ? (
          <p
            className="mt-5 border-3 border-black bg-[#ef4438] px-4 py-3 font-[family-name:var(--font-mono)] text-xs font-bold shadow-[4px_4px_0_#000]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <footer className="mt-6 flex items-center justify-between bg-black px-4 py-2 font-[family-name:var(--font-mono)] text-[9px] uppercase text-white">
          <span>
            This product uses the TMDB API but is not endorsed by TMDB.
          </span>
          <span>Made for movie lovers.</span>
        </footer>
      </div>

      {loading ? (
        <ChallengeLaunchSequence
          challenge={pendingChallenge}
          onComplete={finishLaunch}
        />
      ) : null}
    </main>
  );
}
