import { NextRequest, NextResponse } from "next/server";
import { getPersonPage } from "@/lib/tmdb";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const includeTv = req.nextUrl.searchParams.get("includeTv") === "1";
    const page = await getPersonPage(Number(id), includeTv);
    if (!page) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }
    return NextResponse.json(page);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load person";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
