"use client";

import { formatTime } from "@/lib/format";
import type { TitleRef } from "@/lib/types";

type Props = {
  clicks: number;
  elapsedMs: number;
  target: TitleRef;
  onGiveUp: () => void;
  onHint?: () => void;
  hintText?: string | null;
  hintsLeft?: number;
};

export function GameHud({
  clicks,
  elapsedMs,
  target,
  onGiveUp,
  onHint,
  hintText,
  hintsLeft = 0,
}: Props) {
  return (
    <header className="sticky top-0 z-20 border-b-4 border-black bg-black text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-stretch px-3 sm:px-4">
        <div className="flex shrink-0 font-[family-name:var(--font-mono)]">
          <div className="grid min-w-20 place-items-center border-x-3 border-black bg-[#ffd52e] px-3 py-2 text-center text-black sm:min-w-24">
            <span className="text-[9px] font-black uppercase tracking-widest">
              Clicks
            </span>
            <strong className="text-xl leading-none">{clicks}</strong>
          </div>
          <div className="grid min-w-24 place-items-center border-r-3 border-black bg-[#36ad72] px-3 py-2 text-center text-black sm:min-w-32">
            <span className="text-[9px] font-black uppercase tracking-widest">
              Time
            </span>
            <strong className="text-lg leading-none tabular-nums">
              {formatTime(elapsedMs)}
            </strong>
          </div>
        </div>
        <div className="min-w-0 flex-1 px-3 py-2 sm:px-5">
          <p className="font-[family-name:var(--font-mono)] text-[9px] font-black uppercase tracking-[0.2em] text-[#ffd52e]">
            Target →
          </p>
          <p className="truncate font-[family-name:var(--font-display)] text-base font-black uppercase leading-tight sm:text-lg">
            {target.title}
            {target.year ? (
              <span className="text-[#aaa]"> ({target.year})</span>
            ) : null}
          </p>
          {hintText ? (
            <p className="mt-1 truncate font-[family-name:var(--font-mono)] text-[10px] font-bold text-[#ffd52e]">
              Hint: {hintText}
            </p>
          ) : null}
        </div>
        <div className="my-2 flex shrink-0 items-center gap-2">
          {onHint ? (
            <button
              type="button"
              onClick={onHint}
              disabled={hintsLeft <= 0}
              className="border-3 border-white bg-[#6657e8] px-3 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase text-white shadow-[3px_3px_0_#fff] transition hover:bg-[#ffd52e] hover:text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 sm:px-4"
              title="Soft hint · costs 1 click"
            >
              Hint ({hintsLeft})
            </button>
          ) : null}
          <button
            type="button"
            onClick={onGiveUp}
            className="border-3 border-white bg-[#ef4438] px-3 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase text-black shadow-[3px_3px_0_#fff] transition hover:bg-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-4"
          >
            Give up
          </button>
        </div>
      </div>
    </header>
  );
}
