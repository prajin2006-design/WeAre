"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Bookmark } from "lucide-react";
import { ContentItem, isMovie } from "@/types/content";
import { useUserContent } from "@/lib/context/user-content-context";

interface MovieCardProps {
  movie: ContentItem;
  priority?: boolean;
}

export default function MovieCard({ movie, priority = false }: MovieCardProps) {
  const { isInList, toggleMyList } = useUserContent();
  const inList = isInList(movie.id);
  const [imgSrc, setImgSrc] = useState(movie.poster_url);

  const detailsUrl = isMovie(movie) ? `/movie/${movie.id}` : `/series/${movie.id}`;

  return (
    <div className="group/card relative flex-shrink-0 cursor-pointer select-none">
      {/* Poster Frame */}
      <div className="relative aspect-[2/3] w-36 sm:w-44 md:w-48 lg:w-52 overflow-hidden rounded-md bg-surface border border-border/50 transition-all duration-300 ease-out group-hover/card:border-accent/60 group-hover/card:shadow-xl group-hover/card:shadow-black">
        <Image
          src={imgSrc}
          alt={movie.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 144px, (max-width: 768px) 176px, (max-width: 1024px) 192px, 208px"
          className="object-cover transition-transform duration-500 group-hover/card:scale-105"
          unoptimized
          onError={() => setImgSrc("https://picsum.photos/seed/weare-fallback/600/900")}
        />

        {/* Minimal Stamp for Originals */}
        {movie.is_original && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-black/90 border border-white/20 text-accent font-mono text-[9px] px-1.5 py-0.5 tracking-widest uppercase rounded">
              ORIGINAL
            </span>
          </div>
        )}

        {/* Quick Save Bookmark */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMyList(movie);
          }}
          className={`absolute top-2 right-2 z-20 h-7 w-7 rounded flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all ${
            inList
              ? "bg-accent text-black opacity-100"
              : "bg-black/70 text-white hover:bg-black"
          }`}
          title={inList ? "In My List" : "Save to List"}
        >
          <Bookmark className="h-3.5 w-3.5 fill-current" />
        </button>

        {/* Poster Click Overlay Trigger */}
        <Link
          href={detailsUrl}
          className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover/card:opacity-100 transition-opacity"
          aria-label={`View details for ${movie.title}`}
        >
          <div className="h-11 w-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transition-transform hover:scale-115 active:scale-95">
            <Play className="h-4 w-4 fill-black translate-x-0.5" />
          </div>
        </Link>
      </div>

      {/* Typographic Metadata below card (clean, scannable) */}
      <div className="pt-2.5 max-w-[144px] sm:max-w-[176px] md:max-w-[192px] lg:max-w-[208px]">
        <Link href={detailsUrl}>
          <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover/card:text-accent transition-colors">
            {movie.title}
          </h3>
        </Link>
        <div className="flex items-center justify-between text-[11px] font-mono text-muted mt-0.5">
          <span>{movie.release_year}</span>
          {movie.rating && (
            <span className="text-accent font-semibold">
              ★ {movie.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
