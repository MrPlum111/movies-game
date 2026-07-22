"use client";

import Link from "next/link";
import {
  defaultChallengeSettings,
  endpointKindLabel,
  GENRE_OPTIONS,
  type ChallengeSettings,
  type Difficulty,
  type EndpointKind,
} from "@/lib/challenge-settings";

type Props = {
  settings: ChallengeSettings;
  setSettings: React.Dispatch<React.SetStateAction<ChallengeSettings>>;
  loading: boolean;
  error: string | null;
  pathBlurb: string;
  onStart: () => void;
  onStartRandom: () => void;
  setYears: (field: "yearFrom" | "yearTo", value: number | null) => void;
  setMinimumRating: (value: number) => void;
  setGenre: (genreId: number | null) => void;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
};

const difficulties: { value: Difficulty; label: string; mark: string }[] = [
  { value: 2, label: "Normal", mark: "★" },
  { value: 3, label: "Hard", mark: "★★" },
  { value: 4, label: "Expert", mark: "★★★" },
];

const endpointKinds: EndpointKind[] = ["title", "actor", "director"];

export function HomeMobile({
  settings,
  setSettings,
  loading,
  error,
  pathBlurb,
  onStart,
  onStartRandom,
  setYears,
  setMinimumRating,
  setGenre,
  filtersOpen,
  setFiltersOpen,
}: Props) {
  const rating = settings.start.minRating;
  const genreId = settings.start.genreId;

  return (
    <div className="md:hidden">
      <nav className="border-b-4 border-black bg-black text-white">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="font-[family-name:var(--font-display)] text-base font-black uppercase tracking-tight">
            Reel Speedruns
          </h1>
          <Link
            href="/leaderboard"
            className="border-2 border-white px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase"
          >
            Board
          </Link>
        </div>
      </nav>

      <div className="px-4 pb-36 pt-5">
        <h2 className="font-[family-name:var(--font-display)] text-[2.35rem] font-black uppercase leading-[0.88] tracking-[-0.04em]">
          How fast can you connect{" "}
          <span className="text-[#ef4438]">the movies?</span>
        </h2>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-[11px] leading-relaxed">
          {pathBlurb}
        </p>

        <section className="mt-5 border-4 border-black bg-[#fffdf7] shadow-[5px_5px_0_#000]">
          <div className="border-b-4 border-black bg-[#6657e8] px-4 py-2 text-white">
            <h3 className="font-[family-name:var(--font-mono)] text-xs font-black uppercase">
              Difficulty
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2 p-3">
            {difficulties.map((item) => {
              const active = settings.difficulty === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setSettings((c) => ({ ...c, difficulty: item.value }))
                  }
                  className={`min-h-20 border-3 border-black p-2 shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    active ? "bg-[#36ad72]" : "bg-[#fffdf7]"
                  }`}
                >
                  <span className="block text-lg font-black">{item.mark}</span>
                  <span className="mt-1 block font-[family-name:var(--font-mono)] text-[10px] font-black uppercase">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-3 border-4 border-black bg-[#ef4438] p-3 shadow-[5px_5px_0_#000]">
          <h3 className="font-[family-name:var(--font-mono)] text-xs font-black uppercase">
            Endpoints
          </h3>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {endpointKinds.map((kind) => {
              const active = settings.endpointKind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() =>
                    setSettings((c) => ({ ...c, endpointKind: kind }))
                  }
                  className={`border-3 border-black py-3 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase shadow-[2px_2px_0_#000] ${
                    active ? "bg-black text-white" : "bg-[#fffdf7]"
                  }`}
                >
                  {endpointKindLabel(kind)}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-3 border-4 border-black bg-[#6657e8] p-3 text-white shadow-[5px_5px_0_#000]">
          <h3 className="font-[family-name:var(--font-mono)] text-xs font-black uppercase">
            Genre
          </h3>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-[9px]">
            Both ends share this genre.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {GENRE_OPTIONS.map((genre) => {
              const active = genreId === genre.id;
              return (
                <button
                  key={String(genre.id)}
                  type="button"
                  onClick={() => setGenre(genre.id)}
                  className={`border-3 border-black px-2 py-1.5 font-[family-name:var(--font-mono)] text-[9px] font-black uppercase shadow-[2px_2px_0_#000] ${
                    active
                      ? "bg-[#ffd52e] text-black"
                      : "bg-[#fffdf7] text-black"
                  }`}
                >
                  {genre.label}
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="mt-3 flex w-full items-center justify-between border-4 border-black bg-[#ffd52e] px-4 py-3 font-[family-name:var(--font-mono)] text-xs font-black uppercase shadow-[4px_4px_0_#000]"
        >
          <span>{filtersOpen ? "▾" : "▸"} More filters</span>
          <span className="text-[10px]">TV · Era · Rating</span>
        </button>

        {filtersOpen ? (
          <div className="mt-3 space-y-3 border-4 border-black bg-[#fffdf7] p-3 shadow-[4px_4px_0_#000]">
            <label className="flex items-center justify-between gap-3 border-3 border-black bg-[#f4f0e8] p-3">
              <span className="font-[family-name:var(--font-mono)] text-[11px] font-black uppercase">
                Include TV
              </span>
              <input
                type="checkbox"
                checked={settings.includeTv}
                onChange={(e) =>
                  setSettings((c) => ({ ...c, includeTv: e.target.checked }))
                }
                className="size-6 accent-[#36ad72]"
              />
            </label>

            <div className="border-3 border-black bg-[#9a57dc] p-3">
              <p className="font-[family-name:var(--font-mono)] text-[10px] font-black uppercase">
                Era
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1900}
                  max={2030}
                  placeholder="From"
                  value={settings.start.yearFrom ?? ""}
                  onChange={(e) =>
                    setYears(
                      "yearFrom",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  className="h-11 w-full border-3 border-black bg-[#fffdf7] px-2 text-center font-[family-name:var(--font-mono)] text-xs"
                />
                <span className="font-black">—</span>
                <input
                  type="number"
                  min={1900}
                  max={2030}
                  placeholder="To"
                  value={settings.start.yearTo ?? ""}
                  onChange={(e) =>
                    setYears(
                      "yearTo",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  className="h-11 w-full border-3 border-black bg-[#fffdf7] px-2 text-center font-[family-name:var(--font-mono)] text-xs"
                />
              </div>
            </div>

            <div className="border-3 border-black bg-[#ffd52e] p-3">
              <p className="font-[family-name:var(--font-mono)] text-[10px] font-black uppercase">
                Min rating
              </p>
              <div className="mt-2 grid grid-cols-5 gap-1.5">
                {[0, 5, 6, 7, 8].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMinimumRating(value)}
                    className={`border-3 border-black py-2 font-[family-name:var(--font-mono)] text-[10px] font-black ${
                      rating === value
                        ? "bg-black text-white"
                        : "bg-[#fffdf7]"
                    }`}
                  >
                    {value === 0 ? "Any" : `${value}+`}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSettings(defaultChallengeSettings())}
              className="w-full border-3 border-black bg-black py-3 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase text-white"
            >
              Reset settings
            </button>
          </div>
        ) : null}

        {error ? (
          <p
            className="mt-4 border-3 border-black bg-[#ef4438] px-3 py-3 font-[family-name:var(--font-mono)] text-xs font-bold"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t-4 border-black bg-[#f4f0e8] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onStart}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 border-4 border-black bg-[#36ad72] px-4 py-4 shadow-[5px_5px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60"
        >
          <span className="text-4xl font-black" aria-hidden>
            →
          </span>
          <span className="text-left">
            <span className="block font-[family-name:var(--font-display)] text-2xl font-black uppercase leading-none">
              {loading ? "Building…" : "Start speedrun"}
            </span>
            <span className="mt-1 block font-[family-name:var(--font-mono)] text-[9px] font-black uppercase">
              Find the shortest path
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onStartRandom}
          disabled={loading}
          className="mt-2 w-full border-3 border-black bg-[#ffd52e] py-2.5 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase shadow-[3px_3px_0_#000] disabled:opacity-60"
        >
          Start random
        </button>
      </div>
    </div>
  );
}
