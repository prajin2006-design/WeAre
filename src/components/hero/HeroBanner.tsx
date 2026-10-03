"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Play,
  Plus,
  Check,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ContentItem, Movie, Series, isMovie } from "@/types/content";
import { useUserContent } from "@/lib/context/user-content-context";

interface HeroBannerProps {
  items?: ContentItem[];
  movie?: Movie;
}

export default function HeroBanner({ items, movie }: HeroBannerProps) {
  const { isInList, toggleMyList } = useUserContent();

  const slides: ContentItem[] = (items && items.length > 0)
    ? items
    : movie
    ? [movie]
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  // If items length changed and currentIndex is out of bounds, reset safely
  const safeIndex = currentIndex < slides.length ? currentIndex : 0;
  const currentItem = slides[safeIndex];

  // Auto-rotation every 7 seconds (within 6-8s range requested)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    // Check user preference for reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const handleSelect = useCallback((idx: number) => {
    setCurrentIndex(idx);
  }, []);

  // Keyboard navigation when user is interacting with the hero section or using arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (slides.length <= 1) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, slides.length]);

  if (!currentItem) return null;

  const isFilm = isMovie(currentItem);
  const inList = isInList(currentItem.id);
  const watchUrl = `/watch/${currentItem.id}`;
  const detailsUrl = isFilm ? `/movie/${currentItem.id}` : `/series/${currentItem.id}`;

  const durationOrSeasons = isFilm
    ? currentItem.duration || "2h 00m"
    : `${(currentItem as Series).total_seasons || 1} Season${((currentItem as Series).total_seasons || 1) === 1 ? "" : "s"}`;

  const kicker = currentItem.is_original
    ? "WEARE ORIGINAL PRODUCTION"
    : isFilm
    ? "SPOTLIGHT CINEMA"
    : "FEATURED TV SERIES";

  return (
    <section
      ref={heroRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="relative min-h-[580px] sm:min-h-[640px] h-[82vh] max-h-[850px] w-full overflow-hidden bg-black select-none"
      aria-roledescription="carousel"
      aria-label="Featured Titles Carousel"
    >
      {/* Full Bleed Backdrop Stills with Smooth Crossfade Transition */}
      <div className="absolute inset-0">
        {slides.map((item, idx) => {
          const isActive = idx === safeIndex;
          const bgSrc = item.backdrop_url || item.poster_url;
          return (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-85 z-0" : "opacity-0 pointer-events-none -z-10"
              }`}
              aria-hidden={!isActive}
            >
              <Image
                src={bgSrc}
                alt={item.title}
                fill
                priority={idx === 0 || idx === 1}
                sizes="100vw"
                className="object-cover object-center"
                unoptimized
              />
            </div>
          );
        })}
      </div>

      {/* Controlled Architectural Masking (clean horizontal vignette for crisp readability) */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent w-full md:w-4/5 lg:w-2/3 pointer-events-none z-10" />
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

      {/* Frame Border Details */}
      <div className="absolute top-0 inset-x-0 h-px bg-white/10 z-20 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-border/40 z-20 pointer-events-none" />

      {/* Hero Content Layer */}
      <div className="relative z-20 flex h-full flex-col justify-end pt-24 sm:pt-28 pb-12 sm:pb-16 lg:pb-20">
        <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-8 lg:px-14">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            {/* Left Content Area (Animated smoothly on slide change) */}
            <div
              key={currentItem.id}
              className="max-w-2xl lg:max-w-3xl hero-content-enter"
            >
              {/* Architectural Kicker */}
              <div className="mb-3 flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[11px] sm:text-xs font-mono tracking-[0.25em] uppercase text-accent font-bold">
                  {kicker}
                </span>
                <span className="text-[11px] font-mono text-muted/70 tracking-widest hidden sm:inline">
                  {"//"} 4K DCI HDR
                </span>
              </div>

              {/* Monumental Title */}
              <h1 className="mb-3 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-[0.95] text-cinema-shadow">
                {currentItem.title}
              </h1>

              {/* Clean Typographic Metadata */}
              <div className="mb-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm font-mono text-white/80">
                <span className="text-accent font-bold">
                  ★ {currentItem.rating ? currentItem.rating.toFixed(1) : "8.6"}
                </span>
                <span>·</span>
                <span>{currentItem.release_year}</span>
                <span>·</span>
                <span>{durationOrSeasons}</span>
                <span>·</span>
                <span className="text-foreground/90 uppercase tracking-wider">
                  {currentItem.genres.slice(0, 2).join(" / ")}
                </span>
                <span className="bg-black/80 border border-white/20 text-accent font-mono text-[9px] px-1.5 py-0.5 tracking-wider uppercase rounded">
                  {isFilm ? "FILM" : "SERIES"}
                </span>
                {currentItem.age_rating && (
                  <>
                    <span>·</span>
                    <span className="text-muted border border-border/80 px-1.5 py-0.2 rounded text-[10px]">
                      {currentItem.age_rating}
                    </span>
                  </>
                )}
              </div>

              {/* Tight, Legible Logline */}
              <p className="mb-6 max-w-xl text-xs sm:text-sm md:text-base text-foreground/80 leading-relaxed line-clamp-2 sm:line-clamp-3 font-normal drop-shadow">
                {currentItem.description}
              </p>

              {/* Distinctive High-Contrast CTA System */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {/* PRIMARY CTA: Unmistakable Playback Action */}
                <Link
                  href={watchUrl}
                  className="group flex items-center gap-2.5 rounded-lg bg-white px-7 py-3.5 text-xs sm:text-sm font-black tracking-wider uppercase text-black transition-all hover:bg-accent hover:scale-102 active:scale-98 cta-white-glow shadow-xl"
                >
                  <Play className="h-4 w-4 fill-black group-hover:translate-x-0.5 transition-transform" />
                  <span>{isFilm ? "STREAM FILM" : "STREAM SERIES"}</span>
                </Link>

                {/* SECONDARY CTA: Minimal Frosted Action */}
                <button
                  type="button"
                  onClick={() => toggleMyList(currentItem)}
                  className={`flex items-center gap-2 rounded-lg border px-5 py-3.5 text-xs sm:text-sm font-mono tracking-wider uppercase transition-all backdrop-blur-md active:scale-98 ${
                    inList
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-white/20 bg-black/40 text-white hover:border-white/50 hover:bg-white/10"
                  }`}
                  aria-label={inList ? "In My List" : "Add to My List"}
                >
                  {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  <span>{inList ? "SAVED" : "MY LIST"}</span>
                </button>

                {/* TERTIARY ACTION: Details Page (MUST NOT open Watch) */}
                <Link
                  href={detailsUrl}
                  className="group flex items-center gap-1.5 px-3 py-3.5 text-xs font-mono tracking-widest uppercase text-muted hover:text-white transition-colors"
                >
                  <span>DETAILS</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right Side Carousel Navigation & Indicators */}
            {slides.length > 1 && (
              <div className="flex items-center justify-between sm:justify-end gap-4 lg:pb-2 pt-4 lg:pt-0 border-t border-border/30 sm:border-t-0">
                {/* Dash Indicators */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {slides.map((s, idx) => {
                    const isSelected = idx === safeIndex;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelect(idx)}
                        aria-label={`Go to slide ${idx + 1}: ${s.title}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isSelected
                            ? "w-7 sm:w-9 bg-accent shadow-sm shadow-accent/50"
                            : "w-2.5 sm:w-3 bg-white/25 hover:bg-white/50"
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Numerical Counter */}
                <span className="font-mono text-xs text-muted/80 select-none">
                  <span className="text-white font-bold">{String(safeIndex + 1).padStart(2, "0")}</span>
                  {" / "}
                  <span>{String(slides.length).padStart(2, "0")}</span>
                </span>

                {/* Arrow Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-black/60 border border-white/20 text-white hover:text-accent hover:border-accent hover:bg-black/90 flex items-center justify-center transition-all active:scale-95 backdrop-blur-sm shadow-md"
                    aria-label="Previous title"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-black/60 border border-white/20 text-white hover:text-accent hover:border-accent hover:bg-black/90 flex items-center justify-center transition-all active:scale-95 backdrop-blur-sm shadow-md"
                    aria-label="Next title"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
