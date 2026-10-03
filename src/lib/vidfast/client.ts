import type { VideoSource } from "../video/video-source-service";
import type { VidFastMovieParams, VidFastEpisodeParams } from "./types";

const VIDFAST_BASE_URL = "https://vidfast.vc";

/**
 * VidFast Embedded Streaming Provider Client
 * Generates verified embedded player URLs for movies and TV episodes.
 */
class VidFastClient {
  /**
   * Generates official embedded playback URL for a movie
   * Format: https://vidfast.vc/movie/{tmdb_id}?autoPlay=true
   */
  public getMovieEmbedUrl(params: VidFastMovieParams): string | null {
    if (!params.tmdbId || isNaN(params.tmdbId) || params.tmdbId <= 0) {
      return null;
    }
    return `${VIDFAST_BASE_URL}/movie/${params.tmdbId}?autoPlay=true`;
  }

  /**
   * Generates official embedded playback URL for a TV episode
   * Format: https://vidfast.vc/tv/{tmdb_id}/{season}/{episode}?autoPlay=true
   */
  public getEpisodeEmbedUrl(params: VidFastEpisodeParams): string | null {
    if (
      !params.tmdbId ||
      isNaN(params.tmdbId) ||
      params.tmdbId <= 0 ||
      params.seasonNumber <= 0 ||
      params.episodeNumber <= 0
    ) {
      return null;
    }
    return `${VIDFAST_BASE_URL}/tv/${params.tmdbId}/${params.seasonNumber}/${params.episodeNumber}?autoPlay=true`;
  }

  /**
   * Generates a normalized WeAre VideoSource representation for VidFast
   */
  public getAuthorizedVideoSource(
    contentId: string,
    contentType: "movie" | "episode",
    tmdbId?: number,
    seasonNumber: number = 1,
    episodeNumber: number = 1
  ): VideoSource | null {
    if (!tmdbId || isNaN(tmdbId) || tmdbId <= 0) {
      return null;
    }

    const embedUrl =
      contentType === "movie"
        ? this.getMovieEmbedUrl({ tmdbId })
        : this.getEpisodeEmbedUrl({
            tmdbId,
            seasonNumber: seasonNumber > 0 ? seasonNumber : 1,
            episodeNumber: episodeNumber > 0 ? episodeNumber : 1,
          });

    if (!embedUrl) {
      return null;
    }

    return {
      id: `src-vidfast-${contentId}`,
      content_id: contentId,
      content_type: contentType,
      name: "VidFast",
      source_type: "embed",
      url: embedUrl,
      quality: "Auto",
      language: "en",
      is_active: true,
      priority: 1, // Primary external streaming provider (VidFast default)
      is_healthy: true,
    };
  }
}

export const vidFastClient = new VidFastClient();
