import { NextRequest, NextResponse } from "next/server";
import { DynamicCatalogService } from "@/lib/tmdb/dynamic-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = (searchParams.get("type") || "all") as "all" | "movie" | "tv";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const genreId = searchParams.get("genre")
      ? parseInt(searchParams.get("genre")!, 10)
      : undefined;

    if (!query.trim()) {
      return NextResponse.json({
        items: [],
        page: 1,
        totalPages: 0,
        totalResults: 0,
      });
    }

    const data = await DynamicCatalogService.search({
      query,
      page,
      type,
      genreId,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Catalog Search API Error]:", error);
    return NextResponse.json(
      { error: "Failed to search catalog", items: [], page: 1, totalPages: 0, totalResults: 0 },
      { status: 500 }
    );
  }
}
