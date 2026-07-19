import type { PathNode } from "@/lib/types";

export function PathTrail({ path }: { path: PathNode[] }) {
  if (path.length === 0) return null;
  return (
    <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--muted-fg)]">
      {path.map((node, i) => (
        <li key={`${node.kind}-${node.id}-${i}`} className="flex items-center gap-1.5">
          {i > 0 ? <span aria-hidden>→</span> : null}
          <span
            className={
              node.kind === "title"
                ? "font-medium text-[var(--fg)]"
                : "text-[var(--accent)]"
            }
          >
            {node.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
