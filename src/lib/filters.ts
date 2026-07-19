/** Exclude adult, shorts (<40m), and obvious music videos. */

const MUSIC_VIDEO_RE = /\bmusic\s*video\b/i;

export type FilterableTitle = {
  adult?: boolean;
  runtime?: number | null;
  episode_run_time?: number[];
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  video?: boolean;
};

export function isEligibleMovie(item: FilterableTitle): boolean {
  if (item.adult) return false;

  const label = item.title ?? item.original_title ?? "";
  if (MUSIC_VIDEO_RE.test(label)) return false;

  // TMDB marks many music videos / clips with video: true
  if (item.video === true && (item.runtime == null || item.runtime <= 60)) {
    return false;
  }

  if (typeof item.runtime === "number" && item.runtime > 0 && item.runtime < 40) {
    return false;
  }

  return true;
}

export function isEligibleTv(item: FilterableTitle): boolean {
  if (item.adult) return false;
  const label = item.name ?? item.original_name ?? "";
  if (MUSIC_VIDEO_RE.test(label)) return false;
  return true;
}

export function yearFromDate(date?: string | null): string | null {
  if (!date || date.length < 4) return null;
  return date.slice(0, 4);
}
