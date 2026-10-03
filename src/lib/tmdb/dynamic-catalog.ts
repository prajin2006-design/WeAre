import "server-only";

import { tmdbFetch } from "./client";
import {
  TMDBMovie,
  TMDBSeries,
  TMDBSeason,
  TMDBCredits,
  TMDBPaginatedResponse,
  TMDBGenre,
} from "./types";
import { Movie, Series, Season, Episode, ContentItem } from "@/types/content";
import { getTMDBPosterUrl, getTMDBBackdropUrl } from "./images";
import { getMovieGenres, getSeriesGenres } from "./genres";

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export type MovieCategory =
  | "popular"
  | "trending"
  | "top-rated"
  | "now-playing"
  | "upcoming";

export type TVCategory = "popular" | "trending" | "top-rated";

// Genre lookup caches to enrich catalog items with names
let cachedMovieGenreMap: Map<number, string> | null = null;
let cachedTVGenreMap: Map<number, string> | null = null;

async function getMovieGenreMap(): Promise<Map<number, string>> {
  if (cachedMovieGenreMap) return cachedMovieGenreMap;
  try {
    const genres = await getMovieGenres();
    cachedMovieGenreMap = new Map(genres.map((g) => [g.id, g.name]));
  } catch {
    cachedMovieGenreMap = new Map();
  }
  return cachedMovieGenreMap;
}

async function getTVGenreMap(): Promise<Map<number, string>> {
  if (cachedTVGenreMap) return cachedTVGenreMap;
  try {
    const genres = await getSeriesGenres();
    cachedTVGenreMap = new Map(genres.map((g) => [g.id, g.name]));
  } catch {
    cachedTVGenreMap = new Map();
  }
  return cachedTVGenreMap;
}

/**
 * Maps a TMDB Movie payload to WeAre Movie interface
 */
export function mapTMDBMovieToMovie(
  m: TMDBMovie,
  genreMap?: Map<number, string>,
  credits?: TMDBCredits | null
): Movie {
  const releaseYear = m.release_date
    ? new Date(m.release_date).getFullYear()
    : new Date().getFullYear();

  const runtimeMins = m.runtime || 115;
  const hours = Math.floor(runtimeMins / 60);
  const mins = runtimeMins % 60;
  const durationStr = `${hours}h ${mins.toString().padStart(2, "0")}m`;

  let genres: string[] = [];
  if (m.genres && m.genres.length > 0) {
    genres = m.genres.map((g) => g.name);
  } else if (m.genre_ids && genreMap) {
    genres = m.genre_ids
      .map((id) => genreMap.get(id))
      .filter((name): name is string => Boolean(name));
  }
  if (genres.length === 0) genres = ["Feature Film"];

  let cast: string[] = ["Featured Cast"];
  let director = "Featured Director";

  if (credits) {
    if (credits.cast && credits.cast.length > 0) {
      cast = credits.cast.slice(0, 5).map((c) => c.name);
    }
    const dir = credits.crew?.find((c) => c.job === "Director");
    if (dir) director = dir.name;
  }

  // ID representation: keep TMDB ID cleanly represented
  const movieId = String(m.id);

  return {
    id: movieId,
    tmdb_id: m.id,
    title: m.title || m.original_title || "Untitled",
    description: m.overview || "No overview available.",
    release_year: releaseYear,
    duration: durationStr,
    duration_seconds: runtimeMins * 60,
    age_rating: m.adult ? "R" : "PG-13",
    rating: Number((m.vote_average || 7.0).toFixed(1)),
    rating_count: m.vote_count || 0,
    popularity: m.popularity || 0,
    genres,
    poster_url: getTMDBPosterUrl(m.poster_path, "w500", `movie-${m.id}`),
    backdrop_url: getTMDBBackdropUrl(m.backdrop_path, "w1280", `movie-bg-${m.id}`),
    video_url: `/api/stream/nexstream?type=movie&id=${m.id}`,
    language: m.original_language?.toUpperCase() || "EN",
    cast,
    director,
    is_featured: (m.vote_average || 0) >= 8.0,
    is_published: true,
    is_original: false,
    created_at: m.release_date || new Date().toISOString(),
  };
}

