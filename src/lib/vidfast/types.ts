/**
 * VidFast API Integration Types
 * Defines interfaces and parameters for VidFast embedded streaming integration.
 */

import type { VideoSource } from "../video/video-source-service";

export type VidFastContentType = "movie" | "tv";

export interface VidFastMovieParams {
  tmdbId: number;
}

export interface VidFastEpisodeParams {
  tmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
}

export interface VidFastSourceResult {
  success: boolean;
  source?: VideoSource;
  embedUrl?: string;
  error?: string;
}
