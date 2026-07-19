export type MediaType = "movie" | "tv";

export type TitleRef = {
  id: number;
  mediaType: MediaType;
  title: string;
  year: string | null;
  posterPath: string | null;
  collectionId: number | null;
  voteAverage?: number;
  voteCount?: number;
  popularity?: number;
  originalLanguage?: string;
  genreIds?: number[];
};

export type PersonRef = {
  id: number;
  name: string;
  profilePath: string | null;
};

export type CreditRole = "acting" | "directing" | "writing" | "producing";

export type PersonOnTitle = PersonRef & {
  roles: CreditRole[];
  character?: string | null;
  jobs?: string[];
};

export type TitleOnPerson = TitleRef & {
  roles: CreditRole[];
  character?: string | null;
  jobs?: string[];
};

export type TitlePage = TitleRef & {
  overview: string;
  genres: string[];
  runtime: number | null;
  cast: PersonOnTitle[];
  crew: {
    directing: PersonOnTitle[];
    writing: PersonOnTitle[];
    producing: PersonOnTitle[];
  };
};

export type PersonPage = PersonRef & {
  biography: string;
  knownForDepartment: string | null;
  cast: TitleOnPerson[];
  crew: {
    directing: TitleOnPerson[];
    writing: TitleOnPerson[];
    producing: TitleOnPerson[];
  };
};

export type PathNode =
  | { kind: "title"; mediaType: MediaType; id: number; label: string }
  | { kind: "person"; id: number; label: string };

export type Challenge = {
  start: TitleRef;
  target: TitleRef;
  includeTv: boolean;
  shortestClicks: number;
  shortestPath: PathNode[];
  settings?: import("./challenge-settings").ChallengeSettings;
};

export type ScoreEntry = {
  id: string;
  name: string;
  clicks: number;
  timeMs: number;
  startTitle: string;
  targetTitle: string;
  createdAt: string;
  status: "completed" | "dnf";
};

export type LeaderboardBoard = "clicks" | "time";
