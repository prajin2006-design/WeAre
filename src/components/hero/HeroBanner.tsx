"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Plus, Check, ArrowRight } from "lucide-react";
import { Movie } from "@/types/content";
import { useUserContent } from "@/lib/context/user-content-context";

interface HeroBannerProps {
  movie: Movie;
}

export default function HeroBanner({ movie }: HeroBannerProps) {
  const { isInList, toggleMyList } = useUserContent();
  const inList = isInList(movie.id);
  const [backdropSrc, setBackdropSrc] = useState(movie.backdrop_url);

  const watchUrl = `/watch/${movie.id}`;
  const detailsUrl = `/movie/${movie.id}`;

  return (
    <section className="relative min-h-[560px] sm:min-h-[620px] h-[82vh] max-h-[850px] w-full overflow-hidden bg-black select-none">
      {/* Full Bleed Backdrop Stills */}
      <div className="absolute inset-0">
        <Image
          src={backdropSrc}
          alt={movie.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-80"
          unoptimized
          onError={() => setBackdropSrc("https://picsum.photos/seed/weare-backdrop/1920/1080")}
        />
      </div>

      {/* Controlled Architectural Masking (clean horizontal vignette for crisp readability) */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent w-full md:w-4/5 lg:w-2/3" />
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-background to-transparent" />

      {/* Frame Border Details */}
      <div className="absolute top-0 inset-x-0 h-px bg-white/10 z-20" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-border/40 z-20" />

      {/* Hero Content Layer */}
      <div className="relative z-10 flex h-full flex-col justify-end pt-24 sm:pt-28 pb-12 sm:pb-16 lg:pb-20">
        <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-8 lg:px-14">
          <div className="max-w-2xl lg:max-w-3xl">
            {/* Architectural Kicker */}
            <div className="mb-3 flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] sm:text-xs font-mono tracking-[0.25em] uppercase text-accent font-bold">
                {movie.is_original ? "WEARE ORIGINAL PRODUCTION" : "SPOTLIGHT SELECTION"}
              </span>
              <span className="text-[11px] font-mono text-muted/70 tracking-widest hidden sm:inline">
                {"//"} 4K DCI CINEMA
              </span>
            </div>

            {/* Monumental Title */}
            <h1 className="mb-3 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-[0.95] text-cinema-shadow">
              {movie.title}
            </h1>

            {/* Clean Typographic Metadata (No pill clutter) */}
            <div className="mb-3.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs sm:text-sm font-mono text-white/80">
              <span className="text-accent font-bold">
                ★ {movie.rating ? movie.rating.toFixed(1) : "8.7"}
              </span>
              <span>·</span>
              <span>{movie.release_year}</span>
              <span>·</span>
              <span>{movie.duration}</span>
              <span>·</span>
              <span className="text-foreground/90 uppercase tracking-wider">
                {movie.genres.slice(0, 2).join(" / ")}
              </span>
              {movie.age_rating && (
                <>
                  <span>·</span>
                  <span className="text-muted border border-border/80 px-1.5 py-0.2 rounded text-[10px]">
                    {movie.age_rating}
                  </span>
                </>
              )}
            </div>

            {/* Tight, Legible Logline */}
            <p className="mb-6 max-w-xl text-xs sm:text-sm md:text-base text-foreground/80 leading-relaxed line-clamp-2 sm:line-clamp-3 font-normal drop-shadow">
              {movie.description}
            </p>

            {/* Distinctive High-Contrast CTA System */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* PRIMARY CTA: Unmistakable Visual Focal Point */}
              <Link
                href={watchUrl}
                className="group flex items-center gap-2.5 rounded-lg bg-white px-7 py-3.5 text-xs sm:text-sm font-black tracking-wider uppercase text-black transition-all hover:bg-accent hover:scale-102 active:scale-98 cta-white-glow shadow-xl"
              >
                <Play className="h-4 w-4 fill-black group-hover:translate-x-0.5 transition-transform" />
                <span>STREAM FILM</span>
              </Link>

              {/* SECONDARY CTA: Minimal Frosted Action */}
              <button
                type="button"
                onClick={() => toggleMyList(movie)}
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

              {/* TERTIARY ACTION: Discreet Editorial Link */}
              <Link
                href={detailsUrl}
                className="group flex items-center gap-1.5 px-3 py-3.5 text-xs font-mono tracking-widest uppercase text-muted hover:text-white transition-colors"
              >
                <span>DETAILS</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
