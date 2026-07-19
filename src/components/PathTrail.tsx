import type { PathNode } from "@/lib/types";

export function PathTrail({ path }: { path: PathNode[] }) {
  if (path.length === 0) return null;
  return (
    <ol className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-mono)] text-xs font-bold">
      {path.map((node, i) => (
        <li key={`${node.kind}-${node.id}-${i}`} className="flex items-center gap-2">
          {i > 0 ? <span className="text-xl font-black" aria-hidden>→</span> : null}
          <span
            className={
              node.kind === "title"
                ? "border-2 border-black bg-[#ef4438] px-2 py-1 text-black shadow-[2px_2px_0_#000]"
                : "border-2 border-black bg-[#6657e8] px-2 py-1 text-white shadow-[2px_2px_0_#000]"
            }
          >
            {node.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
