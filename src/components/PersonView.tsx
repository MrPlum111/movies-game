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
      className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-left transition hover:border-[var(--border)] hover:bg-[var(--muted)]"
    >
      <Poster
        path={title.posterPath}
        alt={title.title}
        className="h-14 w-10 shrink-0 rounded-sm"
      />
      <span className="min-w-0">
        <span className="block truncate font-medium group-hover:text-[var(--accent)]">
          {title.title}
          {title.year ? (
            <span className="text-[var(--muted-fg)]"> ({title.year})</span>
          ) : null}
        </span>
        <span className="block truncate text-xs capitalize text-[var(--muted-fg)]">
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
      <div className="flex flex-col items-start gap-5 sm:flex-row">
        <Poster
          path={page.profilePath}
          alt={page.name}
          kind="profile"
          className="h-32 w-32 shrink-0 rounded-full shadow-[var(--shadow)]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted-fg)]">
            Person
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl md:text-4xl">
            {page.name}
          </h1>
          {page.knownForDepartment ? (
            <p className="mt-2 text-sm text-[var(--muted-fg)]">
              Known for {page.knownForDepartment}
            </p>
          ) : null}
          {page.biography ? (
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[var(--fg)]/85 line-clamp-4">
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
        <section className="min-w-0">
          <div className="sticky top-[4.5rem] z-10 -mx-1 mb-3 flex items-baseline justify-between bg-[var(--bg)]/90 px-1 py-2 backdrop-blur-sm">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">Cast</h2>
            <span className="text-xs text-[var(--muted-fg)]">{cast.length}</span>
          </div>
          {cast.length === 0 ? (
            <p className="text-sm text-[var(--muted-fg)]">No cast credits match.</p>
          ) : (
            <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
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

        <section className="min-w-0 lg:border-l lg:border-[var(--border)] lg:pl-8">
          <div className="sticky top-[4.5rem] z-10 -mx-1 mb-3 flex items-baseline justify-between bg-[var(--bg)]/90 px-1 py-2 backdrop-blur-sm">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">Crew</h2>
            <span className="text-xs text-[var(--muted-fg)]">
              {crewSections.reduce((n, s) => n + s.titles.length, 0)}
            </span>
          </div>
          {crewSections.length === 0 ? (
            <p className="text-sm text-[var(--muted-fg)]">No crew credits match.</p>
          ) : (
            crewSections.map(({ label, titles }) => (
              <div key={label} className="mb-6">
                <h3 className="text-xs uppercase tracking-[0.18em] text-[var(--muted-fg)]">
                  {label}
                </h3>
                <div className="mt-2 grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                  {titles.map((title) => (
                    <TitleRow
                      key={`${label}-${title.mediaType}-${title.id}`}
                      title={title}
                      onSelect={() => onSelectTitle(title)}
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
