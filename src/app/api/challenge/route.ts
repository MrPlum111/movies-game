import { NextRequest, NextResponse } from "next/server";
import {
  buildChallengeFromEndpoints,
  generateClassicChallenge,
} from "@/lib/challenge";
import {
  defaultChallengeSettings,
  parseChallengeSettings,
} from "@/lib/challenge-settings";
import type { MediaType } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseFixedRef(raw: unknown): { mediaType: MediaType; id: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { mediaType?: unknown; id?: unknown };
  if (o.mediaType !== "movie" && o.mediaType !== "tv") return null;
  const id = Number(o.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  return { mediaType: o.mediaType, id };
}

export async function GET(req: NextRequest) {
  try {
    const includeTv = req.nextUrl.searchParams.get("includeTv") === "1";
    const settings = defaultChallengeSettings();
    settings.includeTv = includeTv;
    const challenge = await generateClassicChallenge(settings);
    return NextResponse.json(challenge);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Challenge failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const start = parseFixedRef(body?.startRef);
    const target = parseFixedRef(body?.targetRef);
    if (start && target) {
      const challenge = await buildChallengeFromEndpoints({
        start,
        target,
        includeTv: Boolean(body?.includeTv),
      });
      return NextResponse.json(challenge);
    }

    const settings = parseChallengeSettings(body);
    const challenge = await generateClassicChallenge(settings);
    return NextResponse.json(challenge);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Challenge failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
