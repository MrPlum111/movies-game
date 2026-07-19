import { NextRequest, NextResponse } from "next/server";
import { findShortestPath } from "@/lib/graph";
import { getPersonName } from "@/lib/tmdb";
import type { MediaType } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const startType = sp.get("startType") as MediaType | null;
    const targetType = sp.get("targetType") as MediaType | null;
    const startId = Number(sp.get("startId"));
    const targetId = Number(sp.get("targetId"));
    const includeTv = sp.get("includeTv") === "1";

    if (
      !startType ||
      !targetType ||
      !["movie", "tv"].includes(startType) ||
      !["movie", "tv"].includes(targetType) ||
      !startId ||
      !targetId
    ) {
      return NextResponse.json({ error: "Invalid params" }, { status: 400 });
    }

    const result = await findShortestPath(
      { mediaType: startType, id: startId },
      { mediaType: targetType, id: targetId },
      includeTv,
      10,
    );

    if (!result) {
      return NextResponse.json({ error: "No path found" }, { status: 404 });
    }

    const path = await Promise.all(
      result.path.map(async (node) => {
        if (node.kind === "title") return node;
        try {
          return { ...node, label: await getPersonName(node.id) };
        } catch {
          return node;
        }
      }),
    );

    return NextResponse.json({ clicks: result.clicks, path });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Path failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
