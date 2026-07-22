import {
  matchesEndpoint,
  popularityBand,
  type EndpointSettings,
} from "./challenge-settings";
import { isLinkableCrewJob, mergeRoles, roleFromJob } from "./crew";
import { isEligibleMovie, isEligibleTv, yearFromDate } from "./filters";
import type {
  CreditRole,
  MediaType,
  PersonOnTitle,
  PersonPage,
  PersonRef,
  TitleOnPerson,
  TitlePage,
  TitleRef,
} from "./types";

const TMDB_BASE = "https://api.themoviedb.org/3";
export const IMAGE_BASE = "https://image.tmdb.org/t/p";

type CacheEntry = { expires: number; data: unknown };
const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 1000 * 60 * 60; // 1 hour

function getToken(): string {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    throw new Error("TMDB_ACCESS_TOKEN is not set");
  }
  return token;
}

export class TmdbNotFoundError extends Error {
  constructor(path: string) {
    super(`TMDB resource not found: ${path}`);
    this.name = "TmdbNotFoundError";
  }
}

async function tmdbFetch<T>(path: string, ttlMs = DEFAULT_TTL_MS): Promise<T> {
  const key = path;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    if (hit.data === null) {
      throw new TmdbNotFoundError(path);
    }
    return hit.data as T;
  }

  const res = await fetch(`${TMDB_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (res.status === 404) {
    cache.set(key, { expires: Date.now() + ttlMs, data: null });
    throw new TmdbNotFoundError(path);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TMDB ${res.status} for ${path}: ${body}`);
  }

  const data = (await res.json()) as T;
  cache.set(key, { expires: Date.now() + ttlMs, data });
  return data;
}

type TmdbCast = {
  id: number;
  name: string;
  profile_path: string | null;
  character?: string;
  order?: number;
  adult?: boolean;
};

type TmdbCrew = {
  id: number;
  name: string;
  profile_path: string | null;
  job: string;
  department?: string;
  adult?: boolean;
};

type TmdbMovieDetails = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date?: string;
  runtime?: number | null;
  adult?: boolean;
  video?: boolean;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  genres?: { id: number; name: string }[];
  belongs_to_collection?: { id: number; name: string } | null;
  credits?: { cast: TmdbCast[]; crew: TmdbCrew[] };
};

type TmdbTvDetails = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date?: string;
  adult?: boolean;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  genres?: { id: number; name: string }[];
  episode_run_time?: number[];
  aggregate_credits?: {
    cast: (TmdbCast & { roles?: { character: string }[] })[];
    crew: (TmdbCrew & { jobs?: { job: string }[] })[];
  };
  credits?: { cast: TmdbCast[]; crew: TmdbCrew[] };
};

type TmdbPersonDetails = {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  known_for_department?: string;
  adult?: boolean;
  combined_credits?: {
    cast: Array<{
      id: number;
      media_type: MediaType;
      title?: string;
      name?: string;
      poster_path: string | null;
      release_date?: string;
      first_air_date?: string;
      character?: string;
      adult?: boolean;
      video?: boolean;
      runtime?: number | null;
      genre_ids?: number[];
    }>;
    crew: Array<{
      id: number;
      media_type: MediaType;
      title?: string;
      name?: string;
      poster_path: string | null;
      release_date?: string;
      first_air_date?: string;
      job: string;
      adult?: boolean;
      video?: boolean;
      runtime?: number | null;
    }>;
  };
};

type DiscoverMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  adult?: boolean;
  video?: boolean;
  popularity?: number;
  vote_average?: number;
  vote_count?: number;
  original_language?: string;
  genre_ids?: number[];
};

type DiscoverTv = {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date?: string;
  adult?: boolean;
  popularity?: number;
  vote_average?: number;
  vote_count?: number;
  original_language?: string;
  genre_ids?: number[];
};

function personKey(id: number): string {
  return `person:${id}`;
}

function titleKey(mediaType: MediaType, id: number): string {
  return `${mediaType}:${id}`;
}