/**
 * Maps a TMDB TV Series payload to WeAre Series interface
 */
export function mapTMDBSeriesToSeries(
  s: TMDBSeries,
  genreMap?: Map<number, string>,
  credits?: TMDBCredits | null,
  detailedSeasons?: Season[]
): Series {
  const releaseYear = s.first_air_date
    ? new Date(s.first_air_date).getFullYear()
    : new Date().getFullYear();

  let genres: string[] = [];
  if (s.genres && s.genres.length > 0) {
    genres = s.genres.map((g) => g.name);
  } else if (s.genre_ids && genreMap) {
    genres = s.genre_ids
      .map((id) => genreMap.get(id))
      .filter((name): name is string => Boolean(name));
  }
  if (genres.length === 0) genres = ["Drama", "Television"];

  let cast: string[] = ["Featured Ensemble"];
  if (credits?.cast && credits.cast.length > 0) {
    cast = credits.cast.slice(0, 5).map((c) => c.name);
  }

  // Build basic seasons structure from TMDB series.seasons if detailed not supplied
  const totalSeasons = s.number_of_seasons || s.seasons?.filter((sn) => sn.season_number > 0).length || 1;
  const totalEpisodes = s.number_of_episodes || totalSeasons * 8;

  const detailedMap = new Map((detailedSeasons || []).map((sn) => [sn.season_number, sn]));
  let seasons: Season[] = [];

  if (s.seasons && s.seasons.length > 0) {
    seasons = s.seasons
      .filter((sn) => sn.season_number > 0)
      .map((sn) => {
        const detailed = detailedMap.get(sn.season_number);
        if (detailed) return detailed;

        return {
          id: `tv-${s.id}-s${sn.season_number}`,
          series_id: String(s.id),
          season_number: sn.season_number,
          title: sn.name || `Season ${sn.season_number}`,
          description: sn.overview,
          episodes: Array.from({ length: Math.min(sn.episode_count || 10, 24) }, (_, idx) => {
            const epNum = idx + 1;
            return {
              id: `tv-${s.id}-s${sn.season_number}-e${epNum}`,
              series_id: String(s.id),
              season_id: `tv-${s.id}-s${sn.season_number}`,
              season_number: sn.season_number,
              episode_number: epNum,
              title: `Episode ${epNum}`,
              description: `Episode ${epNum} of Season ${sn.season_number}`,
              duration: "45m",
              duration_seconds: 2700,
              thumbnail_url: getTMDBBackdropUrl(s.backdrop_path, "w780", `ep-${s.id}-${sn.season_number}-${epNum}`),
              video_url: `/api/stream/nexstream?type=tv&id=${s.id}&s=${sn.season_number}&e=${epNum}`,
            };
          }),
        };
      });
  } else if (detailedSeasons && detailedSeasons.length > 0) {
    seasons = detailedSeasons;
  }

  if (seasons.length === 0) {
    seasons = [
      {
        id: `tv-${s.id}-s1`,
        series_id: String(s.id),
        season_number: 1,
        title: "Season 1",
        episodes: [
          {
            id: `tv-${s.id}-s1-e1`,
            series_id: String(s.id),
            season_id: `tv-${s.id}-s1`,
            season_number: 1,
            episode_number: 1,
            title: "Pilot",
            description: s.overview || "Series Premiere",
            duration: "50m",
            duration_seconds: 3000,
            thumbnail_url: getTMDBBackdropUrl(s.backdrop_path, "w780", `ep-${s.id}-s1-e1`),
            video_url: `/api/stream/nexstream?type=tv&id=${s.id}&s=1&e=1`,
          },
        ],
      },
    ];
  }

  return {
    id: String(s.id),
    tmdb_id: s.id,
    title: s.name || s.original_name || "Untitled Series",
    description: s.overview || "No overview available.",
    release_year: releaseYear,
    age_rating: s.adult ? "TV-MA" : "TV-14",
    rating: Number((s.vote_average || 7.2).toFixed(1)),
    rating_count: s.vote_count || 0,
    popularity: s.popularity || 0,
    genres,
    poster_url: getTMDBPosterUrl(s.poster_path, "w500", `tv-${s.id}`),
    backdrop_url: getTMDBBackdropUrl(s.backdrop_path, "w1280", `tv-bg-${s.id}`),
    language: s.original_language?.toUpperCase() || "EN",
    cast,
    is_featured: (s.vote_average || 0) >= 8.2,
    is_published: true,
    is_original: false,
    seasons,
    total_seasons: totalSeasons,
    total_episodes: totalEpisodes,
    created_at: s.first_air_date || new Date().toISOString(),
  };
}

