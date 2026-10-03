"use client";

import { useState } from "react";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import MovieCard from "@/components/movies/MovieCard";
import EmptyState from "@/components/ui/EmptyState";
import { useUserContent } from "@/lib/context/user-content-context";
import { isMovie } from "@/types/content";
import { Bookmark, Film, Tv, Play } from "lucide-react";
import Link from "next/link";

type ListTab = "all" | "movies" | "series";

export default function MyListPage() {
  const { myList } = useUserContent();
  const [activeTab, setActiveTab] = useState<ListTab>("all");

  const filteredItems = myList.filter((item) => {
    if (activeTab === "movies") return isMovie(item.content);
    if (activeTab === "series") return !isMovie(item.content);
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-12">
          {/* Header */}
          <div className="mb-6 border-b border-border/40 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Bookmark className="h-5 w-5 text-accent" />
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                  My List
                </h1>
              </div>
              <p className="text-sm text-muted">
                Your personally curated queue of movies, series, and upcoming watchlists
              </p>
            </div>

            {myList.length > 0 && (
              <span className="rounded-full bg-surface border border-border px-3.5 py-1 text-xs font-semibold text-accent self-start sm:self-auto">
                {myList.length} {myList.length === 1 ? "title saved" : "titles saved"}
              </span>
            )}
          </div>

          {/* Type Filter Tabs (All / Movies / Series) */}
          {myList.length > 0 && (
            <div className="mb-8 flex items-center gap-2 border-b border-border/30 pb-4">
              <button
                onClick={() => setActiveTab("all")}
                className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                  activeTab === "all"
                    ? "bg-accent text-black shadow-md shadow-accent/20"
                    : "bg-surface border border-border/60 text-muted hover:text-white"
                }`}
              >
                All Content ({myList.length})
              </button>
              <button
                onClick={() => setActiveTab("movies")}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                  activeTab === "movies"
                    ? "bg-accent text-black shadow-md shadow-accent/20"
                    : "bg-surface border border-border/60 text-muted hover:text-white"
                }`}
              >
                <Film className="h-3.5 w-3.5" />
                <span>Movies ({myList.filter((i) => isMovie(i.content)).length})</span>
              </button>
              <button
                onClick={() => setActiveTab("series")}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                  activeTab === "series"
                    ? "bg-accent text-black shadow-md shadow-accent/20"
                    : "bg-surface border border-border/60 text-muted hover:text-white"
                }`}
              >
                <Tv className="h-3.5 w-3.5" />
                <span>Series ({myList.filter((i) => !isMovie(i.content)).length})</span>
              </button>
            </div>
          )}

          {/* List Content Grid */}
          {myList.length === 0 ? (
            <div className="py-12">
              <EmptyState
                title="Your list is empty"
                description="Explore movies and series in the catalog, then click '+ Add to List' to queue titles here for later."
                actionText="Browse Movies"
                actionHref="/movies"
                icon={<Bookmark className="h-7 w-7 text-accent" />}
              />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted mb-4">
                No {activeTab} in your list yet.
              </p>
              <Link
                href={activeTab === "movies" ? "/movies" : "/series"}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-black hover:bg-accent-hover"
              >
                <Play className="h-3.5 w-3.5 fill-black" />
                <span>Explore {activeTab === "movies" ? "Movies" : "Series"}</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {filteredItems.map((item) => (
                <MovieCard key={item.id} movie={item.content} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
