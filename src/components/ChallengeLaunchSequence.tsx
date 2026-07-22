"use client";

import { useEffect, useRef, useState } from "react";
import { Poster } from "@/components/Poster";
import type { Challenge } from "@/lib/types";

type Phase =
  | "computing"
  | "randomizing"
  | "locked"
  | "countdown"
  | "go";

type Props = {
  challenge: Challenge | null;
  onComplete: () => void;
};

const ROLLING_TITLES = [
  "The Godfather",
  "Moonlight",
  "Spirited Away",
  "The Matrix",
  "Alien",
  "Parasite",
  "Casablanca",
  "Mad Max",
  "Arrival",
  "Goodfellas",
  "Jaws",
  "The Shining",
];

export function ChallengeLaunchSequence({ challenge, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("computing");
  const [rollingIndex, setRollingIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const completed = useRef(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRollingIndex((index) => (index + 1) % ROLLING_TITLES.length);
    }, 75);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!challenge) return;

    completed.current = false;
    setPhase("randomizing");
    // Keep both titles visible under the countdown so players can study them.
    const timers = [
      window.setTimeout(() => setPhase("locked"), 550),
      window.setTimeout(() => {
        setCountdown(3);
        setPhase("countdown");
      }, 1200),
      window.setTimeout(() => setCountdown(2), 1900),
      window.setTimeout(() => setCountdown(1), 2600),
      window.setTimeout(() => setPhase("go"), 3300),
      window.setTimeout(() => {
        if (completed.current) return;
        completed.current = true;
        onComplete();
      }, 3700),
    ];

    return () => timers.forEach(window.clearTimeout);
  }, [challenge, onComplete]);

  const showStart = challenge !== null;
  const showTarget = challenge !== null && phase !== "randomizing";
  const showCountdown = phase === "countdown" || phase === "go";

  return (
    <div
      className="nb-dot-grid fixed inset-0 z-50 overflow-y-auto bg-[#f4f0e8] text-black"
      role="dialog"
      aria-label="Building your speedrun"
      aria-live="polite"
    >
      <div className="flex h-16 items-center justify-between border-b-4 border-black bg-black px-4 text-white md:px-8">
        <p className="font-[family-name:var(--font-display)] text-lg font-black uppercase">
          Reel Speedruns
        </p>
        <p className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.16em]">
          {phase === "computing"
            ? "Computing route"
            : phase === "randomizing"
              ? "Start locked · Finding target"
              : phase === "locked"
                ? "Route found"
                : "Get ready"}
        </p>
      </div>

      <div className="mx-auto flex min-h-[calc(100%-4rem)] max-w-6xl flex-col justify-center px-4 py-8 md:px-8 md:pb-10">
        <div className="mb-8 flex items-end justify-between border-b-4 border-black pb-4">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-xs font-black uppercase tracking-[0.18em]">
              Match generator
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-black uppercase tracking-tight md:text-4xl">
              {phase === "computing"
                ? "Searching the graph…"
                : phase === "randomizing"
                  ? "Choose your destination…"
                  : "Your route is ready."}
            </h2>
          </div>
          <div className="flex gap-2" aria-hidden>
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <span
                key={item}
                className="launch-loader-block size-4 border-2 border-black bg-[#ffd52e]"
                style={{ animationDelay: `${item * 90}ms` }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-6">
          <TitleCard
            label="Start"
            color="red"
            title={showStart ? challenge.start.title : "Scanning titles…"}
            year={showStart ? challenge.start.year : null}
            posterPath={showStart ? challenge.start.posterPath : null}
            locked={showStart}
          />

          <div className="grid place-items-center">
            <span className="rotate-90 text-5xl font-black md:rotate-0 md:text-7xl" aria-hidden>
              →
            </span>
          </div>

          <TitleCard
            label="Target"
            color="purple"
            title={
              showTarget && challenge
                ? challenge.target.title
                : ROLLING_TITLES[rollingIndex]
            }
            year={showTarget && challenge ? challenge.target.year : null}
            posterPath={
              showTarget && challenge ? challenge.target.posterPath : null
            }
            locked={showTarget}
            rolling={!showTarget}
          />
        </div>

        <div className="mt-8 hidden grid-cols-3 border-4 border-black bg-[#fffdf7] font-[family-name:var(--font-mono)] text-xs font-black uppercase shadow-[6px_6px_0_#000] sm:grid">
          <p className="border-r-3 border-black p-4">
            01 <span className="ml-2 text-[#777]">Pick start</span>
          </p>
          <p className="border-r-3 border-black p-4">
            02 <span className="ml-2 text-[#777]">Build path</span>
          </p>
          <p className="p-4">
            03 <span className="ml-2 text-[#777]">Lock target</span>
          </p>
        </div>
      </div>

      {showCountdown ? (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/40 backdrop-blur-[1px]">
          <div
            key={phase === "go" ? "go" : countdown}
            className="launch-countdown text-center drop-shadow-[6px_6px_0_#000]"
          >
            <p className="font-[family-name:var(--font-mono)] text-sm font-black uppercase tracking-[0.3em] text-[#ffd52e]">
              {phase === "go" ? "Go" : "Study the match · Starting in"}
            </p>
            <p className="font-[family-name:var(--font-display)] text-[8rem] font-black leading-none text-white sm:text-[12rem]">
              {phase === "go" ? "GO!" : countdown}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TitleCard({
  label,
  title,
  year,
  posterPath,
  color,
  locked,
  rolling = false,
}: {
  label: string;
  title: string;
  year: string | null;
  posterPath: string | null;
  color: "red" | "purple";
  locked: boolean;
  rolling?: boolean;
}) {
  const background = color === "red" ? "bg-[#ef4438]" : "bg-[#6657e8]";

  return (
    <section
      className={`relative grid min-h-40 grid-cols-[90px_1fr] overflow-hidden border-4 border-black ${background} shadow-[8px_8px_0_#000] md:min-h-72 md:grid-cols-[150px_1fr] ${
        locked ? "launch-card-lock" : ""
      }`}
    >
      <div className="border-r-4 border-black bg-[#fffdf7] p-3">
        {posterPath ? (
          <Poster
            path={posterPath}
            alt={title}
            className="h-full w-full border-3 border-black"
          />
        ) : (
          <div
            className={`launch-poster-scan grid h-full place-items-center border-3 border-black ${background}`}
          >
            <span className="text-6xl" aria-hidden>
              🎬
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-between p-4 md:p-6">
        <div className="flex items-center justify-between border-b-3 border-black pb-3">
          <p className="font-[family-name:var(--font-mono)] text-xs font-black uppercase tracking-[0.16em]">
            {label} title
          </p>
          <span className="font-[family-name:var(--font-mono)] text-[10px] font-black uppercase">
            {locked ? "Locked" : "Searching"}
          </span>
        </div>
        <div className={rolling ? "launch-title-roll" : ""}>
          <h3 className="line-clamp-3 font-[family-name:var(--font-display)] text-2xl font-black leading-[0.95] tracking-tight md:text-4xl">
            {title}
          </h3>
          <p className="mt-3 font-[family-name:var(--font-mono)] text-sm font-bold">
            {year ?? (rolling ? "Analyzing credits…" : "Reading TMDB…")}
          </p>
        </div>
        <p className="font-[family-name:var(--font-mono)] text-[10px] font-black uppercase">
          Movie → Person → Movie
        </p>
      </div>
    </section>
  );
}
