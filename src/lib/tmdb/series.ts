import { tmdbFetch } from './client';
import { TMDBSeries, TMDBCredits, TMDBPaginatedResponse } from './types';

export async function getPopularSeries(page: number = 1): Promise<TMDBSeries[]> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBSeries>>('/tv/popular', {
    params: { page },
  });
  return data?.results || [];
}

export async function getTrendingSeries(timeWindow: 'day' | 'week' = 'week'): Promise<TMDBSeries[]> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBSeries>>(`/trending/tv/${timeWindow}`);
  return data?.results || [];
}

export async function getTopRatedSeries(page: number = 1): Promise<TMDBSeries[]> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBSeries>>('/tv/top_rated', {
    params: { page },
  });
  return data?.results || [];
}

export async function getSeriesDetails(tmdbId: number): Promise<TMDBSeries | null> {
  return await tmdbFetch<TMDBSeries>(`/tv/${tmdbId}`);
}

export async function getSeriesCredits(tmdbId: number): Promise<TMDBCredits | null> {
  return await tmdbFetch<TMDBCredits>(`/tv/${tmdbId}/credits`);
}

export async function getSeriesRecommendations(tmdbId: number): Promise<TMDBSeries[]> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBSeries>>(`/tv/${tmdbId}/recommendations`);
  return data?.results || [];
}

export async function getSeasonDetails(
  tmdbId: number,
  seasonNumber: number
): Promise<import('./types').TMDBSeason | null> {
  return await tmdbFetch<import('./types').TMDBSeason>(`/tv/${tmdbId}/season/${seasonNumber}`);
}
