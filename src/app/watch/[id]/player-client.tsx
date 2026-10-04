"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import NexStreamEmbedPlayer from "@/components/player/NexStreamEmbedPlayer";
import ContentRow from "@/components/movies/ContentRow";
import { useUserContent } from "@/lib/context/user-content-context";
import { useToast } from "@/components/ui/Toast";
import { ContentItem, Episode, isMovie, VideoSource, SubtitleTrack } from "@/types/content";
import {
  Plus,
  Check,
  Share2,
  AlertCircle,
  SkipForward,
  SkipBack,
  ArrowLeft,
  Star,
  Clock,
  Calendar,
  Sparkles,
  Server,
  Play,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Loader2,
} from "lucide-react";

interface WatchPlayerClientProps {
  content: ContentItem;
  videoSrc?: string;
  sourceType?: "hls" | "mp4" | "embed";
  sources?: VideoSource[];
  subtitles?: SubtitleTrack[];
  title: string;
  subtitle?: string;
  episode?: Episode;
  prevEpisodeUrl?: string;
  nextEpisodeUrl?: string;
  recommended?: ContentItem[];
  initialSeasonEpisodes?: Episode[];
}

export default function WatchPlayerClient({
  content,
  sources = [],
  title,
  subtitle,
  episode,
  recommended = [],
  initialSeasonEpisodes = [],
}: WatchPlayerClientProps) {
  const { getProgress, saveProgress, recordWatchHistory, isInList, toggleMyList } = useUserContent();
  const { showToast } = useToast();

  const [copied, setCopied] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  const isTV = !isMovie(content);

  const effectiveTmdbId = content.tmdb_id || (() => {
    const clean = String(content.id).replace(/^(m-|movie-|s-|tv-|series-|tmdb-)/i, "");
    const num = parseInt(clean, 10);
    return !isNaN(num) && num > 0 ? num : undefined;
  })();

  const [currentEpisode, setCurrentEpisode] = useState<Episode | undefined>(episode);
  const [currentSubtitle, setCurrentSubtitle] = useState<string | undefined>(subtitle);

  // Dynamic available seasons list from TV series catalog
  const availableSeasons = useMemo(() => {
    if (!isTV) return [];
    const seasonsMap = new Map<number, { season_number: number; title: string }>();

    if ("seasons" in content && Array.isArray(content.seasons)) {
      for (const sn of content.seasons) {
        if (sn.season_number > 0) {
          seasonsMap.set(sn.season_number, {
            season_number: sn.season_number,
            title: sn.title || `Season ${sn.season_number}`,
          });
        }
      }
    }

    const total = ("total_seasons" in content && typeof content.total_seasons === "number")
      ? content.total_seasons
      : seasonsMap.size || 1;

    for (let i = 1; i <= total; i++) {
      if (!seasonsMap.has(i)) {
        seasonsMap.set(i, {
          season_number: i,
          title: `Season ${i}`,
        });
      }
    }

    return Array.from(seasonsMap.values()).sort((a, b) => a.season_number - b.season_number);
  }, [content, isTV]);

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    episode?.season_number || 1
  );

  const [currentEpisodesList, setCurrentEpisodesList] = useState<Episode[]>(
    initialSeasonEpisodes && initialSeasonEpisodes.length > 0
      ? initialSeasonEpisodes
      : episode
      ? [episode]
      : []
  );

  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);
  const [episodesError, setEpisodesError] = useState<string | null>(null);

  // In-memory cache for season episodes to prevent unnecessary TMDB refetches
  const seasonCacheRef = useRef<Map<number, Episode[]>>(new Map());

  useEffect(() => {
    if (episode && initialSeasonEpisodes && initialSeasonEpisodes.length > 0) {
      seasonCacheRef.current.set(episode.season_number, initialSeasonEpisodes);
    }
  }, [episode, initialSeasonEpisodes]);

  // Video sources state (regenerates dynamically on episode switch)
  const [currentSources, setCurrentSources] = useState<VideoSource[]>(sources);

  // Sort sources strictly: 1. VidFast (DEFAULT), 2. NexStream Fast, then any others
  const orderedSources = useMemo(() => {
    if (!currentSources || currentSources.length === 0) return [];
    return [...currentSources].sort((a, b) => {
      const aIsVid = a.name.toLowerCase().includes("vidfast") || a.id.includes("vidfast");
      const bIsVid = b.name.toLowerCase().includes("vidfast") || b.id.includes("vidfast");
      if (aIsVid && !bIsVid) return -1;
      if (!aIsVid && bIsVid) return 1;

      const aIsNex = a.name.toLowerCase().includes("nexstream") || a.id.includes("nexstream");
      const bIsNex = b.name.toLowerCase().includes("nexstream") || b.id.includes("nexstream");
      if (aIsNex && !bIsNex) return -1;
      if (!aIsNex && bIsNex) return 1;

      return (a.priority || 0) - (b.priority || 0);
    });
  }, [currentSources]);

  // Always default to VidFast
  const vidFastSource = orderedSources.find(
    (s) => s.name.toLowerCase().includes("vidfast") || s.id.includes("vidfast")
  );
  const defaultSource = vidFastSource || (orderedSources.length > 0 ? orderedSources[0] : null);

  const [activeSource, setActiveSource] = useState<VideoSource | null>(defaultSource);
  const [currentPlaybackPos, setCurrentPlaybackPos] = useState<number>(0);

  // Track media identity to reset back to VidFast default when opening a NEW title
  // while preserving user selection (e.g. manual NexStream switch) during the current session
  const mediaKey = `${content.id}:${currentEpisode?.id || "movie"}`;
  const [prevMediaKey, setPrevMediaKey] = useState(mediaKey);

  if (prevMediaKey !== mediaKey) {
    setPrevMediaKey(mediaKey);
  } else if (!activeSource && defaultSource) {
    setActiveSource(defaultSource);
  } else if (activeSource && !orderedSources.some((s) => s.id === activeSource.id)) {
    setActiveSource(defaultSource);
  }

  const hasPlayableSource = orderedSources.length > 0;

  // Saved watch progress for Resume Playback feature (episode-specific)
  const saved = getProgress(content.id, currentEpisode?.id);
  const savedPosition = saved?.current_position || 0;

  // Resume prompt state: show if saved position > 15 seconds
  const [showResumeBanner, setShowResumeBanner] = useState<boolean>(savedPosition > 15);

  const inList = isInList(content.id);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Safe source switching preserving playback position
  const handleSelectSource = (newSource: VideoSource) => {
    if (activeSource && newSource.id === activeSource.id) return;
    setActiveSource(newSource);
    showToast(`Switched to server: ${newSource.name}`, "info");
  };

  const alternativeSource = orderedSources.find((s) => s.id !== activeSource?.id);
  const handleTryAlternative = alternativeSource
    ? () => handleSelectSource(alternativeSource)
    : undefined;

  // Watch progress estimation via time-on-page tracking
  // Cross-origin embeds (VidFast, NexStream) cannot expose playback events, so we
  // estimate position using wall-clock time the user spends on this watch page.
  const lastSaveRef = useRef<number>(0);
  const watchStartRef = useRef<number>(0);
  const contentDuration = isMovie(content)
    ? (content.duration_seconds || 7200)
    : (currentEpisode?.duration_seconds || 3600);

  // Core episode switching function
  const handleSwitchEpisode = useCallback((newEp: Episode) => {
    setCurrentEpisode(newEp);
    setSelectedSeasonNumber(newEp.season_number);
    setCurrentSubtitle(`Season ${newEp.season_number} • Episode ${newEp.episode_number}: ${newEp.title}`);
    setEpisodesError(null);

    // Generate new sources for new episode
    const newSources: VideoSource[] = [];
    if (effectiveTmdbId && effectiveTmdbId > 0) {
      // 1. VidFast (DEFAULT)
      newSources.push({
        id: `src-vidfast-${content.id}-s${newEp.season_number}-e${newEp.episode_number}`,
        content_id: newEp.id,
        content_type: "episode",
        name: "VidFast",
        source_type: "embed",
        url: `https://vidfast.vc/tv/${effectiveTmdbId}/${newEp.season_number}/${newEp.episode_number}?autoPlay=true`,
        quality: "Auto",
        language: "en",
        is_active: true,
        priority: 1,
        is_healthy: true,
      });

      // 2. NexStream Fast
      newSources.push({
        id: `src-nexstream-${content.id}-s${newEp.season_number}-e${newEp.episode_number}`,
        content_id: newEp.id,
        content_type: "episode",
        name: "NexStream Fast",
        source_type: "embed",
        url: `/api/stream/nexstream?type=tv&id=${effectiveTmdbId}&s=${newEp.season_number}&e=${newEp.episode_number}`,
        quality: "1080p",
        language: "en",
        is_active: true,
        priority: 2,
        is_healthy: true,
      });
    }

    setCurrentSources(newSources);

    // Maintain current selected provider if user explicitly chose NexStream
    setActiveSource((prevActive) => {
      const isNex = prevActive?.name.toLowerCase().includes("nexstream");
      if (isNex) {
        return newSources.find((s) => s.name.toLowerCase().includes("nexstream")) || newSources[0] || null;
      }
      return newSources.find((s) => s.name.toLowerCase().includes("vidfast")) || newSources[0] || null;
    });

    // Update browser URL so page refresh preserves selected season and episode
    const newUrl = `/watch/${content.id}?season=${newEp.season_number}&episode=${newEp.episode_number}`;
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", newUrl);
    }

    // Progress reset & resume check for the new episode
    const newSaved = getProgress(content.id, newEp.id);
    const newSavedPos = newSaved?.current_position || 0;
    setCurrentPlaybackPos(newSavedPos > 15 ? newSavedPos : 0);
    setShowResumeBanner(newSavedPos > 15);

    // Timers
    watchStartRef.current = Date.now();
    lastSaveRef.current = 0;

    recordWatchHistory(content, newEp);
    showToast(`Switched to Season ${newEp.season_number} Episode ${newEp.episode_number}`, "info");
  }, [content, effectiveTmdbId, getProgress, recordWatchHistory, showToast]);

  // Season change handler (fetches episodes from TMDB if not cached)
  const handleSeasonChange = async (newSeasonNum: number) => {
    setSelectedSeasonNumber(newSeasonNum);
    setEpisodesError(null);

    // Check cache first
    const cached = seasonCacheRef.current.get(newSeasonNum);
    if (cached && cached.length > 0) {
      setCurrentEpisodesList(cached);
      // Select Episode 1 by default ONLY if currently selected episode does not exist in new season
      const currentEpNum = currentEpisode?.episode_number || 1;
      const matchingEp = cached.find((e) => e.episode_number === currentEpNum);
      const targetEp = matchingEp || cached[0];
      if (targetEp) {
        handleSwitchEpisode(targetEp);
      }
      return;
    }

    // Dynamic fetch from TMDB via existing WeAre server API wrapper
    setIsLoadingEpisodes(true);
    try {
      const res = await fetch(`/api/catalog/season?seriesId=${effectiveTmdbId || content.id}&season=${newSeasonNum}`);
      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`);
      }
      const data = await res.json();
      const fetchedEpisodes: Episode[] = data.season?.episodes || [];
      if (fetchedEpisodes.length === 0) {
        setEpisodesError("No episodes available.");
        setCurrentEpisodesList([]);
        setIsLoadingEpisodes(false);
        return;
      }

      seasonCacheRef.current.set(newSeasonNum, fetchedEpisodes);
      setCurrentEpisodesList(fetchedEpisodes);

      const currentEpNum = currentEpisode?.episode_number || 1;
      const matchingEp = fetchedEpisodes.find((e) => e.episode_number === currentEpNum);
      const targetEp = matchingEp || fetchedEpisodes[0];
      if (targetEp) {
        handleSwitchEpisode(targetEp);
      }
    } catch (err) {
      console.error("Failed to load season episodes:", err);
      setEpisodesError("Unable to load episodes. Please try again.");
      showToast("Unable to load episodes. Please try again.", "error");
    } finally {
      setIsLoadingEpisodes(false);
    }
  };

  const handleEpisodeChange = (targetEpNum: number) => {
    const targetEp = currentEpisodesList.find((e) => e.episode_number === targetEpNum);
    if (targetEp) {
      handleSwitchEpisode(targetEp);
    }
  };

  // Previous & Next navigation controls
  const hasPreviousEpisode = useMemo(() => {
    if (!isTV || !currentEpisode) return false;
    return !(currentEpisode.season_number === 1 && currentEpisode.episode_number === 1);
  }, [isTV, currentEpisode]);

  const hasNextEpisode = useMemo(() => {
    if (!isTV || !currentEpisode) return false;
    const nextInSeason = currentEpisodesList.some((e) => e.episode_number === currentEpisode.episode_number + 1);
    if (nextInSeason) return true;
    const nextSeasonExists = availableSeasons.some((s) => s.season_number > currentEpisode.season_number);
    return nextSeasonExists;
  }, [isTV, currentEpisode, currentEpisodesList, availableSeasons]);

  const handlePreviousEpisode = async () => {
    if (!currentEpisode || !hasPreviousEpisode) return;
    const prevEpInSeason = currentEpisodesList.find((e) => e.episode_number === currentEpisode.episode_number - 1);
    if (prevEpInSeason) {
      handleSwitchEpisode(prevEpInSeason);
      return;
    }
    // Switch to previous season last episode
    if (currentEpisode.season_number > 1) {
      const prevSeasonNum = currentEpisode.season_number - 1;
      setSelectedSeasonNumber(prevSeasonNum);
      setIsLoadingEpisodes(true);
      try {
        let episodes = seasonCacheRef.current.get(prevSeasonNum);
        if (!episodes || episodes.length === 0) {
          const res = await fetch(`/api/catalog/season?seriesId=${effectiveTmdbId || content.id}&season=${prevSeasonNum}`);
          const data = await res.json();
          episodes = data.season?.episodes || [];
          if (episodes && episodes.length > 0) {
            seasonCacheRef.current.set(prevSeasonNum, episodes);
          }
        }
        if (episodes && episodes.length > 0) {
          setCurrentEpisodesList(episodes);
          const lastEp = episodes[episodes.length - 1];
          handleSwitchEpisode(lastEp);
        }
      } catch {
        showToast("Unable to load previous season", "error");
      } finally {
        setIsLoadingEpisodes(false);
      }
    }
  };

  const handleNextEpisode = async () => {
    if (!currentEpisode || !hasNextEpisode) return;
    const nextEpInSeason = currentEpisodesList.find((e) => e.episode_number === currentEpisode.episode_number + 1);
    if (nextEpInSeason) {
      handleSwitchEpisode(nextEpInSeason);
      return;
    }
    const nextSeason = availableSeasons.find((s) => s.season_number > currentEpisode.season_number);
    if (nextSeason) {
      await handleSeasonChange(nextSeason.season_number);
    }
  };

  // Record initial "started watching" progress & history
  useEffect(() => {
    watchStartRef.current = Date.now();
    // Record in watch history immediately when user opens content/episode
    recordWatchHistory(content, currentEpisode);

    // Save initial watch progress after 2 seconds on page
    const initialTimer = setTimeout(() => {
      const saved = getProgress(content.id, currentEpisode?.id);
      const startPosition = saved && saved.current_position > 15 ? saved.current_position : 1;
      saveProgress(content, startPosition, contentDuration, currentEpisode);
    }, 2000);

    return () => clearTimeout(initialTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.id, currentEpisode?.id]);

  // Listen for official postMessage events from embedded players (VidFast, NexStream, HTML5)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        let msg = event.data;
        if (typeof msg === "string") {
          try {
            msg = JSON.parse(msg);
          } catch {
            return;
          }
        }
        if (!msg || typeof msg !== "object") return;

        // Supported playback payload patterns
        const reportedTime =
          typeof msg.currentTime === "number"
            ? msg.currentTime
            : typeof msg.time === "number"
            ? msg.time
            : typeof msg.data?.currentTime === "number"
            ? msg.data.currentTime
            : undefined;

        const reportedDuration =
          typeof msg.duration === "number" && msg.duration > 0
            ? msg.duration
            : typeof msg.data?.duration === "number" && msg.data.duration > 0
            ? msg.data.duration
            : contentDuration;

        if (typeof reportedTime === "number" && reportedTime >= 0) {
          setCurrentPlaybackPos(reportedTime);
          const now = Date.now();
          if (now - lastSaveRef.current > 8000) {
            lastSaveRef.current = now;
            saveProgress(content, reportedTime, reportedDuration, currentEpisode);
          }
        }

        if (msg.event === "pause" || msg.type === "pause") {
          const pos = typeof reportedTime === "number" ? reportedTime : currentPlaybackPos;
          if (pos > 0) {
            saveProgress(content, pos, reportedDuration, currentEpisode);
          }
        }

        if (msg.event === "ended" || msg.type === "ended") {
          saveProgress(content, reportedDuration, reportedDuration, currentEpisode);
        }
      } catch {
        // Non-blocking
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [content, currentEpisode, contentDuration, currentPlaybackPos, saveProgress]);

  // Periodic time-on-page progress tracking (every 8 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const elapsedSinceOpen = (Date.now() - watchStartRef.current) / 1000;
      const estimatedPosition = Math.min(
        contentDuration * 0.95, // Cap at 95% to avoid marking complete until finished
        (savedPosition > 15 ? savedPosition : 0) + elapsedSinceOpen
      );
      setCurrentPlaybackPos(estimatedPosition);

      const now = Date.now();
      if (now - lastSaveRef.current > 8000) {
        lastSaveRef.current = now;
        saveProgress(content, estimatedPosition, contentDuration, currentEpisode);
      }
    }, 8000); // Persist approximately every 8 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.id, currentEpisode?.id, contentDuration, savedPosition]);

  // Save progress on page unload or visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const elapsedSinceOpen = (Date.now() - watchStartRef.current) / 1000;
        const estimatedPosition = Math.min(
          contentDuration * 0.95,
          (savedPosition > 15 ? savedPosition : 0) + elapsedSinceOpen
        );
        if (estimatedPosition > 0) {
          saveProgress(content, estimatedPosition, contentDuration, currentEpisode);
        }
      }
    };
    const handleBeforeUnload = () => {
      const elapsedSinceOpen = (Date.now() - watchStartRef.current) / 1000;
      const estimatedPosition = Math.min(
        contentDuration * 0.95,
        (savedPosition > 15 ? savedPosition : 0) + elapsedSinceOpen
      );
      if (estimatedPosition > 0) {
        saveProgress(content, estimatedPosition, contentDuration, currentEpisode);
      }
    };
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.id, currentEpisode?.id, contentDuration, savedPosition]);




  // Resume vs Start Over
  const handleResume = () => {
    setCurrentPlaybackPos(savedPosition);
    setShowResumeBanner(false);
    showToast(`Resumed from ${formatTime(savedPosition)}`, "info");
  };

  const handleStartOver = () => {
    setCurrentPlaybackPos(0);
    setShowResumeBanner(false);
    showToast("Starting over from beginning", "info");
  };

  const handleToggleList = async () => {
    const isAdded = await toggleMyList(content);
    if (isAdded) {
      showToast(`Added "${content.title}" to My List`, "success");
    } else {
      showToast(`Removed "${content.title}" from My List`, "info");
    }
  };

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        showToast("Stream link copied to clipboard!", "success");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      showToast("Could not copy link", "error");
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setShowReportModal(false);
      setReportReason("");
      showToast("Feedback sent. Our team will review the stream.", "success");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pt-16 sm:pt-20">
        {/* Navigation Breadcrumb Bar */}
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 py-3 flex items-center justify-between text-xs sm:text-sm text-muted border-b border-border/30">
          <Link
            href={
              isMovie(content)
                ? `/movie/${content.id}`
                : `/series/${content.id}?season=${selectedSeasonNumber}`
            }
            className="inline-flex items-center gap-2 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Details</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{title}</span>
            {currentSubtitle && (
              <>
                <span className="text-muted/60">•</span>
                <span className="text-accent font-semibold">{currentSubtitle}</span>
              </>
            )}
          </div>
        </div>

        {/* Resume Playback Prompt Banner */}
        {showResumeBanner && (
          <div className="bg-accent/10 border-b border-accent/30 py-3 px-4 sm:px-6 lg:px-12 animate-in fade-in">
            <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-white">
                <Clock className="h-4 w-4 text-accent" />
                <span>
                  You were watching this title. <strong>Resume from {formatTime(savedPosition)}?</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResume}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 font-bold text-black hover:bg-accent-hover active:scale-95 transition-all shadow-md shadow-accent/20"
                >
                  <Play className="h-3 w-3 fill-black" />
                  <span>Resume</span>
                </button>
                <button
                  onClick={handleStartOver}
                  className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-surface/80 px-3.5 py-1.5 font-semibold text-white hover:bg-surface active:scale-95 transition-all"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Start Over</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Player or Playback Unavailable Section */}
        {hasPlayableSource && activeSource ? (
          <>
            <section className="w-full bg-black relative shadow-2xl">
              <div className="max-w-[1800px] mx-auto aspect-video max-h-[85vh] w-full">
                <NexStreamEmbedPlayer
                  key={`${activeSource.id}-${currentEpisode?.id || "movie"}`}
                  src={activeSource.url}
                  title={title}
                  serverName={activeSource.name}
                  qualityBadge={activeSource.name.toLowerCase().includes("nexstream") ? "EMBED • 1080p" : "EMBED • Auto"}
                  onTryAlternative={handleTryAlternative}
                  alternativeName={alternativeSource?.name}
                />
              </div>
            </section>

            {/* Streaming Servers Selector Bar */}
            <section className="border-b border-border/40 bg-surface/40 py-3.5 px-4 sm:px-6 lg:px-12 backdrop-blur-md">
              <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                    <Server className="h-4 w-4 text-accent" />
                    Streaming Servers
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {orderedSources.map((s) => {
                      const isActive = activeSource ? s.id === activeSource.id : false;
                      const isNex = s.name.toLowerCase().includes("nexstream");
                      const badgeText = isNex ? "EMBED • 1080p" : "EMBED • Auto";
                      return (
                        <button
                          key={s.id}
                          onClick={() => handleSelectSource(s)}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                            isActive
                              ? "bg-accent text-black shadow-md shadow-accent/20"
                              : "border border-border/80 bg-surface text-foreground/80 hover:text-white hover:border-border hover:bg-surface-hover"
                          }`}
                        >
                          {isActive && <CheckCircle2 className="h-3.5 w-3.5" />}
                          <span>{s.name}</span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              isActive
                                ? "bg-black/20 text-black font-semibold"
                                : "bg-white/10 text-muted"
                            }`}
                          >
                            {badgeText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Episode Jump Controls (For Series) */}
                {isTV && (hasPreviousEpisode || hasNextEpisode) && (
                  <div className="flex items-center gap-2">
                    {hasPreviousEpisode && (
                      <button
                        type="button"
                        onClick={handlePreviousEpisode}
                        disabled={isLoadingEpisodes}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-surface px-3 py-1.5 text-xs font-semibold text-white hover:bg-surface-hover hover:text-accent transition-colors disabled:opacity-40"
                      >
                        <SkipBack className="h-3.5 w-3.5" />
                        <span>Previous Ep</span>
                      </button>
                    )}
                    {hasNextEpisode && (
                      <button
                        type="button"
                        onClick={handleNextEpisode}
                        disabled={isLoadingEpisodes}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-accent/20 border border-accent/40 px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/30 transition-colors disabled:opacity-40"
                      >
                        <span>Next Ep</span>
                        <SkipForward className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="w-full bg-surface/20 border-b border-border/40 py-16 px-4 sm:px-6 lg:px-12">
            <div className="max-w-xl mx-auto rounded-3xl border border-border/60 bg-surface/90 p-8 sm:p-12 shadow-2xl backdrop-blur-md text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-400">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                Playback Unavailable
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed mb-6">
                A streaming source for &ldquo;{title}&rdquo; is not currently configured on the WeAre network.
              </p>
              <div className="rounded-2xl border border-border/60 bg-black/40 p-4 text-left text-xs text-muted mb-6 space-y-2">
                <div className="font-mono text-accent uppercase font-bold text-[10px] tracking-wider">
                  {"//"} PROVIDER & CATALOG INFORMATION
                </div>
                <p>
                  Metadata and artwork catalogued through The Movie Database (TMDB).
                </p>
                <p>
                  To watch this title legally, please check official theatrical streaming services, VOD platforms, or authorized broadcast networks in your region.
                </p>
              </div>

              <Link
                href={isMovie(content) ? `/movie/${content.id}` : `/series/${content.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs font-bold text-black hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Title Details</span>
              </Link>
            </div>
          </section>
        )}

        {/* Metadata & Actions Section */}
        <section className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 pb-8 border-b border-border/40">
            {/* Title & Info */}
            <div className="space-y-4 max-w-3xl">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {content.is_featured && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">
                      <Sparkles className="w-3 h-3" /> Featured
                    </span>
                  )}
                  <span className="text-xs uppercase tracking-wider font-semibold text-muted bg-surface px-2 py-0.5 rounded border border-border/60">
                    {content.age_rating}
                  </span>
                  <span className="text-xs font-semibold text-muted bg-surface px-2 py-0.5 rounded border border-border/60">
                    4K ULTRA HD
                  </span>
                  {content.rating && (
                    <span className="flex items-center gap-1 text-accent font-bold text-xs">
                      <Star className="h-3.5 w-3.5 fill-accent" />
                      {content.rating.toFixed(1)} / 10
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {title}
                </h1>
                {currentSubtitle && <p className="text-sm font-semibold text-accent mt-1">{currentSubtitle}</p>}

                {/* Season & Episode Switcher (TV Only) */}
                {isTV && availableSeasons.length > 0 && (
                  <div className="pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                      {/* Season Dropdown */}
                      <div className="relative inline-flex items-center">
                        <select
                          id="season-selector"
                          aria-label="Select Season"
                          value={selectedSeasonNumber}
                          onChange={(e) => handleSeasonChange(Number(e.target.value))}
                          disabled={isLoadingEpisodes}
                          className="appearance-none bg-surface/90 hover:bg-surface text-white font-bold text-xs sm:text-sm px-3.5 py-2 pr-8 rounded-xl border border-border/80 hover:border-accent/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all cursor-pointer shadow-sm disabled:opacity-50"
                        >
                          {availableSeasons.map((s) => (
                            <option key={s.season_number} value={s.season_number} className="bg-surface text-white">
                              {s.title}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 h-3.5 w-3.5 text-accent pointer-events-none" />
                      </div>

                      {/* Episode Dropdown */}
                      <div className="relative inline-flex items-center min-w-[200px] max-w-full sm:max-w-[340px]">
                        <select
                          id="episode-selector"
                          aria-label="Select Episode"
                          value={currentEpisode?.episode_number || 1}
                          onChange={(e) => handleEpisodeChange(Number(e.target.value))}
                          disabled={isLoadingEpisodes || currentEpisodesList.length === 0}
                          className="w-full appearance-none bg-surface/90 hover:bg-surface text-white font-bold text-xs sm:text-sm px-3.5 py-2 pr-8 rounded-xl border border-border/80 hover:border-accent/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all cursor-pointer shadow-sm truncate disabled:opacity-50"
                        >
                          {currentEpisodesList.map((ep) => (
                            <option key={ep.id} value={ep.episode_number} className="bg-surface text-white">
                              Episode {ep.episode_number}: {ep.title}
                            </option>
                          ))}
                        </select>
                        {isLoadingEpisodes ? (
                          <Loader2 className="absolute right-2.5 h-3.5 w-3.5 text-accent animate-spin pointer-events-none" />
                        ) : (
                          <ChevronDown className="absolute right-2.5 h-3.5 w-3.5 text-accent pointer-events-none" />
                        )}
                      </div>

                      {/* Episode Jump Prev / Next Controls */}
                      <div className="flex items-center gap-2">
                        {hasPreviousEpisode && (
                          <button
                            type="button"
                            onClick={handlePreviousEpisode}
                            disabled={isLoadingEpisodes}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-surface/80 px-3 py-2 text-xs font-semibold text-white hover:text-accent hover:border-accent/50 hover:bg-surface transition-all active:scale-95 disabled:opacity-40"
                            title="Previous Episode"
                          >
                            <SkipBack className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Previous</span>
                          </button>
                        )}
                        {hasNextEpisode && (
                          <button
                            type="button"
                            onClick={handleNextEpisode}
                            disabled={isLoadingEpisodes}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-accent/20 border border-accent/40 px-3 py-2 text-xs font-bold text-accent hover:bg-accent/30 transition-all active:scale-95 disabled:opacity-40"
                            title="Next Episode"
                          >
                            <span>Next</span>
                            <SkipForward className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status feedback */}
                    {isLoadingEpisodes && (
                      <p className="flex items-center gap-1.5 text-xs text-accent mt-2 font-mono">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading episodes...
                      </p>
                    )}
                    {episodesError && (
                      <p className="text-xs text-amber-400 mt-2 font-semibold">
                        {episodesError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Specs */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {currentEpisode?.published_at ? `Aired: ${currentEpisode.published_at}` : content.release_year}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {currentEpisode ? currentEpisode.duration : ("duration" in content ? content.duration : `${availableSeasons.length} Seasons`)}
                </span>
                <span>•</span>
                <span>{content.language}</span>
                <span>•</span>
                <span>{content.genres.join(", ")}</span>
              </div>

              {/* Synopsis & Episode Still */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {currentEpisode?.thumbnail_url && (
                  <div className="relative w-36 sm:w-44 aspect-video rounded-xl overflow-hidden border border-border/60 flex-shrink-0 bg-surface shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentEpisode.thumbnail_url}
                      alt={currentEpisode.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="space-y-1.5 flex-1">
                  {currentEpisode && (
                    <h3 className="text-sm font-bold text-white">
                      {currentEpisode.title}
                    </h3>
                  )}
                  <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed max-w-2xl">
                    {currentEpisode ? currentEpisode.description : content.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* My List */}
              <button
                onClick={handleToggleList}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all active:scale-95 ${
                  inList
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-border/80 bg-surface/80 text-white hover:bg-surface"
                }`}
              >
                {inList ? <Check className="h-4 w-4 stroke-[2.5]" /> : <Plus className="h-4 w-4" />}
                <span>{inList ? "In My List" : "Add to My List"}</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-xl border border-border/80 bg-surface/80 px-4 py-2.5 text-xs font-bold text-white hover:bg-surface transition-all active:scale-95"
              >
                <Share2 className="h-4 w-4" />
                <span>{copied ? "Copied!" : "Share"}</span>
              </button>

              {/* Report Issue */}
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 rounded-xl border border-border/80 bg-surface/80 px-4 py-2.5 text-xs font-bold text-muted hover:text-white hover:bg-surface transition-all active:scale-95"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Report Issue</span>
              </button>
            </div>
          </div>
        </section>

        {/* Recommended Row */}
        {recommended.length > 0 && (
          <section className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 pb-16">
            <ContentRow
              title="Recommended Content"
              subtitle={`More titles matched to ${title}`}
              items={recommended}
            />
          </section>
        )}
      </main>

      {/* Report Issue Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Report Playback Issue</h3>
            <p className="text-xs text-muted mb-4">
              Having trouble with this stream? Let us know so our technicians can inspect the server.
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Active Server</label>
                <input
                  type="text"
                  disabled
                  value={activeSource ? activeSource.name : "None (Unavailable)"}
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white/60 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Issue Description</label>
                <select
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent"
                >
                  <option value="">Select an issue...</option>
                  <option value="buffering">Excessive buffering or freeze</option>
                  <option value="audio">Audio out of sync or missing</option>
                  <option value="subtitles">Subtitles incorrect or missing</option>
                  <option value="quality">Quality drops or pixelation</option>
                  <option value="playback">Stream failed to start</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reportReason || reportSuccess}
                  className="rounded-xl bg-accent px-5 py-2 text-xs font-bold text-black hover:bg-accent-hover transition-all disabled:opacity-50"
                >
                  {reportSuccess ? "Submitted!" : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
