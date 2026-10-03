import { tmdbFetch } from './client';
import { TMDBGenre } from './types';

export async function getMovieGenres(): Promise<TMDBGenre[]> {
  const data = await tmdbFetch<{ genres: TMDBGenre[] }>('/genre/movie/list');
  return data?.genres || [];
}

export async function getSeriesGenres(): Promise<TMDBGenre[]> {
  const data = await tmdbFetch<{ genres: TMDBGenre[] }>('/genre/tv/list');
  return data?.genres || [];
}
