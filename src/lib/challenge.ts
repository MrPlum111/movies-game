import {
  hopsForDifficulty,
  matchesEndpoint,
  type ChallengeSettings,
} from "./challenge-settings";
import { findShortestPath, sharesPeople } from "./graph";
import {
  fetchPersonPool,
  fetchTitlePool,
  getPersonName,
  getPersonRef,
  getPersonTitleKeys,
  getTitlePersonIds,
  parseTitleKey,
  titleKey,
} from "./tmdb";
import type {
  Challenge,
  ChallengeEndpoint,
  MediaType,
  PathNode,
  PersonRef,
  TitleRef,
} from "./types";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function personLabel(id: number): Promise<string> {
  try {
    return await getPersonName(id);
  } catch {
    return `Person ${id}`;
  }
}

type TitleFrontier = {
  title: TitleRef;
  path: PathNode[];
  personIds: number[];
};

type PersonFrontier = {
  person: PersonRef;
  path: PathNode[];
  titleKeys: string[];
};

async function expandTitleHop(
  nodes: TitleFrontier[],
  includeTv: boolean,
  beam: number,
): Promise<TitleFrontier[]> {
  const next: TitleFrontier[] = [];
  const seen = new Set(nodes.map((n) => titleKey(n.title.mediaType, n.title.id)));

  for (const node of shuffle(nodes)) {
    const people = shuffle(node.personIds).slice(0, 5);
    for (const personId of people) {
      const titles = shuffle(
        await getPersonTitleKeys(personId, includeTv, 18),
      ).slice(0, 6);
      const pName = await personLabel(personId);

      for (const tKey of titles) {
        if (seen.has(tKey)) continue;
        if (
          node.path.some(
            (p) =>
              p.kind === "title" && titleKey(p.mediaType, p.id) === tKey,
          )
        ) {
          continue;
        }

        const parsed = parseTitleKey(tKey);
        const meta = await getTitlePersonIds(
          parsed.mediaType,
          parsed.id,
          12,
        );
        if (!meta) continue;

        seen.add(tKey);
        next.push({
          title: meta.title,
          personIds: meta.personIds,
          path: [
            ...node.path,
            { kind: "person", id: personId, label: pName },
            {
              kind: "title",
              mediaType: meta.title.mediaType,
              id: meta.title.id,
              label: meta.title.title,
            },
          ],
        });

        if (next.length >= beam * 3) break;
      }
      if (next.length >= beam * 3) break;
    }
    if (next.length >= beam * 3) break;
  }

  return shuffle(next).slice(0, beam);
}

async function expandPersonHop(
  nodes: PersonFrontier[],
  includeTv: boolean,
  beam: number,
): Promise<PersonFrontier[]> {
  const next: PersonFrontier[] = [];
  const seen = new Set(nodes.map((n) => n.person.id));

  for (const node of shuffle(nodes)) {
    const titles = shuffle(node.titleKeys).slice(0, 6);
    for (const tKey of titles) {
      const parsed = parseTitleKey(tKey);
      const meta = await getTitlePersonIds(
        parsed.mediaType,
        parsed.id,
        12,
      );
      if (!meta) continue;

      const people = shuffle(meta.personIds).slice(0, 6);
      for (const personId of people) {
        if (seen.has(personId)) continue;
        if (node.path.some((p) => p.kind === "person" && p.id === personId)) {
          continue;
        }

        const person = await getPersonRef(personId);
        if (!person) continue;
        const titleKeys = await getPersonTitleKeys(
          personId,
          includeTv,
          18,
        );
        if (titleKeys.length === 0) continue;

        seen.add(personId);
        next.push({
          person,
          titleKeys,
          path: [
            ...node.path,
            {
              kind: "title",
              mediaType: meta.title.mediaType,
              id: meta.title.id,
              label: meta.title.title,
            },
            { kind: "person", id: person.id, label: person.name },
          ],
        });

        if (next.length >= beam * 3) break;
      }
      if (next.length >= beam * 3) break;
    }
    if (next.length >= beam * 3) break;
  }

  return shuffle(next).slice(0, beam);
}

