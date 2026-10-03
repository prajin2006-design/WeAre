import "server-only";

import { VideoSource } from "@/lib/video/video-source-service";
import { nexStreamClient } from "./client";

/**
 * Normalized internal NexStream source format
 */
export interface NormalizedNexStreamSource {
  provider: "nexstream";
  externalId: string;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
  title?: string;
  embedUrl?: string;
  streamUrl?: string;
  subtitles?: { language: string; label: string; url: string }[];
  available: boolean;
  quality?: string;
}

export class NexStreamAdapter {
  /**
   * Resolves an authorized NexStream playback source for a movie
   */
  public static async resolveMovieSource(
    tmdbId: number,
    title?: string
  ): Promise<NormalizedNexStreamSource | null> {
    if (!nexStreamClient.isConfigured() || !tmdbId || isNaN(tmdbId) || tmdbId <= 0) {
      return null;
    }

    // Build the secure server proxy URL
    const proxyUrl = `/api/stream/nexstream?type=movie&id=${tmdbId}`;

    return {
      provider: "nexstream",
      externalId: String(tmdbId),
      type: "movie",
      title: title || `Movie TMDB #${tmdbId}`,
      embedUrl: proxyUrl,
      streamUrl: proxyUrl,
      subtitles: [],
      available: true,
      quality: "1080p",
    };
  }

  /**
   * Resolves an authorized NexStream playback source for a TV episode
   */
  public static async resolveTVSource(
    tmdbId: number,
    seasonNumber: number = 1,
    episodeNumber: number = 1,
    title?: string
  ): Promise<NormalizedNexStreamSource | null> {
    if (!nexStreamClient.isConfigured() || !tmdbId || isNaN(tmdbId) || tmdbId <= 0) {
      return null;
    }

    const s = Math.max(1, seasonNumber);
    const e = Math.max(1, episodeNumber);
    const proxyUrl = `/api/stream/nexstream?type=tv&id=${tmdbId}&s=${s}&e=${e}`;

    return {
      provider: "nexstream",
      externalId: `${tmdbId}-s${s}e${e}`,
      type: "tv",
      season: s,
      episode: e,
      title: title || `TV TMDB #${tmdbId} S${s}:E${e}`,
      embedUrl: proxyUrl,
      streamUrl: proxyUrl,
      subtitles: [],
      available: true,
      quality: "1080p",
    };
  }

  /**
   * Converts a normalized NexStream source into the application's VideoSource model
   */
  public static toVideoSource(
    normalized: NormalizedNexStreamSource,
    contentId: string,
    priority: number = 1
  ): VideoSource {
    return {
      id: `src-nexstream-${normalized.externalId}`,
      content_id: contentId,
      content_type: normalized.type === "movie" ? "movie" : "episode",
      name: "NexStream Fast",
      source_type: "embed",
      url: normalized.embedUrl || normalized.streamUrl || "",
      quality: normalized.quality || "1080p",
      language: "en",
      is_active: normalized.available,
      priority,
      is_healthy: true,
    };
  }
}
