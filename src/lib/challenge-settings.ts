import type { MediaType, TitleRef } from "./types";

/** UI difficulties: 2=Normal(~4), 3=Hard(~6), 4=Expert(~8). 1/5 kept for parse compat. */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** 1 = obscure … 5 = blockbuster (internal; UI no longer exposes this) */
export type PopularityTier = 1 | 2 | 3 | 4 | 5;

/** Shared start/end entity type */
export type EndpointKind = "title" | "actor" | "director";

/** Who you may traverse through on title ↔ person edges */
export type PathFilter = "any" | "acting" | "directing";

export type EndpointSettings = {
  popularity: PopularityTier;
  /** Inclusive; null = no bound */
  yearFrom: number | null;
  yearTo: number | null;
  /** TMDB vote_average minimum, 0 = any */
  minRating: number;
  /** ISO 639-1, "any", or "non-en" */
  language: "any" | "en" | "non-en" | string;
  /** TMDB genre id, or null = any */
  genreId: number | null;
};

export type ChallengeSettings = {
  difficulty: Difficulty;
  includeTv: boolean;
  endpointKind: EndpointKind;
  pathFilter: PathFilter;
  start: EndpointSettings;
  end: EndpointSettings;
};

export const GENRE_OPTIONS: { id: number | null; label: string }[] = [
  { id: null, label: "Any genre" },
  { id: 28, label: "Action" },
  { id: 12, label: "Adventure" },
  { id: 16, label: "Animation" },
  { id: 35, label: "Comedy" },
  { id: 80, label: "Crime" },
  { id: 99, label: "Documentary" },
  { id: 18, label: "Drama" },
  { id: 14, label: "Fantasy" },
  { id: 27, label: "Horror" },
  { id: 9648, label: "Mystery" },
  { id: 10749, label: "Romance" },
  { id: 878, label: "Sci-Fi" },
  { id: 53, label: "Thriller" },
  { id: 37, label: "Western" },
];

const FIXED_POPULARITY: PopularityTier = 4;

export const defaultEndpoint = (): EndpointSettings => ({
  popularity: FIXED_POPULARITY,
  yearFrom: null,
  yearTo: null,
  minRating: 0,
  language: "any",
  genreId: null,
});

export const defaultChallengeSettings = (): ChallengeSettings => ({
  difficulty: 2,
  includeTv: false,
  endpointKind: "title",
  pathFilter: "any",
  start: defaultEndpoint(),
  end: defaultEndpoint(),
});

/** Movie-to-movie (or person-to-person) hops (= clicks / 2). */
export function hopsForDifficulty(d: Difficulty): number {
  switch (d) {
    case 1:
    case 2:
      return 2;
    case 3:
      return 3;
    case 4:
    case 5:
      return 4;
  }
}

export function difficultyLabel(d: Difficulty): string {
  return (
    {
      1: "Normal",
      2: "Normal",
      3: "Hard",
      4: "Expert",
      5: "Expert",
    } as const
  )[d];
}

export function popularityLabel(p: PopularityTier): string {
  return (
    {
      1: "Obscure",
      2: "Niche",
      3: "Known",
      4: "Popular",
      5: "Blockbuster",
    } as const
  )[p];
}

export function endpointKindLabel(kind: EndpointKind): string {
  return (
    {
      title: "Movie",
      actor: "Actor",
      director: "Director",
    } as const
  )[kind];
}

export function pathFilterLabel(filter: PathFilter): string {
  return (
    {
      any: "All",
      acting: "Actors only",
      directing: "Directors only",
    } as const
  )[filter];
}

/** vote_count band used for discover + filtering */
export function popularityBand(tier: PopularityTier): {
  min: number;
  max: number | null;
} {
  switch (tier) {
    case 1:
      return { min: 40, max: 600 };
    case 2:
      return { min: 250, max: 2500 };
    case 3:
      return { min: 1000, max: 12000 };
    case 4:
      return { min: 4000, max: null };
    case 5:
      return { min: 15000, max: null };
  }
}

