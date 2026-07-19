import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { ScoreEntry } from "./types";

/** Vercel’s filesystem is read-only except /tmp (ephemeral per instance). */
const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "moviesgame-data")
  : path.join(process.cwd(), "data");
const SCORES_FILE = path.join(DATA_DIR, "scores.json");

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(SCORES_FILE);
  } catch {
    await fs.writeFile(SCORES_FILE, "[]", "utf8");
  }
}

async function readAll(): Promise<ScoreEntry[]> {
  await ensureFile();
  const raw = await fs.readFile(SCORES_FILE, "utf8");
  try {
    return JSON.parse(raw) as ScoreEntry[];
  } catch {
    return [];
  }
}

async function writeAll(entries: ScoreEntry[]): Promise<void> {
  await ensureFile();
  await fs.writeFile(SCORES_FILE, JSON.stringify(entries, null, 2), "utf8");
}

export async function addScore(
  input: Omit<ScoreEntry, "id" | "createdAt">,
): Promise<ScoreEntry> {
  const entries = await readAll();
  const entry: ScoreEntry = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  entries.push(entry);
  await writeAll(entries);
  return entry;
}

export async function getLeaderboard(
  board: "clicks" | "time",
  limit = 25,
): Promise<ScoreEntry[]> {
  const completed = (await readAll()).filter((e) => e.status === "completed");

  if (board === "clicks") {
    return completed
      .sort((a, b) => a.clicks - b.clicks || a.timeMs - b.timeMs)
      .slice(0, limit);
  }

  return completed.sort((a, b) => a.timeMs - b.timeMs).slice(0, limit);
}
