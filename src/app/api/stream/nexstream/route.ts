import { NextRequest, NextResponse } from "next/server";
import { nexStreamClient } from "@/lib/nexstream/client";

export const dynamic = "force-dynamic";

/**
 * Server-side NexStream Stream Endpoint
 * Proxies and renders authorized NexStream embeds securely without exposing NEXSTREAM_API_KEY to client JavaScript.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const type = searchParams.get("type") || "movie";
  const rawId = searchParams.get("id");
  const rawSeason = searchParams.get("s") || "1";
  const rawEpisode = searchParams.get("e") || "1";
  const mode = searchParams.get("mode") || "embed";

  // Check configuration
  if (!nexStreamClient.isConfigured()) {
    if (mode === "info") {
      return NextResponse.json(
        {
          available: false,
          error: "NexStream API key is not configured on this server.",
        },
        { status: 503 }
      );
    }

    return new NextResponse(
      renderErrorHtml(
        "NexStream Unavailable",
        "The streaming service is not configured with an active API key."
      ),
      {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  // Validate TMDB ID
  const tmdbId = parseInt(rawId || "0", 10);
  if (!tmdbId || isNaN(tmdbId) || tmdbId <= 0) {
    if (mode === "info") {
      return NextResponse.json(
        { available: false, error: "Missing or invalid TMDB ID parameter." },
        { status: 400 }
      );
    }
    return new NextResponse(
      renderErrorHtml("Invalid Stream Request", "A valid TMDB content identifier is required."),
      {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  const season = parseInt(rawSeason, 10) || 1;
  const episode = parseInt(rawEpisode, 10) || 1;

  // Metadata / Status Info Mode
  if (mode === "info") {
    return NextResponse.json({
      available: true,
      name: "NexStream Fast",
      provider: "NexStream / CodeSpecter",
      quality: "1080p",
      type,
      tmdbId,
      season: type === "tv" ? season : undefined,
      episode: type === "tv" ? episode : undefined,
    });
  }

  // Generate official server-authenticated embed URL
  const embedUrl =
    type === "tv"
      ? nexStreamClient.getEpisodeEmbedUrl({
          tmdbId,
          seasonNumber: season,
          episodeNumber: episode,
        })
      : nexStreamClient.getMovieEmbedUrl({ tmdbId });

  if (!embedUrl) {
    return new NextResponse(
      renderErrorHtml("Source Unavailable", "Unable to generate a secure stream for this title."),
      {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  // Render the secure embed document with isolated framing
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>WeAre Player - NexStream</title>
    <style>
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background-color: #000;
        overflow: hidden;
      }
      iframe {
        width: 100%;
        height: 100%;
        border: 0;
        display: block;
      }
    </style>
  </head>
  <body>
    <iframe
      src="${embedUrl}"
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade"
    ></iframe>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}

function renderErrorHtml(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        padding: 24px;
        background: #09090b;
        color: #f4f4f5;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        text-align: center;
      }
      .card {
        max-width: 420px;
        padding: 32px;
        background: #121216;
        border: 1px solid #222228;
        border-radius: 12px;
      }
      h2 { color: #e5b85c; margin-top: 0; font-size: 1.25rem; }
      p { color: #82828e; font-size: 0.875rem; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>${title}</h2>
      <p>${message}</p>
    </div>
  </body>
</html>`;
}