export function matchesEndpoint(
  title: TitleRef,
  settings: EndpointSettings,
): boolean {
  const year = title.year ? Number(title.year) : null;
  if (settings.yearFrom != null && (year == null || year < settings.yearFrom)) {
    return false;
  }
  if (settings.yearTo != null && (year == null || year > settings.yearTo)) {
    return false;
  }

  const band = popularityBand(settings.popularity);
  const votes = title.voteCount ?? 0;
  if (votes < band.min) return false;
  if (band.max != null && votes > band.max) return false;

  if (settings.minRating > 0) {
    if ((title.voteAverage ?? 0) < settings.minRating) return false;
  }

  const lang = title.originalLanguage ?? "";
  if (settings.language === "en" && lang !== "en") return false;
  if (settings.language === "non-en" && (lang === "en" || !lang)) return false;
  if (
    settings.language !== "any" &&
    settings.language !== "en" &&
    settings.language !== "non-en" &&
    lang !== settings.language
  ) {
    return false;
  }

  if (settings.genreId != null) {
    if (!(title.genreIds ?? []).includes(settings.genreId)) return false;
  }

  return true;
}

export function randomChallengeSettings(): ChallengeSettings {
  const difficulties: Difficulty[] = [2, 3, 4];
  const kinds: EndpointKind[] = ["title", "actor", "director"];
  const filters: PathFilter[] = ["any", "acting", "directing"];
  const ratings = [0, 5, 6, 7, 8];
  const yearFromOptions: (number | null)[] = [null, 1970, 1980, 1990, 2000, 2010];
  const yearToOptions: (number | null)[] = [null, 1999, 2009, 2019, 2030];

  let yearFrom =
    yearFromOptions[Math.floor(Math.random() * yearFromOptions.length)];
  let yearTo = yearToOptions[Math.floor(Math.random() * yearToOptions.length)];
  if (yearFrom != null && yearTo != null && yearFrom > yearTo) {
    [yearFrom, yearTo] = [yearTo, yearFrom];
  }

  const endpoint: EndpointSettings = {
    ...defaultEndpoint(),
    yearFrom,
    yearTo,
    minRating: ratings[Math.floor(Math.random() * ratings.length)],
  };

  return {
    difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
    includeTv: Math.random() < 0.35,
    endpointKind: kinds[Math.floor(Math.random() * kinds.length)],
    pathFilter: filters[Math.floor(Math.random() * filters.length)],
    start: { ...endpoint },
    end: { ...endpoint },
  };
}

export function parseChallengeSettings(input: unknown): ChallengeSettings {
  const base = defaultChallengeSettings();
  if (!input || typeof input !== "object") return base;
  const o = input as Partial<ChallengeSettings>;

  const clampDifficulty = (n: unknown): Difficulty => {
    const v = Number(n);
    if (v === 1 || v === 2) return 2;
    if (v === 3) return 3;
    if (v === 4 || v === 5) return 4;
    return base.difficulty;
  };

  const parseEndpoint = (
    raw: unknown,
    fallback: EndpointSettings,
  ): EndpointSettings => {
    if (!raw || typeof raw !== "object") return fallback;
    const e = raw as Partial<EndpointSettings>;
    return {
      popularity: FIXED_POPULARITY,
      yearFrom:
        e.yearFrom === null || e.yearFrom === undefined
          ? null
          : Number.isFinite(Number(e.yearFrom))
            ? Number(e.yearFrom)
            : fallback.yearFrom,
      yearTo:
        e.yearTo === null || e.yearTo === undefined
          ? null
          : Number.isFinite(Number(e.yearTo))
            ? Number(e.yearTo)
            : fallback.yearTo,
      minRating: Math.min(9, Math.max(0, Number(e.minRating) || 0)),
      language: "any",
      genreId: null,
    };
  };

  const endpointKind: EndpointKind =
    o.endpointKind === "actor" ||
    o.endpointKind === "director" ||
    o.endpointKind === "title"
      ? o.endpointKind
      : base.endpointKind;

  const pathFilter: PathFilter =
    o.pathFilter === "acting" ||
    o.pathFilter === "directing" ||
    o.pathFilter === "any"
      ? o.pathFilter
      : base.pathFilter;

  return {
    difficulty: clampDifficulty(o.difficulty),
    includeTv: Boolean(o.includeTv),
    endpointKind,
    pathFilter,
    start: parseEndpoint(o.start, base.start),
    end: parseEndpoint(o.end, base.end),
  };
}

export type { MediaType };
