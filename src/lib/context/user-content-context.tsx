"use client";

import React, { createContext, useContext, useEffect, useState, useTransition, useCallback } from "react";
import { ContentItem, WatchProgress, WatchHistoryItem, MyListItem, isMovie, Episode } from "@/types/content";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import { ListService } from "@/lib/content/list-service";
import { WatchService, WatchProgressRecord, WatchHistoryRecord } from "@/lib/content/watch-service";
import { UserService, UserProfileData } from "@/lib/content/user-service";
import { toContentUuid, decodeContentUuid } from "@/lib/content/content-id-encoder";

interface UserContentContextType {
  myList: MyListItem[];
  watchProgress: WatchProgress[];
  continueWatching: WatchProgress[];
  watchHistory: WatchHistoryItem[];
  isInList: (contentId: string) => boolean;
  toggleMyList: (content: ContentItem) => Promise<boolean>;
  saveProgress: (
    content: ContentItem,
    currentPosition: number,
    duration: number,
    episode?: Episode
  ) => Promise<void>;
  recordWatchHistory: (
    content: ContentItem,
    episode?: Episode
  ) => Promise<void>;
  getProgress: (contentId: string, episodeId?: string) => WatchProgress | undefined;
  removeFromWatchProgress: (contentId: string, episodeId?: string) => Promise<void>;
  removeFromWatchHistory: (historyId: string) => Promise<void>;
  userId: string | null;
  userEmail: string | null;
  userRole: 'user' | 'admin' | null;
  isAdmin: boolean;
  userProfile: UserProfileData | null;
  refreshUserData: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContentContext = createContext<UserContentContextType | undefined>(undefined);

const MY_LIST_STORAGE_KEY = "weare_user_mylist_v1";
const PROGRESS_STORAGE_KEY = "weare_user_progress_v1";
const HISTORY_STORAGE_KEY = "weare_user_history_v1";

// Helper to enrich a raw DB watch_progress record with TMDB metadata
async function enrichProgressWithMetadata(
  p: WatchProgressRecord
): Promise<WatchProgress> {
  const duration = p.duration_seconds || 1;
  const percentage = Math.min(100, Math.round((p.position_seconds / duration) * 100));

  const decoded = decodeContentUuid(p.content_id);

  let title = "Stream Content";
  let poster_url = "";
  let backdrop_url = "";
  let episode_title: string | undefined;
  let season_number: number | undefined;
  let episode_number: number | undefined;
  let episode_id: string | undefined;
  let canonicalContentId = p.content_id;

  if (decoded.type === "movie") {
    canonicalContentId = String(decoded.tmdbId);
    try {
      const res = await fetch(`/api/catalog/item?id=${encodeURIComponent(canonicalContentId)}&type=movie`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          title = data.title || title;
          poster_url = data.poster_url || poster_url;
          backdrop_url = data.backdrop_url || backdrop_url;
        }
      }
    } catch {
      // Non-blocking fallback
    }
  } else if (decoded.type === "episode") {
    canonicalContentId = String(decoded.tmdbId);
    season_number = decoded.seasonNumber;
    episode_number = decoded.episodeNumber;
    episode_id = decoded.episodeParam;
    try {
      const res = await fetch(
        `/api/catalog/item?id=${encodeURIComponent(canonicalContentId)}&type=tv&season=${season_number}&episode=${episode_number}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data) {
          title = data.title || title;
          poster_url = data.poster_url || poster_url;
          backdrop_url = data.backdrop_url || backdrop_url;
          if (data.episode_title) episode_title = data.episode_title;
        }
      }
    } catch {
      // Non-blocking fallback
    }
  } else {
    // Legacy seeded UUID
    try {
      const res = await fetch(`/api/catalog/item?id=${encodeURIComponent(p.content_id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          title = data.title || title;
          poster_url = data.poster_url || poster_url;
          backdrop_url = data.backdrop_url || backdrop_url;
          if (data.episode_title) episode_title = data.episode_title;
          if (data.season_number) season_number = data.season_number;
          if (data.episode_number) episode_number = data.episode_number;
          if (data.episode_id) episode_id = data.episode_id;
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }

  return {
    id: p.id,
    user_id: p.user_id,
    content_id: canonicalContentId,
    content_type: p.content_type,
    current_position: p.position_seconds,
    duration: p.duration_seconds,
    percentage,
    title,
    poster_url,
    backdrop_url,
    episode_id,
    episode_title,
    season_number,
    episode_number,
    updated_at: p.updated_at,
  };
}

// Helper to enrich a raw DB watch_history record with TMDB metadata
async function enrichHistoryWithMetadata(
  h: WatchHistoryRecord
): Promise<WatchHistoryItem> {
  const decoded = decodeContentUuid(h.content_id);

  let title = "Stream Content";
  let poster_url = "";
  let backdrop_url = "";
  let episode_title: string | undefined;
  let season_number: number | undefined;
  let episode_number: number | undefined;
  let episode_id: string | undefined;
  let canonicalContentId = h.content_id;

  if (decoded.type === "movie") {
    canonicalContentId = String(decoded.tmdbId);
    try {
      const res = await fetch(`/api/catalog/item?id=${encodeURIComponent(canonicalContentId)}&type=movie`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          title = data.title || title;
          poster_url = data.poster_url || poster_url;
          backdrop_url = data.backdrop_url || backdrop_url;
        }
      }
    } catch {
      // Non-blocking fallback
    }
  } else if (decoded.type === "episode") {
    canonicalContentId = String(decoded.tmdbId);
    season_number = decoded.seasonNumber;
    episode_number = decoded.episodeNumber;
    episode_id = decoded.episodeParam;
    try {
      const res = await fetch(
        `/api/catalog/item?id=${encodeURIComponent(canonicalContentId)}&type=tv&season=${season_number}&episode=${episode_number}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data) {
          title = data.title || title;
          poster_url = data.poster_url || poster_url;
          backdrop_url = data.backdrop_url || backdrop_url;
          if (data.episode_title) episode_title = data.episode_title;
        }
      }
    } catch {
      // Non-blocking fallback
    }
  } else {
    try {
      const res = await fetch(`/api/catalog/item?id=${encodeURIComponent(h.content_id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          title = data.title || title;
          poster_url = data.poster_url || poster_url;
          backdrop_url = data.backdrop_url || backdrop_url;
          if (data.episode_title) episode_title = data.episode_title;
          if (data.season_number) season_number = data.season_number;
          if (data.episode_number) episode_number = data.episode_number;
          if (data.episode_id) episode_id = data.episode_id;
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }

  return {
    id: h.id,
    user_id: h.user_id,
    content_id: canonicalContentId,
    content_type: h.content_type,
    title,
    poster_url,
    backdrop_url,
    episode_id,
    episode_title,
    season_number,
    episode_number,
    watched_at: h.watched_at,
  };
}

export function UserContentProvider({ children }: { children: React.ReactNode }) {
  const [myList, setMyList] = useState<MyListItem[]>([]);
  const [watchProgress, setWatchProgress] = useState<WatchProgress[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [, startTransition] = useTransition();

  // Clear unauthenticated / stale data and initialize user data on auth check
  const loadUserDatabaseContent = useCallback(async (currentUserId: string) => {
    if (!currentUserId) {
      setMyList([]);
      setWatchProgress([]);
      setWatchHistory([]);
      setUserProfile(null);
      return;
    }

    try {
      const [dbList, dbProgress, dbHistory, existingProfile] = await Promise.all([
        ListService.getUserList(currentUserId),
        WatchService.getUserContinueWatching(currentUserId),
        WatchService.getWatchHistory(currentUserId),
        UserService.getProfile(currentUserId),
      ]);

      // Profile: ensure record exists idempotently
      if (existingProfile) {
        setUserProfile(existingProfile);
      } else {
        try {
          const supabase = createClient();
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            const displayName =
              authData.user.user_metadata?.full_name ||
              authData.user.user_metadata?.display_name ||
              authData.user.email?.split("@")[0] ||
              "WeAre Member";
            await UserService.updateProfile(currentUserId, {
              display_name: displayName,
              avatar_url: "",
            });
            const createdProfile = await UserService.getProfile(currentUserId);
            if (createdProfile) {
              setUserProfile(createdProfile);
            }
          }
        } catch {
          // non-blocking
        }
      }

      // My List: map only current user's DB records, or empty array
      let mappedList: MyListItem[] = [];
      if (dbList && dbList.length > 0) {
        mappedList = await Promise.all(
          dbList.map(async (item) => {
            const decoded = decodeContentUuid(item.content_id);
            const canonicalId =
              decoded.type === "movie" || decoded.type === "episode"
                ? String(decoded.tmdbId)
                : item.content_id;

            let foundContent: ContentItem | null = null;
            try {
              const res = await fetch(`/api/catalog/item?id=${encodeURIComponent(canonicalId)}&type=${item.content_type}`);
              if (res.ok) {
                foundContent = await res.json();
              }
            } catch {
              // Fallback below
            }
            const fallbackContent: ContentItem = {
              id: canonicalId,
              title: "Saved Stream",
              description: "Saved to your list.",
              release_year: 2025,
              duration: "2h 00m",
              duration_seconds: 7200,
              age_rating: "PG-13",
              rating: 8.0,
              genres: ["Action"],
              poster_url: "https://picsum.photos/seed/saved-title/600/900",
              backdrop_url: "https://picsum.photos/seed/saved-title-bg/1920/1080",
              video_url: "",
              language: "English",
              cast: ["WeAre Cast"],
              director: "Director",
              is_featured: false,
              is_published: true,
              is_original: true,
              created_at: item.created_at,
            };

            return {
              id: item.id,
              user_id: item.user_id,
              content_id: canonicalId,
              content_type: item.content_type,
              added_at: item.created_at,
              content: foundContent || fallbackContent,
            };
          })
        );
      }
      startTransition(() => {
        setMyList(mappedList);
      });

      // Watch Progress: map only current user's records, or empty array
      let mappedProgress: WatchProgress[] = [];
      if (dbProgress && dbProgress.length > 0) {
        mappedProgress = await Promise.all(
          dbProgress.map((p) => enrichProgressWithMetadata(p))
        );
      }
      startTransition(() => {
        setWatchProgress(mappedProgress);
      });

      // Watch History: map only current user's records, or empty array
      let mappedHistory: WatchHistoryItem[] = [];
      if (dbHistory && dbHistory.length > 0) {
        mappedHistory = await Promise.all(
          dbHistory.map((h) => enrichHistoryWithMetadata(h))
        );
      }
      startTransition(() => {
        setWatchHistory(mappedHistory);
      });
    } catch (err) {
      console.warn("[UserContentProvider] Database sync notice:", err);
    }
  }, []);

  // Check Supabase session & listen to auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    try {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUserId(data.user.id);
          setUserEmail(data.user.email ?? null);
          const role = data.user.app_metadata?.role === "admin" ? "admin" : "user";
          setUserRole(role);
          setIsAdmin(role === "admin");
          loadUserDatabaseContent(data.user.id);
        } else {
          setUserId(null);
          setUserEmail(null);
          setUserRole(null);
          setIsAdmin(false);
          setUserProfile(null);
          setMyList([]);
          setWatchProgress([]);
          setWatchHistory([]);
        }
      });

      const {
        data: { subscription: authSub },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_OUT" || !session?.user) {
          setUserId(null);
          setUserEmail(null);
          setUserRole(null);
          setIsAdmin(false);
          setUserProfile(null);
          setMyList([]);
          setWatchProgress([]);
          setWatchHistory([]);
          try {
            localStorage.removeItem(PROGRESS_STORAGE_KEY);
            localStorage.removeItem(HISTORY_STORAGE_KEY);
            localStorage.removeItem(MY_LIST_STORAGE_KEY);
          } catch {
            // ignore
          }
        } else if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(session.user.email ?? null);
          const role = session.user.app_metadata?.role === "admin" ? "admin" : "user";
          setUserRole(role);
          setIsAdmin(role === "admin");
          await loadUserDatabaseContent(session.user.id);
        }
      });

      return () => {
        authSub.unsubscribe();
      };
    } catch (err) {
      console.warn("[UserContentProvider] Supabase setup notice:", err);
    }
  }, [loadUserDatabaseContent]);


  // Real-time synchronization on my_list, watch_progress, and watch_history
  useEffect(() => {
    if (!isSupabaseConfigured() || !userId) return;

    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`user-realtime-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "my_list",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            loadUserDatabaseContent(userId);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "watch_progress",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            loadUserDatabaseContent(userId);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "watch_history",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            loadUserDatabaseContent(userId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn("[UserContentProvider] Realtime subscription notice:", err);
    }
  }, [userId, loadUserDatabaseContent]);

  const syncProgressStorage = (items: WatchProgress[]) => {

    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const syncHistoryStorage = (items: WatchHistoryItem[]) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const isInList = (contentId: string): boolean => {
    const cleanId = String(contentId).trim();
    return myList.some(
      (item) => String(item.content_id).trim() === cleanId || String(item.content.id).trim() === cleanId
    );
  };

  const toggleMyList = async (content: ContentItem): Promise<boolean> => {
    const cleanId = String(content.id).trim();
    const existingIndex = myList.findIndex(
      (item) => String(item.content_id).trim() === cleanId || String(item.content.id).trim() === cleanId
    );
    let updated: MyListItem[];
    let isAdded = false;

    if (existingIndex > -1) {
      updated = myList.filter(
        (item) => String(item.content_id).trim() !== cleanId && String(item.content.id).trim() !== cleanId
      );
      isAdded = false;
      if (userId) {
        await ListService.removeFromList(userId, cleanId);
      }

    } else {
      const newItem: MyListItem = {
        id: `ml-${Date.now()}`,
        user_id: userId || "local-user",
        content_id: cleanId,
        content_type: isMovie(content) ? "movie" : "series",
        added_at: new Date().toISOString(),
        content,
      };
      updated = [newItem, ...myList];
      isAdded = true;
      if (userId) {
        await ListService.addToList(userId, isMovie(content) ? "movie" : "series", cleanId);
      }
    }

    startTransition(() => {
      setMyList(updated);
    });

    return isAdded;
  };

  /**
   * Save watch progress (throttled, multi-tab safe)
   */
  const saveProgress = async (
    content: ContentItem,
    currentPosition: number,
    duration: number,
    episode?: Episode
  ): Promise<void> => {
    if (!duration || duration <= 0) return;
    const percentage = Math.min(100, Math.round((currentPosition / duration) * 100));

    const contentType: 'movie' | 'episode' = episode || !isMovie(content) ? 'episode' : 'movie';
    const effectiveContentId = content.tmdb_id ? String(content.tmdb_id) : content.id;
    const episodeId = episode ? `s${episode.season_number}-e${episode.episode_number}` : undefined;

    // Deterministic UUID for database storage
    const contentUuid = toContentUuid(
      contentType,
      effectiveContentId,
      episode?.season_number,
      episode?.episode_number
    );

    const progressId = episode ? `wp-${effectiveContentId}-${episodeId}` : `wp-${effectiveContentId}`;

    const newProgress: WatchProgress = {
      id: progressId,
      user_id: userId || "local-user",
      content_id: effectiveContentId,
      content_type: contentType,
      episode_id: episodeId,
      current_position: Math.floor(currentPosition),
      duration: Math.floor(duration),
      percentage,
      title: content.title,
      poster_url: content.poster_url,
      backdrop_url: episode?.thumbnail_url || content.backdrop_url,
      episode_title: episode?.title,
      season_number: episode?.season_number,
      episode_number: episode?.episode_number,
      updated_at: new Date().toISOString(),
    };

    setWatchProgress((prev) => {
      const filtered = prev.filter(
        (p) => !(p.content_id === effectiveContentId && p.episode_id === episodeId)
      );
      const updated = [newProgress, ...filtered];
      syncProgressStorage(updated);
      return updated;
    });

    // Save to Supabase only for authenticated users
    if (userId) {
      await WatchService.saveProgress(
        userId,
        contentType,
        contentUuid,
        currentPosition,
        duration
      );
    }
  };

  /**
   * Record watch history (deduplicated, updates timestamp on revisit)
   */
  const recordWatchHistory = async (
    content: ContentItem,
    episode?: Episode
  ): Promise<void> => {
    const contentType: 'movie' | 'episode' = episode || !isMovie(content) ? 'episode' : 'movie';
    const effectiveContentId = content.tmdb_id ? String(content.tmdb_id) : content.id;
    const episodeId = episode ? `s${episode.season_number}-e${episode.episode_number}` : undefined;

    const contentUuid = toContentUuid(
      contentType,
      effectiveContentId,
      episode?.season_number,
      episode?.episode_number
    );

    const newHistoryItem: WatchHistoryItem = {
      id: `wh-${contentUuid}`,
      user_id: userId || "local-user",
      content_id: effectiveContentId,
      content_type: contentType,
      title: content.title,
      poster_url: content.poster_url,
      backdrop_url: episode?.thumbnail_url || content.backdrop_url,
      episode_id: episodeId,
      episode_title: episode?.title,
      season_number: episode?.season_number,
      episode_number: episode?.episode_number,
      watched_at: new Date().toISOString(),
    };

    setWatchHistory((prev) => {
      const filtered = prev.filter(
        (h) => !(h.content_id === effectiveContentId && h.episode_id === episodeId)
      );
      const updated = [newHistoryItem, ...filtered];
      syncHistoryStorage(updated);
      return updated;
    });

    if (userId) {
      await WatchService.recordWatchHistory(userId, contentType, contentUuid);
    }
  };

  const getProgress = (contentId: string, episodeId?: string): WatchProgress | undefined => {
    const cleanContentId = String(contentId).replace(/^(s-|tv-|series-|m-|movie-|tmdb-)/i, "");
    let normalizedEpId = episodeId;
    if (episodeId) {
      const m = episodeId.match(/s(\d+)[^0-9a-z]*e(\d+)/i);
      if (m) normalizedEpId = `s${m[1]}-e${m[2]}`;
    }
    return watchProgress.find((p) => {
      const cleanPContentId = String(p.content_id).replace(/^(s-|tv-|series-|m-|movie-|tmdb-)/i, "");
      const contentMatches = cleanPContentId === cleanContentId || p.content_id === contentId;
      if (!contentMatches) return false;
      if (!episodeId) return true;
      return p.episode_id === normalizedEpId || p.episode_id === episodeId;
    });
  };

  const removeFromWatchProgress = async (contentId: string, episodeId?: string) => {
    setWatchProgress((prev) => {
      const updated = prev.filter(
        (p) => !(p.content_id === contentId && (!episodeId || p.episode_id === episodeId))
      );
      syncProgressStorage(updated);
      return updated;
    });

    if (userId) {
      let seasonNum: number | undefined;
      let episodeNum: number | undefined;
      if (episodeId) {
        const m = episodeId.match(/s(\d+)[^0-9a-z]*e(\d+)/i);
        if (m) {
          seasonNum = parseInt(m[1], 10);
          episodeNum = parseInt(m[2], 10);
        }
      }
      const contentUuid = toContentUuid(
        episodeId ? 'episode' : 'movie',
        contentId,
        seasonNum,
        episodeNum
      );
      await WatchService.removeProgress(userId, contentUuid);
    }
  };

  const removeFromWatchHistory = async (historyId: string) => {
    setWatchHistory((prev) => {
      const updated = prev.filter((h) => h.id !== historyId);
      syncHistoryStorage(updated);
      return updated;
    });

    if (userId) {
      await WatchService.removeFromWatchHistory(userId, historyId);
    }
  };

  const refreshUserData = async () => {
    if (userId) {
      await loadUserDatabaseContent(userId);
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Sign out notice:", e);
      }
    }
    setUserId(null);
    setUserEmail(null);
    setUserRole(null);
    setIsAdmin(false);
    setUserProfile(null);
    setWatchProgress([]);
    setWatchHistory([]);
    setMyList([]);
    try {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      localStorage.removeItem(MY_LIST_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Only unfinished content (percentage > 0 and < 90), ordered newest first
  const continueWatching = watchProgress
    .filter((p) => p.percentage > 0 && p.percentage < 90)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <UserContentContext.Provider
      value={{
        myList,
        watchProgress,
        continueWatching,
        watchHistory,
        isInList,
        toggleMyList,
        saveProgress,
        recordWatchHistory,
        getProgress,
        removeFromWatchProgress,
        removeFromWatchHistory,
        userId,
        userEmail,
        userRole,
        isAdmin,
        userProfile,
        refreshUserData,
        signOut,
      }}
    >
      {children}
    </UserContentContext.Provider>
  );

}

export function useUserContent() {
  const context = useContext(UserContentContext);
  if (context === undefined) {
    throw new Error("useUserContent must be used within a UserContentProvider");
  }
  return context;
}
