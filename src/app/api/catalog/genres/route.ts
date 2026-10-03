import { NextRequest, NextResponse } from "next/server";
import { DynamicCatalogService } from "@/lib/tmdb/dynamic-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "movie") as "movie" | "tv";
    const genres = await DynamicCatalogService.getGenres(type);
    return NextResponse.json({ genres });
  } catch (error) {
    console.error("[Catalog Genres API Error]:", error);
    return NextResponse.json({ genres: [] }, { status: 500 });
  }
}
