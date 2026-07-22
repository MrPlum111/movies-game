import type { Challenge, MediaType, PathNode } from "./types";
import { challengeEndpointLabel } from "./types";

export type CurrentNode =
  | { kind: "title"; mediaType: MediaType; id: number }
  | { kind: "person"; id: number };

export type GameSession = {
  challenge: Challenge;
  path: PathNode[];
  current: CurrentNode;
  clicks: number;
  startedAt: number;
  status: "playing" | "won" | "dnf";
  finishedAt?: number;
};

const KEY = "moviesgame:session";

export function saveSession(session: GameSession): void {
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function loadSession(): GameSession | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(KEY);
}

export function createSession(challenge: Challenge): GameSession {
  if (challenge.start.kind === "person") {
    return {
      challenge,
      path: [
        {
          kind: "person",
          id: challenge.start.id,
          label: challenge.start.name,
        },
      ],
      current: { kind: "person", id: challenge.start.id },
      clicks: 0,
      startedAt: Date.now(),
      status: "playing",
    };
  }

  return {
    challenge,
    path: [
      {
        kind: "title",
        mediaType: challenge.start.mediaType,
        id: challenge.start.id,
        label: challenge.start.title,
      },
    ],
    current: {
      kind: "title",
      mediaType: challenge.start.mediaType,
      id: challenge.start.id,
    },
    clicks: 0,
    startedAt: Date.now(),
    status: "playing",
  };
}

export { challengeEndpointLabel };
