/**
 * NexStream API Integration Types
 * Defines interfaces and configuration for server-side NexStream streaming integration.
 */

import { VideoSource } from "@/lib/video/video-source-service";

export type NexStreamContentType = "movie" | "tv";

export interface NexStreamMovieParams {
  tmdbId: number;
}

export interface NexStreamEpisodeParams {
  tmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
}

export interface NexStreamSourceConfig {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
}

export interface NexStreamStatus {
  isConfigured: boolean;
  isHealthy: boolean;
  endpoint: string;
  provider: "NexStream / CodeSpecter";
  message?: string;
}

export interface NexStreamSourceResult {
  success: boolean;
  source?: VideoSource;
  embedUrl?: string;
  error?: string;
}
