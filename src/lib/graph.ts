import type { MediaType, PathNode } from "./types";
import {
  getPersonName,
  getPersonTitleKeys,
  getTitlePersonIds,
  parseTitleKey,
  titleKey,
} from "./tmdb";

export type ShortestPathResult = {
  clicks: number;
  path: PathNode[];
};

/** Caps used only for pathfinding — UI still loads full cast/filmography. */
const MAX_CAST_FOR_GRAPH = 15;
const MAX_TITLES_PER_PERSON = 30;

/**
 * BFS on Title ↔ Person.
 * Clicks = edges from the start title (start = 0).
 */
export async function findShortestPath(
  start: { mediaType: MediaType; id: number },
  target: { mediaType: MediaType; id: number },
  includeTv: boolean,
  maxClicks = 6,
): Promise<ShortestPathResult | null> {
  const startKey = titleKey(start.mediaType, start.id);
  const targetKey = titleKey(target.mediaType, target.id);

  if (startKey === targetKey) {
    const meta = await getTitlePersonIds(start.mediaType, start.id);
    return {
      clicks: 0,
      path: [
        {
          kind: "title",
          mediaType: start.mediaType,
          id: start.id,
          label: meta?.title.title ?? startKey,
        },
      ],
    };
  }

  type Item = { kind: "title" | "person"; key: string; clicks: number };
  const queue: Item[] = [{ kind: "title", key: startKey, clicks: 0 }];
  const visited = new Set<string>([`t:${startKey}`]);
  const parent = new Map<string, string>();

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.clicks >= maxClicks) continue;

    if (cur.kind === "title") {
      const { mediaType, id } = parseTitleKey(cur.key);
      const meta = await getTitlePersonIds(mediaType, id, MAX_CAST_FOR_GRAPH);
      if (!meta) continue;

      for (const personId of meta.personIds) {
        const mark = `p:${personId}`;
        if (visited.has(mark)) continue;
        visited.add(mark);
        parent.set(mark, `t:${cur.key}`);
        queue.push({
          kind: "person",
          key: String(personId),
          clicks: cur.clicks + 1,
        });
      }
    } else {
      const titles = await getPersonTitleKeys(
        Number(cur.key),
        includeTv,
        MAX_TITLES_PER_PERSON,
      );
      for (const tKey of titles) {
        const mark = `t:${tKey}`;
        if (visited.has(mark)) continue;
        visited.add(mark);
        parent.set(mark, `p:${cur.key}`);

        if (tKey === targetKey) {
          return {
            clicks: cur.clicks + 1,
            path: await buildPath(`t:${targetKey}`, parent, startKey),
          };
        }

        queue.push({
          kind: "title",
          key: tKey,
          clicks: cur.clicks + 1,
        });
      }
    }
  }

  return null;
}

async function buildPath(
  endMark: string,
  parent: Map<string, string>,
  startKey: string,
): Promise<PathNode[]> {
  const marks: string[] = [];
  let cur: string | undefined = endMark;
  while (cur) {
    marks.push(cur);
    cur = parent.get(cur);
  }
  marks.reverse();

  if (marks[0] !== `t:${startKey}`) {
    marks.unshift(`t:${startKey}`);
  }

  const nodes: PathNode[] = [];
  for (const mark of marks) {
    if (mark.startsWith("t:")) {
      const key = mark.slice(2);
      const { mediaType, id } = parseTitleKey(key);
      const meta = await getTitlePersonIds(mediaType, id, MAX_CAST_FOR_GRAPH);
      nodes.push({
        kind: "title",
        mediaType,
        id,
        label: meta?.title.title ?? key,
      });
    } else {
      const id = Number(mark.slice(2));
      let label = `Person ${id}`;
      try {
        label = await getPersonName(id);
      } catch {
        /* fallback */
      }
      nodes.push({ kind: "person", id, label });
    }
  }
  return nodes;
}

export function sharesPeople(a: number[], b: number[]): boolean {
  const set = new Set(a);
  return b.some((id) => set.has(id));
}
