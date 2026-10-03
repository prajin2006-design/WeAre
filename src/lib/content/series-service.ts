import { Series, Episode } from '@/types/content';
import { DEVELOPMENT_SERIES } from '@/data/development-store';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface DatabaseSeriesRow {
  id: string;
  tmdb_id?: number | null;
  title: string;
  original_title?: string | null;
  description?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  first_air_date?: string | null;
  last_air_date?: string | null;
  rating?: number | null;
  vote_count?: number | null;
  language?: string | null;
  original_language?: string | null;
  status?: string | null;
  created_at?: string;
  genres?: { genres: { name: string } | null }[];
  cast?: { character?: string; cast_members: { name: string } | null }[];
  seasons?: {
    id: string;
    series_id: string;
    season_number: number;
    title: string;
    description?: string;
    episodes?: {
      id: string;
      series_id: string;
      season_id: string;
      season_number: number;
      episode_number: number;
      title: string;
      description?: string;
      duration?: number;
      thumbnail_url?: string;
      video_url?: string;
    }[];
  }[];
}

export function mapDbSeriesToSeries(row: DatabaseSeriesRow): Series {
  const releaseYear = row.first_air_date ? new Date(row.first_air_date).getFullYear() : 2025;

  const extractedGenres: string[] = [];
  if (row.genres && Array.isArray(row.genres)) {
    row.genres.forEach((g) => {
      if (g?.genres?.name) extractedGenres.push(g.genres.name);
    });
  }

  const extractedCast: string[] = [];
  if (row.cast && Array.isArray(row.cast)) {
    row.cast.forEach((c) => {
      if (c?.cast_members?.name) extractedCast.push(c.cast_members.name);
    });
  }

  const mappedSeasons = (row.seasons || []).map((s) => ({
    id: s.id,
    series_id: s.series_id,
    season_number: s.season_number,
    title: s.title || `Season ${s.season_number}`,
    description: s.description,
    episodes: (s.episodes || []).map((e) => ({
      id: e.id,
      series_id: e.series_id,
      season_id: e.season_id,
      season_number: e.season_number,
      episode_number: e.episode_number,
      title: e.title,
      description: e.description || '',
      duration: `${e.duration || 45}m`,
      duration_seconds: (e.duration || 45) * 60,
      thumbnail_url: e.thumbnail_url || row.backdrop_url || '',
      video_url: e.video_url || '',
    })),
  }));

  const totalEpisodes = mappedSeasons.reduce((acc, s) => acc + s.episodes.length, 0);

  return {
    id: row.id,
    tmdb_id: row.tmdb_id || undefined,
    title: row.title,
    description: row.description || '',
    release_year: releaseYear,
    age_rating: 'TV-MA',
    rating: Number(row.rating || 8.0),
    genres: extractedGenres.length > 0 ? extractedGenres : ['Drama', 'Sci-Fi'],
    poster_url: row.poster_url || 'https://picsum.photos/seed/weare-series/600/900',
    backdrop_url: row.backdrop_url || 'https://picsum.photos/seed/weare-series-bg/1920/1080',
    trailer_url: '',
    language: row.language || 'English',
    cast: extractedCast.length > 0 ? extractedCast : ['Sora Tanaka', 'Dr. Noah King'],
    director: 'Katarina Vane',
    is_featured: (row.rating || 0) >= 8.5,
    is_published: true,
    is_original: true,
    seasons: mappedSeasons.length > 0 ? mappedSeasons : DEVELOPMENT_SERIES[0].seasons,
    total_seasons: mappedSeasons.length || 1,
    total_episodes: totalEpisodes || 6,
    created_at: row.created_at || new Date().toISOString(),
  };
}

export const SeriesService = {
  async getPopular(limit: number = 20): Promise<Series[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('series')
          .select(`
            *,
            genres:series_genres(genres(name)),
            cast:series_cast(character, cast_members(name)),
            seasons(*, episodes(*))
          `)
          .order('rating', { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return (data as unknown as DatabaseSeriesRow[]).map(mapDbSeriesToSeries);
        }
      } catch (err) {
        console.warn('[SeriesService.getPopular] Notice:', err);
      }
    }
    return DEVELOPMENT_SERIES.slice(0, limit);
  },

  async getById(id: string): Promise<Series | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const isNumeric = /^\d+$/.test(id);
        const query = supabase
          .from('series')
          .select(`
            *,
            genres:series_genres(genres(name)),
            cast:series_cast(character, cast_members(name)),
            seasons(*, episodes(*))
          `);

        const { data, error } = isNumeric
          ? await query.eq('tmdb_id', parseInt(id, 10)).maybeSingle()
          : await query.eq('id', id).maybeSingle();

        if (!error && data) {
          return mapDbSeriesToSeries(data as unknown as DatabaseSeriesRow);
        }
      } catch (err) {
        console.warn('[SeriesService.getById] Notice:', err);
      }
    }

    const local = DEVELOPMENT_SERIES.find((s) => s.id === id);
    return local || null;
  },

  async getEpisodeById(seriesId: string, episodeId: string): Promise<Episode | null> {
    const s = await this.getById(seriesId);
    if (!s) return null;
    for (const season of s.seasons) {
      const ep = season.episodes.find((e) => e.id === episodeId);
      if (ep) return ep;
    }
    return null;
  },
};
