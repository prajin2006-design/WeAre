import { tmdbFetch } from './client';
import { TMDBMovie, TMDBCredits, TMDBPaginatedResponse } from './types';

export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(`/trending/movie/${timeWindow}`);
  return data?.results || [];
}

export async function getPopularMovies(page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>('/movie/popular', {
    params: { page },
  });
  return data?.results || [];
}

export async function getNowPlayingMovies(page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>('/movie/now_playing', {
    params: { page },
  });
  return data?.results || [];
}

export async function getUpcomingMovies(page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>('/movie/upcoming', {
    params: { page },
  });
  return data?.results || [];
}

export async function getTopRatedMovies(page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>('/movie/top_rated', {
    params: { page },
  });
  return data?.results || [];
}

export async function getMovieDetails(tmdbId: number): Promise<TMDBMovie | null> {
  return await tmdbFetch<TMDBMovie>(`/movie/${tmdbId}`);
}

export async function getMovieCredits(tmdbId: number): Promise<TMDBCredits | null> {
  return await tmdbFetch<TMDBCredits>(`/movie/${tmdbId}/credits`);
}

export async function getMovieRecommendations(tmdbId: number): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(`/movie/${tmdbId}/recommendations`);
  return data?.results || [];
}
