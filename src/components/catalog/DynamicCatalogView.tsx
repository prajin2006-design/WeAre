"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import MovieCard from "@/components/movies/MovieCard";
import { ContentItem } from "@/types/content";
import {
  Film,
  Tv,
  Flame,
  Star,
  Clock,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Loader2,
  RefreshCw,
} from "lucide-react";

export type CatalogContentType = "movie" | "tv";

interface DynamicCatalogViewProps {
  initialType: CatalogContentType;
  initialCategory: string;
  title: string;
  subtitle: string;
}

interface GenreOption {
  id: number;
  name: string;
}

const MOVIE_CATEGORIES = [
  { slug: "popular", label: "Popular", icon: Sparkles, path: "/movies/popular" },
  { slug: "trending", label: "Trending", icon: Flame, path: "/movies/trending" },
  { slug: "top-rated", label: "Top Rated", icon: Star, path: "/movies/top-rated" },
  { slug: "now-playing", label: "Now Playing", icon: Clock, path: "/movies/now-playing" },
  { slug: "upcoming", label: "Upcoming", icon: Film, path: "/movies/upcoming" },
];

const TV_CATEGORIES = [
  { slug: "popular", label: "Popular", icon: Sparkles, path: "/tv/popular" },
  { slug: "trending", label: "Trending", icon: Flame, path: "/tv/trending" },
  { slug: "top-rated", label: "Top Rated", icon: Star, path: "/tv/top-rated" },
];

export default function DynamicCatalogView({
  initialType,
  initialCategory,
  title,
  subtitle,
}: DynamicCatalogViewProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);

  // Load genres
  useEffect(() => {
    let active = true;
    async function fetchGenres() {
      try {
        const res = await fetch(`/api/catalog/genres?type=${initialType}`);
        if (res.ok && active) {
          const data = await res.json();
          setGenres(data.genres || []);
        }
      } catch {
        // Fallback silently
      }
    }
    fetchGenres();
    return () => {
      active = false;
    };
  }, [initialType]);

  // Load catalog items on mount or when filters change
  useEffect(() => {
    let active = true;

    async function fetchCatalog() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          type: initialType,
          category: initialCategory,
          page: "1",
        });

        if (selectedGenre) {
          params.set("genre", String(selectedGenre));
        }

        const res = await fetch(`/api/catalog/discover?${params.toString()}`);
        if (res.ok && active) {
          const data = await res.json();
          setItems(data.items || []);
          setPage(1);
          setTotalPages(data.totalPages || 1);
          setTotalResults(data.totalResults || 0);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic catalog:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchCatalog();

    return () => {
      active = false;
    };
  }, [initialType, initialCategory, selectedGenre]);

  // Load more handler
  const handleLoadMore = useCallback(async () => {
    if (page >= totalPages || loadingMore || loading) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        type: initialType,
        category: initialCategory,
        page: String(nextPage),
      });

      if (selectedGenre) {
        params.set("genre", String(selectedGenre));
      }

      const res = await fetch(`/api/catalog/discover?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const newItems = (data.items || []).filter(
            (item: ContentItem) => !existingIds.has(item.id)
          );
          return [...prev, ...newItems];
        });
        setPage(nextPage);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Load more failed:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [initialType, initialCategory, selectedGenre, page, totalPages, loadingMore, loading]);

  const categories = initialType === "movie" ? MOVIE_CATEGORIES : TV_CATEGORIES;

  return (
    <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-12 pt-24 sm:pt-28 pb-20">
      {/* Catalog Header */}
      <div className="border-b border-border/40 pb-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold">
                {"//"} TMDB GLOBAL REGISTRY
              </span>
              <span className="text-muted text-xs">•</span>
              <span className="font-mono text-xs text-muted">
                {totalResults > 0
                  ? `${totalResults.toLocaleString()} Titles Available`
                  : "Streaming Worldwide"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-muted mt-1 max-w-2xl">
              {subtitle}
            </p>
          </div>

          {/* Quick Type Switcher (Movies vs TV) */}
          <div className="flex items-center rounded-xl border border-border/60 bg-surface/80 p-1 backdrop-blur-md">
            <Link
              href="/movies"
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                initialType === "movie"
                  ? "bg-accent text-black shadow-md shadow-accent/20"
                  : "text-muted hover:text-white"
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>Movies</span>
            </Link>
            <Link
              href="/tv"
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                initialType === "tv"
                  ? "bg-accent text-black shadow-md shadow-accent/20"
                  : "text-muted hover:text-white"
              }`}
            >
              <Tv className="h-3.5 w-3.5" />
              <span>TV Shows</span>
            </Link>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isCurrent = initialCategory === cat.slug;
            return (
              <Link
                key={cat.slug}
                href={cat.path}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  isCurrent
                    ? "bg-white text-black shadow-lg"
                    : "border border-border/60 bg-surface/60 text-muted hover:text-white hover:border-border"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isCurrent ? "text-black" : "text-accent"}`} />
                <span>{cat.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Genre Filter Chips */}
        {genres.length > 0 && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-muted pr-2 flex-shrink-0">
              <SlidersHorizontal className="h-3 w-3" />
              Genre:
            </span>
            <button
              onClick={() => setSelectedGenre(null)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                selectedGenre === null
                  ? "bg-accent/20 border border-accent text-accent font-bold"
                  : "border border-border/50 bg-surface/50 text-muted hover:text-white"
              }`}
            >
              All Genres
            </button>
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g.id === selectedGenre ? null : g.id)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedGenre === g.id
                    ? "bg-accent text-black font-bold shadow-md shadow-accent/20"
                    : "border border-border/50 bg-surface/50 text-muted hover:text-white"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="aspect-[2/3] w-full rounded-xl bg-surface border border-border/30" />
              <div className="h-3.5 w-3/4 rounded bg-surface/80" />
              <div className="h-3 w-1/2 rounded bg-surface/50" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <Film className="mx-auto h-12 w-12 text-muted/40 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No titles found</h3>
          <p className="text-sm text-muted mb-4">
            Try choosing a different genre or clearing current filters.
          </p>
          {selectedGenre && (
            <button
              onClick={() => setSelectedGenre(null)}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-black hover:bg-accent-hover transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {items.map((item, idx) => (
              <MovieCard key={`${item.id}-${idx}`} movie={item} priority={idx < 6} />
            ))}
          </div>

          {/* Pagination / Infinite Scroll Trigger */}
          {page < totalPages && (
            <div className="mt-14 flex flex-col items-center justify-center gap-3">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="group inline-flex items-center gap-2.5 rounded-2xl border border-border/80 bg-surface/90 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:border-accent hover:bg-surface hover:text-accent disabled:opacity-50 shadow-xl shadow-black/50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    <span>Loading next page...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Titles</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                  </>
                )}
              </button>

              <span className="font-mono text-xs text-muted">
                Showing page {page} of {totalPages}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
