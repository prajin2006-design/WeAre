/**
 * Video Source and Subtitle Management Service
 * Strictly handles authorized legal streaming sources and WebVTT captions.
 */

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { nexStreamClient } from '@/lib/nexstream/client';
import { vidFastClient } from '@/lib/vidfast/client';

export interface VideoSource {
  id: string;
  content_id: string;
  content_type: 'movie' | 'episode';
  name: string;
  source_type: 'hls' | 'mp4' | 'embed';
  url: string;
  hls_url?: string | null;
  quality: string;
  language: string;
  is_active: boolean;
  priority: number;
  created_at?: string;
  updated_at?: string;
  is_healthy?: boolean;
}

export interface SubtitleTrack {
  id: string;
  content_id: string;
  content_type: 'movie' | 'episode';
  language: string;
  label: string;
  url: string;
  created_at?: string;
}

export const DEFAULT_SUBTITLES: SubtitleTrack[] = [
  {
    id: 'sub-en',
    content_id: 'default',
    content_type: 'movie',
    language: 'en',
    label: 'English',
    url: '/subtitles/sample-en.vtt',
  },
  {
    id: 'sub-es',
    content_id: 'default',
    content_type: 'movie',
    language: 'es',
    label: 'Spanish',
    url: '/subtitles/sample-es.vtt',
  },
];

// In-memory health check cache (TTL 5 minutes)
const healthCache = new Map<string, { healthy: boolean; timestamp: number }>();

export const VideoSourceService = {
  /**
   * Check if a content item has at least one active external streaming source
   */
  async hasPlayableSource(
    contentId: string,
    contentType: 'movie' | 'episode' = 'movie',
    tmdbId?: number
  ): Promise<boolean> {
    const sources = await this.getSourcesForContent(contentId, contentType, tmdbId);
    return sources.some((s) => s.is_active);
  },

  /**
   * Retrieve external streaming providers for a movie or episode.
   * Strict server order:
   * 1. VidFast (EMBED • Auto) - DEFAULT
   * 2. NexStream Fast (EMBED • 1080p)
   */
  async getSourcesForContent(
    contentId: string,
    contentType: 'movie' | 'episode' = 'movie',
    tmdbId?: number,
    seasonNumber: number = 1,
    episodeNumber: number = 1
  ): Promise<VideoSource[]> {
    const sources: VideoSource[] = [];

    const effectiveTmdbId =
      tmdbId ||
      (() => {
        const clean = String(contentId).replace(/^(m-|movie-|s-|tv-|series-|tmdb-|ep-|episode-)/i, "");
        const num = parseInt(clean, 10);
        return !isNaN(num) && num > 0 ? num : undefined;
      })();

    // 1. External Streaming Provider: VidFast (EMBED • Auto) - DEFAULT (Priority 1)
    if (effectiveTmdbId && effectiveTmdbId > 0) {
      const vidFastSource = vidFastClient.getAuthorizedVideoSource(
        contentId,
        contentType,
        effectiveTmdbId,
        seasonNumber,
        episodeNumber
      );
      if (vidFastSource) {
        sources.push({
          ...vidFastSource,
          priority: 1,
        });
      }
    }

    // 2. External Streaming Provider: NexStream Fast (EMBED • 1080p) (Priority 2)
    if (effectiveTmdbId && nexStreamClient.isConfigured()) {
      const nexSource = nexStreamClient.getAuthorizedVideoSource(
        contentId,
        contentType,
        effectiveTmdbId,
        seasonNumber,
        episodeNumber
      );
      if (nexSource) {
        sources.push({
          ...nexSource,
          priority: 2,
        });
      }
    }

    // Ensure strict display order: 1. VidFast (DEFAULT), 2. NexStream Fast
    return sources.sort((a, b) => {
      const isAVid = a.name.toLowerCase().includes("vidfast") || a.id.includes("vidfast");
      const isBVid = b.name.toLowerCase().includes("vidfast") || b.id.includes("vidfast");
      if (isAVid && !isBVid) return -1;
      if (!isAVid && isBVid) return 1;

      const isANex = a.name.toLowerCase().includes("nexstream") || a.id.includes("nexstream");
      const isBNex = b.name.toLowerCase().includes("nexstream") || b.id.includes("nexstream");
      if (isANex && !isBNex) return -1;
      if (!isANex && isBNex) return 1;

      return a.priority - b.priority;
    });
  },

  /**
   * Retrieve all available subtitle tracks for a movie or episode
   */
  async getSubtitlesForContent(contentId: string, contentType: 'movie' | 'episode' = 'movie'): Promise<SubtitleTrack[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('subtitles')
          .select('*')
          .eq('content_id', contentId)
          .eq('content_type', contentType);

        if (!error && data && data.length > 0) {
          return data as SubtitleTrack[];
        }
      } catch (err) {
        console.warn('[VideoSourceService.getSubtitlesForContent] Notice:', err);
      }
    }

    return DEFAULT_SUBTITLES.map((sub) => ({
      ...sub,
      content_id: contentId,
      content_type: contentType,
    }));
  },

  /**
   * Server-side source health check with 5-minute caching
   */
  async checkSourceHealth(url: string): Promise<boolean> {
    const cached = healthCache.get(url);
    const now = Date.now();
    if (cached && now - cached.timestamp < 300000) {
      return cached.healthy;
    }

    try {
      const res = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(4000),
      });
      const healthy = res.ok;
      healthCache.set(url, { healthy, timestamp: now });
      return healthy;
    } catch {
      healthCache.set(url, { healthy: false, timestamp: now });
      return false;
    }
  },

  /**
   * Admin: Add a new authorized video source
   */
  async addSource(source: Omit<VideoSource, 'id' | 'created_at' | 'updated_at'>): Promise<VideoSource> {
    const supabase = createAdminSupabaseClient();
    const payload = {
      content_id: source.content_id,
      content_type: source.content_type,
      name: source.name,
      source_type: source.source_type,
      url: source.url,
      hls_url: source.hls_url || (source.source_type === 'hls' ? source.url : null),
      quality: source.quality || '1080p',
      language: source.language || 'en',
      is_active: source.is_active ?? true,
      priority: source.priority || 1,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('video_sources')
      .insert(payload)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to add video source');
    }

    return data as VideoSource;
  },

  /**
   * Admin: Update an existing video source
   */
  async updateSource(id: string, updates: Partial<VideoSource>): Promise<boolean> {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from('video_sources')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return !error;
  },

  /**
   * Admin: Delete a video source
   */
  async deleteSource(id: string): Promise<boolean> {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from('video_sources').delete().eq('id', id);
    return !error;
  },
};
