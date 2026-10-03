"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import MovieCard from "@/components/movies/MovieCard";
import EmptyState from "@/components/ui/EmptyState";
import { ContentItem } from "@/types/content";
import {
  Search as SearchIcon,
  X,
  SlidersHorizontal,
  Film,
  Tv,
  ChevronDown,
  Loader2,
} from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const qParam = searchParams.get("q") || "";
  const typeParam = (searchParams.get("type") || "all") as "all" | "movie" | "tv";

  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<"all" | "movie" | "tv">(
    typeParam === "movie" || typeParam === "tv" ? typeParam : "all"
  );
  const [results, setResults] = useState<ContentItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevQParam, setPrevQParam] = useState(qParam);
  if (qParam !== prevQParam) {
    setPrevQParam(qParam);
    setQuery(qParam);
  }

  const [prevTypeParam, setPrevTypeParam] = useState(typeParam);
  if (typeParam !== prevTypeParam) {
    setPrevTypeParam(typeParam);
    setActiveType(typeParam === "movie" || typeParam === "tv" ? typeParam : "all");
  }

  // Debounced search query
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setPage(1);

      try {
        const cleanQuery = query.trim();
        let endpoint = `/api/catalog/discover?category=popular&type=${activeType}&page=1`;

        if (cleanQuery) {
          endpoint = `/api/catalog/search?q=${encodeURIComponent(cleanQuery)}&type=${activeType}&page=1`;
        }

        const res = await fetch(endpoint);
        if (res.ok && active) {
          const data = await res.json();
          setResults(data.items || []);
          setTotalPages(data.totalPages || 1);
          setTotalResults(data.totalResults || 0);
        } else if (active) {
          throw new Error("Failed to load catalog results");
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to search catalog");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }

      // Update URL search param seamlessly without full page refresh
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (activeType !== "all") params.set("type", activeType);
      const paramStr = params.toString();
      const newUrl = `/search${paramStr ? `?${paramStr}` : ""}`;
      if (typeof window !== "undefined" && window.location.pathname + window.location.search !== newUrl) {
        router.replace(newUrl, { scroll: false });
      }
    }, 280);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, activeType, router]);

  // Handle load more
  const handleLoadMore = async () => {
    if (page >= totalPages || loadingMore || loading) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const cleanQuery = query.trim();
      let endpoint = `/api/catalog/discover?category=popular&type=${activeType}&page=${nextPage}`;

      if (cleanQuery) {
        endpoint = `/api/catalog/search?q=${encodeURIComponent(cleanQuery)}&type=${activeType}&page=${nextPage}`;
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setResults((prev) => {
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
      console.error("Load more search results failed:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-12">
      {/* Search Input Hero Box */}
      <div className="mb-8 pt-4">
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-accent" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search millions of movies, TV shows, actors, directors..."
            className="w-full rounded-2xl border border-border/80 bg-surface/90 py-4 pl-12 pr-12 text-base text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-xl shadow-black/40"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              aria-label="Clear query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Type Filter Buttons */}
        <div className="mt-4 flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-muted pr-1">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Type:
          </span>
          <button
            onClick={() => setActiveType("all")}
            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
              activeType === "all"
                ? "bg-accent text-black shadow-md shadow-accent/20"
                : "border border-border/60 bg-surface/60 text-muted hover:text-white"
            }`}
          >
            All Titles
          </button>
          <button
            onClick={() => setActiveType("movie")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
              activeType === "movie"
                ? "bg-accent text-black shadow-md shadow-accent/20"
                : "border border-border/60 bg-surface/60 text-muted hover:text-white"
            }`}
          >
            <Film className="h-3 w-3" />
            <span>Movies Only</span>
          </button>
          <button
            onClick={() => setActiveType("tv")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
              activeType === "tv"
                ? "bg-accent text-black shadow-md shadow-accent/20"
                : "border border-border/60 bg-surface/60 text-muted hover:text-white"
            }`}
          >
            <Tv className="h-3 w-3" />
            <span>TV Shows Only</span>
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="mb-6 flex items-baseline justify-between border-b border-border/40 pb-3">
        <h2 className="text-lg font-bold text-foreground">
          {query.trim()
            ? `Results for "${query}"`
            : "Popular Catalog Titles"}
        </h2>
        <span className="font-mono text-xs text-muted font-medium">
          {totalResults > 0
            ? `${totalResults.toLocaleString()} results`
            : `${results.length} titles`}
        </span>
      </div>

      {/* Results Grid */}
      {error ? (
        <EmptyState
          title="Search encountered an error"
          description={error}
          actionText="Try Again"
          actionHref="/search"
        />
      ) : loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-xl bg-surface animate-pulse border border-border/40"
            />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title="No matching titles found"
          description={`We couldn't find any movies or series matching "${query}". Try searching with a different title, original name, or keyword.`}
          actionText="Clear Search"
          actionHref="/search"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {results.map((item, idx) => (
              <MovieCard key={`${item.id}-${idx}`} movie={item} priority={idx < 6} />
            ))}
          </div>

          {/* Load More Button */}
          {page < totalPages && (
            <div className="mt-12 flex flex-col items-center justify-center gap-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="group inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-surface/90 px-8 py-3.5 text-sm font-bold text-white transition-all hover:border-accent hover:text-accent disabled:opacity-50 shadow-xl shadow-black/50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    <span>Loading more titles...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Results</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                  </>
                )}
              </button>
              <span className="font-mono text-xs text-muted">
                Page {page} of {totalPages}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <Suspense
          fallback={
            <div className="mx-auto max-w-[1800px] px-4 py-12 text-center text-muted">
              Loading search catalog...
            </div>
          }
        >
          <SearchContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
