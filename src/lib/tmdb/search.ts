import { tmdbFetch } from './client';
import { TMDBMovie, TMDBSeries, TMDBPaginatedResponse } from './types';

export async function searchMovies(query: string, page: number = 1): Promise<TMDBMovie[]> {
  if (!query || !query.trim()) return [];

  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>('/search/movie', {
    params: {
      query: query.trim(),
      page,
      include_adult: false,
    },
  });

  return data?.results || [];
}

export async function searchSeries(query: string, page: number = 1): Promise<TMDBSeries[]> {
  if (!query || !query.trim()) return [];

  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBSeries>>('/search/tv', {
    params: {
      query: query.trim(),
      page,
      include_adult: false,
    },
  });

  return data?.results || [];
}
