-- ==============================================================================
-- WeAre Streaming Platform - Complete PostgreSQL Database Schema
-- Version: 2.0.0
-- Compatible with Supabase PostgreSQL & Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- ------------------------------------------------------------------------------
-- 2. MOVIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  original_title TEXT,
  description TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  release_date DATE,
  runtime INTEGER, -- in minutes
  rating NUMERIC(3, 1) DEFAULT 0.0,
  vote_count INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en',
  original_language TEXT DEFAULT 'en',
  adult BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Released',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON public.movies(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_rating ON public.movies(rating DESC);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON public.movies(release_date DESC);

-- ------------------------------------------------------------------------------
-- 3. SERIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  original_title TEXT,
  description TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  first_air_date DATE,
  last_air_date DATE,
  rating NUMERIC(3, 1) DEFAULT 0.0,
  vote_count INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en',
  original_language TEXT DEFAULT 'en',
  status TEXT DEFAULT 'Returning Series',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_series_tmdb_id ON public.series(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_series_rating ON public.series(rating DESC);

-- ------------------------------------------------------------------------------
-- 4. SEASONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  poster_url TEXT,
  air_date DATE,
  CONSTRAINT uq_series_season UNIQUE (series_id, season_number)
);

CREATE INDEX IF NOT EXISTS idx_seasons_series_id ON public.seasons(series_id);

-- ------------------------------------------------------------------------------
-- 5. EPISODES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER, -- in minutes or seconds
  thumbnail_url TEXT,
  video_url TEXT,
  CONSTRAINT uq_season_episode UNIQUE (season_id, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_episodes_series_id ON public.episodes(series_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season_id ON public.episodes(season_id);

-- ------------------------------------------------------------------------------
-- 6. GENRES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('movie', 'series')),
  CONSTRAINT uq_genre_tmdb_type UNIQUE (tmdb_id, type)
);

CREATE INDEX IF NOT EXISTS idx_genres_type ON public.genres(type);
CREATE INDEX IF NOT EXISTS idx_genres_name ON public.genres(name);

-- ------------------------------------------------------------------------------
-- 7. MOVIE GENRES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.movie_genres (
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, genre_id)
);

CREATE INDEX IF NOT EXISTS idx_movie_genres_genre_id ON public.movie_genres(genre_id);

-- ------------------------------------------------------------------------------
-- 8. SERIES GENRES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.series_genres (
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (series_id, genre_id)
);

CREATE INDEX IF NOT EXISTS idx_series_genres_genre_id ON public.series_genres(genre_id);

-- ------------------------------------------------------------------------------
-- 9. CAST MEMBERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cast_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  profile_url TEXT,
  character_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cast_members_tmdb_id ON public.cast_members(tmdb_id);

-- ------------------------------------------------------------------------------
-- 10. MOVIE CAST
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.movie_cast (
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  cast_member_id UUID NOT NULL REFERENCES public.cast_members(id) ON DELETE CASCADE,
  character TEXT,
  display_order INTEGER DEFAULT 0,
  PRIMARY KEY (movie_id, cast_member_id)
);

CREATE INDEX IF NOT EXISTS idx_movie_cast_movie_id ON public.movie_cast(movie_id);

-- ------------------------------------------------------------------------------
-- 11. SERIES CAST
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.series_cast (
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  cast_member_id UUID NOT NULL REFERENCES public.cast_members(id) ON DELETE CASCADE,
  character TEXT,
  display_order INTEGER DEFAULT 0,
  PRIMARY KEY (series_id, cast_member_id)
);

CREATE INDEX IF NOT EXISTS idx_series_cast_series_id ON public.series_cast(series_id);

-- ------------------------------------------------------------------------------
-- 12. WATCH PROGRESS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.watch_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'episode')),
  content_id UUID NOT NULL,
  position_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_user_progress UNIQUE (user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_progress_user ON public.watch_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_updated ON public.watch_progress(updated_at DESC);

-- ------------------------------------------------------------------------------
-- 13. WATCH HISTORY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.watch_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'episode')),
  content_id UUID NOT NULL,
  watched_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_watched_at ON public.watch_history(watched_at DESC);

