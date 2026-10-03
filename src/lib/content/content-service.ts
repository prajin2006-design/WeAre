import { ContentItem, Movie, Series, Episode } from '@/types/content';
import { DynamicCatalogService } from '@/lib/tmdb/dynamic-catalog';
import { MovieService } from './movie-service';
import { SeriesService } from './series-service';
import { SearchService } from './search-service';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface SystemMetrics {
  totalMovies: number;
  totalSeries: number;
  totalEpisodes: number;
  totalGenres: number;
  isSupabaseConnected: boolean;
}

const COMMON_GENRE_MAP: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  "sci-fi": 878,
  "science fiction": 878,
  scifi: 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

export const ContentService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  async getFeaturedHero(): Promise<ContentItem | null> {
    try {
      const res = await DynamicCatalogService.getMovies({ category: "trending", page: 1 });
      if (res.items.length > 0) {
        const candidate = res.items.find((m) => m.backdrop_url && m.rating >= 6.5) || res.items[0];
        return {
          ...candidate,
          is_featured: true,
        };
      }
    } catch (err) {
      console.warn('[ContentService.getFeaturedHero] Dynamic TMDB notice:', err);
    }
    const movies = await MovieService.getPopular(5);
    const featured = movies.find((m) => m.is_featured);
    return featured || movies[0] || null;
  },

  async getTrending(): Promise<ContentItem[]> {
    try {
      const [movies, series] = await Promise.all([
        DynamicCatalogService.getMovies({ category: "trending", page: 1 }),
        DynamicCatalogService.getSeries({ category: "trending", page: 1 }),
      ]);
      const combined: ContentItem[] = [];
      const maxLen = Math.max(movies.items.length, series.items.length);
      for (let i = 0; i < maxLen; i++) {
        if (movies.items[i]) combined.push(movies.items[i]);
        if (series.items[i]) combined.push(series.items[i]);
      }
      if (combined.length > 0) return combined.slice(0, 10);
    } catch (err) {
      console.warn('[ContentService.getTrending] Dynamic TMDB notice:', err);
    }
    const [movies, series] = await Promise.all([
      MovieService.getTrending(6),
      SeriesService.getPopular(4),
    ]);
    return [...movies, ...series].sort((a, b) => b.rating - a.rating);
  },

  async getPopularMovies(): Promise<Movie[]> {
    try {
      const res = await DynamicCatalogService.getMovies({ category: "popular", page: 1 });
      if (res.items.length > 0) return res.items;
    } catch (err) {
      console.warn('[ContentService.getPopularMovies] Dynamic TMDB notice:', err);
    }
    return await MovieService.getPopular(20);
  },

  async getPopularSeries(): Promise<Series[]> {
    try {
      const res = await DynamicCatalogService.getSeries({ category: "popular", page: 1 });
      if (res.items.length > 0) return res.items;
    } catch (err) {
      console.warn('[ContentService.getPopularSeries] Dynamic TMDB notice:', err);
    }
    return await SeriesService.getPopular(10);
  },

  async getNowPlaying(): Promise<Movie[]> {
    try {
      const res = await DynamicCatalogService.getMovies({ category: "now-playing", page: 1 });
      if (res.items.length > 0) return res.items;
    } catch (err) {
      console.warn('[ContentService.getNowPlaying] Dynamic TMDB notice:', err);
    }
    return await this.getPopularMovies();
  },

  async getUpcoming(): Promise<Movie[]> {
    try {
      const res = await DynamicCatalogService.getMovies({ category: "upcoming", page: 1 });
      if (res.items.length > 0) return res.items;
    } catch (err) {
      console.warn('[ContentService.getUpcoming] Dynamic TMDB notice:', err);
    }
    return await this.getPopularMovies();
  },

  async getTopRated(): Promise<ContentItem[]> {
    try {
      const [movies, series] = await Promise.all([
        DynamicCatalogService.getMovies({ category: "top-rated", page: 1 }),
        DynamicCatalogService.getSeries({ category: "top-rated", page: 1 }),
      ]);
      const combined: ContentItem[] = [];
      const maxLen = Math.max(movies.items.length, series.items.length);
      for (let i = 0; i < maxLen; i++) {
        if (movies.items[i]) combined.push(movies.items[i]);
        if (series.items[i]) combined.push(series.items[i]);
      }
      if (combined.length > 0) return combined.slice(0, 10);
    } catch (err) {
      console.warn('[ContentService.getTopRated] Dynamic TMDB notice:', err);
    }
    return await MovieService.getPopular(10);
  },

  async getWeAreOriginals(): Promise<ContentItem[]> {
    try {
      const res = await DynamicCatalogService.getMovies({ category: "top-rated", page: 1 });
      if (res.items.length > 0) {
        return res.items.slice(0, 6).map((m) => ({ ...m, is_original: true }));
      }
    } catch (err) {
      console.warn('[ContentService.getWeAreOriginals] Dynamic TMDB notice:', err);
    }
    return await MovieService.getPopular(6);
  },

  async getNewReleases(): Promise<ContentItem[]> {
    try {
      const [movies, series] = await Promise.all([
        DynamicCatalogService.getMovies({ category: "now-playing", page: 1 }),
        DynamicCatalogService.getSeries({ category: "trending", page: 1 }),
      ]);
      const combined: ContentItem[] = [];
      const maxLen = Math.max(movies.items.length, series.items.length);
      for (let i = 0; i < maxLen; i++) {
        if (movies.items[i]) combined.push(movies.items[i]);
        if (series.items[i]) combined.push(series.items[i]);
      }
      if (combined.length > 0) return combined.slice(0, 10);
    } catch (err) {
      console.warn('[ContentService.getNewReleases] Dynamic TMDB notice:', err);
    }
    return await MovieService.getPopular(10);
  },

  async getPopularThisWeek(): Promise<ContentItem[]> {
    return await this.getTrending();
  },

  async getRecommended(currentId: string): Promise<ContentItem[]> {
    const popular = await this.getPopularMovies();
    return popular.filter((item) => item.id !== currentId).slice(0, 8);
  },

  async getContentById(id: string, preferredType?: "movie" | "tv"): Promise<ContentItem | null> {
    const isSeriesPrefix = /^(s-|tv-|series-)/i.test(id);
    const isMoviePrefix = /^(m-|movie-)/i.test(id);
    const effectiveType =
      preferredType || (isSeriesPrefix ? "tv" : isMoviePrefix ? "movie" : undefined);

    const cleanId = id.replace(/^(m-|movie-|s-|tv-|series-|tmdb-)/i, "");
    const numId = parseInt(cleanId, 10);
    if (!isNaN(numId) && numId > 0) {
      try {
        if (effectiveType === "tv") {
          const series = await DynamicCatalogService.getSeriesById(numId);
          if (series) return series;
          const movie = await DynamicCatalogService.getMovieById(numId);
          if (movie) return movie;
        } else if (effectiveType === "movie") {
          const movie = await DynamicCatalogService.getMovieById(numId);
          if (movie) return movie;
          const series = await DynamicCatalogService.getSeriesById(numId);
          if (series) return series;
        } else {
          const [movie, series] = await Promise.all([
            DynamicCatalogService.getMovieById(numId).catch(() => null),
            DynamicCatalogService.getSeriesById(numId).catch(() => null),
          ]);
          if (movie && series) {
            const movieVotes = movie.rating_count || 0;
            const seriesVotes = series.rating_count || 0;
            return seriesVotes > movieVotes ? series : movie;
          }
          if (movie) return movie;
          if (series) return series;
        }
      } catch (err) {
        console.warn('[ContentService.getContentById] TMDB lookup notice:', err);
      }
    }

    if (effectiveType === "tv") {
      const series = await SeriesService.getById(id);
      if (series) return series;
      return await MovieService.getById(id);
    } else {
      const movie = await MovieService.getById(id);
      if (movie) return movie;
      return await SeriesService.getById(id);
    }
  },

  async getEpisodeById(seriesId: string, episodeId: string): Promise<Episode | null> {
    const cleanSeriesId = seriesId.replace(/^(s-|tv-|series-|tmdb-)/, "");
    const seriesTmdbId = parseInt(cleanSeriesId, 10);
    if (!isNaN(seriesTmdbId) && seriesTmdbId > 0) {
      try {
        const match =
          episodeId.match(/s(\d+)[^0-9a-z]*e(\d+)/i) ||
          episodeId.match(/season[^\d]*(\d+)[^\d]*episode[^\d]*(\d+)/i);
        let seasonNum = 1;
        let epNum = 1;
        if (match) {
          seasonNum = parseInt(match[1], 10);
          epNum = parseInt(match[2], 10);
        } else {
          const sMatch = episodeId.match(/s(\d+)/i);
          const eMatch = episodeId.match(/e(\d+)/i);
          if (sMatch && eMatch) {
            seasonNum = parseInt(sMatch[1], 10);
            epNum = parseInt(eMatch[1], 10);
          }
        }
        const seasonData = await DynamicCatalogService.getSeason(seriesTmdbId, seasonNum);
        if (seasonData?.episodes) {
          return seasonData.episodes.find((e) => e.episode_number === epNum) || seasonData.episodes[0] || null;
        }
      } catch (err) {
        console.warn('[ContentService.getEpisodeById] Dynamic TMDB notice:', err);
      }
    }
    return await SeriesService.getEpisodeById(seriesId, episodeId);
  },

  async search(query: string, genre?: string): Promise<ContentItem[]> {
    return await SearchService.search(query, genre);
  },

  async getByGenre(genre: string): Promise<ContentItem[]> {
    const gLower = genre.toLowerCase().trim();
    const genreId = COMMON_GENRE_MAP[gLower];
    if (genreId) {
      try {
        const [movies, series] = await Promise.all([
          DynamicCatalogService.getMovies({ genreId, page: 1 }),
          DynamicCatalogService.getSeries({ genreId, page: 1 }),
        ]);
        const combined = [...movies.items, ...series.items];
        if (combined.length > 0) return combined.slice(0, 15);
      } catch (err) {
        console.warn('[ContentService.getByGenre] Dynamic TMDB notice:', err);
      }
    }
    const all = await this.getPopularMovies();
    return all.filter((item) =>
      item.genres.some((g) => g.toLowerCase() === gLower)
    );
  },

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
        console.warn('[ContentService.getMetrics] Notice:', err);
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

  async addMovie(movie: Omit<Movie, 'id' | 'created_at'>): Promise<Movie> {
    return await MovieService.addMovie(movie);
  },

  async deleteMovie(id: string): Promise<boolean> {
    return await MovieService.deleteMovie(id);
  },
};
