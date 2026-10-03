import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface UserProfileData {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export const UserService = {
  async getProfile(userId: string): Promise<UserProfileData | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[UserService.getProfile] Error:', error.message);
        return null;
      }
      return data as UserProfileData | null;
    } catch (e) {
      console.warn('[UserService.getProfile] Exception:', e);
      return null;
    }
  },

  async updateProfile(
    userId: string,
    updates: { display_name?: string; avatar_url?: string }
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !userId) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: userId,
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  },
};
