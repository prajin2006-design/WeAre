/**
 * Utility for deterministic encoding and decoding of TMDB movie/TV content identifiers
 * to/from standard RFC 4122 UUIDs for PostgreSQL tables (watch_progress, watch_history)
 * that enforce UUID column types.
 *
 * Pattern:
 * - Movie:   e0000001-0000-4000-8000-{tmdbId_hex_12}
 * - Episode: e0000002-{season_hex_4}-{episode_hex_4}-8000-{tmdbId_hex_12}
 * - Legacy:  Direct passthrough of existing UUIDs
 */

export interface DecodedMovie {
  type: 'movie';
  tmdbId: number;
}

export interface DecodedEpisode {
  type: 'episode';
  tmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  episodeParam: string;
}

export interface DecodedLegacy {
  type: 'legacy';
  uuid: string;
}

export type DecodedContent = DecodedMovie | DecodedEpisode | DecodedLegacy;

export function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

export function encodeMovieIdToUuid(tmdbId: number): string {
  const safeId = Math.max(1, Math.floor(Math.abs(tmdbId)));
  const hex = safeId.toString(16).padStart(12, '0');
  return `e0000001-0000-4000-8000-${hex}`;
}

export function encodeEpisodeIdToUuid(
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number
): string {
  const safeId = Math.max(1, Math.floor(Math.abs(tmdbId)));
  const safeSeason = Math.max(1, Math.min(65535, Math.floor(Math.abs(seasonNumber))));
  const safeEpisode = Math.max(1, Math.min(65535, Math.floor(Math.abs(episodeNumber))));

  const sHex = safeSeason.toString(16).padStart(4, '0');
  const eHex = safeEpisode.toString(16).padStart(4, '0');
  const idHex = safeId.toString(16).padStart(12, '0');
  return `e0000002-${sHex}-${eHex}-8000-${idHex}`;
}

export function toContentUuid(
  contentType: 'movie' | 'episode' | 'series',
  contentId: string | number,
  seasonNumber?: number,
  episodeNumber?: number
): string {
  const strId = String(contentId).trim();

  // If it's already a standard legacy UUID from Supabase seeded data
  if (isUuid(strId) && !strId.startsWith('e0000001-') && !strId.startsWith('e0000002-')) {
    return strId;
  }

  // Extract numeric TMDB ID from prefixes like m-550, s-1399, tv-1399, etc.
  const cleanNum = parseInt(strId.replace(/^(m-|movie-|s-|tv-|series-|tmdb-)/i, ''), 10);
  const tmdbId = !isNaN(cleanNum) && cleanNum > 0 ? cleanNum : 1;

  if (contentType === 'episode' || (seasonNumber !== undefined && episodeNumber !== undefined)) {
    return encodeEpisodeIdToUuid(tmdbId, seasonNumber || 1, episodeNumber || 1);
  }

  return encodeMovieIdToUuid(tmdbId);
}

export function decodeContentUuid(uuid: string): DecodedContent {
  const trimmed = uuid.trim().toLowerCase();
  if (trimmed.startsWith('e0000001-')) {
    const tmdbId = parseInt(trimmed.slice(24), 16);
    return { type: 'movie', tmdbId: isNaN(tmdbId) ? 0 : tmdbId };
  }
  if (trimmed.startsWith('e0000002-')) {
    const seasonNumber = parseInt(trimmed.slice(9, 13), 16) || 1;
    const episodeNumber = parseInt(trimmed.slice(14, 18), 16) || 1;
    const tmdbId = parseInt(trimmed.slice(24), 16) || 0;
    return {
      type: 'episode',
      tmdbId,
      seasonNumber,
      episodeNumber,
      episodeParam: `s${seasonNumber}-e${episodeNumber}`,
    };
  }
  return { type: 'legacy', uuid: trimmed };
}
