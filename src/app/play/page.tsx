"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GameHud } from "@/components/GameHud";
import { PathTrail } from "@/components/PathTrail";
import { PersonView } from "@/components/PersonView";
import { ResultPanel } from "@/components/ResultPanel";
import { TitleView } from "@/components/TitleView";
import {
  clearSession,
  createSession,
  loadSession,
  saveSession,
  type GameSession,
} from "@/lib/game-session";
import type { PersonOnTitle, PersonPage, TitleOnPerson, TitlePage } from "@/lib/types";

export default function PlayPage() {
  const router = useRouter();
  const [session, setSession] = useState<GameSession | null>(null);
  const [titlePage, setTitlePage] = useState<TitlePage | null>(null);
  const [personPage, setPersonPage] = useState<PersonPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const existing = loadSession();
    if (!existing) {
      router.replace("/");
      return;
    }
    setSession(existing);
  }, [router]);

  const loadCurrent = useCallback(async (s: GameSession) => {
    setLoading(true);
    setError(null);
    setTitlePage(null);
    setPersonPage(null);
    try {
      if (s.current.kind === "title") {
        const res = await fetch(
          `/api/title/${s.current.mediaType}/${s.current.id}`,
        );
        if (!res.ok) throw new Error("Failed to load title");
        setTitlePage((await res.json()) as TitlePage);
      } else {
        const q = s.challenge.includeTv ? "?includeTv=1" : "";
        const res = await fetch(`/api/person/${s.current.id}${q}`);
        if (!res.ok) throw new Error("Failed to load person");
        setPersonPage((await res.json()) as PersonPage);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const currentKey =
    session == null
      ? null
      : session.current.kind === "title"
        ? `title:${session.current.mediaType}:${session.current.id}`
        : `person:${session.current.id}`;

  useEffect(() => {
    if (!session) return;
    if (session.status === "playing") {
      void loadCurrent(session);
    } else {
      setLoading(false);
    }
    // Reload only when the current node changes, not on every session field update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, session?.status, loadCurrent]);

  useEffect(() => {
    if (!session || session.status !== "playing") return;
    const tick = () => setElapsedMs(Date.now() - session.startedAt);
    tick();
    const id = window.setInterval(tick, 50);
    return () => window.clearInterval(id);
  }, [session]);

  function commit(next: GameSession) {
    saveSession(next);
    setSession(next);
  }

  function selectPerson(person: PersonOnTitle) {
    if (!session || session.status !== "playing") return;
    if (session.current.kind !== "title") return;

    const next: GameSession = {
      ...session,
      clicks: session.clicks + 1,
      current: { kind: "person", id: person.id },
      path: [
        ...session.path,
        { kind: "person", id: person.id, label: person.name },
      ],
    };
    commit(next);
  }

  function selectTitle(title: TitleOnPerson) {
    if (!session || session.status !== "playing") return;
    if (session.current.kind !== "person") return;

    const won =
      title.id === session.challenge.target.id &&
      title.mediaType === session.challenge.target.mediaType;

    const next: GameSession = {
      ...session,
      clicks: session.clicks + 1,
      current: {
        kind: "title",
        mediaType: title.mediaType,
        id: title.id,
      },
      path: [
        ...session.path,
        {
          kind: "title",
          mediaType: title.mediaType,
          id: title.id,
          label: title.title,
        },
      ],
      status: won ? "won" : "playing",
      finishedAt: won ? Date.now() : undefined,
    };
    commit(next);
  }

  function giveUp() {
    if (!session || session.status !== "playing") return;
    const next: GameSession = {
      ...session,
      status: "dnf",
      finishedAt: Date.now(),
    };
    commit(next);
    void fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "dnf",
        clicks: next.clicks,
        timeMs: (next.finishedAt ?? Date.now()) - next.startedAt,
        startTitle: next.challenge.start.title,
        targetTitle: next.challenge.target.title,
      }),
    });
  }

  async function playAgain() {
    clearSession();
    setLoading(true);
    try {
      const body =
        session?.challenge.settings ??
        ({
          difficulty: 2,
          includeTv: session?.challenge.includeTv ?? false,
          start: {
            popularity: 4,
            yearFrom: null,
            yearTo: null,
            minRating: 0,
            language: "any",
            genreId: null,
          },
          end: {
            popularity: 4,
            yearFrom: null,
            yearTo: null,
            minRating: 0,
            language: "any",
            genreId: null,
          },
        } as const);
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Could not start a new challenge");
      const challenge = await res.json();
      const next = createSession(challenge);
      saveSession(next);
      setSession(next);
      setElapsedMs(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to restart");
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center text-[var(--muted-fg)]">
        Loading session…
      </main>
    );
  }

  const finishedMs =
    session.finishedAt != null
      ? session.finishedAt - session.startedAt
      : elapsedMs;

  return (
    <main className="min-h-screen">
      {session.status === "playing" ? (
        <GameHud
          clicks={session.clicks}
          elapsedMs={elapsedMs}
          target={session.challenge.target}
          onGiveUp={giveUp}
        />
      ) : null}

      <div className="mx-auto max-w-7xl px-4 pt-4">
        <PathTrail path={session.path} />
      </div>

      {error ? (
        <p className="mx-auto max-w-7xl px-4 py-8 text-[var(--accent)]">{error}</p>
      ) : null}

      {loading ? (
        <p className="mx-auto max-w-7xl px-4 py-16 text-[var(--muted-fg)]">
          Loading page…
        </p>
      ) : null}

      {!loading && titlePage && session.current.kind === "title" ? (
        <TitleView page={titlePage} onSelectPerson={selectPerson} />
      ) : null}

      {!loading && personPage && session.current.kind === "person" ? (
        <PersonView page={personPage} onSelectTitle={selectTitle} />
      ) : null}

      {session.status !== "playing" ? (
        <ResultPanel
          status={session.status}
          clicks={session.clicks}
          timeMs={finishedMs}
          playerPath={session.path}
          shortestClicks={session.challenge.shortestClicks}
          shortestPath={session.challenge.shortestPath}
          startTitle={session.challenge.start.title}
          targetTitle={session.challenge.target.title}
          onPlayAgain={() => void playAgain()}
        />
      ) : null}
    </main>
  );
}
