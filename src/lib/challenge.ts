import {
  hopsForDifficulty,
  matchesEndpoint,
  type ChallengeSettings,
} from "./challenge-settings";
import { findShortestPath, sharesPeople } from "./graph";
import {
  fetchTitlePool,
  getPersonName,
  getPersonTitleKeys,
  getTitlePersonIds,
  parseTitleKey,
  titleKey,
} from "./tmdb";
import type { Challenge, MediaType, PathNode, TitleRef } from "./types";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type Frontier = {
  title: TitleRef;
  path: PathNode[];
  personIds: number[];
};

async function personLabel(id: number): Promise<string> {
  try {
    return await getPersonName(id);
  } catch {
    return `Person ${id}`;
  }
}

/**
 * Expand one movie-hop: Title → Person → Title
 * Returns up to `beam` new frontiers.
 */
async function expandHop(
  nodes: Frontier[],
  includeTv: boolean,
  beam: number,
): Promise<Frontier[]> {
  const next: Frontier[] = [];
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
        if (node.path.some((p) => p.kind === "title" && titleKey(p.mediaType, p.id) === tKey)) {
          continue;
        }

        const parsed = parseTitleKey(tKey);
        const meta = await getTitlePersonIds(parsed.mediaType, parsed.id, 12);
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

export async function generateClassicChallenge(
  settings: ChallengeSettings,
): Promise<Challenge> {
  const hops = hopsForDifficulty(settings.difficulty);
  const startPool = shuffle(
    await fetchTitlePool(settings.start, settings.includeTv, 3),
  );

  if (startPool.length === 0) {
    throw new Error(
      "No titles match your start filters — loosen popularity, year, or genre.",
    );
  }

  let lastError = "Could not find a route matching your end filters";

  for (const startSeed of startPool.slice(0, 10)) {
    try {
      const startMeta = await getTitlePersonIds(
        startSeed.mediaType,
        startSeed.id,
      );
      if (!startMeta) continue;
      if (!matchesEndpoint(startMeta.title, settings.start)) continue;

      const start = startMeta.title;
      const startPeople = startMeta.personIds;

      let frontier: Frontier[] = [
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

      // Expand (hops - 1) times to reach intermediate nodes, then final hop filters ends
      for (let h = 0; h < hops - 1; h++) {
        frontier = await expandHop(frontier, settings.includeTv, 16);
        if (frontier.length === 0) break;
      }

      if (frontier.length === 0) {
        lastError = "Graph expansion dried up";
        continue;
      }

      // Final hop: look for an end title matching end filters
      for (const node of shuffle(frontier)) {
        const people = shuffle(node.personIds).slice(0, 6);
        for (const personId of people) {
          const titles = shuffle(
            await getPersonTitleKeys(personId, settings.includeTv, 20),
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
            const endMeta = await getTitlePersonIds(parsed.mediaType, parsed.id);
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
            // Expected: hops * 2
            if (clicks < hops * 2) continue;

            return {
              start,
              target,
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

/** Rebuild a challenge for a fixed start/target pair (shareable links). */
export async function buildChallengeFromEndpoints(input: {
  start: { mediaType: MediaType; id: number };
  target: { mediaType: MediaType; id: number };
  includeTv: boolean;
}): Promise<Challenge> {
  const startMeta = await getTitlePersonIds(input.start.mediaType, input.start.id);
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
    start: startMeta.title,
    target: targetMeta.title,
    includeTv: input.includeTv,
    shortestClicks: result.clicks,
    shortestPath: result.path,
  };
}