function groupCrewPeople(crew: TmdbCrew[]): {
  directing: PersonOnTitle[];
  writing: PersonOnTitle[];
  producing: PersonOnTitle[];
} {
  const buckets: Record<
    "directing" | "writing" | "producing",
    Map<number, PersonOnTitle>
  > = {
    directing: new Map(),
    writing: new Map(),
    producing: new Map(),
  };

  for (const c of crew) {
    if (c.adult) continue;
    const role = roleFromJob(c.job);
    if (!role || role === "acting") continue;
    const map = buckets[role];
    const existing = map.get(c.id);
    if (existing) {
      existing.jobs = [...(existing.jobs ?? []), c.job];
      existing.roles = mergeRoles(existing.roles, role);
    } else {
      map.set(c.id, {
        id: c.id,
        name: c.name,
        profilePath: c.profile_path,
        roles: [role],
        jobs: [c.job],
      });
    }
  }

  return {
    directing: [...buckets.directing.values()],
    writing: [...buckets.writing.values()],
    producing: [...buckets.producing.values()],
  };
}

function uniquePeopleFromTitle(
  cast: TmdbCast[],
  crew: TmdbCrew[],
): { personIds: number[]; people: Map<number, Set<CreditRole>> } {
  const people = new Map<number, Set<CreditRole>>();

  for (const c of cast) {
    if (c.adult) continue;
    const set = people.get(c.id) ?? new Set();
    set.add("acting");
    people.set(c.id, set);
  }

  for (const c of crew) {
    if (c.adult) continue;
    const role = roleFromJob(c.job);
    if (!role || role === "acting") continue;
    const set = people.get(c.id) ?? new Set();
    set.add(role);
    people.set(c.id, set);
  }

  return { personIds: [...people.keys()], people };
}

export async function getMoviePage(id: number): Promise<TitlePage | null> {
  let data: TmdbMovieDetails;
  try {
    data = await tmdbFetch<TmdbMovieDetails>(
      `/movie/${id}?append_to_response=credits`,
    );
  } catch (e) {
    if (e instanceof TmdbNotFoundError) return null;
    throw e;
  }
  if (!isEligibleMovie(data)) return null;

  const cast: PersonOnTitle[] = (data.credits?.cast ?? [])
    .filter((c) => !c.adult)
    .map((c) => ({
      id: c.id,
      name: c.name,
      profilePath: c.profile_path,
      roles: ["acting"] as CreditRole[],
      character: c.character ?? null,
    }));

  const crewGrouped = groupCrewPeople(data.credits?.crew ?? []);

  return {
    id: data.id,
    mediaType: "movie",
    title: data.title,
    year: yearFromDate(data.release_date),
    posterPath: data.poster_path,
    collectionId: data.belongs_to_collection?.id ?? null,
    overview: data.overview ?? "",
    genres: (data.genres ?? []).map((g) => g.name),
    runtime: data.runtime ?? null,
    cast,
    crew: crewGrouped,
  };
}

export async function getTvPage(id: number): Promise<TitlePage | null> {
  let data: TmdbTvDetails;
  try {
    data = await tmdbFetch<TmdbTvDetails>(
      `/tv/${id}?append_to_response=aggregate_credits,credits`,
    );
  } catch (e) {
    if (e instanceof TmdbNotFoundError) return null;
    throw e;
  }
  if (!isEligibleTv(data)) return null;

  const aggCast = data.aggregate_credits?.cast ?? data.credits?.cast ?? [];
  const cast: PersonOnTitle[] = aggCast
    .filter((c) => !c.adult)
    .map((c) => {
      const roleCharacter =
        "roles" in c && Array.isArray(c.roles) && c.roles[0]
          ? c.roles[0].character
          : undefined;
      return {
        id: c.id,
        name: c.name,
        profilePath: c.profile_path,
        roles: ["acting"] as CreditRole[],
        character: roleCharacter || c.character || null,
      };
    });

  let rawCrew: TmdbCrew[] = data.credits?.crew ?? [];
  if (data.aggregate_credits?.crew?.length) {
    rawCrew = data.aggregate_credits.crew.flatMap((c) =>
      (c.jobs ?? [{ job: c.job }]).map((j) => ({
        id: c.id,
        name: c.name,
        profile_path: c.profile_path,
        job: j.job,
        adult: c.adult,
      })),
    );
  }

  return {
    id: data.id,
    mediaType: "tv",
    title: data.name,
    year: yearFromDate(data.first_air_date),
    posterPath: data.poster_path,
    collectionId: null,
    overview: data.overview ?? "",
    genres: (data.genres ?? []).map((g) => g.name),
    runtime: data.episode_run_time?.[0] ?? null,
    cast,
    crew: groupCrewPeople(rawCrew),
  };
}

export async function getTitlePage(
  mediaType: MediaType,
  id: number,
): Promise<TitlePage | null> {
  return mediaType === "movie" ? getMoviePage(id) : getTvPage(id);
}

