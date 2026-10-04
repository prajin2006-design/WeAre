"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, Server, Loader2, Maximize, Minimize } from "lucide-react";

export type NexStreamEmbedPlayerProps = {
  src: string;
  title?: string;
  serverName?: string;
  qualityBadge?: string;
  onTryAlternative?: () => void;
  alternativeName?: string;
  onTryVidFast?: () => void;
};

// Memoized Iframe component so controls hover and state updates do NOT recreate or reload the iframe DOM node
const ProviderEmbedIframe = React.memo(function ProviderEmbedIframe({
  src,
  title,
  serverName,
  onLoad,
  onError,
}: {
  src: string;
  title?: string;
  serverName: string;
  onLoad: () => void;
  onError: () => void;
}) {
  return (
    <iframe
      key={src}
      src={src}
      title={title || `${serverName} Stream`}
      className="w-full h-full border-0 object-contain bg-black"
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      allowFullScreen
      referrerPolicy="origin-when-cross-origin"
      onLoad={onLoad}
      onError={onError}
    />
  );
});

export default function NexStreamEmbedPlayer({
  src,
  title,
  serverName = "VidFast",
  qualityBadge = "EMBED • Auto",
  onTryAlternative,
  alternativeName,
  onTryVidFast,
}: NexStreamEmbedPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fallbackServerName =
    alternativeName || (serverName.toLowerCase().includes("vidfast") ? "NexStream Fast" : "VidFast");
  const fallbackHandler = onTryAlternative || onTryVidFast;

  // Reset loading and error state strictly when provider src URL changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Auto-hide controls overlay
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="group relative w-full h-full aspect-video bg-black select-none overflow-hidden flex items-center justify-center font-sans"
    >
      {/* Active Single Provider Iframe */}
      {!hasError && src && (
        <ProviderEmbedIframe
          src={src}
          title={title}
          serverName={serverName}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 pointer-events-none">
          <Loader2 className="h-10 w-10 animate-spin text-accent mb-3" />
          <p className="text-sm font-bold text-white tracking-wide">Connecting to {serverName}...</p>
          <p className="text-xs text-muted mt-1 font-mono">{qualityBadge}</p>
        </div>
      )}

      {/* Error / Fallback State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center z-30">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-accent mb-4 shadow-xl">
            <AlertTriangle className="h-7 w-7 text-accent" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1.5">{serverName} is unavailable</h3>
          <p className="text-xs text-muted max-w-md mb-6 leading-relaxed">
            The {serverName} playback server could not be reached. You can switch to {fallbackServerName} or try again later.
          </p>

          {fallbackHandler && (
            <button
              onClick={fallbackHandler}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-black hover:bg-accent-hover active:bg-[#E67600] active:scale-95 transition-all shadow-lg shadow-accent/20"
            >
              <Server className="h-4 w-4" />
              <span>{`Try ${fallbackServerName}`}</span>
            </button>
          )}
        </div>
      )}

      {/* Top Controls Overlay */}
      {!hasError && (
        <div
          className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 z-20 flex items-center justify-between pointer-events-none ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div>
            {title && (
              <h2 className="text-base sm:text-lg font-bold text-white drop-shadow-md leading-tight">
                {title}
              </h2>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono font-bold tracking-wider text-accent uppercase">
                {serverName.toUpperCase()}
              </span>
              <span className="text-[10px] text-muted font-mono">• {qualityBadge}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {fallbackHandler && (
              <button
                onClick={fallbackHandler}
                className="flex items-center gap-1.5 rounded-xl border border-on-primary/60 bg-black/60 px-3.5 py-1.5 text-xs font-semibold text-foreground hover:text-accent hover:border-accent backdrop-blur-md transition-all active:scale-95"
                title={`Switch to ${fallbackServerName} server`}
              >
                <Server className="h-3.5 w-3.5 text-accent" />
                <span>{`Try ${fallbackServerName}`}</span>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 text-foreground/80 hover:text-accent hover:bg-surface-hover rounded-xl transition-all active:scale-95 bg-black/40 backdrop-blur-md border border-on-primary/40"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

