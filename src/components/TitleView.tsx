"use client";

import { useMemo, useState } from "react";
import { PageSearch, matchesQuery } from "@/components/PageSearch";
import { Poster } from "@/components/Poster";
import type { PathFilter } from "@/lib/challenge-settings";
import type { PersonOnTitle, TitlePage } from "@/lib/types";

type Props = {
  page: TitlePage;
  onSelectPerson: (person: PersonOnTitle) => void;
  opening?: boolean;
  pathFilter?: PathFilter;
};

function PersonRow({
  person,
  onSelect,
}: {
  person: PersonOnTitle;
  onSelect: () => void;
}) {
  const roleNote =
    person.roles.length > 1
      ? person.roles.join(" · ")
      : person.character || person.jobs?.join(", ") || person.roles[0];

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-center gap-3 border-2 border-black bg-[#fffdf7] p-2 text-left shadow-[3px_3px_0_#000] transition hover:-translate-y-0.5 hover:bg-[#ffd52e] hover:shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    >
      <Poster
        path={person.profilePath}
        alt={person.name}
        kind="profile"
        className="h-11 w-11 shrink-0 border-2 border-black"
      />
      <span className="min-w-0">
        <span className="block truncate font-[family-name:var(--font-mono)] text-xs font-black uppercase">
          {person.name}
        </span>
        <span className="block truncate font-[family-name:var(--font-mono)] text-[10px] capitalize text-[#6b645a]">
          {roleNote}
        </span>
      </span>
    </button>
  );
}

export function TitleView({
  page,
  onSelectPerson,
  opening = false,
  pathFilter = "any",
}: Props) {
  const [query, setQuery] = useState("");

  const showCast = pathFilter === "any" || pathFilter === "acting";
  const showCrew = pathFilter === "any" || pathFilter === "directing";

  const cast = useMemo(
    () =>
      page.cast.filter((p) =>
        matchesQuery(query, p.name, p.character, ...(p.jobs ?? []), ...p.roles),
      ),
    [page.cast, query],
  );

  const crewSections = useMemo(() => {
    if (!showCrew) return [];
    const sections =
      pathFilter === "directing"
        ? ([["Directing", page.crew.directing]] as const)
        : ([
            ["Directing", page.crew.directing],
            ["Writing", page.crew.writing],
            ["Producing", page.crew.producing],
          ] as const);
    return sections
      .map(([label, people]) => ({
        label,
        people: people.filter((p) =>
          matchesQuery(query, p.name, ...(p.jobs ?? []), ...p.roles),
        ),
      }))
      .filter((s) => s.people.length > 0);
  }, [page.crew, query, pathFilter, showCrew]);

  return (
    <article
      className={`${opening ? "launch-page-enter" : "animate-fade-up"} mx-auto max-w-7xl px-4 py-6`}
    >
      <div className="grid gap-6 border-4 border-black bg-[#fffdf7] p-5 shadow-[7px_7px_0_#000] md:grid-cols-[180px_1fr]">
        <div className={opening ? "launch-page-poster" : ""}>
          <Poster
            path={page.posterPath}
            alt={page.title}
            className="mx-auto aspect-[2/3] w-full max-w-[180px] border-3 border-black md:mx-0"
          />
        </div>
        <div className={`min-w-0 ${opening ? "launch-page-info" : ""}`}>
          <p className="inline-block bg-black px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase tracking-[0.2em] text-white">
            {page.mediaType === "tv" ? "TV series" : "Movie"}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-black uppercase leading-[0.95] tracking-tight md:text-5xl">
            {page.title}
            {page.year ? (
              <span className="text-[#ef4438]"> ({page.year})</span>
            ) : null}
          </h1>
          {page.genres.length > 0 ? (
            <p className="mt-3 font-[family-name:var(--font-mono)] text-xs font-bold uppercase text-[#6657e8]">{page.genres.join(" · ")}</p>
          ) : null}
          {page.overview ? (
            <p className="mt-3 max-w-3xl border-l-4 border-[#ffd52e] pl-3 text-[15px] font-medium leading-relaxed line-clamp-4">
              {page.overview}
            </p>
          ) : null}
          <div className="mt-4 max-w-xl">
            <PageSearch
              value={query}
              onChange={setQuery}
              placeholder="Search cast or crew on this page…"
            />
          </div>
        </div>
      </div>

      <div
        className={`mt-8 grid gap-8 lg:items-start ${
          showCast && showCrew ? "lg:grid-cols-2" : "lg:grid-cols-1"
        } ${opening ? "launch-page-lists" : ""}`}
      >
        {showCast ? (
        <section className="min-w-0 border-4 border-black bg-[#fffdf7] shadow-[6px_6px_0_#000]">
          <div className="sticky top-[4.5rem] z-10 flex items-baseline justify-between border-b-4 border-black bg-[#6657e8] px-4 py-3 text-white">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-black uppercase">Cast</h2>
            <span className="font-[family-name:var(--font-mono)] text-xs font-black">{cast.length}</span>
          </div>
          {cast.length === 0 ? (
            <p className="p-4 font-[family-name:var(--font-mono)] text-xs">No cast matches.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              {cast.map((person) => (
                <PersonRow
                  key={`cast-${person.id}`}
                  person={person}
                  onSelect={() => onSelectPerson(person)}
                />
              ))}
            </div>
          )}
        </section>
        ) : null}

        {showCrew ? (
        <section className="min-w-0 border-4 border-black bg-[#fffdf7] shadow-[6px_6px_0_#000]">
          <div className="sticky top-[4.5rem] z-10 flex items-baseline justify-between border-b-4 border-black bg-[#ef4438] px-4 py-3">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-black uppercase">
              {pathFilter === "directing" ? "Directors" : "Crew"}
            </h2>
            <span className="font-[family-name:var(--font-mono)] text-xs font-black">
              {crewSections.reduce((n, s) => n + s.people.length, 0)}
            </span>
          </div>
          {crewSections.length === 0 ? (
            <p className="p-4 font-[family-name:var(--font-mono)] text-xs">No crew matches.</p>
          ) : (
            <div className="p-4">
            {crewSections.map(({ label, people }) => (
              <div key={label} className="mb-6 last:mb-0">
                <h3 className="mb-3 inline-block border-2 border-black bg-[#ffd52e] px-2 py-1 font-[family-name:var(--font-mono)] text-[10px] font-black uppercase tracking-[0.18em]">
                  {label}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {people.map((person) => (
                    <PersonRow
                      key={`${label}-${person.id}`}
                      person={person}
                      onSelect={() => onSelectPerson(person)}
                    />
                  ))}
                </div>
              </div>
            ))}
            </div>
          )}
        </section>
        ) : null}
      </div>
    </article>
  );
}