export async function getPersonPage(
  id: number,
  includeTv: boolean,
): Promise<PersonPage | null> {
  let data: TmdbPersonDetails;
  try {
    data = await tmdbFetch<TmdbPersonDetails>(
      `/person/${id}?append_to_response=combined_credits`,
    );
  } catch (e) {
    if (e instanceof TmdbNotFoundError) return null;
    throw e;
  }
  if (data.adult) return null;

  const castMap = new Map<string, TitleOnPerson>();
  for (const c of data.combined_credits?.cast ?? []) {
    if (c.media_type === "tv" && !includeTv) continue;
    if (c.media_type === "movie" && !isEligibleMovie(c)) continue;
    if (c.media_type === "tv" && !isEligibleTv(c)) continue;

    const key = titleKey(c.media_type, c.id);
    const existing = castMap.get(key);
    if (existing) {
      existing.roles = mergeRoles(existing.roles, "acting");
      continue;
    }
    castMap.set(key, {
      id: c.id,
      mediaType: c.media_type,
      title: c.title ?? c.name ?? "Untitled",
      year: yearFromDate(c.release_date ?? c.first_air_date),
      posterPath: c.poster_path,
      collectionId: null,
      roles: ["acting"],
      character: c.character ?? null,
    });
  }

  const crewBuckets: Record<
    "directing" | "writing" | "producing",
    Map<string, TitleOnPerson>
  > = {
    directing: new Map(),
    writing: new Map(),
    producing: new Map(),
  };

  for (const c of data.combined_credits?.crew ?? []) {
    if (!isLinkableCrewJob(c.job)) continue;
    if (c.media_type === "tv" && !includeTv) continue;
    if (c.media_type === "movie" && !isEligibleMovie(c)) continue;
    if (c.media_type === "tv" && !isEligibleTv(c)) continue;

    const role = roleFromJob(c.job);
    if (!role || role === "acting") continue;

    const key = titleKey(c.media_type, c.id);
    const map = crewBuckets[role];
    const existing = map.get(key);
    if (existing) {
      existing.jobs = [...(existing.jobs ?? []), c.job];
      existing.roles = mergeRoles(existing.roles, role);
    } else {
      map.set(key, {
        id: c.id,
        mediaType: c.media_type,
        title: c.title ?? c.name ?? "Untitled",
        year: yearFromDate(c.release_date ?? c.first_air_date),
        posterPath: c.poster_path,
        collectionId: null,
        roles: [role],
        jobs: [c.job],
      });
    }
  }

  return {
    id: data.id,
    name: data.name,
    profilePath: data.profile_path,
    biography: data.biography ?? "",
    knownForDepartment: data.known_for_department ?? null,
    cast: [...castMap.values()],
    crew: {
      directing: [...crewBuckets.directing.values()],
      writing: [...crewBuckets.writing.values()],
      producing: [...crewBuckets.producing.values()],
    },
  };
}

/** Lightweight neighbor fetch for graph algorithms */
export async function getTitlePersonIds(
  mediaType: MediaType,
  id: number,
  castLimit?: number,
): Promise<{ personIds: number[]; collectionId: number | null; title: TitleRef } | null> {
  if (mediaType === "movie") {
    let data: TmdbMovieDetails;
    try {
      data = await tmdbFetch<TmdbMovieDetails>(
        `/movie/${id}?append_to_response=credits`,
      );
    } catch (e) {
      if (e instanceof TmdbNotFoundError) return null;
      throw e;
    }
    if (!isEligibleMovie(data)) return null;
    const cast = [...(data.credits?.cast ?? [])].sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999),
    );
    const limitedCast =
      typeof castLimit === "number" ? cast.slice(0, castLimit) : cast;
    const { personIds } = uniquePeopleFromTitle(
      limitedCast,
      data.credits?.crew ?? [],
    );
    return {
      personIds,
      collectionId: data.belongs_to_collection?.id ?? null,
      title: {
        id: data.id,
        mediaType: "movie",
        title: data.title,
        year: yearFromDate(data.release_date),
        posterPath: data.poster_path,
        collectionId: data.belongs_to_collection?.id ?? null,
        voteAverage: data.vote_average,
        voteCount: data.vote_count,
        popularity: data.popularity,
        originalLanguage: data.original_language,
        genreIds: (data.genres ?? []).map((g) => g.id),
      },
    };
  }

  let data: TmdbTvDetails;
  try {
    data = await tmdbFetch<TmdbTvDetails>(
      `/tv/${id}?append_to_response=aggregate_credits,credits`,
    );
  } catch (e) {
    if (e instanceof TmdbNotFoundError) return null;
    throw e;
  }
  if (!isEligibleTv(data)) return null;

  const castRaw = data.aggregate_credits?.cast ?? data.credits?.cast ?? [];
  const cast =
    typeof castLimit === "number" ? castRaw.slice(0, castLimit) : castRaw;
  let crew: TmdbCrew[] = data.credits?.crew ?? [];
  if (data.aggregate_credits?.crew?.length) {
    crew = data.aggregate_credits.crew.flatMap((c) =>
      (c.jobs ?? [{ job: c.job }]).map((j) => ({
        id: c.id,
        name: c.name,
        profile_path: c.profile_path,
        job: j.job,
        adult: c.adult,
      })),
    );
  }
  const { personIds } = uniquePeopleFromTitle(cast, crew);
  return {
    personIds,
    collectionId: null,
    title: {
      id: data.id,
      mediaType: "tv",
      title: data.name,
      year: yearFromDate(data.first_air_date),
      posterPath: data.poster_path,
      collectionId: null,
      voteAverage: data.vote_average,
      voteCount: data.vote_count,
      popularity: data.popularity,
      originalLanguage: data.original_language,
      genreIds: (data.genres ?? []).map((g) => g.id),
    },
  };
}

