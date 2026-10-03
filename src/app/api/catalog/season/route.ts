import { NextRequest, NextResponse } from "next/server";
import { DynamicCatalogService } from "@/lib/tmdb/dynamic-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get("seriesId") || searchParams.get("id");
    const seasonNumberStr = searchParams.get("season") || searchParams.get("seasonNumber") || "1";

    if (!seriesId) {
      return NextResponse.json({ error: "Missing seriesId parameter" }, { status: 400 });
    }

    const cleanSeriesId = seriesId.replace(/^(s-|tv-|series-|tmdb-)/i, "");
    const seriesTmdbId = parseInt(cleanSeriesId, 10);
    const seasonNumber = parseInt(seasonNumberStr, 10);

    if (isNaN(seriesTmdbId) || isNaN(seasonNumber)) {
      return NextResponse.json({ error: "Invalid seriesId or seasonNumber" }, { status: 400 });
    }

    const season = await DynamicCatalogService.getSeason(seriesTmdbId, seasonNumber);

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    return NextResponse.json({ season });
  } catch (error) {
    console.error("[Catalog Season API Error]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
