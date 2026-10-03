"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useUserContent } from "@/lib/context/user-content-context";

export default function ContinueWatchingRow() {
  const { continueWatching, removeFromWatchProgress, refreshUserData } = useUserContent();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Refresh progress data when user returns to this tab / comes back from watch page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshUserData();
      }
    };
    const handleFocus = () => {
      refreshUserData();
    };
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshUserData]);

  if (!continueWatching || continueWatching.length === 0) {
    return null;
  }

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative my-8 sm:my-12 select-none">
      <div className="mx-auto max-w-[1800px] px-4 sm:px-8 lg:px-14 mb-4">
        <div className="flex items-baseline justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
            <span className="text-[11px] font-mono tracking-[0.25em] text-accent uppercase font-bold">
              {"//"} RESUME PLAYBACK
            </span>
          </div>
          <span className="text-xs font-mono text-muted">
            {continueWatching.length} IN PROGRESS
          </span>
        </div>
      </div>

      <div className="relative group/continue">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-30 hidden sm:flex w-12 items-center justify-center bg-background/85 hover:bg-background text-white transition-all backdrop-blur-sm border-r border-border/40"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="content-row-scroll flex gap-4 sm:gap-5 overflow-x-auto px-4 sm:px-8 lg:px-14 py-2"
        >
          {continueWatching.map((item) => {
            const playUrl = item.episode_id
              ? `/watch/${item.content_id}?ep=${item.episode_id}`
              : `/watch/${item.content_id}`;

            const remSecs = Math.max(0, (item.duration || 7200) - item.current_position);
            const remMins = Math.ceil(remSecs / 60);
            const timeString =
              remMins >= 60
                ? `${Math.floor(remMins / 60)}h ${remMins % 60}m remaining`
                : `${remMins}m remaining`;

            return (
              <div
                key={item.id}
                className="group/card relative flex-shrink-0 w-72 sm:w-84 md:w-96 select-none cursor-pointer"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-md bg-surface border border-border/50 transition-all duration-300 group-hover/card:border-accent/60 group-hover/card:shadow-xl">
                  {/* Backdrop */}
                  {(item.backdrop_url || item.poster_url) ? (
                  <Image
                    src={item.backdrop_url || item.poster_url}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 288px, (max-width: 768px) 336px, 384px"
                    className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                    unoptimized
                  />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center">
                      <span className="text-2xl font-bold text-muted/40 truncate px-4">{item.title}</span>
                    </div>
                  )}

                  {/* Dismiss */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFromWatchProgress(item.content_id, item.episode_id);
                    }}
                    className="absolute top-2.5 right-2.5 z-20 flex h-7 w-7 items-center justify-center rounded bg-black/70 text-white/80 opacity-0 transition-all duration-200 hover:bg-black hover:text-white group-hover/card:opacity-100"
                    title="Remove from Continue Watching"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                  {/* Play Overlay */}
                  <Link
                    href={playUrl}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity"
                  >
                    <div className="h-11 w-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transition-transform hover:scale-115 active:scale-95">
                      <Play className="h-4 w-4 fill-black translate-x-0.5" />
                    </div>
                  </Link>

                  {/* Razor-thin Progress Bar at bottom of card */}
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-black/80">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="pt-2 flex items-baseline justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link href={playUrl} className="block group/title">
                      <h3 className="text-sm font-bold text-white truncate group-hover/title:text-accent transition-colors">
                        {item.title}
                      </h3>
                      {item.episode_title && (
                        <p className="text-xs text-muted font-mono truncate hover:text-white transition-colors">
                          S{item.season_number}:E{item.episode_number} · {item.episode_title}
                        </p>
                      )}
                    </Link>
                  </div>
                  <span className="text-[11px] font-mono text-accent font-semibold flex-shrink-0">
                    {timeString}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-30 hidden sm:flex w-12 items-center justify-center bg-background/85 hover:bg-background text-white transition-all backdrop-blur-sm border-l border-border/40"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </section>
  );
}
