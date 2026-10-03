export type ContentType = 'movie' | 'series' | 'episode';
export type { VideoSource, SubtitleTrack } from '@/lib/video/video-source-service';

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface Movie {
  id: string;
  tmdb_id?: number;
  title: string;
  description: string;
  release_year: number;
  duration: string; // e.g. "2h 14m"
  duration_seconds: number;
  age_rating: string; // "PG-13", "R", "TV-MA"
  rating: number; // e.g. 8.7
  rating_count?: number;
  popularity?: number;
  genres: string[];
  poster_url: string;
  backdrop_url: string;
  trailer_url?: string;
  video_url: string; // MP4 or HLS (.m3u8)
  language: string;
  subtitles?: { language: string; src: string }[];
  cast: string[];
  director: string;
  is_featured: boolean;
  is_published: boolean;
  is_original: boolean;
  created_at: string;
}

export interface Episode {
  id: string;
  series_id: string;
  season_id: string;
  season_number: number;
  episode_number: number;
  title: string;
  description: string;
  duration: string;
  duration_seconds: number;
  thumbnail_url: string;
  video_url: string;
  subtitles?: { language: string; src: string }[];
  published_at?: string;
}

export interface Season {
  id: string;
  series_id: string;
  season_number: number;
  title: string;
  description?: string;
  episodes: Episode[];
}

export interface Series {
  id: string;
  tmdb_id?: number;
  title: string;
  description: string;
  release_year: number;
  age_rating: string;
  rating: number;
  rating_count?: number;
  popularity?: number;
  genres: string[];
  poster_url: string;
  backdrop_url: string;
  trailer_url?: string;
  language: string;
  cast: string[];
  director?: string;
  is_featured: boolean;
  is_published: boolean;
  is_original: boolean;
  seasons: Season[];
  total_seasons: number;
  total_episodes: number;
  created_at: string;
}

export type ContentItem = Movie | Series;

export function isMovie(content: ContentItem): content is Movie {
  return !('seasons' in content);
}

export interface WatchProgress {
  id: string;
  user_id: string;
  content_id: string;
  content_type: ContentType;
  episode_id?: string;
  current_position: number; // in seconds
  duration: number; // in seconds
  percentage: number;
  title: string;
  poster_url: string;
  backdrop_url: string;
  episode_title?: string;
  season_number?: number;
  episode_number?: number;
  updated_at: string;
}

export interface WatchHistoryItem {
  id: string;
  user_id: string;
  content_id: string;
  content_type: ContentType;
  title: string;
  poster_url: string;
  backdrop_url: string;
  episode_id?: string;
  episode_title?: string;
  season_number?: number;
  episode_number?: number;
  watched_at: string;
}

export interface MyListItem {
  id: string;
  user_id: string;
  content_id: string;
  content_type: ContentType;
  added_at: string;
  content: ContentItem;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  created_at: string;
  preferences?: {
    preferred_language?: string;
    autoplay_next?: boolean;
    stream_quality?: 'auto' | '1080p' | '720p' | '480p';
  };
}
