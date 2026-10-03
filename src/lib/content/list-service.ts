import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ContentType } from '@/types/content';
import { toContentUuid } from '@/lib/content/content-id-encoder';

export interface MyListRecord {
  id: string;
  user_id: string;
  content_type: ContentType;
  content_id: string;
  created_at: string;
}

export const ListService = {
  async getUserList(userId: string): Promise<MyListRecord[]> {
    if (!isSupabaseConfigured() || !userId) return [];

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('my_list')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[ListService.getUserList] Error:', error.message);
        return [];
      }
      return (data as MyListRecord[]) || [];
    } catch (e) {
      console.warn('[ListService.getUserList] Exception:', e);
      return [];
    }
  },

  async addToList(
    userId: string,
    contentType: ContentType,
    contentId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !userId) {
      return { success: false, error: 'Database not configured or user not authenticated' };
    }

    try {
      const supabase = createClient();
      const uuid = toContentUuid(contentType === 'movie' ? 'movie' : 'series', contentId);
      const { error } = await supabase.from('my_list').upsert(
        {
          user_id: userId,
          content_type: contentType,
          content_id: uuid,
        },
        { onConflict: 'user_id,content_type,content_id' }
      );

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  },

  async removeFromList(
    userId: string,
    contentId: string
  ): Promise<{ success: boolean; error?: string }> {


    if (!isSupabaseConfigured() || !userId) {
      return { success: false, error: 'Database not configured or user not authenticated' };
    }

    try {
      const supabase = createClient();
      const uuidMovie = toContentUuid('movie', contentId);
      const uuidSeries = toContentUuid('series', contentId);

      const { error } = await supabase
        .from('my_list')
        .delete()
        .eq('user_id', userId)
        .in('content_id', [contentId, uuidMovie, uuidSeries]);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  },

  async isInList(userId: string, contentId: string, contentType: ContentType = 'movie'): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId) return false;

    try {
      const supabase = createClient();
      const uuid = toContentUuid(contentType === 'movie' ? 'movie' : 'series', contentId);
      const { data } = await supabase
        .from('my_list')
        .select('id')
        .eq('user_id', userId)
        .in('content_id', [contentId, uuid])
        .maybeSingle();

      return Boolean(data);
    } catch {
      return false;
    }
  },
};

