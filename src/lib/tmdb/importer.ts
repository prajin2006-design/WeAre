/**
 * TMDB to Supabase Ingestion and Importer Service
 * Runs strictly on the server with administrative privileges (SUPABASE_SERVICE_ROLE_KEY).
 * Imports metadata ONLY — does NOT download or host unauthorized commercial content.
 */

import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { getPopularMovies, getMovieDetails, getMovieCredits } from './movies';
import { getPopularSeries, getSeriesDetails, getSeriesCredits } from './series';
import { getMovieGenres, getSeriesGenres } from './genres';
import { getTMDBPosterUrl, getTMDBBackdropUrl, getTMDBProfileUrl } from './images';

export interface ImportResult {
  success: boolean;
  importedCount: number;
  message: string;
  errors?: string[];
}

export async function importGenres(): Promise<number> {
  const supabase = createAdminSupabaseClient();
  const [movieGenres, seriesGenres] = await Promise.all([
    getMovieGenres(),
    getSeriesGenres(),
  ]);

  let count = 0;
  for (const genre of movieGenres) {
    const { error } = await supabase.from('genres').upsert(
      {
        tmdb_id: genre.id,
        name: genre.name,
        type: 'movie',
      },
      { onConflict: 'tmdb_id,type' }
    );
    if (!error) count++;
  }

  for (const genre of seriesGenres) {
    const { error } = await supabase.from('genres').upsert(
      {
        tmdb_id: genre.id,
        name: genre.name,
        type: 'series',
      },
      { onConflict: 'tmdb_id,type' }
    );
    if (!error) count++;
  }

  return count;
}

