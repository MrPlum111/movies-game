import type { Challenge } from "./types";
import { challengeEndpointLabel } from "./types";

export const MAX_HINTS = 3;

export function hintForLevel(challenge: Challenge, level: number): string {
  const target = challenge.target;
  const year =
    target.kind === "title" && target.year ? Number(target.year) : null;
  const decade =
    year && Number.isFinite(year) ? `${Math.floor(year / 10) * 10}s` : null;

  if (level === 1) {
    if (target.kind === "person") {
      return `Target is a ${target.role === "director" ? "director" : "performer"}.`;
    }
    if (decade) return `Target dropped in the ${decade}.`;
    return `Target is a ${target.mediaType === "tv" ? "TV series" : "movie"}.`;
  }

  if (level === 2) {
    const people = challenge.shortestPath.filter((n) => n.kind === "person");
    if (people.length > 0) {
      const first = people[0].label.trim();
      const initial = first.charAt(0).toUpperCase();
      return `A useful person on the short path has a name starting with “${initial}”.`;
    }
    return `Target label starts with “${challengeEndpointLabel(target).charAt(0).toUpperCase()}”.`;
  }

  const titles = challenge.shortestPath.filter((n) => n.kind === "title");
  const mid = titles[Math.min(1, titles.length - 1)];
  if (mid) {
    const initial = mid.label.trim().charAt(0).toUpperCase();
    return `One bridge title on the short path starts with “${initial}”.`;
  }

  if (decade) return `Think ${decade} connections around the target.`;
  return "Look for strong billing — lead cast or directors — not deep crew cuts.";
}
