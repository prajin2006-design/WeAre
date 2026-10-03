"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  Loader2,
  SkipForward,
  SkipBack,
  Server,
  AlertTriangle,
  RefreshCw,
  Check,
  Tv,
} from "lucide-react";
import Hls from "hls.js";
import type { VideoSource, SubtitleTrack } from "@/types/content";

export interface VideoPlayerProps {
  src: string;
  sourceType?: "hls" | "mp4" | "embed";
  title: string;
  subtitle?: string;
  initialPosition?: number;
  sources?: VideoSource[];
  activeSourceId?: string;
  onSelectSource?: (source: VideoSource) => void;
  subtitles?: SubtitleTrack[];
  nextEpisodeUrl?: string;
  prevEpisodeUrl?: string;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  onProgressUpdate?: (currentSeconds: number, totalSeconds: number) => void;
  onEnded?: () => void;
}

interface HlsQualityLevel {
  index: number;
  height: number;
  bitrate: number;
  label: string;
}

export default function VideoPlayer({
  src,
  sourceType,
  title,
  subtitle,
  initialPosition = 0,
  sources = [],
  activeSourceId,
  onSelectSource,
  subtitles = [],
  nextEpisodeUrl,
  prevEpisodeUrl,
  onNextEpisode,
  onPrevEpisode,
  onProgressUpdate,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTimeRef = useRef<number>(0);

  // Core Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPipAvailable, setIsPipAvailable] = useState(false);

  // Player Lifecycle States: loading | playing | paused | buffering | error | empty
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quality & Subtitles
  const [availableQualities, setAvailableQualities] = useState<HlsQualityLevel[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>("Auto");
  const [activeSubtitle, setActiveSubtitle] = useState<string>("off");

  // UI Menus & Hover
  const [showControls, setShowControls] = useState(true);
  const [activeMenu, setActiveMenu] = useState<"settings" | "quality" | "speed" | "subtitles" | "sources" | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  // Determine if stream is HLS
  const isHlsStream =
    sourceType === "hls" ||
    src.includes(".m3u8") ||
    src.startsWith("blob:") ||
    src.includes("/hls");

  // Check PiP support
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof document !== "undefined") {
        setIsPipAvailable(Boolean(document.pictureInPictureEnabled));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Format seconds into MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // --------------------------------------------------------------------------
  // HLS and Video Initialization
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (sourceType === "embed") {
      const embedTimer = setTimeout(() => {
        setIsLoading(false);
        setIsBuffering(false);
        setErrorMessage(null);
      }, 0);
      return () => clearTimeout(embedTimer);
    }

    const video = videoRef.current;
    if (!video) return;

    if (!src || src.trim() === "") {
      const emptyTimer = setTimeout(() => {
        setIsLoading(false);
        setErrorMessage("No playable source is available.");
      }, 0);
      return () => clearTimeout(emptyTimer);
    }

    const resetTimer = setTimeout(() => {
      setIsLoading(true);
      setIsBuffering(false);
      setErrorMessage(null);
      setAvailableQualities([]);
      setSelectedQuality("Auto");
    }, 0);

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let hlsInstance: Hls | null = null;
    let recoveryAttempts = 0;

    if (isHlsStream) {
      if (Hls.isSupported()) {
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });

        hlsRef.current = hlsInstance;
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(video);

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setIsLoading(false);

          // Extract real available quality levels
          if (data.levels && data.levels.length > 0) {
            const detectedLevels: HlsQualityLevel[] = [
              { index: -1, height: 0, bitrate: 0, label: "Auto" },
              ...data.levels.map((lvl, idx) => ({
                index: idx,
                height: lvl.height,
                bitrate: lvl.bitrate,
                label: lvl.height ? `${lvl.height}p` : `Level ${idx + 1}`,
              })),
            ];
            // Deduplicate by label and sort descending
            const seen = new Set<string>();
            const unique = detectedLevels.filter((lvl) => {
              if (seen.has(lvl.label)) return false;
              seen.add(lvl.label);
              return true;
            });
            setAvailableQualities(unique);
          }

          if (initialPosition > 0 && initialPosition < (video.duration || 99999)) {
            video.currentTime = initialPosition;
          }
        });

        // Error handling & bounded recovery (No infinite retry loops)
        hlsInstance.on(Hls.Events.ERROR, (_, errorData) => {
          if (errorData.fatal) {
            switch (errorData.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                if (recoveryAttempts < 2) {
                  recoveryAttempts++;
                  hlsInstance?.startLoad();
                } else {
                  hlsInstance?.destroy();
                  setErrorMessage("Unable to play this source. Network connection failed.");
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                if (recoveryAttempts < 2) {
                  recoveryAttempts++;
                  hlsInstance?.recoverMediaError();
                } else {
                  hlsInstance?.destroy();
                  setErrorMessage("Unable to play this video. Media format error.");
                }
                break;
              default:
                hlsInstance?.destroy();
                setErrorMessage("Unable to play this video.");
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS for Safari / iOS
        video.src = src;
      } else {
        setErrorMessage("Your browser does not support HLS video playback.");
      }
    } else {
      // Standard MP4 Direct HTML5 playback
      video.src = src;
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsLoading(false);
      if (initialPosition > 0 && initialPosition < (video.duration || 0)) {
        video.currentTime = initialPosition;
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const handlePause = () => {
      setIsPlaying(false);
      setIsBuffering(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };
    const handleError = () => {
      setIsLoading(false);
      setIsBuffering(false);
      setErrorMessage("Unable to play this video source.");
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);

      clearTimeout(resetTimer);
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, isHlsStream, sourceType, initialPosition, onEnded]);

  // --------------------------------------------------------------------------
  // Progress updates throttled to every ~4 seconds and on key state changes
  // --------------------------------------------------------------------------
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const current = video.currentTime;
    setCurrentTime(current);

    if (video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1));
    }

    if (Math.abs(current - lastSavedTimeRef.current) >= 4) {
      lastSavedTimeRef.current = current;
      if (onProgressUpdate && video.duration) {
        onProgressUpdate(current, video.duration);
      }
    }
  };

  // --------------------------------------------------------------------------
  // Playback Controls
  // --------------------------------------------------------------------------
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !src || errorMessage) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
      if (onProgressUpdate && video.duration) {
        onProgressUpdate(video.currentTime, video.duration);
      }
    }
  }, [src, errorMessage, onProgressUpdate]);

  const seekRelative = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const target = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    video.currentTime = target;
    setCurrentTime(target);
  }, []);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const target = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = target;
    setCurrentTime(target);
  };

  const handleSeekHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos);
    setHoverTime(pos * duration);
  };

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.volume = val;
      video.muted = val === 0;
      setVolume(val);
      setIsMuted(val === 0);
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP not allowed or failed
    }
  };

  const setSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setActiveMenu(null);
    }
  };

  // Switch HLS Quality Level preserving playback position
  const setQuality = (level: HlsQualityLevel) => {
    const video = videoRef.current;
    const hls = hlsRef.current;
    if (!video) return;

    const savedPos = video.currentTime;
    setSelectedQuality(level.label);
    setActiveMenu(null);

    if (hls && level.index !== undefined) {
      hls.currentLevel = level.index;
      if (Math.abs(video.currentTime - savedPos) > 1) {
        video.currentTime = savedPos;
      }
    }
  };

  // Switch Subtitle Track
  const setSubtitle = (langCode: string) => {
    const video = videoRef.current;
    setActiveSubtitle(langCode);
    setActiveMenu(null);

    if (video && video.textTracks) {
      for (let i = 0; i < video.textTracks.length; i++) {
        const track = video.textTracks[i];
        if (langCode === "off") {
          track.mode = "disabled";
        } else {
          track.mode = track.language === langCode ? "showing" : "disabled";
        }
      }
    }
  };

  // Switch Video Source safely
  const handleSelectSource = (s: VideoSource) => {
    const video = videoRef.current;
    const currentPos = video?.currentTime || 0;
    setActiveMenu(null);
    if (onSelectSource) {
      onSelectSource(s);
      // Give React cycle a tick to re-attach with preserved position
      setTimeout(() => {
        if (videoRef.current && currentPos > 0) {
          videoRef.current.currentTime = currentPos;
        }
      }, 100);
    }
  };

  // --------------------------------------------------------------------------
  // Keyboard Shortcuts
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
          e.preventDefault();
          seekRelative(-10);
          break;
        case "arrowright":
          e.preventDefault();
          seekRelative(10);
          break;
        case "arrowup":
          e.preventDefault();
          if (videoRef.current) {
            const nextVol = Math.min(1, videoRef.current.volume + 0.1);
            videoRef.current.volume = nextVol;
            setVolume(nextVol);
            setIsMuted(nextVol === 0);
          }
          break;
        case "arrowdown":
          e.preventDefault();
          if (videoRef.current) {
            const nextVol = Math.max(0, videoRef.current.volume - 0.1);
            videoRef.current.volume = nextVol;
            setVolume(nextVol);
            setIsMuted(nextVol === 0);
          }
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "p":
          e.preventDefault();
          togglePiP();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, seekRelative, toggleFullscreen, toggleMute]);

  // Controls auto-hide on inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (activeMenu === null) {
          setShowControls(false);
        }
      }, 3500);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && activeMenu === null && setShowControls(false)}
      className="group relative w-full h-full bg-black select-none overflow-hidden flex items-center justify-center font-sans"
    >
      {/* HTML5 Video Element or Secure Embed Player */}
      {sourceType === "embed" ? (
        <iframe
          src={src}
          title={title}
          className="w-full h-full border-0 object-contain bg-black"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      ) : (
        <video
          ref={videoRef}
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        >
          {subtitles.map((sub) => (
            <track
              key={sub.id || sub.language}
              kind="subtitles"
              label={sub.label}
              src={sub.url}
              srcLang={sub.language}
              default={activeSubtitle === sub.language}
            />
          ))}
        </video>
      )}

      {/* State Overlay: Buffering */}
      {isBuffering && !isLoading && !errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="flex items-center gap-3 rounded-2xl bg-black/80 border border-white/10 px-5 py-3.5 backdrop-blur-md text-white shadow-2xl">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <span className="text-xs font-semibold tracking-wide">Buffering stream...</span>
          </div>
        </div>
      )}

      {/* State Overlay: Loading */}
      {isLoading && !errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
          <Loader2 className="h-10 w-10 animate-spin text-accent mb-3" />
          <p className="text-sm font-bold text-white tracking-wide">Loading video...</p>
          <p className="text-xs text-muted mt-1">{title}</p>
        </div>
      )}

      {/* State Overlay: Error / Source Failure */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center z-30">
          <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-xl">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1.5">{errorMessage}</h3>
          <p className="text-xs text-muted max-w-md mb-6 leading-relaxed">
            The active video stream could not be loaded. You can select another authorized source or retry.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {sources.length > 1 && (
              <button
                onClick={() => setActiveMenu("sources")}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-black hover:bg-accent-hover active:scale-95 transition-all shadow-lg shadow-accent/20"
              >
                <Server className="h-4 w-4" />
                <span>Try Another Source</span>
              </button>
            )}

            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.load();
                  setIsLoading(true);
                  setErrorMessage(null);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Stream</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Bar Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 z-20 flex items-center justify-between ${
          showControls && !errorMessage ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white drop-shadow-md leading-tight">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-accent font-medium mt-0.5">{subtitle}</p>}
        </div>

        {/* Server / Source Pill Trigger */}
        {sources.length > 0 && (
          <button
            onClick={() => setActiveMenu(activeMenu === "sources" ? null : "sources")}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/60 px-3.5 py-1.5 text-xs font-semibold text-white/90 hover:text-white hover:border-accent/50 backdrop-blur-md transition-all active:scale-95"
            aria-label="Select streaming server"
          >
            <Server className="h-3.5 w-3.5 text-accent" />
            <span>
              {sources.find((s) => s.id === activeSourceId)?.name || "Authorized Source"}
            </span>
          </button>
        )}
      </div>

      {/* Bottom Controls Bar (HTML5 video playback) */}
      {sourceType !== "embed" && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 z-20 flex flex-col gap-3 ${
            showControls && !errorMessage ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
        {/* Scrubber / Progress Bar */}
        <div
          className="relative w-full h-2 group/scrub flex items-center cursor-pointer"
          onMouseMove={handleSeekHover}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Timestamp Hover Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 -translate-x-1/2 rounded-md bg-surface border border-border px-2 py-0.5 text-[11px] font-mono text-white pointer-events-none shadow-lg z-30"
              style={{ left: `${hoverPosition * 100}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}

          {/* Background Track */}
          <div className="absolute inset-0 rounded-full bg-white/20 overflow-hidden">
            {/* Buffered Bar */}
            <div
              className="h-full bg-white/30 transition-all duration-150"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Played Progress Bar */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-accent transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Interactive Scrub Handle */}
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progressPercent}
            onChange={handleSeekChange}
            aria-label="Seek video position"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left Controls: Play, Jump, Volume, Time */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Previous Episode */}
            {prevEpisodeUrl && (
              <button
                onClick={onPrevEpisode}
                className="p-1.5 text-white/80 hover:text-accent transition-colors"
                aria-label="Previous episode"
                title="Previous Episode"
              >
                <SkipBack className="h-5 w-5" />
              </button>
            )}

            {/* Play / Pause Toggle */}
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black hover:bg-accent hover:scale-105 active:scale-95 transition-all shadow-lg"
              aria-label={isPlaying ? "Pause video" : "Play video"}
              disabled={Boolean(errorMessage)}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Next Episode */}
            {nextEpisodeUrl && (
              <button
                onClick={onNextEpisode}
                className="p-1.5 text-white/80 hover:text-accent transition-colors"
                aria-label="Next episode"
                title="Next Episode"
              >
                <SkipForward className="h-5 w-5" />
              </button>
            )}

            {/* Seek -10s */}
            <button
              onClick={() => seekRelative(-10)}
              className="p-1.5 text-white/80 hover:text-white transition-colors"
              aria-label="Rewind 10 seconds"
              title="Rewind 10s"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Seek +10s */}
            <button
              onClick={() => seekRelative(10)}
              className="p-1.5 text-white/80 hover:text-white transition-colors"
              aria-label="Fast forward 10 seconds"
              title="Fast Forward 10s"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 text-white/80 hover:text-white transition-colors"
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume slider"
                className="w-16 sm:w-20 h-1.5 accent-accent bg-white/20 rounded-full cursor-pointer opacity-80 group-hover/vol:opacity-100 transition-opacity"
              />
            </div>

            {/* Time Indicator */}
            <span className="text-xs font-mono text-white/80 ml-2 hidden sm:inline-block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls: Quality, Speed, Subtitles, PiP, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Subtitles Button */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === "subtitles" ? null : "subtitles")}
                className={`p-2 rounded-xl transition-all ${
                  activeSubtitle !== "off"
                    ? "text-accent bg-accent/20"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                aria-label="Subtitle selection"
                title="Captions / Subtitles"
              >
                <Subtitles className="h-4 w-4" />
              </button>

              {activeMenu === "subtitles" && (
                <div className="absolute bottom-12 right-0 w-44 rounded-2xl border border-border bg-surface/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in z-40">
                  <span className="block px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                    Subtitles
                  </span>
                  <button
                    onClick={() => setSubtitle("off")}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold ${
                      activeSubtitle === "off" ? "text-accent bg-accent/10" : "text-white hover:bg-white/5"
                    }`}
                  >
                    <span>Subtitles Off</span>
                    {activeSubtitle === "off" && <Check className="h-3.5 w-3.5" />}
                  </button>
                  {subtitles.map((sub) => (
                    <button
                      key={sub.id || sub.language}
                      onClick={() => setSubtitle(sub.language)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold ${
                        activeSubtitle === sub.language
                          ? "text-accent bg-accent/10"
                          : "text-white hover:bg-white/5"
                      }`}
                    >
                      <span>{sub.label}</span>
                      {activeSubtitle === sub.language && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Selector (Real HLS Level Variants) */}
            {availableQualities.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === "quality" ? null : "quality")}
                  className="px-2.5 py-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/90 hover:text-white transition-all active:scale-95"
                  aria-label="Quality selection"
                >
                  {selectedQuality}
                </button>

                {activeMenu === "quality" && (
                  <div className="absolute bottom-12 right-0 w-36 rounded-2xl border border-border bg-surface/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in z-40">
                    <span className="block px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                      Resolution
                    </span>
                    {availableQualities.map((lvl) => (
                      <button
                        key={lvl.label}
                        onClick={() => setQuality(lvl)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold ${
                          selectedQuality === lvl.label
                            ? "text-accent bg-accent/10"
                            : "text-white hover:bg-white/5"
                        }`}
                      >
                        <span>{lvl.label}</span>
                        {selectedQuality === lvl.label && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings (Speed) Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === "speed" ? null : "speed")}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                aria-label="Playback speed"
                title="Playback Speed"
              >
                <Settings className="h-4 w-4" />
              </button>

              {activeMenu === "speed" && (
                <div className="absolute bottom-12 right-0 w-36 rounded-2xl border border-border bg-surface/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in z-40">
                  <span className="block px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                    Speed
                  </span>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSpeed(spd)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold ${
                        playbackSpeed === spd
                          ? "text-accent bg-accent/10"
                          : "text-white hover:bg-white/5"
                      }`}
                    >
                      <span>{spd === 1 ? "1.0x (Normal)" : `${spd}x`}</span>
                      {playbackSpeed === spd && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PiP Button */}
            {isPipAvailable && (
              <button
                onClick={togglePiP}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all hidden sm:inline-block"
                aria-label="Picture in picture"
                title="Picture-in-Picture"
              >
                <Tv className="h-4 w-4" />
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title="Fullscreen"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Sources Selection Modal/Menu (When opened via top pill or Try Another Source) */}
      {activeMenu === "sources" && sources.length > 0 && (
        <div
          onClick={() => setActiveMenu(null)}
          className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Server className="h-5 w-5 text-accent" />
              <h3 className="text-base font-bold text-white">Authorized Streaming Servers</h3>
            </div>
            <p className="text-xs text-muted mb-4">
              Select an authorized playback mirror. Playback position will be preserved.
            </p>

            <div className="space-y-2">
              {sources.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSource(s)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                    s.id === activeSourceId
                      ? "border-accent bg-accent/15 text-white"
                      : "border-border/60 bg-surface/50 text-foreground/80 hover:border-border hover:bg-surface"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">{s.name}</span>
                    <span className="text-[11px] text-muted">
                      {s.source_type.toUpperCase()} • {s.quality || "Adaptive"}
                    </span>
                  </div>
                  {s.id === activeSourceId ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-accent">
                      <Check className="h-3.5 w-3.5" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted font-medium">Switch</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveMenu(null)}
              className="mt-5 w-full rounded-xl border border-border py-2 text-xs font-semibold text-muted hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
