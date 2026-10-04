import { NextRequest, NextResponse } from "next/server";
import { ContentService } from "@/lib/content/content-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const typeParam = searchParams.get("type");
    const limitParam = searchParams.get("limit");

    if (!id) {
      return NextResponse.json({ error: "Missing required 'id' parameter" }, { status: 400 });
    }

    const preferredType = typeParam === "movie" || typeParam === "tv" ? typeParam : undefined;
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 20) : 10;

    const items = await ContentService.getRecommended(id, preferredType, limit);

    return NextResponse.json({
      items,
      count: items.length,
      id,
    });
  } catch (error) {
    console.error("[Catalog Recommendations API Error]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
