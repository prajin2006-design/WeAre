import { NextRequest, NextResponse } from "next/server";
import { resolveContentById } from "@/lib/catalog/content-resolver";
import { isMovie } from "@/types/content";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const typeParam = searchParams.get("type");
    const preferredType = typeParam === "movie" || typeParam === "tv" ? typeParam : undefined;

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const item = await resolveContentById(id, preferredType);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const seasonParam = searchParams.get("season");
    const episodeParam = searchParams.get("episode");

    if (seasonParam && episodeParam && !isMovie(item)) {
      const { resolveEpisode } = await import("@/lib/catalog/content-resolver");
      const ep = await resolveEpisode(item.id, `s${seasonParam}e${episodeParam}`);
      if (ep) {
        return NextResponse.json({
          ...item,
          episode_title: ep.title,
          season_number: ep.season_number,
          episode_number: ep.episode_number,
          episode_id: `s${ep.season_number}-e${ep.episode_number}`,
          backdrop_url: ep.thumbnail_url || item.backdrop_url,
        });
      }
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("[Catalog Item API Error]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