/**
 * Maps TMDB Season with episodes
 */
export function mapTMDBSeasonToSeason(
  seriesTmdbId: number,
  sn: TMDBSeason,
  seriesBackdrop?: string | null
): Season {
  const episodes: Episode[] = (sn.episodes || []).map((ep) => {
    const runtimeMins = ep.runtime || 48;
    return {
      id: `tv-${seriesTmdbId}-s${sn.season_number}-e${ep.episode_number}`,
      series_id: String(seriesTmdbId),
      season_id: `tv-${seriesTmdbId}-s${sn.season_number}`,
      season_number: sn.season_number,
      episode_number: ep.episode_number,
      title: ep.name || `Episode ${ep.episode_number}`,
      description: ep.overview || "No episode summary available.",
      duration: `${runtimeMins}m`,
      duration_seconds: runtimeMins * 60,
      thumbnail_url: getTMDBBackdropUrl(
        ep.still_path || seriesBackdrop,
        "w780",
        `ep-${seriesTmdbId}-${sn.season_number}-${ep.episode_number}`
      ),
      video_url: `/api/stream/nexstream?type=tv&id=${seriesTmdbId}&s=${sn.season_number}&e=${ep.episode_number}`,
      published_at: ep.air_date || undefined,
    };
  });

  return {
    id: `tv-${seriesTmdbId}-s${sn.season_number}`,
    series_id: String(seriesTmdbId),
    season_number: sn.season_number,
    title: sn.name || `Season ${sn.season_number}`,
    description: sn.overview,
    episodes,
  };
}

