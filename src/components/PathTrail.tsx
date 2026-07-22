"use client";

import { useState } from "react";
import { PathNodePopup } from "@/components/PathNodePopup";
import type { PathNode } from "@/lib/types";

type Props = {
  path: PathNode[];
  interactive?: boolean;
  includeTv?: boolean;
  /** Compact one-line trail with expand sheet (play HUD on mobile). */
  compact?: boolean;
};

export function PathTrail({
  path,
  interactive = false,
  includeTv = false,
  compact = false,
}: Props) {
  const [peek, setPeek] = useState<PathNode | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (path.length === 0) return null;

  const chipClass = (node: PathNode) =>
    node.kind === "title"
      ? "border-2 border-black bg-[#ef4438] px-2 py-1 text-black shadow-[2px_2px_0_#000]"
      : "border-2 border-black bg-[#6657e8] px-2 py-1 text-white shadow-[2px_2px_0_#000]";

  function renderNode(node: PathNode, i: number) {
    return (
      <li
        key={`${node.kind}-${node.id}-${i}`}
        className="flex items-center gap-2"
      >
        {i > 0 ? (
          <span className="text-xl font-black" aria-hidden>
            →
          </span>
        ) : null}
        {interactive ? (
          <button
            type="button"
            onClick={() => setPeek(node)}
            className={`${chipClass(node)} underline-offset-2 transition hover:-translate-y-0.5 hover:underline active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
          >
            {node.label}
          </button>
        ) : (
          <span className={chipClass(node)}>{node.label}</span>
        )}
      </li>
    );
  }

  if (compact) {
    const last = path[path.length - 1];
    return (
      <>
        <div className="flex items-center gap-2 md:hidden">
          <ol className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden font-[family-name:var(--font-mono)] text-[10px] font-bold">
            {path.length > 1 ? (
              <>
                <li className="shrink-0 truncate max-w-[40%]">
                  <span className={chipClass(path[0])}>{path[0].label}</span>
                </li>
                <li className="shrink-0 text-sm font-black" aria-hidden>
                  …
                </li>
                <li className="min-w-0 truncate">
                  <span className={chipClass(last)}>{last.label}</span>
                </li>
              </>
            ) : (
              <li>
                <span className={chipClass(path[0])}>{path[0].label}</span>
              </li>
            )}
          </ol>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="shrink-0 border-2 border-black bg-[#ffd52e] px-2 py-1 font-[family-name:var(--font-mono)] text-[9px] font-black uppercase shadow-[2px_2px_0_#000]"
          >
            Path · {path.length}
          </button>
        </div>

        <ol className="hidden flex-wrap items-center gap-2 font-[family-name:var(--font-mono)] text-xs font-bold md:flex">
          {path.map(renderNode)}
        </ol>

        {sheetOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-end bg-black/60 md:hidden"
            role="dialog"
            aria-label="Full path"
          >
            <button
              type="button"
              className="absolute inset-0"
              aria-label="Close path"
              onClick={() => setSheetOpen(false)}
            />
            <div className="relative z-10 max-h-[70vh] w-full overflow-y-auto border-t-4 border-black bg-[#fffdf7] p-4 shadow-[0_-8px_0_#000]">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-[family-name:var(--font-mono)] text-xs font-black uppercase">
                  Your path · {path.length} steps
                </p>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="border-2 border-black bg-black px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase text-white"
                >
                  Close
                </button>
              </div>
              <ol className="flex flex-col gap-2 font-[family-name:var(--font-mono)] text-xs font-bold">
                {path.map((node, i) => (
                  <li
                    key={`${node.kind}-${node.id}-${i}`}
                    className="flex items-start gap-2"
                  >
                    <span className="mt-1 shrink-0 font-black text-[#6b645a]">
                      {i + 1}.
                    </span>
                    {interactive ? (
                      <button
                        type="button"
                        onClick={() => setPeek(node)}
                        className={`${chipClass(node)} text-left`}
                      >
                        {node.label}
                      </button>
                    ) : (
                      <span className={chipClass(node)}>{node.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}

        {peek ? (
          <PathNodePopup
            node={peek}
            includeTv={includeTv}
            onClose={() => setPeek(null)}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <ol className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-mono)] text-xs font-bold">
        {path.map(renderNode)}
      </ol>
      {peek ? (
        <PathNodePopup
          node={peek}
          includeTv={includeTv}
          onClose={() => setPeek(null)}
        />
      ) : null}
    </>
  );
}
