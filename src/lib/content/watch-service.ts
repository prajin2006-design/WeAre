import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface WatchProgressRecord {
  id: string;
  user_id: string;
  content_type: 'movie' | 'episode';
  content_id: string; // Valid UUID in PostgreSQL
  position_seconds: number;
  duration_seconds: number;
  updated_at: string;
}

export interface WatchHistoryRecord {
  id: string;
  user_id: string;
  content_type: 'movie' | 'episode';
  content_id: string; // Valid UUID in PostgreSQL
  watched_at: string;
}

export const WatchService = {
  /**
   * Retrieve watch progress for a specific user and content UUID
   */
  async getProgress(
    userId: string,
    contentType: 'movie' | 'episode',
    contentUuid: string
  ): Promise<WatchProgressRecord | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('watch_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('content_type', contentType)
        .eq('content_id', contentUuid)
        .maybeSingle();

      if (error) {
        console.warn('[WatchService.getProgress] Error:', {
          table: 'watch_progress',
          operation: 'select',
          code: error.code,
          message: error.message,
        });
        return null;
      }
      return data as WatchProgressRecord | null;
    } catch (e) {
      console.warn('[WatchService.getProgress] Exception:', e);
      return null;
    }
  },

  /**
   * Upsert watch progress with multi-tab conflict safety
   */
  async saveProgress(
    userId: string,
    contentType: 'movie' | 'episode',
    contentUuid: string,
    positionSeconds: number,
    durationSeconds: number
  ): Promise<void> {
    if (!isSupabaseConfigured() || !userId) return;
    if (durationSeconds <= 0) return;

    try {
      const supabase = createClient();
      const currentTimestamp = new Date().toISOString();

      // Multi-tab safety: Check if existing record has a newer updated_at timestamp
      const { data: existing } = await supabase
        .from('watch_progress')
        .select('updated_at, position_seconds')
        .eq('user_id', userId)
        .eq('content_type', contentType)
        .eq('content_id', contentUuid)
        .maybeSingle();

      if (existing?.updated_at) {
        const existingTime = new Date(existing.updated_at).getTime();
        const nowTime = new Date(currentTimestamp).getTime();
        // If an older browser tab tries to overwrite a newer progress from the future/another tab
        if (existingTime > nowTime) {
          return;
        }
      }

      const { error } = await supabase.from('watch_progress').upsert(
        {
          user_id: userId,
          content_type: contentType,
          content_id: contentUuid,
          position_seconds: Math.floor(positionSeconds),
          duration_seconds: Math.floor(durationSeconds),
          updated_at: currentTimestamp,
        },
        { onConflict: 'user_id,content_type,content_id' }
      );

      if (error) {
        console.error('[WatchService.saveProgress] Error:', {
          table: 'watch_progress',
          operation: 'upsert',
          code: error.code,
          message: error.message,
        });
      }
    } catch (e) {
      console.error('[WatchService.saveProgress] Exception:', e);
    }
  },

  /**
   * Remove a progress record (e.g. user dismisses from Continue Watching)
   */
  async removeProgress(userId: string, contentUuid: string): Promise<void> {
    if (!isSupabaseConfigured() || !userId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('watch_progress')
        .delete()
        .eq('user_id', userId)
        .eq('content_id', contentUuid);

      if (error) {
        console.error('[WatchService.removeProgress] Error:', {
          table: 'watch_progress',
          operation: 'delete',
          code: error.code,
          message: error.message,
        });
      }
    } catch (e) {
      console.error('[WatchService.removeProgress] Exception:', e);
    }
  },

  /**
   * Retrieve unfinished items for Continue Watching
   */
  async getUserContinueWatching(userId: string): Promise<WatchProgressRecord[]> {
    if (!isSupabaseConfigured() || !userId) return [];

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('watch_progress')
        .select('*')
        .eq('user_id', userId)
        .gt('position_seconds', 10)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[WatchService.getUserContinueWatching] Error:', {
          table: 'watch_progress',
          operation: 'select',
          code: error.code,
          message: error.message,
        });
        return [];
      }

      // Filter to only unfinished items (< 90% completed)
      const unfinished = (data || []).filter((r) => {
        const dur = r.duration_seconds || 1;
        const pct = (r.position_seconds / dur) * 100;
        return pct < 90;
      });

      return (unfinished as WatchProgressRecord[]) || [];
    } catch (e) {
      console.error('[WatchService.getUserContinueWatching] Exception:', e);
      return [];
    }
  },

  /**
   * Record watch history without creating uncontrolled duplicate rows.
   * If the user re-watches a movie/episode, updates its watched_at timestamp.
   */
  async recordWatchHistory(
    userId: string,
    contentType: 'movie' | 'episode',
    contentUuid: string
  ): Promise<void> {
    if (!isSupabaseConfigured() || !userId) return;

    try {
      const supabase = createClient();
      const currentTimestamp = new Date().toISOString();

      // Check if existing watch history record exists for this item
      const { data: existing, error: checkError } = await supabase
        .from('watch_history')
        .select('id')
        .eq('user_id', userId)
        .eq('content_type', contentType)
        .eq('content_id', contentUuid)
        .maybeSingle();

      if (checkError) {
        console.warn('[WatchService.recordWatchHistory] Check warning:', checkError.message);
      }

      if (existing?.id) {
        // Update existing record's timestamp to now
        const { error: updateError } = await supabase
          .from('watch_history')
          .update({ watched_at: currentTimestamp })
          .eq('id', existing.id);

        if (updateError) {
          console.error('[WatchService.recordWatchHistory] Update error:', {
            table: 'watch_history',
            operation: 'update',
            code: updateError.code,
            message: updateError.message,
          });
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase.from('watch_history').insert({
          user_id: userId,
          content_type: contentType,
          content_id: contentUuid,
          watched_at: currentTimestamp,
        });

        if (insertError) {
          console.error('[WatchService.recordWatchHistory] Insert error:', {
            table: 'watch_history',
            operation: 'insert',
            code: insertError.code,
            message: insertError.message,
          });
        }
      }
    } catch (e) {
      console.error('[WatchService.recordWatchHistory] Exception:', e);
    }
  },

  /**
   * Get newest watched history for the authenticated user
   */
  async getWatchHistory(userId: string, limit: number = 50): Promise<WatchHistoryRecord[]> {
    if (!isSupabaseConfigured() || !userId) return [];

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', userId)
        .order('watched_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[WatchService.getWatchHistory] Error:', {
          table: 'watch_history',
          operation: 'select',
          code: error.code,
          message: error.message,
        });
        return [];
      }
      return (data as WatchHistoryRecord[]) || [];
    } catch (e) {
      console.error('[WatchService.getWatchHistory] Exception:', e);
      return [];
    }
  },

  /**
   * Remove an item from watch history
   */
  async removeFromWatchHistory(userId: string, historyIdOrContentUuid: string): Promise<void> {
    if (!isSupabaseConfigured() || !userId) return;

    try {
      const supabase = createClient();
      // Try deleting by record id first; if not matching, delete by content_id
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', userId)
        .or(`id.eq.${historyIdOrContentUuid},content_id.eq.${historyIdOrContentUuid}`);

      if (error) {
        console.error('[WatchService.removeFromWatchHistory] Error:', {
          table: 'watch_history',
          operation: 'delete',
          code: error.code,
          message: error.message,
        });
      }
    } catch (e) {
      console.error('[WatchService.removeFromWatchHistory] Exception:', e);
    }
  },
};
