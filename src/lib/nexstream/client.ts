import "server-only";

import { VideoSource } from "@/lib/video/video-source-service";
import {
  NexStreamMovieParams,
  NexStreamEpisodeParams,
  NexStreamStatus,
} from "./types";

const NEXSTREAM_BASE_URL = "https://api.codespecters.com";
const DEFAULT_TIMEOUT_MS = 6000;

/**
 * Server-only NexStream API Client
 * Manages authorized server-side integration with the NexStream streaming network.
 * NEVER exposes the API key to the client browser or client bundles.
 */
class NexStreamClient {
  private getApiKey(): string | null {
    const key = process.env.NEXSTREAM_API_KEY;
    if (!key || key.trim() === "" || key.includes("your-nexstream-api-key")) {
      return null;
    }
    return key.trim();
  }

  /**
   * Check if NexStream is configured with an active API key
   */
  public isConfigured(): boolean {
    return Boolean(this.getApiKey());
  }

  /**
   * Generate official server-authenticated embed URL for a movie
   * Strictly server-side: uses the secure server API key.
   */
  public getMovieEmbedUrl(params: NexStreamMovieParams): string | null {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    if (!params.tmdbId || isNaN(params.tmdbId) || params.tmdbId <= 0) {
      return null;
    }

    return `${NEXSTREAM_BASE_URL}/embed/movie/${params.tmdbId}?apikey=${encodeURIComponent(apiKey)}`;
  }

  /**
   * Generate official server-authenticated embed URL for a TV episode
   * Strictly server-side: uses the secure server API key.
   */
  public getEpisodeEmbedUrl(params: NexStreamEpisodeParams): string | null {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    if (
      !params.tmdbId ||
      isNaN(params.tmdbId) ||
      params.tmdbId <= 0 ||
      params.seasonNumber <= 0 ||
      params.episodeNumber <= 0
    ) {
      return null;
    }

    return `${NEXSTREAM_BASE_URL}/embed/tv/${params.tmdbId}/${params.seasonNumber}/${params.episodeNumber}?apikey=${encodeURIComponent(apiKey)}`;
  }

  /**
   * Generates a normalized WeAre VideoSource representation pointing to our secure server proxy.
   * This ensures the client browser interacts with the server route without knowing the actual API key.
   */
  public getAuthorizedVideoSource(
    contentId: string,
    contentType: "movie" | "episode",
    tmdbId?: number,
    seasonNumber: number = 1,
    episodeNumber: number = 1
  ): VideoSource | null {
    if (!this.isConfigured() || !tmdbId || tmdbId <= 0) {
      return null;
    }

    // Build the secure internal proxy URL
    const proxyUrl =
      contentType === "movie"
        ? `/api/stream/nexstream?type=movie&id=${tmdbId}`
        : `/api/stream/nexstream?type=tv&id=${tmdbId}&s=${seasonNumber}&e=${episodeNumber}`;

    return {
      id: `src-nexstream-${contentId}`,
      content_id: contentId,
      content_type: contentType,
      name: "NexStream Fast",
      source_type: "embed",
      url: proxyUrl,
      quality: "1080p",
      language: "en",
      is_active: true,
      priority: 2, // Secondary provider behind VidFast (priority 1)
      is_healthy: true,
    };
  }

  /**
   * Health and connectivity check with timeout handling
   */
  public async checkHealth(): Promise<NexStreamStatus> {
    const configured = this.isConfigured();
    if (!configured) {
      return {
        isConfigured: false,
        isHealthy: false,
        endpoint: NEXSTREAM_BASE_URL,
        provider: "NexStream / CodeSpecter",
        message: "NEXSTREAM_API_KEY is not configured in .env.local",
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      // Test connectivity against the base embed endpoint
      const response = await fetch(`${NEXSTREAM_BASE_URL}/`, {
        method: "HEAD",
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeout);

      const isHealthy = response !== null && response.status < 500;

      return {
        isConfigured: true,
        isHealthy,
        endpoint: NEXSTREAM_BASE_URL,
        provider: "NexStream / CodeSpecter",
        message: isHealthy
          ? "NexStream integration active and responding"
          : "NexStream gateway returned error status",
      };
    } catch (err: unknown) {
      clearTimeout(timeout);
      return {
        isConfigured: true,
        isHealthy: false,
        endpoint: NEXSTREAM_BASE_URL,
        provider: "NexStream / CodeSpecter",
        message: `Health check failed: ${err instanceof Error ? err.message : "Network error"}`,
      };
    }
  }
}

export const nexStreamClient = new NexStreamClient();
