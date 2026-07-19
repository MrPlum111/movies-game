"use client";

import { useMemo, useState } from "react";
import { PageSearch, matchesQuery } from "@/components/PageSearch";
import { Poster } from "@/components/Poster";
import type { PersonOnTitle, TitlePage } from "@/lib/types";

type Props = {
  page: TitlePage;
  onSelectPerson: (person: PersonOnTitle) => void;
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
      className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-left transition hover:border-[var(--border)] hover:bg-[var(--muted)]"
    >
      <Poster
        path={person.profilePath}
        alt={person.name}
        kind="profile"
        className="h-11 w-11 shrink-0 rounded-full"
      />
      <span className="min-w-0">
        <span className="block truncate font-medium group-hover:text-[var(--accent)]">
          {person.name}
        </span>
        <span className="block truncate text-xs capitalize text-[var(--muted-fg)]">
          {roleNote}
        </span>
      </span>
    </button>
  );
}

export function TitleView({ page, onSelectPerson }: Props) {
  const [query, setQuery] = useState("");

  const cast = useMemo(
    () =>
      page.cast.filter((p) =>
        matchesQuery(query, p.name, p.character, ...(p.jobs ?? []), ...p.roles),
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
      .map(([label, people]) => ({
        label,
        people: people.filter((p) =>
          matchesQuery(query, p.name, ...(p.jobs ?? []), ...p.roles),
        ),
      }))
      .filter((s) => s.people.length > 0);
  }, [page.crew, query]);

  return (
    <article className="animate-fade-up mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 md:grid-cols-[160px_1fr]">
        <Poster
          path={page.posterPath}
          alt={page.title}
          className="mx-auto aspect-[2/3] w-full max-w-[160px] rounded-md shadow-[var(--shadow)] md:mx-0"
        />
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted-fg)]">
            {page.mediaType === "tv" ? "TV series" : "Movie"}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl leading-tight md:text-4xl">
            {page.title}
            {page.year ? (
              <span className="text-[var(--muted-fg)]"> ({page.year})</span>
            ) : null}
          </h1>
          {page.genres.length > 0 ? (
            <p className="mt-2 text-sm text-[var(--muted-fg)]">{page.genres.join(" · ")}</p>
          ) : null}
          {page.overview ? (
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[var(--fg)]/85 line-clamp-4">
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

      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
        <section className="min-w-0">
          <div className="sticky top-[4.5rem] z-10 -mx-1 mb-3 flex items-baseline justify-between bg-[var(--bg)]/90 px-1 py-2 backdrop-blur-sm">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">Cast</h2>
            <span className="text-xs text-[var(--muted-fg)]">{cast.length}</span>
          </div>
          {cast.length === 0 ? (
            <p className="text-sm text-[var(--muted-fg)]">No cast matches.</p>
          ) : (
            <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
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

        <section className="min-w-0 lg:border-l lg:border-[var(--border)] lg:pl-8">
          <div className="sticky top-[4.5rem] z-10 -mx-1 mb-3 flex items-baseline justify-between bg-[var(--bg)]/90 px-1 py-2 backdrop-blur-sm">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">Crew</h2>
            <span className="text-xs text-[var(--muted-fg)]">
              {crewSections.reduce((n, s) => n + s.people.length, 0)}
            </span>
          </div>
          {crewSections.length === 0 ? (
            <p className="text-sm text-[var(--muted-fg)]">No crew matches.</p>
          ) : (
            crewSections.map(({ label, people }) => (
              <div key={label} className="mb-6">
                <h3 className="text-xs uppercase tracking-[0.18em] text-[var(--muted-fg)]">
                  {label}
                </h3>
                <div className="mt-2 grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                  {people.map((person) => (
                    <PersonRow
                      key={`${label}-${person.id}`}
                      person={person}
                      onSelect={() => onSelectPerson(person)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </article>
  );
}
