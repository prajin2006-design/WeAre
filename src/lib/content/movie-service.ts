import { Movie } from '@/types/content';
import { DEVELOPMENT_MOVIES } from '@/data/development-store';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface DatabaseMovieRow {
  id: string;
  tmdb_id?: number | null;
  title: string;
  original_title?: string | null;
  description?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  release_date?: string | null;
  runtime?: number | null;
  rating?: number | null;
  vote_count?: number | null;
  language?: string | null;
  original_language?: string | null;
  adult?: boolean | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  genres?: { genres: { name: string } | null }[];
  cast?: { character?: string; cast_members: { name: string } | null }[];
  video_sources?: { url: string; hls_url?: string; is_active: boolean }[];
}

export function mapDbMovieToMovie(row: DatabaseMovieRow): Movie {
  const releaseYear = row.release_date ? new Date(row.release_date).getFullYear() : 2025;
  const runtimeMins = row.runtime || 120;
  const hours = Math.floor(runtimeMins / 60);
  const mins = runtimeMins % 60;
  const durationStr = `${hours}h ${mins.toString().padStart(2, '0')}m`;

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

  const activeVideo = row.video_sources?.find((v) => v.is_active) || row.video_sources?.[0];
  const videoUrl = activeVideo?.hls_url || activeVideo?.url || '';

  return {
    id: row.id,
    tmdb_id: row.tmdb_id || undefined,
    title: row.title,
    description: row.description || '',
    release_year: releaseYear,
    duration: durationStr,
    duration_seconds: runtimeMins * 60,
    age_rating: row.adult ? 'R' : 'PG-13',
    rating: Number(row.rating || 7.5),
    genres: extractedGenres.length > 0 ? extractedGenres : ['Action', 'Sci-Fi'],
    poster_url: row.poster_url || 'https://picsum.photos/seed/weare-poster/600/900',
    backdrop_url: row.backdrop_url || 'https://picsum.photos/seed/weare-bg/1920/1080',
    trailer_url: videoUrl,
    video_url: videoUrl,
    language: row.language || 'English',
    cast: extractedCast.length > 0 ? extractedCast : ['Elena Vance', 'Julian Mercer'],
    director: 'Aria Sterling',
    is_featured: (row.rating || 0) >= 8.5,
    is_published: true,
    is_original: true,
    created_at: row.created_at || new Date().toISOString(),
  };
}

export const MovieService = {
  async getPopular(limit: number = 20): Promise<Movie[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('movies')
          .select(`
            *,
            genres:movie_genres(genres(name)),
            cast:movie_cast(character, cast_members(name))
          `)
          .order('rating', { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return (data as unknown as DatabaseMovieRow[]).map(mapDbMovieToMovie);
        }
      } catch (err) {
        console.warn('[MovieService.getPopular] Notice:', err);
      }
    }
    return DEVELOPMENT_MOVIES.slice(0, limit);
  },

  async getTrending(limit: number = 10): Promise<Movie[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('movies')
          .select(`
            *,
            genres:movie_genres(genres(name)),
            cast:movie_cast(character, cast_members(name))
          `)
          .order('rating', { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return (data as unknown as DatabaseMovieRow[]).map(mapDbMovieToMovie);
        }
      } catch (err) {
        console.warn('[MovieService.getTrending] Notice:', err);
      }
    }
    return DEVELOPMENT_MOVIES.slice(0, limit);
  },

  async getById(id: string): Promise<Movie | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        // Support querying by UUID or tmdb_id
        const isNumeric = /^\d+$/.test(id);
        const query = supabase
          .from('movies')
          .select(`
            *,
            genres:movie_genres(genres(name)),
            cast:movie_cast(character, cast_members(name))
          `);

        const { data, error } = isNumeric
          ? await query.eq('tmdb_id', parseInt(id, 10)).maybeSingle()
          : await query.eq('id', id).maybeSingle();

        if (!error && data) {
          // Fetch video source for this movie
          const { data: videos } = await supabase
            .from('video_sources')
            .select('*')
            .eq('content_id', data.id)
            .eq('content_type', 'movie');

          const movieRow = {
            ...(data as unknown as DatabaseMovieRow),
            video_sources: videos || [],
          };
          return mapDbMovieToMovie(movieRow);
        }
      } catch (err) {
        console.warn('[MovieService.getById] Notice:', err);
      }
    }

    const local = DEVELOPMENT_MOVIES.find((m) => m.id === id);
    return local || null;
  },

  async getRecommended(): Promise<Movie[]> {
    return [];
  },

  async addMovie(movie: Omit<Movie, 'id' | 'created_at'>): Promise<Movie> {
    const generatedId = `m-${Date.now()}`;
    const fullMovie: Movie = {
      ...movie,
      id: generatedId,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('movies')
          .insert({
            title: movie.title,
            description: movie.description,
            release_date: `${movie.release_year}-01-01`,
            runtime: Math.round(movie.duration_seconds / 60),
            rating: movie.rating,
            poster_url: movie.poster_url,
            backdrop_url: movie.backdrop_url,
            language: movie.language,
            adult: movie.age_rating === 'R',
            status: 'Released',
          })
          .select('id')
          .single();

        if (data?.id) {
          fullMovie.id = data.id;
          await supabase.from('video_sources').insert({
            content_id: data.id,
            content_type: 'movie',
            name: 'Default Source',
            source_type: 'mp4',
            url: movie.video_url,
            hls_url: movie.video_url,
            is_active: true,
          });
        }
      } catch (err) {
        console.warn('[MovieService.addMovie] Supabase notice:', err);
      }
    }

    DEVELOPMENT_MOVIES.unshift(fullMovie);
    return fullMovie;
  },

  async deleteMovie(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from('movies').delete().eq('id', id);
      } catch (err) {
        console.warn('[MovieService.deleteMovie] Supabase notice:', err);
      }
    }

    const index = DEVELOPMENT_MOVIES.findIndex((m) => m.id === id);
    if (index > -1) {
      DEVELOPMENT_MOVIES.splice(index, 1);
      return true;
    }
    return false;
  },
};

