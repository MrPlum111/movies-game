"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChallengeLaunchSequence } from "@/components/ChallengeLaunchSequence";
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
import { hintForLevel, MAX_HINTS } from "@/lib/hints";
import type {
  Challenge,
  PersonOnTitle,
  PersonPage,
  TitleOnPerson,
  TitlePage,
} from "@/lib/types";
import { challengeEndpointLabel } from "@/lib/types";

export default function PlayPage() {
  const router = useRouter();
  const [session, setSession] = useState<GameSession | null>(null);
  const [titlePage, setTitlePage] = useState<TitlePage | null>(null);
  const [personPage, setPersonPage] = useState<PersonPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [opening, setOpening] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState<Challenge | null>(
    null,
  );
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("moviesgame:opening") === "1") {
      sessionStorage.removeItem("moviesgame:opening");
      setOpening(true);
    }
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
    if (!session || launching) return;
    if (session.status === "playing") {
      void loadCurrent(session);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, session?.status, loadCurrent, launching]);

  useEffect(() => {
    if (!session || session.status !== "playing" || launching) return;
    const tick = () => setElapsedMs(Date.now() - session.startedAt);
    tick();
    const id = window.setInterval(tick, 50);
    return () => window.clearInterval(id);
  }, [session, launching]);

  useEffect(() => {
    if (!opening || !titlePage) return;
    const timer = window.setTimeout(() => setOpening(false), 1200);
    return () => window.clearTimeout(timer);
  }, [opening, titlePage]);

  function commit(next: GameSession) {
    saveSession(next);
    setSession(next);
  }

  function selectPerson(person: PersonOnTitle) {
    if (!session || session.status !== "playing") return;
    if (session.current.kind !== "title") return;

    const won =
      session.challenge.target.kind === "person" &&
      person.id === session.challenge.target.id;

    const next: GameSession = {
      ...session,
      clicks: session.clicks + 1,
      current: { kind: "person", id: person.id },
      path: [
        ...session.path,
        { kind: "person", id: person.id, label: person.name },
      ],
      status: won ? "won" : "playing",
      finishedAt: won ? Date.now() : undefined,
    };
    commit(next);
  }

  function selectTitle(title: TitleOnPerson) {
    if (!session || session.status !== "playing") return;
    if (session.current.kind !== "person") return;

    const won =
      session.challenge.target.kind === "title" &&
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
        startTitle: challengeEndpointLabel(next.challenge.start),
        targetTitle: challengeEndpointLabel(next.challenge.target),
      }),
    });
  }

  function useHint() {
    if (!session || session.status !== "playing") return;
    if (hintsUsed >= MAX_HINTS) return;

    const nextLevel = hintsUsed + 1;
    const text = hintForLevel(session.challenge, nextLevel);
    setHintsUsed(nextLevel);
    setHintText(text);
    commit({
      ...session,
      clicks: session.clicks + 1,
    });
  }

  async function playAgain() {
      const body =
        session?.challenge.settings ??
        ({
          difficulty: 2,
          includeTv: session?.challenge.includeTv ?? false,
          endpointKind: "title",
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

    clearSession();
    setLaunching(true);
    setPendingChallenge(null);
    setError(null);
    setHintsUsed(0);
    setHintText(null);
    setTitlePage(null);
    setPersonPage(null);

    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Could not start a new challenge");
      const challenge = (await res.json()) as Challenge;
      setPendingChallenge(challenge);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to restart");
      setLaunching(false);
    }
  }

  const finishLaunch = useCallback(() => {
    if (!pendingChallenge) return;
    const next = createSession(pendingChallenge);
    saveSession(next);
    sessionStorage.setItem("moviesgame:opening", "1");
    setSession(next);
    setElapsedMs(0);
    setOpening(true);
    setLaunching(false);
    setPendingChallenge(null);
  }, [pendingChallenge]);

  if (!session && !launching) {
    return (
      <main className="nb-dot-grid grid min-h-screen place-items-center bg-[#f4f0e8]">
        <p className="border-4 border-black bg-[#ffd52e] px-6 py-4 font-[family-name:var(--font-mono)] text-xs font-black uppercase shadow-[6px_6px_0_#000]">
          Loading session…
        </p>
      </main>
    );
  }

  const finishedMs =
    session && session.finishedAt != null
      ? session.finishedAt - session.startedAt
      : elapsedMs;

  return (
    <main className="nb-dot-grid min-h-screen bg-[#f4f0e8] pb-10 text-black">
      {launching ? (
        <ChallengeLaunchSequence
          challenge={pendingChallenge}
          onComplete={finishLaunch}
        />
      ) : null}

      {session && session.status === "playing" && !launching ? (
        <GameHud
          clicks={session.clicks}
          elapsedMs={elapsedMs}
          target={session.challenge.target}
          onGiveUp={giveUp}
          onHint={useHint}
          hintText={hintText}
          hintsLeft={MAX_HINTS - hintsUsed}
        />
      ) : null}

      {session && !launching ? (
        <>
          <div className="mx-auto max-w-7xl px-3 pt-3 md:px-4 md:pt-5">
            <div className="border-3 border-black bg-[#fffdf7] p-3 shadow-[4px_4px_0_#000]">
              <p className="mb-2 hidden font-[family-name:var(--font-mono)] text-[9px] font-black uppercase tracking-[0.2em] md:block">
                Current route
              </p>
              <PathTrail
                path={session.path}
                interactive={session.status !== "playing"}
                includeTv={session.challenge.includeTv}
                compact
              />
            </div>
          </div>

          {error ? (
            <p className="mx-auto mt-5 max-w-7xl border-4 border-black bg-[#ef4438] px-4 py-4 font-[family-name:var(--font-mono)] text-xs font-black shadow-[5px_5px_0_#000]">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="mx-auto max-w-7xl px-4 py-16">
              <p className="inline-block border-4 border-black bg-[#ffd52e] px-5 py-3 font-[family-name:var(--font-mono)] text-xs font-black uppercase shadow-[5px_5px_0_#000]">
                Loading page…
              </p>
            </div>
          ) : null}

          {!loading && titlePage && session.current.kind === "title" ? (
            <TitleView
              page={titlePage}
              onSelectPerson={selectPerson}
              opening={opening}
            />
          ) : null}

          {!loading && personPage && session.current.kind === "person" ? (
            <PersonView
              page={personPage}
              onSelectTitle={selectTitle}
            />
          ) : null}

          {session.status !== "playing" ? (
            <ResultPanel
              status={session.status}
              clicks={session.clicks}
              timeMs={finishedMs}
              playerPath={session.path}
              shortestClicks={session.challenge.shortestClicks}
              shortestPath={session.challenge.shortestPath}
              start={session.challenge.start}
              target={session.challenge.target}
              includeTv={session.challenge.includeTv}
              onPlayAgain={() => void playAgain()}
            />
          ) : null}
        </>
      ) : null}
    </main>
  );
}
