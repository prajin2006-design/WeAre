"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
import { ContentItem } from "@/types/content";
import { useUserContent } from "@/lib/context/user-content-context";

interface TopRankedMarqueeProps {
  title?: string;
  items: ContentItem[];
}

export default function TopRankedMarquee({
  title = "TOP 10 CINEMA",
  items,
}: TopRankedMarqueeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { isInList, toggleMyList } = useUserContent();

  if (!items || items.length === 0) return null;

  const topItems = items.slice(0, 10);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 20);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative my-12 sm:my-16">
      {/* Editorial Header */}
      <div className="mx-auto max-w-[1800px] px-4 sm:px-8 lg:px-14 mb-5">
        <div className="flex items-end justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-3">
            <span className="h-4 w-1 bg-accent rounded-full" />
            <h2 className="text-sm font-mono tracking-[0.2em] uppercase text-accent font-bold">
              {title}
            </h2>
            <span className="text-xs text-muted/60 font-mono tracking-widest hidden sm:inline">
              {"//"} CURATED BY WEARE
            </span>
          </div>
          <span className="text-xs text-muted font-mono">
            TOP {topItems.length} SELECTIONS
          </span>
        </div>
      </div>

      {/* Marquee Track */}
      <div className="relative group/marquee">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-30 hidden sm:flex w-14 items-center justify-center bg-background/80 hover:bg-background/95 text-white transition-all backdrop-blur-sm border-r border-border/40"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="content-row-scroll flex gap-6 sm:gap-8 overflow-x-auto px-4 sm:px-8 lg:px-14 py-2"
        >
          {topItems.map((item, index) => {
            const rank = (index + 1).toString().padStart(2, "0");
            const inList = isInList(item.id);
            const playUrl = `/watch/${item.id}`;

            return (
              <div
                key={item.id}
                className="group relative flex-shrink-0 flex items-stretch gap-4 sm:gap-6 select-none"
              >
                {/* Architectural Numeral */}
                <div className="flex items-center justify-center">
                  <span className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter text-white/10 group-hover:text-accent/40 transition-colors font-mono select-none">
                    {rank}
                  </span>
                </div>

                {/* Cinematic Card Frame */}
                <div className="relative aspect-[16/10] w-64 sm:w-80 md:w-96 overflow-hidden rounded-lg bg-surface border border-border/50 transition-all duration-300 group-hover:border-accent/60 group-hover:shadow-2xl group-hover:shadow-black">
                  <Image
                    src={item.backdrop_url || item.poster_url}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 256px, (max-width: 768px) 320px, 384px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />

                  {/* Clean dark tint on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                  {/* Hover Interactive Layer */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono tracking-widest text-accent font-semibold uppercase">
                        #{index + 1} ON WEARE
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleMyList(item);
                        }}
                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
                          inList
                            ? "bg-accent text-black"
                            : "bg-black/70 text-white border border-white/30"
                        }`}
                        title={inList ? "In My List" : "Add to List"}
                      >
                        {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-white truncate">
                          {item.title}
                        </h3>
                        <p className="text-xs text-white/70 font-mono mt-0.5 truncate">
                          {item.release_year} · {item.genres.slice(0, 2).join(" / ")}
                        </p>
                      </div>

                      <Link
                        href={playUrl}
                        className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-accent hover:scale-110 active:scale-95 transition-all shadow-lg flex-shrink-0"
                        title={`Stream ${item.title}`}
                      >
                        <Play className="h-4 w-4 fill-current translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-30 hidden sm:flex w-14 items-center justify-center bg-background/80 hover:bg-background/95 text-white transition-all backdrop-blur-sm border-l border-border/40"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        )}
      </div>
    </section>
  );
}