-- ------------------------------------------------------------------------------
-- 14. MY LIST
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.my_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series')),
  content_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_user_my_list UNIQUE (user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_my_list_user ON public.my_list(user_id);
CREATE INDEX IF NOT EXISTS idx_my_list_created_at ON public.my_list(created_at DESC);

-- ------------------------------------------------------------------------------
-- 15. RATINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series')),
  content_id UUID NOT NULL,
  rating NUMERIC(3, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 10.0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_user_rating UNIQUE (user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_user ON public.ratings(user_id);

-- ------------------------------------------------------------------------------
-- 16. VIDEO SOURCES (Authorized Streams Only)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.video_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'episode')),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- e.g. 'hls', 'mp4', 'dash'
  url TEXT NOT NULL,
  hls_url TEXT,
  quality TEXT DEFAULT '1080p',
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_video_sources_content ON public.video_sources(content_id, content_type);

-- ------------------------------------------------------------------------------
-- 17. SUBTITLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subtitles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'episode')),
  language TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subtitles_content ON public.subtitles(content_id, content_type);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profile info"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow users to insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Movies RLS (Public read, service-role/admin write)
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to movies"
  ON public.movies FOR SELECT
  USING (true);

-- 3. Series RLS (Public read, service-role write)
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to series"
  ON public.series FOR SELECT
  USING (true);

-- 4. Seasons RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to seasons"
  ON public.seasons FOR SELECT
  USING (true);

-- 5. Episodes RLS
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to episodes"
  ON public.episodes FOR SELECT
  USING (true);

-- 6. Genres RLS
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to genres"
  ON public.genres FOR SELECT
  USING (true);

-- 7. Movie Genres RLS
ALTER TABLE public.movie_genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to movie_genres"
  ON public.movie_genres FOR SELECT
  USING (true);

-- 8. Series Genres RLS
ALTER TABLE public.series_genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to series_genres"
  ON public.series_genres FOR SELECT
  USING (true);

-- 9. Cast Members RLS
ALTER TABLE public.cast_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to cast_members"
  ON public.cast_members FOR SELECT
  USING (true);

-- 10. Movie Cast RLS
ALTER TABLE public.movie_cast ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to movie_cast"
  ON public.movie_cast FOR SELECT
  USING (true);

-- 11. Series Cast RLS
ALTER TABLE public.series_cast ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to series_cast"
  ON public.series_cast FOR SELECT
  USING (true);

-- 12. Video Sources RLS (Active sources read access)
ALTER TABLE public.video_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to active video sources"
  ON public.video_sources FOR SELECT
  USING (is_active = true);

-- 13. Subtitles RLS
ALTER TABLE public.subtitles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to subtitles"
  ON public.subtitles FOR SELECT
  USING (true);

-- 14. Watch Progress RLS (Private per user)
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watch progress"
  ON public.watch_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch progress"
  ON public.watch_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch progress"
  ON public.watch_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watch progress"
  ON public.watch_progress FOR DELETE
  USING (auth.uid() = user_id);

-- 15. Watch History RLS (Private per user)
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watch history"
  ON public.watch_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch history"
  ON public.watch_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watch history"
  ON public.watch_history FOR DELETE
  USING (auth.uid() = user_id);

-- 16. My List RLS (Private per user)
ALTER TABLE public.my_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own list"
  ON public.my_list FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own list"
  ON public.my_list FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own list"
  ON public.my_list FOR DELETE
  USING (auth.uid() = user_id);

-- 17. Ratings RLS (Private per user modifications)
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON public.ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON public.ratings FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS (For multi-tab and live sync)
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.my_list, public.watch_progress;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ==============================================================================
-- SCHEMA & TABLE PRIVILEGES (Standard Supabase Grants)
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
