import { NextRequest, NextResponse } from "next/server";
import { addScore, getLeaderboard } from "@/lib/scores";

export async function GET(req: NextRequest) {
  try {
    const board = req.nextUrl.searchParams.get("board") === "time" ? "time" : "clicks";
    const entries = await getLeaderboard(board);
    return NextResponse.json({ board, entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load scores";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      clicks?: number;
      timeMs?: number;
      startTitle?: string;
      targetTitle?: string;
      status?: "completed" | "dnf";
    };

    const name = (body.name ?? "Anonymous").trim().slice(0, 24) || "Anonymous";
    const status = body.status === "dnf" ? "dnf" : "completed";

    if (
      status === "completed" &&
      (typeof body.clicks !== "number" ||
        typeof body.timeMs !== "number" ||
        body.clicks < 0 ||
        body.timeMs < 0)
    ) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    const entry = await addScore({
      name,
      clicks: body.clicks ?? 0,
      timeMs: body.timeMs ?? 0,
      startTitle: body.startTitle ?? "",
      targetTitle: body.targetTitle ?? "",
      status,
    });

    return NextResponse.json(entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save score";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