async function generateTitleChallenge(
  settings: ChallengeSettings,
): Promise<Challenge> {
  const hops = hopsForDifficulty(settings.difficulty);
  const startPool = shuffle(
    await fetchTitlePool(settings.start, settings.includeTv, 3),
  );

  if (startPool.length === 0) {
    throw new Error(
      "No titles match your filters — loosen year or minimum rating.",
    );
  }

  let lastError = "Could not find a route matching your end filters";

  for (const startSeed of startPool.slice(0, 10)) {
    try {
      const startMeta = await getTitlePersonIds(
        startSeed.mediaType,
        startSeed.id,
        undefined,
      );
      if (!startMeta) continue;
      if (!matchesEndpoint(startMeta.title, settings.start)) continue;
      if (startMeta.personIds.length === 0) continue;

      const start = startMeta.title;
      const startPeople = startMeta.personIds;

      let frontier: TitleFrontier[] = [
        {
          title: start,
          personIds: startPeople,
          path: [
            {
              kind: "title",
              mediaType: start.mediaType,
              id: start.id,
              label: start.title,
            },
          ],
        },
      ];

      for (let h = 0; h < hops - 1; h++) {
        frontier = await expandTitleHop(
          frontier,
          settings.includeTv,
          16,
        );
        if (frontier.length === 0) break;
      }

      if (frontier.length === 0) {
        lastError = "Graph expansion dried up";
        continue;
      }

      for (const node of shuffle(frontier)) {
        const people = shuffle(node.personIds).slice(0, 6);
        for (const personId of people) {
          const titles = shuffle(
            await getPersonTitleKeys(
              personId,
              settings.includeTv,
              20,
            ),
          ).slice(0, 8);
          const pName = await personLabel(personId);

          for (const tKey of titles) {
            const startKey = titleKey(start.mediaType, start.id);
            if (tKey === startKey) continue;
            if (
              node.path.some(
                (p) =>
                  p.kind === "title" && titleKey(p.mediaType, p.id) === tKey,
              )
            ) {
              continue;
            }

            const parsed = parseTitleKey(tKey);
            const endMeta = await getTitlePersonIds(
              parsed.mediaType,
              parsed.id,
              undefined,
            );
            if (!endMeta) continue;

            const target = endMeta.title;
            if (!matchesEndpoint(target, settings.end)) continue;

            if (
              start.collectionId &&
              target.collectionId &&
              start.collectionId === target.collectionId
            ) {
              continue;
            }

            if (sharesPeople(startPeople, endMeta.personIds)) {
              continue;
            }

            const path: PathNode[] = [
              ...node.path,
              { kind: "person", id: personId, label: pName },
              {
                kind: "title",
                mediaType: target.mediaType,
                id: target.id,
                label: target.title,
              },
            ];

            const clicks = path.length - 1;
            if (clicks < hops * 2) continue;

            const startEndpoint: ChallengeEndpoint = { kind: "title", ...start };
            const targetEndpoint: ChallengeEndpoint = {
              kind: "title",
              ...target,
            };

            return {
              start: startEndpoint,
              target: targetEndpoint,
              includeTv: settings.includeTv,
              shortestClicks: clicks,
              shortestPath: path,
              settings,
            };
          }
        }
      }

      lastError = "No end title matched your end filters from this start";
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Attempt failed";
    }
  }

  throw new Error(lastError);
}

