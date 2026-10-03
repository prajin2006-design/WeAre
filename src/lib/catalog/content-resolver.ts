import "server-only";

import { ContentItem, Episode } from "@/types/content";
import { ContentService } from "@/lib/content/content-service";
import { DynamicCatalogService } from "@/lib/tmdb/dynamic-catalog";

/**
 * Universal server-side content resolver.
 * Seamlessly resolves titles from:
 * 1. Supabase database (custom/managed content & pre-imported movies)
 * 2. On-demand dynamic TMDB metadata (movies & TV series worldwide)
 * 3. Local fallback development store
 */
export async function resolveContentById(
  id: string,
  preferredType?: "movie" | "tv"
): Promise<ContentItem | null> {
  if (!id) return null;

  const isSeriesPrefix = /^(s-|tv-|series-)/i.test(id);
  const isMoviePrefix = /^(m-|movie-)/i.test(id);
  const effectiveType =
    preferredType || (isSeriesPrefix ? "tv" : isMoviePrefix ? "movie" : undefined);

  // 1. Try Supabase database / local service first
  try {
    const localOrDbContent = await ContentService.getContentById(id, effectiveType);
    if (localOrDbContent) {
      if (effectiveType === "tv" && !('seasons' in localOrDbContent)) {
        // Did not match series requirement, proceed to TMDB TV lookup
      } else {
        return localOrDbContent;
      }
    }
  } catch (err) {
    console.warn("[ContentResolver] Database lookup notice:", err);
  }

  // 2. Extract potential TMDB numerical ID
  const cleanId = id.replace(/^(m-|movie-|s-|tv-|series-|tmdb-)/i, "");
  const numericId = parseInt(cleanId, 10);

  if (!isNaN(numericId) && numericId > 0) {
    if (effectiveType === "tv") {
      try {
        const dynamicSeries = await DynamicCatalogService.getSeriesById(numericId);
        if (dynamicSeries) return dynamicSeries;
      } catch (err) {
        console.warn("[ContentResolver] Dynamic series lookup notice:", err);
      }
      try {
        const dynamicMovie = await DynamicCatalogService.getMovieById(numericId);
        if (dynamicMovie) return dynamicMovie;
      } catch (err) {
        console.warn("[ContentResolver] Dynamic movie lookup notice:", err);
      }
    } else if (effectiveType === "movie") {
      try {
        const dynamicMovie = await DynamicCatalogService.getMovieById(numericId);
        if (dynamicMovie) return dynamicMovie;
      } catch (err) {
        console.warn("[ContentResolver] Dynamic movie lookup notice:", err);
      }
      try {
        const dynamicSeries = await DynamicCatalogService.getSeriesById(numericId);
        if (dynamicSeries) return dynamicSeries;
      } catch (err) {
        console.warn("[ContentResolver] Dynamic series lookup notice:", err);
      }
    } else {
      // Ambiguous numeric ID without preference: query both and prefer the more prominent one
      try {
        const [movie, series] = await Promise.all([
          DynamicCatalogService.getMovieById(numericId).catch(() => null),
          DynamicCatalogService.getSeriesById(numericId).catch(() => null),
        ]);
        if (movie && series) {
          const movieVotes = movie.rating_count || 0;
          const seriesVotes = series.rating_count || 0;
          return seriesVotes > movieVotes ? series : movie;
        }
        if (movie) return movie;
        if (series) return series;
      } catch (err) {
        console.warn("[ContentResolver] Dynamic lookup notice:", err);
      }
    }
  }

  return null;
}

/**
 * Universal episode resolver for TV series
 */
export async function resolveEpisode(
  seriesId: string,
  episodeParam: string
): Promise<Episode | null> {
  // 1. Try database episode lookup
  try {
    const dbEpisode = await ContentService.getEpisodeById(seriesId, episodeParam);
    if (dbEpisode) return dbEpisode;
  } catch {
    // Continue to dynamic resolution
  }

  // 2. Parse season and episode numbers from param (e.g., "tv-1399-s1-e2", "s1e2", "1-2", or numeric ID)
  let seasonNumber = 1;
  let episodeNumber = 1;

  const matchFormatted =
    episodeParam.match(/s(\d+)[^0-9a-z]*e(\d+)/i) ||
    episodeParam.match(/season[^\d]*(\d+)[^\d]*episode[^\d]*(\d+)/i);

  if (matchFormatted) {
    seasonNumber = parseInt(matchFormatted[1], 10);
    episodeNumber = parseInt(matchFormatted[2], 10);
  } else {
    const sMatch = episodeParam.match(/s(\d+)/i);
    const eMatch = episodeParam.match(/e(\d+)/i);
    if (sMatch && eMatch) {
      seasonNumber = parseInt(sMatch[1], 10);
      episodeNumber = parseInt(eMatch[1], 10);
    } else {
      const parts = episodeParam.split("-");
      const numParts = parts.filter((p) => /^\d+$/.test(p)).map((p) => parseInt(p, 10));
      if (numParts.length >= 2) {
        seasonNumber = numParts[numParts.length - 2];
        episodeNumber = numParts[numParts.length - 1];
      }
    }
  }

  // 3. Resolve dynamic season episodes from TMDB
  const cleanSeriesId = seriesId.replace(/^(s-|tv-|series-|tmdb-)/, "");
  const seriesTmdbId = parseInt(cleanSeriesId, 10);

  if (!isNaN(seriesTmdbId) && seriesTmdbId > 0) {
    const seasonData = await DynamicCatalogService.getSeason(seriesTmdbId, seasonNumber);
    if (seasonData && seasonData.episodes) {
      const found = seasonData.episodes.find((ep) => ep.episode_number === episodeNumber);
      if (found) return found;
      return seasonData.episodes[0] || null;
    }
  }

  return null;
}
