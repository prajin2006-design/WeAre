/**
 * Database Content Service for Admin & Local Storage Management
 * Strictly queries and manages the internal Supabase database records.
 */

import { Movie, Series, ContentItem } from '@/types/content';
import { MovieService } from '@/lib/content/movie-service';
import { SeriesService } from '@/lib/content/series-service';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface SystemMetrics {
  totalMovies: number;
  totalSeries: number;
  totalEpisodes: number;
  totalGenres: number;
  isSupabaseConnected: boolean;
}

export const ContentService = {
  async getMetrics(): Promise<SystemMetrics> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const [
          { count: moviesCount },
          { count: seriesCount },
          { count: episodesCount },
          { count: genresCount },
        ] = await Promise.all([
          supabase.from('movies').select('*', { count: 'exact', head: true }),
          supabase.from('series').select('*', { count: 'exact', head: true }),
          supabase.from('episodes').select('*', { count: 'exact', head: true }),
          supabase.from('genres').select('*', { count: 'exact', head: true }),
        ]);

        return {
          totalMovies: moviesCount ?? 0,
          totalSeries: seriesCount ?? 0,
          totalEpisodes: episodesCount ?? 0,
          totalGenres: genresCount ?? 0,
          isSupabaseConnected: true,
        };
      } catch (err) {
        console.warn('[DatabaseContentService.getMetrics] Notice:', err);
      }
    }

    const [movies, series] = await Promise.all([
      MovieService.getPopular(50),
      SeriesService.getPopular(50),
    ]);

    const totalEpisodes = series.reduce((acc, s) => acc + s.total_episodes, 0);

    return {
      totalMovies: movies.length,
      totalSeries: series.length,
      totalEpisodes,
      totalGenres: 10,
      isSupabaseConnected: false,
    };
  },

  async getPopularMovies(limit: number = 50): Promise<Movie[]> {
    return await MovieService.getPopular(limit);
  },

  async getPopularSeries(limit: number = 20): Promise<Series[]> {
    return await SeriesService.getPopular(limit);
  },

  async getContentById(id: string): Promise<ContentItem | null> {
    const movie = await MovieService.getById(id);
    if (movie) return movie;
    return await SeriesService.getById(id);
  },

  async addMovie(movie: Omit<Movie, 'id' | 'created_at'>): Promise<Movie> {
    return await MovieService.addMovie(movie);
  },

  async deleteMovie(id: string): Promise<boolean> {
    return await MovieService.deleteMovie(id);
  },
};
