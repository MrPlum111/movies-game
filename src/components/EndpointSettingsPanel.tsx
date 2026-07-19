"use client";

import {
  GENRE_OPTIONS,
  popularityLabel,
  type EndpointSettings,
  type PopularityTier,
} from "@/lib/challenge-settings";

type Props = {
  title: string;
  subtitle: string;
  value: EndpointSettings;
  onChange: (next: EndpointSettings) => void;
};

const YEAR_PRESETS: { label: string; from: number | null; to: number | null }[] = [
  { label: "Any era", from: null, to: null },
  { label: "Classics · pre-1980", from: null, to: 1979 },
  { label: "80s–90s", from: 1980, to: 1999 },
  { label: "2000s", from: 2000, to: 2009 },
  { label: "2010s", from: 2010, to: 2019 },
  { label: "Recent · 2020+", from: 2020, to: null },
];

export function EndpointSettingsPanel({ title, subtitle, value, onChange }: Props) {
  const set = (patch: Partial<EndpointSettings>) => onChange({ ...value, ...patch });

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 p-4 backdrop-blur-sm">
      <h3 className="font-[family-name:var(--font-display)] text-xl">{title}</h3>
      <p className="mt-1 text-xs text-[var(--muted-fg)]">{subtitle}</p>

      <label className="mt-5 block text-xs uppercase tracking-[0.14em] text-[var(--muted-fg)]">
        Popularity · {popularityLabel(value.popularity)}
      </label>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value.popularity}
        onChange={(e) => set({ popularity: Number(e.target.value) as PopularityTier })}
        className="mt-2 w-full accent-[var(--accent)]"
      />
      <div className="mt-1 flex justify-between text-[10px] text-[var(--muted-fg)]">
        <span>Obscure</span>
        <span>Blockbuster</span>
      </div>

      <label className="mt-5 block text-xs uppercase tracking-[0.14em] text-[var(--muted-fg)]">
        Era
      </label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {YEAR_PRESETS.map((p) => {
          const active = value.yearFrom === p.from && value.yearTo === p.to;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => set({ yearFrom: p.from, yearTo: p.to })}
              className={`rounded-md px-2.5 py-1 text-xs ${
                active
                  ? "bg-[var(--fg)] text-[var(--bg)]"
                  : "border border-[var(--border)] hover:border-[var(--accent)]"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block text-xs text-[var(--muted-fg)]">
          Year from
          <input
            type="number"
            min={1900}
            max={2030}
            placeholder="Any"
            value={value.yearFrom ?? ""}
            onChange={(e) =>
              set({
                yearFrom: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs text-[var(--muted-fg)]">
          Year to
          <input
            type="number"
            min={1900}
            max={2030}
            placeholder="Any"
            value={value.yearTo ?? ""}
            onChange={(e) =>
              set({
                yearTo: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <label className="mt-4 block text-xs uppercase tracking-[0.14em] text-[var(--muted-fg)]">
        Min rating · {value.minRating === 0 ? "Any" : `${value.minRating.toFixed(1)}+`}
      </label>
      <input
        type="range"
        min={0}
        max={8}
        step={0.5}
        value={value.minRating}
        onChange={(e) => set({ minRating: Number(e.target.value) })}
        className="mt-2 w-full accent-[var(--accent)]"
      />

      <label className="mt-4 block text-xs uppercase tracking-[0.14em] text-[var(--muted-fg)]">
        Language
      </label>
      <select
        value={value.language}
        onChange={(e) => set({ language: e.target.value })}
        className="mt-2 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-2 text-sm"
      >
        <option value="any">Any language</option>
        <option value="en">English</option>
        <option value="non-en">Non-English</option>
        <option value="fr">French</option>
        <option value="ja">Japanese</option>
        <option value="ko">Korean</option>
        <option value="es">Spanish</option>
        <option value="de">German</option>
        <option value="it">Italian</option>
        <option value="hi">Hindi</option>
      </select>

      <label className="mt-4 block text-xs uppercase tracking-[0.14em] text-[var(--muted-fg)]">
        Genre
      </label>
      <select
        value={value.genreId ?? ""}
        onChange={(e) =>
          set({
            genreId: e.target.value === "" ? null : Number(e.target.value),
          })
        }
        className="mt-2 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-2 text-sm"
      >
        {GENRE_OPTIONS.map((g) => (
          <option key={String(g.id)} value={g.id ?? ""}>
            {g.label}
          </option>
        ))}
      </select>
    </section>
  );
}
