"use client";

import { useMemo, useState } from "react";
import { PageSearch, matchesQuery } from "@/components/PageSearch";
import { Poster } from "@/components/Poster";
import type { PersonPage, TitleOnPerson } from "@/lib/types";

type Props = {
  page: PersonPage;
  onSelectTitle: (title: TitleOnPerson) => void;
};

function TitleRow({
  title,
  onSelect,
}: {
  title: TitleOnPerson;
  onSelect: () => void;
}) {
  const roleNote =
    title.roles.length > 1
      ? title.roles.join(" · ")
      : title.character || title.jobs?.join(", ") || title.roles[0];

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-center gap-3 border-2 border-black bg-[#fffdf7] p-2 text-left shadow-[3px_3px_0_#000] transition hover:-translate-y-0.5 hover:bg-[#ffd52e] hover:shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    >
      <Poster
        path={title.posterPath}
        alt={title.title}
        className="h-14 w-10 shrink-0 border-2 border-black"
      />
      <span className="min-w-0">
        <span className="block truncate font-[family-name:var(--font-mono)] text-xs font-black uppercase">
          {title.title}
          {title.year ? (
            <span className="text-[#ef4438]"> ({title.year})</span>
          ) : null}
        </span>
        <span className="block truncate font-[family-name:var(--font-mono)] text-[10px] capitalize text-[#6b645a]">
          {title.mediaType === "tv" ? "TV · " : ""}
          {roleNote}
        </span>
      </span>
    </button>
  );
}

export function PersonView({ page, onSelectTitle }: Props) {
  const [query, setQuery] = useState("");

  const cast = useMemo(
    () =>
      page.cast.filter((t) =>
        matchesQuery(
          query,
          t.title,
          t.year,
          t.character,
          ...(t.jobs ?? []),
          ...t.roles,
        ),
      ),
    [page.cast, query],
  );

  const crewSections = useMemo(() => {
    const sections = [
      ["Directing", page.crew.directing],
      ["Writing", page.crew.writing],
      ["Producing", page.crew.producing],
    ] as const;
    return sections
      .map(([label, titles]) => ({
        label,
        titles: titles.filter((t) =>
          matchesQuery(query, t.title, t.year, ...(t.jobs ?? []), ...t.roles),
        ),
      }))
      .filter((s) => s.titles.length > 0);
  }, [page.crew, query]);

  return (
    <article className="animate-fade-up mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-col items-start gap-5 border-4 border-black bg-[#fffdf7] p-5 shadow-[7px_7px_0_#000] sm:flex-row">
        <Poster
          path={page.profilePath}
          alt={page.name}
          kind="profile"
          className="h-36 w-36 shrink-0 border-4 border-black bg-[#6657e8]"
        />
        <div className="min-w-0 flex-1">
          <p className="inline-block bg-black px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase tracking-[0.2em] text-white">
            Person
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-black uppercase leading-none tracking-tight md:text-5xl">
            {page.name}
          </h1>
          {page.knownForDepartment ? (
            <p className="mt-3 font-[family-name:var(--font-mono)] text-xs font-black uppercase text-[#6657e8]">
              Known for {page.knownForDepartment}
            </p>
          ) : null}
          {page.biography ? (
            <p className="mt-3 max-w-3xl border-l-4 border-[#ffd52e] pl-3 text-[15px] font-medium leading-relaxed line-clamp-4">
              {page.biography}
            </p>
          ) : null}
          <div className="mt-4 max-w-xl">
            <PageSearch
              value={query}
              onChange={setQuery}
              placeholder="Search titles in this filmography…"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
        <section className="min-w-0 border-4 border-black bg-[#fffdf7] shadow-[6px_6px_0_#000]">
          <div className="sticky top-[4.5rem] z-10 flex items-baseline justify-between border-b-4 border-black bg-[#6657e8] px-4 py-3 text-white">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-black uppercase">Acting credits</h2>
            <span className="font-[family-name:var(--font-mono)] text-xs font-black">{cast.length}</span>
          </div>
          {cast.length === 0 ? (
            <p className="p-4 font-[family-name:var(--font-mono)] text-xs">No acting credits match.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              {cast.map((title) => (
                <TitleRow
                  key={`cast-${title.mediaType}-${title.id}`}
                  title={title}
                  onSelect={() => onSelectTitle(title)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="min-w-0 border-4 border-black bg-[#fffdf7] shadow-[6px_6px_0_#000]">
          <div className="sticky top-[4.5rem] z-10 flex items-baseline justify-between border-b-4 border-black bg-[#ef4438] px-4 py-3">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-black uppercase">Crew credits</h2>
            <span className="font-[family-name:var(--font-mono)] text-xs font-black">
              {crewSections.reduce((n, s) => n + s.titles.length, 0)}
            </span>
          </div>
          {crewSections.length === 0 ? (
            <p className="p-4 font-[family-name:var(--font-mono)] text-xs">No crew credits match.</p>
          ) : (
            <div className="p-4">
            {crewSections.map(({ label, titles }) => (
              <div key={label} className="mb-6 last:mb-0">
                <h3 className="mb-3 inline-block border-2 border-black bg-[#ffd52e] px-2 py-1 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase tracking-[0.18em]">
                  {label}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {titles.map((title) => (
                    <TitleRow
                      key={`${label}-${title.mediaType}-${title.id}`}
                      title={title}
                      onSelect={() => onSelectTitle(title)}
                    />
                  ))}
                </div>
              </div>
            ))}
            </div>
          )}
        </section>
      </div>
    </article>
  );
}
