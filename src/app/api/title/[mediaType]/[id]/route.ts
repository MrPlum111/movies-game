import { NextRequest, NextResponse } from "next/server";
import { getTitlePage } from "@/lib/tmdb";
import type { MediaType } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ mediaType: string; id: string }> },
) {
  try {
    const { mediaType, id } = await ctx.params;
    if (mediaType !== "movie" && mediaType !== "tv") {
      return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
    }
    const page = await getTitlePage(mediaType as MediaType, Number(id));
    if (!page) {
      return NextResponse.json({ error: "Title not found or excluded" }, { status: 404 });
    }
    return NextResponse.json(page);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load title";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
