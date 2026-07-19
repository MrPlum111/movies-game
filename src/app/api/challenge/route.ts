import { NextRequest, NextResponse } from "next/server";
import { generateClassicChallenge } from "@/lib/challenge";
import {
  defaultChallengeSettings,
  parseChallengeSettings,
} from "@/lib/challenge-settings";

export const dynamic = "force-dynamic";

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
    const settings = parseChallengeSettings(body);
    const challenge = await generateClassicChallenge(settings);
    return NextResponse.json(challenge);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Challenge failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
