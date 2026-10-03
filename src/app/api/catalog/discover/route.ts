import { NextRequest, NextResponse } from "next/server";
import {
  DynamicCatalogService,
  MovieCategory,
  TVCategory,
} from "@/lib/tmdb/dynamic-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "movie").toLowerCase();
    const category = (searchParams.get("category") || "popular").toLowerCase();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const genreId = searchParams.get("genre")
      ? parseInt(searchParams.get("genre")!, 10)
      : undefined;
    const language = searchParams.get("language") || "en-US";

    if (type === "all") {
      const validMovieCategory: MovieCategory = [
        "trending",
        "top-rated",
        "now-playing",
        "upcoming",
      ].includes(category)
        ? (category as MovieCategory)
        : "popular";

      const validTVCategory: TVCategory = ["trending", "top-rated"].includes(category)
        ? (category as TVCategory)
        : "popular";

      const [moviesData, seriesData] = await Promise.all([
        DynamicCatalogService.getMovies({
          category: validMovieCategory,
          page,
          genreId,
          language,
        }),
        DynamicCatalogService.getSeries({
          category: validTVCategory,
          page,
          genreId,
          language,
        }),
      ]);

      const combined = [];
      const maxLen = Math.max(moviesData.items.length, seriesData.items.length);
      for (let i = 0; i < maxLen; i++) {
        if (moviesData.items[i]) combined.push(moviesData.items[i]);
        if (seriesData.items[i]) combined.push(seriesData.items[i]);
      }

      return NextResponse.json({
        items: combined,
        page,
        totalPages: Math.max(moviesData.totalPages, seriesData.totalPages),
        totalResults: moviesData.totalResults + seriesData.totalResults,
      });
    } else if (type === "tv") {
      const validCategory: TVCategory = ["trending", "top-rated"].includes(category)
        ? (category as TVCategory)
        : "popular";

      const data = await DynamicCatalogService.getSeries({
        category: validCategory,
        page,
        genreId,
        language,
      });

      return NextResponse.json(data);
    } else {
      const validCategory: MovieCategory = [
        "trending",
        "top-rated",
        "now-playing",
        "upcoming",
      ].includes(category)
        ? (category as MovieCategory)
        : "popular";

      const data = await DynamicCatalogService.getMovies({
        category: validCategory,
        page,
        genreId,
        language,
      });

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("[Catalog Discover API Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch dynamic catalog", items: [], page: 1, totalPages: 0, totalResults: 0 },
      { status: 500 }
    );
  }
}
