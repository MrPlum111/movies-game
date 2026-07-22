import type { Challenge } from "./types";

export const MAX_HINTS = 3;

export function hintForLevel(challenge: Challenge, level: number): string {
  const year = challenge.target.year ? Number(challenge.target.year) : null;
  const decade =
    year && Number.isFinite(year) ? `${Math.floor(year / 10) * 10}s` : null;

  if (level === 1) {
    if (decade) return `Target dropped in the ${decade}.`;
    return `Target is a ${challenge.target.mediaType === "tv" ? "TV series" : "movie"}.`;
  }

  if (level === 2) {
    const people = challenge.shortestPath.filter((n) => n.kind === "person");
    if (people.length > 0) {
      const first = people[0].label.trim();
      const initial = first.charAt(0).toUpperCase();
      return `A useful person on the short path has a name starting with “${initial}”.`;
    }
    return `Target is a ${challenge.target.mediaType === "tv" ? "TV series" : "feature film"}.`;
  }

  const titles = challenge.shortestPath.filter((n) => n.kind === "title");
  const mid = titles[1];
  if (mid) {
    const initial = mid.label.trim().charAt(0).toUpperCase();
    return `One bridge title on the short path starts with “${initial}”.`;
  }

  if (decade) return `Think ${decade} connections around the target.`;
  return "Look for directors and lead cast, not deep crew cuts.";
}