export async function getPersonTitleKeys(
  personId: number,
  includeTv: boolean,
  titleLimit?: number,
): Promise<string[]> {
  let data: TmdbPersonDetails;
  try {
    data = await tmdbFetch<TmdbPersonDetails>(
      `/person/${personId}?append_to_response=combined_credits`,
    );
  } catch (e) {
    if (e instanceof TmdbNotFoundError) return [];
    throw e;
  }
  if (data.adult) return [];

  const keys: string[] = [];
  const seen = new Set<string>();

  const push = (mediaType: MediaType, id: number) => {
    const key = titleKey(mediaType, id);
    if (seen.has(key)) return;
    seen.add(key);
    keys.push(key);
  };

  for (const c of data.combined_credits?.cast ?? []) {
    if (c.media_type === "tv" && !includeTv) continue;
    if (c.media_type === "movie" && !isEligibleMovie(c)) continue;
    if (c.media_type === "tv" && !isEligibleTv(c)) continue;
    push(c.media_type, c.id);
    if (titleLimit && keys.length >= titleLimit) return keys;
  }

  for (const c of data.combined_credits?.crew ?? []) {
    const role = roleFromJob(c.job);
    if (!role) continue;
    if (!isLinkableCrewJob(c.job)) continue;
    if (c.media_type === "tv" && !includeTv) continue;
    if (c.media_type === "movie" && !isEligibleMovie(c)) continue;
    if (c.media_type === "tv" && !isEligibleTv(c)) continue;
    push(c.media_type, c.id);
    if (titleLimit && keys.length >= titleLimit) return keys;
  }

  return keys;
}

function discoverQuery(
  endpoint: EndpointSettings,
  page: number,
  media: "movie" | "tv",
): string {
  const band = popularityBand(endpoint.popularity);
  const params = new URLSearchParams({
    sort_by: endpoint.popularity >= 4 ? "popularity.desc" : "vote_count.desc",
    include_adult: "false",
    page: String(page),
    "vote_count.gte": String(band.min),
  });
  if (band.max != null) params.set("vote_count.lte", String(band.max));
  if (endpoint.minRating > 0) {
    params.set("vote_average.gte", String(endpoint.minRating));
  }
  if (endpoint.genreId != null) {
    params.set("with_genres", String(endpoint.genreId));
  }
  if (endpoint.language === "en") {
    params.set("with_original_language", "en");
  }

  if (media === "movie") {
    if (endpoint.yearFrom != null) {
      params.set("primary_release_date.gte", `${endpoint.yearFrom}-01-01`);
    }
    if (endpoint.yearTo != null) {
      params.set("primary_release_date.lte", `${endpoint.yearTo}-12-31`);
    }
    return `/discover/movie?${params.toString()}`;
  }

  if (endpoint.yearFrom != null) {
    params.set("first_air_date.gte", `${endpoint.yearFrom}-01-01`);
  }
  if (endpoint.yearTo != null) {
    params.set("first_air_date.lte", `${endpoint.yearTo}-12-31`);
  }
  return `/discover/tv?${params.toString()}`;
}