export async function importMoviesFromTMDB(limit: number = 20): Promise<ImportResult> {
  try {
    const supabase = createAdminSupabaseClient();
    await importGenres();

    const tmdbList = await getPopularMovies(1);
    if (!tmdbList || tmdbList.length === 0) {
      return { success: false, importedCount: 0, message: 'No movies returned from TMDB API.' };
    }

    const itemsToImport = tmdbList.slice(0, limit);
    let importedCount = 0;
    const errors: string[] = [];

    for (const item of itemsToImport) {
      try {
        const details = await getMovieDetails(item.id) || item;
        const credits = await getMovieCredits(item.id);

        const moviePayload = {
          tmdb_id: item.id,
          title: item.title,
          original_title: item.original_title || item.title,
          description: item.overview || 'No synopsis available.',
          poster_url: getTMDBPosterUrl(item.poster_path, 'w500', `movie-${item.id}`),
          backdrop_url: getTMDBBackdropUrl(item.backdrop_path, 'w1280', `movie-bg-${item.id}`),
          release_date: item.release_date || new Date().toISOString().split('T')[0],
          runtime: details.runtime || 120,
          rating: Number(item.vote_average.toFixed(1)),
          vote_count: item.vote_count || 0,
          language: item.original_language || 'en',
          original_language: item.original_language || 'en',
          adult: item.adult || false,
          status: details.status || 'Released',
          updated_at: new Date().toISOString(),
        };

        const { data: movieRow, error: movieError } = await supabase
          .from('movies')
          .upsert(moviePayload, { onConflict: 'tmdb_id' })
          .select('id')
          .single();

        if (movieError || !movieRow) {
          errors.push(`Failed to upsert "${item.title}": ${movieError?.message}`);
          continue;
        }

        const movieId = movieRow.id;

        // Associate genres
        if (details.genres && details.genres.length > 0) {
          for (const g of details.genres) {
            const { data: genreRow } = await supabase
              .from('genres')
              .select('id')
              .eq('tmdb_id', g.id)
              .eq('type', 'movie')
              .maybeSingle();

            if (genreRow) {
              await supabase
                .from('movie_genres')
                .upsert({ movie_id: movieId, genre_id: genreRow.id }, { onConflict: 'movie_id,genre_id' });
            }
          }
        }

        // Associate top 5 cast members
        if (credits?.cast) {
          const topCast = credits.cast.slice(0, 5);
          for (const actor of topCast) {
            const { data: castRow } = await supabase
              .from('cast_members')
              .upsert(
                {
                  tmdb_id: actor.id,
                  name: actor.name,
                  profile_url: getTMDBProfileUrl(actor.profile_path, 'w185', `actor-${actor.id}`),
                  character_name: actor.character,
                },
                { onConflict: 'tmdb_id' }
              )
              .select('id')
              .single();

            if (castRow) {
              await supabase.from('movie_cast').upsert(
                {
                  movie_id: movieId,
                  cast_member_id: castRow.id,
                  character: actor.character,
                  display_order: actor.order,
                },
                { onConflict: 'movie_id,cast_member_id' }
              );
            }
          }
        }

        importedCount++;
      } catch (innerErr: unknown) {
        errors.push(`Error on movie ${item.title}: ${innerErr instanceof Error ? innerErr.message : String(innerErr)}`);
      }
    }

    return {
      success: importedCount > 0,
      importedCount,
      message: `Successfully imported ${importedCount} movies into Supabase.`,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: unknown) {
    return {
      success: false,
      importedCount: 0,
      message: error instanceof Error ? error.message : 'Unknown import error',
    };
  }
}

export async function importSeriesFromTMDB(limit: number = 10): Promise<ImportResult> {
  try {
    const supabase = createAdminSupabaseClient();
    const tmdbList = await getPopularSeries(1);
    if (!tmdbList || tmdbList.length === 0) {
      return { success: false, importedCount: 0, message: 'No series returned from TMDB API.' };
    }

    const itemsToImport = tmdbList.slice(0, limit);
    let importedCount = 0;
    const errors: string[] = [];

    for (const item of itemsToImport) {
      try {
        const details = await getSeriesDetails(item.id) || item;

        const seriesPayload = {
          tmdb_id: item.id,
          title: item.name,
          original_title: item.original_name || item.name,
          description: item.overview || 'No synopsis available.',
          poster_url: getTMDBPosterUrl(item.poster_path, 'w500', `series-${item.id}`),
          backdrop_url: getTMDBBackdropUrl(item.backdrop_path, 'w1280', `series-bg-${item.id}`),
          first_air_date: item.first_air_date || new Date().toISOString().split('T')[0],
          last_air_date: details.last_air_date || null,
          rating: Number(item.vote_average.toFixed(1)),
          vote_count: item.vote_count || 0,
          language: item.original_language || 'en',
          original_language: item.original_language || 'en',
          status: details.status || 'Returning Series',
          updated_at: new Date().toISOString(),
        };

        const { data: seriesRow, error: seriesError } = await supabase
          .from('series')
          .upsert(seriesPayload, { onConflict: 'tmdb_id' })
          .select('id')
          .single();

        if (seriesError || !seriesRow) {
          errors.push(`Failed to upsert series "${item.name}": ${seriesError?.message}`);
          continue;
        }

        const seriesId = seriesRow.id;

        // Associate genres
        if (details.genres && details.genres.length > 0) {
          for (const g of details.genres) {
            const { data: genreRow } = await supabase
              .from('genres')
              .select('id')
              .eq('tmdb_id', g.id)
              .eq('type', 'series')
              .maybeSingle();

            if (genreRow) {
              await supabase
                .from('series_genres')
                .upsert({ series_id: seriesId, genre_id: genreRow.id }, { onConflict: 'series_id,genre_id' });
            }
          }
        }

        // Associate top 5 cast members
        const credits = await getSeriesCredits(item.id);
        if (credits?.cast) {
          const topCast = credits.cast.slice(0, 5);
          for (const actor of topCast) {
            const { data: castRow } = await supabase
              .from('cast_members')
              .upsert(
                {
                  tmdb_id: actor.id,
                  name: actor.name,
                  profile_url: getTMDBProfileUrl(actor.profile_path, 'w185', `actor-${actor.id}`),
                  character_name: actor.character,
                },
                { onConflict: 'tmdb_id' }
              )
              .select('id')
              .single();

            if (castRow) {
              await supabase.from('series_cast').upsert(
                {
                  series_id: seriesId,
                  cast_member_id: castRow.id,
                  character: actor.character,
                  display_order: actor.order,
                },
                { onConflict: 'series_id,cast_member_id' }
              );
            }
          }
        }

        // Create default season and episode if none exist
        const { data: seasonRow } = await supabase
          .from('seasons')
          .upsert(
            {
              series_id: seriesId,
              season_number: 1,
              title: 'Season 1',
              description: 'First season',
              poster_url: seriesPayload.poster_url,
            },
            { onConflict: 'series_id,season_number' }
          )
          .select('id')
          .single();

        if (seasonRow) {
          await supabase.from('episodes').upsert(
            {
              series_id: seriesId,
              season_id: seasonRow.id,
              season_number: 1,
              episode_number: 1,
              title: 'Pilot',
              description: 'Series premiere episode.',
              duration: 48,
              thumbnail_url: seriesPayload.backdrop_url,
              video_url: null,
            },
            { onConflict: 'season_id,episode_number' }
          );
        }

        importedCount++;
      } catch (innerErr: unknown) {
        errors.push(`Error on series ${item.name}: ${innerErr instanceof Error ? innerErr.message : String(innerErr)}`);
      }
    }

    return {
      success: importedCount > 0,
      importedCount,
      message: `Successfully imported ${importedCount} series into Supabase.`,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: unknown) {
    return {
      success: false,
      importedCount: 0,
      message: error instanceof Error ? error.message : 'Unknown series import error',
    };
  }
}

export interface CatalogImportResult {
  success: boolean;
  moviesImported: number;
  seriesImported: number;
  genresImported: number;
  message: string;
  errors?: string[];
}

export async function importCatalogFromTMDB(
  movieLimit: number = 20,
  seriesLimit: number = 10
): Promise<CatalogImportResult> {
  const genresCount = await importGenres();
  const moviesRes = await importMoviesFromTMDB(movieLimit);
  const seriesRes = await importSeriesFromTMDB(seriesLimit);

  const errors = [
    ...(moviesRes.errors || []),
    ...(seriesRes.errors || []),
  ];

  const success = moviesRes.success || seriesRes.success;

  return {
    success,
    moviesImported: moviesRes.importedCount,
    seriesImported: seriesRes.importedCount,
    genresImported: genresCount,
    message: `Imported ${moviesRes.importedCount} movies and ${seriesRes.importedCount} series (${genresCount} genres synced).`,
    errors: errors.length > 0 ? errors : undefined,
  };
}