export const DynamicCatalogService = {
  /**
   * Fetch paginated dynamic movies from TMDB
   */
  async getMovies(options: {
    category?: MovieCategory;
    page?: number;
    genreId?: number;
    language?: string;
  } = {}): Promise<PaginatedResult<Movie>> {
    const page = Math.max(1, options.page || 1);
    const category = options.category || "popular";
    const genreMap = await getMovieGenreMap();

    let endpoint = "/movie/popular";
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      language: options.language || "en-US",
    };

    if (options.genreId && options.genreId > 0) {
      // Use discover endpoint when specific genre requested
      endpoint = "/discover/movie";
      params["with_genres"] = options.genreId;
      if (category === "top-rated") {
        params["sort_by"] = "vote_average.desc";
        params["vote_count.gte"] = 100;
      } else if (category === "upcoming" || category === "now-playing") {
        params["sort_by"] = "primary_release_date.desc";
      } else {
        params["sort_by"] = "popularity.desc";
      }
    } else {
      switch (category) {
        case "trending":
          endpoint = "/trending/movie/week";
          break;
        case "top-rated":
          endpoint = "/movie/top_rated";
          break;
        case "now-playing":
          endpoint = "/movie/now_playing";
          break;
        case "upcoming":
          endpoint = "/movie/upcoming";
          break;
        case "popular":
        default:
          endpoint = "/movie/popular";
          break;
      }
    }

    const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(endpoint, {
      params,
      revalidateSeconds: 3600, // 1-hour cache
    });

    if (!data || !data.results) {
      return { items: [], page, totalPages: 0, totalResults: 0 };
    }

    const items = data.results.map((m) => mapTMDBMovieToMovie(m, genreMap));

    return {
      items,
      page: data.page,
      totalPages: Math.min(data.total_pages, 500), // TMDB caps at 500
      totalResults: data.total_results,
    };
  },

  /**
   * Fetch paginated dynamic TV series from TMDB
   */
  async getSeries(options: {
    category?: TVCategory;
    page?: number;
    genreId?: number;
    language?: string;
  } = {}): Promise<PaginatedResult<Series>> {
    const page = Math.max(1, options.page || 1);
    const category = options.category || "popular";
    const genreMap = await getTVGenreMap();

    let endpoint = "/tv/popular";
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      language: options.language || "en-US",
    };

    if (options.genreId && options.genreId > 0) {
      endpoint = "/discover/tv";
      params["with_genres"] = options.genreId;
      if (category === "top-rated") {
        params["sort_by"] = "vote_average.desc";
        params["vote_count.gte"] = 50;
      } else {
        params["sort_by"] = "popularity.desc";
      }
    } else {
      switch (category) {
        case "trending":
          endpoint = "/trending/tv/week";
          break;
        case "top-rated":
          endpoint = "/tv/top_rated";
          break;
        case "popular":
        default:
          endpoint = "/tv/popular";
          break;
      }
    }

    const data = await tmdbFetch<TMDBPaginatedResponse<TMDBSeries>>(endpoint, {
      params,
      revalidateSeconds: 3600,
    });

    if (!data || !data.results) {
      return { items: [], page, totalPages: 0, totalResults: 0 };
    }

    const items = data.results.map((s) => mapTMDBSeriesToSeries(s, genreMap));

    return {
      items,
      page: data.page,
      totalPages: Math.min(data.total_pages, 500),
      totalResults: data.total_results,
    };
  },

  /**
   * Fetch complete movie details dynamically from TMDB
   */
  async getMovieById(idOrTmdbId: string | number): Promise<Movie | null> {
    const tmdbId = typeof idOrTmdbId === "number" ? idOrTmdbId : parseInt(idOrTmdbId.replace(/^(m-|movie-|tmdb-)/, ""), 10);
    if (!tmdbId || isNaN(tmdbId)) return null;

    const [details, credits] = await Promise.all([
      tmdbFetch<TMDBMovie>(`/movie/${tmdbId}`, { revalidateSeconds: 86400 }),
      tmdbFetch<TMDBCredits>(`/movie/${tmdbId}/credits`, { revalidateSeconds: 86400 }),
    ]);

    if (!details) return null;

    const genreMap = await getMovieGenreMap();
    return mapTMDBMovieToMovie(details, genreMap, credits);
  },

  /**
   * Fetch complete series details dynamically from TMDB with seasons
   */
  async getSeriesById(idOrTmdbId: string | number, loadFirstSeasonEpisodes = true): Promise<Series | null> {
    const tmdbId = typeof idOrTmdbId === "number" ? idOrTmdbId : parseInt(idOrTmdbId.replace(/^(s-|tv-|series-|tmdb-)/, ""), 10);
    if (!tmdbId || isNaN(tmdbId)) return null;

    const [details, credits] = await Promise.all([
      tmdbFetch<TMDBSeries>(`/tv/${tmdbId}`, { revalidateSeconds: 86400 }),
      tmdbFetch<TMDBCredits>(`/tv/${tmdbId}/credits`, { revalidateSeconds: 86400 }),
    ]);

    if (!details) return null;

    const genreMap = await getTVGenreMap();

    let detailedSeasons: Season[] = [];
    if (loadFirstSeasonEpisodes && details.seasons && details.seasons.length > 0) {
      const validSeasons = details.seasons.filter((sn) => sn.season_number > 0).slice(0, 6);
      const seasonsData = await Promise.all(
        validSeasons.map((sn) =>
          this.getSeason(tmdbId, sn.season_number, details.backdrop_path)
        )
      );
      detailedSeasons = seasonsData.filter((s): s is Season => Boolean(s));
    }

    return mapTMDBSeriesToSeries(details, genreMap, credits, detailedSeasons);
  },

  /**
   * Fetch a specific TV season's episodes
   */
  async getSeason(
    seriesTmdbId: number,
    seasonNumber: number,
    seriesBackdrop?: string | null
  ): Promise<Season | null> {
    const data = await tmdbFetch<TMDBSeason>(`/tv/${seriesTmdbId}/season/${seasonNumber}`, {
      revalidateSeconds: 86400,
    });

    if (!data) return null;

    return mapTMDBSeasonToSeason(seriesTmdbId, data, seriesBackdrop);
  },

  /**
   * Dynamic search across TMDB movies and TV series
   */
  async search(options: {
    query: string;
    page?: number;
    type?: "all" | "movie" | "tv";
    genreId?: number;
  }): Promise<PaginatedResult<ContentItem>> {
    const q = options.query?.trim();
    if (!q) {
      return { items: [], page: 1, totalPages: 0, totalResults: 0 };
    }

    const page = Math.max(1, options.page || 1);
    const type = options.type || "all";

    const [movieGenres, tvGenres] = await Promise.all([
      getMovieGenreMap(),
      getTVGenreMap(),
    ]);

    if (type === "movie") {
      const res = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>("/search/movie", {
        params: { query: q, page, include_adult: false },
        revalidateSeconds: 1800,
      });
      if (!res || !res.results) return { items: [], page, totalPages: 0, totalResults: 0 };
      const items = res.results.map((m) => mapTMDBMovieToMovie(m, movieGenres));
      return { items, page: res.page, totalPages: Math.min(res.total_pages, 100), totalResults: res.total_results };
    }

    if (type === "tv") {
      const res = await tmdbFetch<TMDBPaginatedResponse<TMDBSeries>>("/search/tv", {
        params: { query: q, page, include_adult: false },
        revalidateSeconds: 1800,
      });
      if (!res || !res.results) return { items: [], page, totalPages: 0, totalResults: 0 };
      const items = res.results.map((s) => mapTMDBSeriesToSeries(s, tvGenres));
      return { items, page: res.page, totalPages: Math.min(res.total_pages, 100), totalResults: res.total_results };
    }

    // Combined search ("all") using TMDB official multi-search
    interface TMDBMultiItem {
      id: number;
      media_type: "movie" | "tv" | "person";
      title?: string;
      name?: string;
      overview?: string;
      poster_path?: string | null;
      backdrop_path?: string | null;
      release_date?: string;
      first_air_date?: string;
      vote_average?: number;
      vote_count?: number;
      genre_ids?: number[];
      adult?: boolean;
      original_language?: string;
      popularity?: number;
    }

    const multiRes = await tmdbFetch<TMDBPaginatedResponse<TMDBMultiItem>>("/search/multi", {
      params: { query: q, page, include_adult: false },
      revalidateSeconds: 1800,
    });

    if (multiRes && multiRes.results && multiRes.results.length > 0) {
      const items: ContentItem[] = [];
      for (const item of multiRes.results) {
        if (item.media_type === "movie") {
          items.push(mapTMDBMovieToMovie(item as unknown as TMDBMovie, movieGenres));
        } else if (item.media_type === "tv") {
          items.push(mapTMDBSeriesToSeries(item as unknown as TMDBSeries, tvGenres));
        }
      }
      return {
        items,
        page: multiRes.page,
        totalPages: Math.min(multiRes.total_pages, 100),
        totalResults: multiRes.total_results,
      };
    }

    // Fallback: search movies
    const fallbackRes = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>("/search/movie", {
      params: { query: q, page, include_adult: false },
      revalidateSeconds: 1800,
    });
    const items = (fallbackRes?.results || []).map((m) => mapTMDBMovieToMovie(m, movieGenres));
    return {
      items,
      page: fallbackRes?.page || page,
      totalPages: Math.min(fallbackRes?.total_pages || 0, 100),
      totalResults: fallbackRes?.total_results || 0,
    };
  },

  /**
   * Helper to get genres list for filters
   */
  async getGenres(type: "movie" | "tv"): Promise<TMDBGenre[]> {
    return type === "movie" ? await getMovieGenres() : await getSeriesGenres();
  },
};