export async function fetchTitlePool(
  endpoint: EndpointSettings,
  includeTv: boolean,
  pages = 3,
): Promise<TitleRef[]> {
  const titles: TitleRef[] = [];

  for (let page = 1; page <= pages; page++) {
    const data = await tmdbFetch<{ results: DiscoverMovie[] }>(
      discoverQuery(endpoint, page, "movie"),
    );
    for (const m of data.results) {
      if (!isEligibleMovie(m)) continue;
      if (endpoint.language === "non-en" && m.original_language === "en") {
        continue;
      }
      const ref: TitleRef = {
        id: m.id,
        mediaType: "movie",
        title: m.title,
        year: yearFromDate(m.release_date),
        posterPath: m.poster_path,
        collectionId: null,
        voteAverage: m.vote_average,
        voteCount: m.vote_count,
        popularity: m.popularity,
        originalLanguage: m.original_language,
        genreIds: m.genre_ids,
      };
      if (matchesEndpoint(ref, endpoint)) titles.push(ref);
    }
  }

  if (includeTv) {
    for (let page = 1; page <= Math.min(pages, 2); page++) {
      const data = await tmdbFetch<{ results: DiscoverTv[] }>(
        discoverQuery(endpoint, page, "tv"),
      );
      for (const t of data.results) {
        if (!isEligibleTv(t)) continue;
        if (endpoint.language === "non-en" && t.original_language === "en") {
          continue;
        }
        const ref: TitleRef = {
          id: t.id,
          mediaType: "tv",
          title: t.name,
          year: yearFromDate(t.first_air_date),
          posterPath: t.poster_path,
          collectionId: null,
          voteAverage: t.vote_average,
          voteCount: t.vote_count,
          popularity: t.popularity,
          originalLanguage: t.original_language,
          genreIds: t.genre_ids,
        };
        if (matchesEndpoint(ref, endpoint)) titles.push(ref);
      }
    }
  }

  return titles;
}

export async function fetchPopularTitlePool(
  includeTv: boolean,
): Promise<TitleRef[]> {
  const { defaultEndpoint } = await import("./challenge-settings");
  return fetchTitlePool(defaultEndpoint(), includeTv);
}

export async function fetchPersonPool(
  role: "actor" | "director",
  pages = 3,
): Promise<PersonRef[]> {
  const dept = role === "actor" ? "Acting" : "Directing";
  const people: PersonRef[] = [];
  const seen = new Set<number>();

  for (let page = 1; page <= pages; page++) {
    const data = await tmdbFetch<{
      results: {
        id: number;
        name: string;
        profile_path: string | null;
        adult?: boolean;
        known_for_department?: string;
      }[];
    }>(`/person/popular?page=${page}`);

    for (const p of data.results) {
      if (p.adult || seen.has(p.id)) continue;
      if (p.known_for_department && p.known_for_department !== dept) continue;
      seen.add(p.id);
      people.push({
        id: p.id,
        name: p.name,
        profilePath: p.profile_path,
      });
    }
  }

  // Fallback: if department filter was too strict, take popular people unfiltered
  if (people.length < 8) {
    for (let page = 1; page <= pages; page++) {
      const data = await tmdbFetch<{
        results: {
          id: number;
          name: string;
          profile_path: string | null;
          adult?: boolean;
        }[];
      }>(`/person/popular?page=${page}`);
      for (const p of data.results) {
        if (p.adult || seen.has(p.id)) continue;
        seen.add(p.id);
        people.push({
          id: p.id,
          name: p.name,
          profilePath: p.profile_path,
        });
      }
    }
  }

  return people;
}

export async function getPersonRef(id: number): Promise<PersonRef | null> {
  try {
    const data = await tmdbFetch<{
      id: number;
      name: string;
      profile_path: string | null;
      adult?: boolean;
    }>(`/person/${id}`);
    if (data.adult) return null;
    return {
      id: data.id,
      name: data.name,
      profilePath: data.profile_path,
    };
  } catch (e) {
    if (e instanceof TmdbNotFoundError) return null;
    throw e;
  }
}

export function parseTitleKey(key: string): { mediaType: MediaType; id: number } {
  const [mediaType, id] = key.split(":");
  return { mediaType: mediaType as MediaType, id: Number(id) };
}

export async function getPersonName(id: number): Promise<string> {
  try {
    const data = await tmdbFetch<{ name: string }>(`/person/${id}`);
    return data.name;
  } catch (e) {
    if (e instanceof TmdbNotFoundError) return `Person ${id}`;
    throw e;
  }
}

export { personKey, titleKey };
