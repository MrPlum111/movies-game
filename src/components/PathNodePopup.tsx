"use client";

import { useEffect, useState } from "react";
import { Poster } from "@/components/Poster";
import type { PathNode, PersonPage, TitlePage } from "@/lib/types";

type Props = {
  node: PathNode;
  includeTv: boolean;
  onClose: () => void;
};

export function PathNodePopup({ node, includeTv, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<TitlePage | null>(null);
  const [person, setPerson] = useState<PersonPage | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTitle(null);
    setPerson(null);

    async function load() {
      try {
        if (node.kind === "title") {
          const res = await fetch(`/api/title/${node.mediaType}/${node.id}`);
          if (!res.ok) throw new Error("Could not load title");
          if (!cancelled) setTitle((await res.json()) as TitlePage);
        } else {
          const q = includeTv ? "?includeTv=1" : "";
          const res = await fetch(`/api/person/${node.id}${q}`);
          if (!res.ok) throw new Error("Could not load person");
          if (!cancelled) setPerson((await res.json()) as PersonPage);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [node, includeTv]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const directors =
    title?.crew.directing.slice(0, 3).map((p) => p.name).join(" · ") ?? "";
  const cast =
    title?.cast.slice(0, 6).map((p) => p.name).join(" · ") ?? "";
  const knownFor =
    person?.cast.slice(0, 5).map((t) => t.title).join(" · ") ?? "";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={node.label}
      onClick={onClose}
    >
      <div
        className="animate-fade-up max-h-[85vh] w-full max-w-md overflow-y-auto border-4 border-black bg-[#fffdf7] shadow-[10px_10px_0_#000]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-start justify-between border-b-4 border-black p-4 ${
            node.kind === "title" ? "bg-[#ef4438]" : "bg-[#6657e8] text-white"
          }`}
        >
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-mono)] text-[10px] font-black uppercase tracking-[0.18em]">
              {node.kind === "title" ? "Title peek" : "Person peek"}
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-black uppercase leading-none">
              {node.label}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-black bg-[#ffd52e] px-2 py-1 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase text-black"
          >
            Close
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <p className="font-[family-name:var(--font-mono)] text-xs font-black uppercase">
              Loading details…
            </p>
          ) : null}
          {error ? (
            <p className="border-3 border-black bg-[#ef4438] px-3 py-2 font-[family-name:var(--font-mono)] text-xs font-black">
              {error}
            </p>
          ) : null}

          {title ? (
            <div className="grid grid-cols-[96px_1fr] gap-3">
              <Poster
                path={title.posterPath}
                alt={title.title}
                className="aspect-[2/3] w-full border-3 border-black"
              />
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-mono)] text-[10px] font-black uppercase text-[#6657e8]">
                  {title.mediaType === "tv" ? "TV" : "Movie"}
                  {title.year ? ` · ${title.year}` : ""}
                </p>
                {title.genres.length > 0 ? (
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] font-bold">
                    {title.genres.slice(0, 3).join(" · ")}
                  </p>
                ) : null}
                {directors ? (
                  <p className="mt-3 font-[family-name:var(--font-mono)] text-[10px]">
                    <span className="font-black uppercase">Directed by</span>
                    <br />
                    {directors}
                  </p>
                ) : null}
                {cast ? (
                  <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px]">
                    <span className="font-black uppercase">Cast</span>
                    <br />
                    {cast}
                  </p>
                ) : null}
              </div>
              {title.overview ? (
                <p className="col-span-2 mt-1 border-l-4 border-[#ffd52e] pl-3 text-sm leading-relaxed">
                  {title.overview}
                </p>
              ) : null}
            </div>
          ) : null}

          {person ? (
            <div className="grid grid-cols-[96px_1fr] gap-3">
              <Poster
                path={person.profilePath}
                alt={person.name}
                kind="profile"
                className="aspect-square w-full border-3 border-black object-cover"
              />
              <div className="min-w-0">
                {person.knownForDepartment ? (
                  <p className="font-[family-name:var(--font-mono)] text-[10px] font-black uppercase text-[#6657e8]">
                    Known for {person.knownForDepartment}
                  </p>
                ) : null}
                {knownFor ? (
                  <p className="mt-3 font-[family-name:var(--font-mono)] text-[10px]">
                    <span className="font-black uppercase">Notable titles</span>
                    <br />
                    {knownFor}
                  </p>
                ) : null}
              </div>
              {person.biography ? (
                <p className="col-span-2 mt-1 border-l-4 border-[#ffd52e] pl-3 text-sm leading-relaxed line-clamp-6">
                  {person.biography}
                </p>
              ) : (
                <p className="col-span-2 font-[family-name:var(--font-mono)] text-xs">
                  No biography on file.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
