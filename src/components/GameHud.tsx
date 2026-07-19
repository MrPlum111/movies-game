"use client";

import { formatTime } from "@/lib/format";
import type { TitleRef } from "@/lib/types";

type Props = {
  clicks: number;
  elapsedMs: number;
  target: TitleRef;
  onGiveUp: () => void;
};

export function GameHud({ clicks, elapsedMs, target, onGiveUp }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-baseline gap-4 font-[family-name:var(--font-mono)] text-sm">
          <span>
            <span className="text-[var(--muted-fg)]">Clicks</span>{" "}
            <strong className="text-lg">{clicks}</strong>
          </span>
          <span>
            <span className="text-[var(--muted-fg)]">Time</span>{" "}
            <strong className="text-lg tabular-nums">{formatTime(elapsedMs)}</strong>
          </span>
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-fg)]">
            Target
          </p>
          <p className="truncate font-[family-name:var(--font-display)] text-lg leading-tight">
            {target.title}
            {target.year ? (
              <span className="text-[var(--muted-fg)]"> ({target.year})</span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={onGiveUp}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Give up
        </button>
      </div>
    </header>
  );
}
