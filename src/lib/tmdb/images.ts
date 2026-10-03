/**
 * TMDB Image URL Helper Functions
 */

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';
export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original';
export type ProfileSize = 'w45' | 'w185' | 'h632' | 'original';

export function getTMDBPosterUrl(
  path: string | null | undefined,
  size: PosterSize = 'w500',
  fallbackSeed: string = 'poster'
): string {
  if (path && path.startsWith('/')) {
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }
  if (path && path.startsWith('http')) {
    return path;
  }
  return `https://picsum.photos/seed/${encodeURIComponent(fallbackSeed)}/600/900`;
}

export function getTMDBBackdropUrl(
  path: string | null | undefined,
  size: BackdropSize = 'w1280',
  fallbackSeed: string = 'backdrop'
): string {
  if (path && path.startsWith('/')) {
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }
  if (path && path.startsWith('http')) {
    return path;
  }
  return `https://picsum.photos/seed/${encodeURIComponent(fallbackSeed)}/1920/1080`;
}

export function getTMDBProfileUrl(
  path: string | null | undefined,
  size: ProfileSize = 'w185',
  fallbackSeed: string = 'actor'
): string {
  if (path && path.startsWith('/')) {
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }
  if (path && path.startsWith('http')) {
    return path;
  }
  return `https://picsum.photos/seed/${encodeURIComponent(fallbackSeed)}/300/450`;
}
