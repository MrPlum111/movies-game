import type { MediaType, TitleRef } from "./types";

export type SharedEndpoints = {
  start: { mediaType: MediaType; id: number };
  target: { mediaType: MediaType; id: number };
  includeTv: boolean;
};

function parseRef(raw: string | null): { mediaType: MediaType; id: number } | null {
  if (!raw) return null;
  const match = raw.match(/^(movie|tv)-(\d+)$/);
  if (!match) return null;
  return { mediaType: match[1] as MediaType, id: Number(match[2]) };
}

export function encodeSharedChallenge(
  start: Pick<TitleRef, "mediaType" | "id">,
  target: Pick<TitleRef, "mediaType" | "id">,
  includeTv: boolean,
): string {
  const params = new URLSearchParams({
    s: `${start.mediaType}-${start.id}`,
    t: `${target.mediaType}-${target.id}`,
  });
  if (includeTv) params.set("tv", "1");
  return `/?${params.toString()}`;
}

export function parseSharedChallenge(
  searchParams: URLSearchParams,
): SharedEndpoints | null {
  const start = parseRef(searchParams.get("s"));
  const target = parseRef(searchParams.get("t"));
  if (!start || !target) return null;
  if (start.mediaType === target.mediaType && start.id === target.id) return null;
  return {
    start,
    target,
    includeTv: searchParams.get("tv") === "1",
  };
}

export function absoluteShareUrl(pathWithQuery: string): string {
  if (typeof window === "undefined") return pathWithQuery;
  return new URL(pathWithQuery, window.location.origin).toString();
}
