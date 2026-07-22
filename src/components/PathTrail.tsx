"use client";

import { useState } from "react";
import { PathNodePopup } from "@/components/PathNodePopup";
import type { PathNode } from "@/lib/types";

type Props = {
  path: PathNode[];
  interactive?: boolean;
  includeTv?: boolean;
};

export function PathTrail({
  path,
  interactive = false,
  includeTv = false,
}: Props) {
  const [peek, setPeek] = useState<PathNode | null>(null);

  if (path.length === 0) return null;

  return (
    <>
      <ol className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-mono)] text-xs font-bold">
        {path.map((node, i) => {
          const chipClass =
            node.kind === "title"
              ? "border-2 border-black bg-[#ef4438] px-2 py-1 text-black shadow-[2px_2px_0_#000]"
              : "border-2 border-black bg-[#6657e8] px-2 py-1 text-white shadow-[2px_2px_0_#000]";

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
                  className={`${chipClass} underline-offset-2 transition hover:-translate-y-0.5 hover:underline active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
                >
                  {node.label}
                </button>
              ) : (
                <span className={chipClass}>{node.label}</span>
              )}
            </li>
          );
        })}
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
