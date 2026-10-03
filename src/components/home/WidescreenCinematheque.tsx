"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import { ContentItem } from "@/types/content";
import { useUserContent } from "@/lib/context/user-content-context";

interface WidescreenCinemathequeProps {
  title: string;
  subtitle?: string;
  items: ContentItem[];
}

export default function WidescreenCinematheque({
  title,
  subtitle = "CINEMATOGRAPHY & MASTERWORKS",
  items,
}: WidescreenCinemathequeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { isInList, toggleMyList } = useUserContent();

  if (!items || items.length === 0) return null;

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 20);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative my-12 sm:my-16">
      {/* Header */}
      <div className="mx-auto max-w-[1800px] px-4 sm:px-8 lg:px-14 mb-4">
        <div className="flex items-baseline justify-between border-b border-border/40 pb-3">
          <div>
            <span className="text-[11px] font-mono tracking-[0.2em] text-accent uppercase font-semibold block mb-0.5">
              {subtitle}
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              {title}
            </h2>
          </div>
          <span className="text-xs font-mono text-muted">
            {items.length} TITLES
          </span>
        </div>
      </div>

      {/* Reel */}
      <div className="relative group/cinematheque">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-12 z-30 hidden sm:flex w-12 items-center justify-center bg-background/85 hover:bg-background text-white transition-all backdrop-blur-sm border-r border-border/40"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="content-row-scroll flex gap-5 sm:gap-6 overflow-x-auto px-4 sm:px-8 lg:px-14 py-2"
        >
          {items.map((item) => {
            const inList = isInList(item.id);
            const playUrl = `/watch/${item.id}`;

            return (
              <div
                key={item.id}
                className="group/card relative flex-shrink-0 w-72 sm:w-84 md:w-96 select-none"
              >
                {/* 16:9 Frame */}
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-surface border border-border/40 transition-all duration-300 group-hover/card:border-accent/50 group-hover/card:shadow-xl">
                  <Image
                    src={item.backdrop_url || item.poster_url}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 288px, (max-width: 768px) 336px, 384px"
                    className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                    unoptimized
                  />

                  {/* Minimal hover trigger */}
                  <Link
                    href={playUrl}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity"
                  >
                    <div className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95">
                      <Play className="h-5 w-5 fill-black translate-x-0.5" />
                    </div>
                  </Link>

                  {/* Bookmark quick button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleMyList(item);
                    }}
                    className={`absolute top-2.5 right-2.5 z-20 h-7 w-7 rounded flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all ${
                      inList
                        ? "bg-accent text-black opacity-100"
                        : "bg-black/60 text-white hover:bg-black"
                    }`}
                    title={inList ? "In My List" : "Add to List"}
                  >
                    <Bookmark className="h-3.5 w-3.5 fill-current" />
                  </button>
                </div>

                {/* Typographic Metadata below card */}
                <div className="pt-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link href={playUrl}>
                      <h3 className="text-sm font-bold text-white truncate group-hover/card:text-accent transition-colors">
                        {item.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 text-xs font-mono text-muted mt-0.5">
                      <span>{item.release_year}</span>
                      <span>·</span>
                      <span>{item.genres.slice(0, 2).join(", ")}</span>
                    </div>
                  </div>

                  {item.rating && (
                    <span className="text-xs font-mono text-accent font-semibold flex-shrink-0">
                      ★ {item.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-12 z-30 hidden sm:flex w-12 items-center justify-center bg-background/85 hover:bg-background text-white transition-all backdrop-blur-sm border-l border-border/40"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </section>
  );
}