async function generatePersonChallenge(
  settings: ChallengeSettings,
): Promise<Challenge> {
  const hops = hopsForDifficulty(settings.difficulty);
  const role = settings.endpointKind === "director" ? "director" : "actor";
  const pool = shuffle(await fetchPersonPool(role, 4));

  if (pool.length === 0) {
    throw new Error("Could not load people for this endpoint mode");
  }

  let lastError = "Could not find a person-to-person route";

  for (const startSeed of pool.slice(0, 12)) {
    try {
      const startTitles = await getPersonTitleKeys(
        startSeed.id,
        settings.includeTv,
        24,
      );
      if (startTitles.length === 0) continue;

      // Prefer titles that also match era/rating filters when possible
      const filteredTitles: string[] = [];
      for (const tKey of startTitles.slice(0, 20)) {
        const parsed = parseTitleKey(tKey);
        const meta = await getTitlePersonIds(
          parsed.mediaType,
          parsed.id,
          8,
        );
        if (!meta) continue;
        if (
          matchesEndpoint(meta.title, settings.start) ||
          matchesEndpoint(meta.title, settings.end)
        ) {
          filteredTitles.push(tKey);
        }
      }
      const seedTitles =
        filteredTitles.length > 0 ? filteredTitles : startTitles;

      let frontier: PersonFrontier[] = [
        {
          person: startSeed,
          titleKeys: seedTitles,
          path: [
            { kind: "person", id: startSeed.id, label: startSeed.name },
          ],
        },
      ];

      for (let h = 0; h < hops - 1; h++) {
        frontier = await expandPersonHop(
          frontier,
          settings.includeTv,
          16,
        );
        if (frontier.length === 0) break;
      }

      if (frontier.length === 0) {
        lastError = "Person graph expansion dried up";
        continue;
      }

      for (const node of shuffle(frontier)) {
        const titles = shuffle(node.titleKeys).slice(0, 8);
        for (const tKey of titles) {
          const parsed = parseTitleKey(tKey);
          const meta = await getTitlePersonIds(
            parsed.mediaType,
            parsed.id,
            12,
          );
          if (!meta) continue;
          if (!matchesEndpoint(meta.title, settings.end) && settings.end.minRating > 0) {
            // soft: still allow if rating filter empty; if set, prefer matching titles
            if ((meta.title.voteAverage ?? 0) < settings.end.minRating) continue;
          }

          for (const personId of shuffle(meta.personIds).slice(0, 8)) {
            if (personId === startSeed.id) continue;
            if (node.path.some((p) => p.kind === "person" && p.id === personId)) {
              continue;
            }

            const target = await getPersonRef(personId);
            if (!target) continue;

            const path: PathNode[] = [
              ...node.path,
              {
                kind: "title",
                mediaType: meta.title.mediaType,
                id: meta.title.id,
                label: meta.title.title,
              },
              { kind: "person", id: target.id, label: target.name },
            ];

            const clicks = path.length - 1;
            if (clicks < hops * 2) continue;

            return {
              start: { kind: "person", role, ...startSeed },
              target: { kind: "person", role, ...target },
              includeTv: settings.includeTv,
              shortestClicks: clicks,
              shortestPath: path,
              settings,
            };
          }
        }
      }

      lastError = "No suitable end person from this start";
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Attempt failed";
    }
  }

  throw new Error(lastError);
}

export async function generateClassicChallenge(
  settings: ChallengeSettings,
): Promise<Challenge> {
  if (settings.endpointKind === "title") {
    return generateTitleChallenge(settings);
  }
  return generatePersonChallenge(settings);
}

/** Rebuild a challenge for a fixed start/target title pair (shareable links). */
export async function buildChallengeFromEndpoints(input: {
  start: { mediaType: MediaType; id: number };
  target: { mediaType: MediaType; id: number };
  includeTv: boolean;
}): Promise<Challenge> {
  const startMeta = await getTitlePersonIds(
    input.start.mediaType,
    input.start.id,
  );
  const targetMeta = await getTitlePersonIds(
    input.target.mediaType,
    input.target.id,
  );
  if (!startMeta || !targetMeta) {
    throw new Error("Could not load one of the shared titles");
  }

  const result = await findShortestPath(
    input.start,
    input.target,
    input.includeTv,
    12,
  );
  if (!result) {
    throw new Error("No path found between these titles");
  }

  return {
    start: { kind: "title", ...startMeta.title },
    target: { kind: "title", ...targetMeta.title },
    includeTv: input.includeTv,
    shortestClicks: result.clicks,
    shortestPath: result.path,
  };
}
