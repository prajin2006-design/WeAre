import { NextRequest, NextResponse } from "next/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/server";
import { VideoSourceService } from "@/lib/video/video-source-service";
import { authorizeAdminRequest } from "@/lib/auth/admin-auth";

function isValidUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(req);
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Admin access requires SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { content_id, content_type, name, source_type, url, hls_url, quality, language, is_active, priority } = body;

    if (!content_id || !name || !url) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!isValidUrl(url)) {
      return NextResponse.json({ error: "Invalid video stream URL format." }, { status: 400 });
    }

    if (hls_url && !isValidUrl(hls_url)) {
      return NextResponse.json({ error: "Invalid HLS manifest URL format." }, { status: 400 });
    }

    const created = await VideoSourceService.addSource({
      content_id,
      content_type: content_type || "movie",
      name: name.trim(),
      source_type: source_type === "hls" ? "hls" : "mp4",
      url: url.trim(),
      hls_url: hls_url ? hls_url.trim() : null,
      quality: quality || "1080p",
      language: language || "en",
      is_active: is_active ?? true,
      priority: Number(priority) || 1,
    });

    return NextResponse.json({ success: true, source: created });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add source" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(req);
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Admin access requires SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing source id." }, { status: 400 });
    }

    if (updates.url && !isValidUrl(updates.url)) {
      return NextResponse.json({ error: "Invalid stream URL." }, { status: 400 });
    }

    if (updates.hls_url && !isValidUrl(updates.hls_url)) {
      return NextResponse.json({ error: "Invalid HLS URL." }, { status: 400 });
    }

    const success = await VideoSourceService.updateSource(id, updates);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update source" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(req);
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Admin access requires SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing source id." }, { status: 400 });
    }

    const success = await VideoSourceService.deleteSource(id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete source" },
      { status: 500 }
    );
  }
}

