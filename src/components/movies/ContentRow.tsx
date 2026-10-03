"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import { ContentItem } from "@/types/content";

interface ContentRowProps {
  title: string;
  items: ContentItem[];
  subtitle?: string;
  tag?: string;
}

export default function ContentRow({ title, items, subtitle, tag = "COLLECTION" }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, items]);

  if (!items || items.length === 0) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="group/row relative my-10 sm:my-14 select-none">
      {/* Title & Subtitle */}
      <div className="mx-auto max-w-[1800px] px-4 sm:px-8 lg:px-14 mb-4">
        <div className="flex items-baseline justify-between border-b border-border/40 pb-3">
          <div>
            <span className="text-[10px] font-mono tracking-[0.25em] text-accent uppercase font-bold block mb-0.5">
              {`// ${tag}`}
            </span>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-muted font-mono mt-0.5">{subtitle}</p>
            )}
          </div>
          <span className="text-xs font-mono text-muted">
            {items.length} TITLES
          </span>
        </div>
      </div>

      {/* Row Container with overlay buttons */}
      <div className="relative">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-10 z-30 hidden sm:flex w-12 items-center justify-center bg-background/85 hover:bg-background text-white transition-all backdrop-blur-sm border-r border-border/40"
            aria-label={`Scroll left in ${title}`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          className="content-row-scroll flex gap-4 sm:gap-5 overflow-x-auto px-4 sm:px-8 lg:px-14 py-2"
        >
          {items.map((item) => (
            <MovieCard key={item.id} movie={item} />
          ))}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-10 z-30 hidden sm:flex w-12 items-center justify-center bg-background/85 hover:bg-background text-white transition-all backdrop-blur-sm border-l border-border/40"
            aria-label={`Scroll right in ${title}`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </section>
  );
}
