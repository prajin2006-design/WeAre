"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import MovieCard from "@/components/movies/MovieCard";
import { ContentItem } from "@/types/content";
import { Sparkles, TrendingUp, Calendar, Flame, Star, ChevronDown, Loader2 } from "lucide-react";

type TabKey = "trending" | "new" | "popular" | "top";

export default function NewPopularPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("trending");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setPage(1);
      try {
        let category = "popular";
        if (activeTab === "trending") category = "trending";
        else if (activeTab === "new") category = "now-playing";
        else if (activeTab === "popular") category = "popular";
        else if (activeTab === "top") category = "top-rated";

        const res = await fetch(`/api/catalog/discover?category=${category}&type=all&page=1`);
        if (res.ok && active) {
          const json = await res.json();
          setItems(json.items || []);
          setTotalPages(json.totalPages || 1);
        }
      } catch (err) {
        console.error("Failed to load new and popular items:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [activeTab]);

  const handleLoadMore = async () => {
    if (page >= totalPages || loadingMore || loading) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      let category = "popular";
      if (activeTab === "trending") category = "trending";
      else if (activeTab === "new") category = "now-playing";
      else if (activeTab === "popular") category = "popular";
      else if (activeTab === "top") category = "top-rated";

      const res = await fetch(`/api/catalog/discover?category=${category}&type=all&page=${nextPage}`);
      if (res.ok) {
        const json = await res.json();
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const newItems = (json.items || []).filter(
            (item: ContentItem) => !existingIds.has(item.id)
          );
          return [...prev, ...newItems];
        });
        setPage(nextPage);
        setTotalPages(json.totalPages || 1);
      }
    } catch (err) {
      console.error("Load more failed in new-popular:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: "trending",
      label: "Trending Now",
      icon: <TrendingUp className="h-4 w-4" />,
      desc: "The most-streamed titles gaining momentum across WeAre today",
    },
    {
      key: "new",
      label: "New Releases",
      icon: <Calendar className="h-4 w-4" />,
      desc: "Brand new additions, world premieres, and newly debuted series",
    },
    {
      key: "popular",
      label: "Popular This Week",
      icon: <Flame className="h-4 w-4" />,
      desc: "Weekly top charts driven by viewer ratings and completed sessions",
    },
    {
      key: "top",
      label: "Top Rated",
      icon: <Star className="h-4 w-4" />,
      desc: "Critically acclaimed cinema and highest audience-scored titles",
    },
  ];

  const currentTabInfo = tabs.find((t) => t.key === activeTab) || tabs[0];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-12">
          {/* Header */}
          <div className="mb-8 border-b border-border/40 pb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                New & Popular
              </h1>
            </div>
            <p className="text-sm text-muted">
              Discover what’s hot, recently added, and trending across the globe
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap active:scale-95 ${
                  activeTab === tab.key
                    ? "bg-accent text-black shadow-lg shadow-accent/20"
                    : "border border-border/60 bg-surface/50 text-muted hover:text-white hover:border-border"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Description Banner */}
          <div className="mb-6 flex items-baseline justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{currentTabInfo.label}</h2>
              <p className="text-xs text-muted mt-0.5">{currentTabInfo.desc}</p>
            </div>
            <span className="text-xs text-muted font-medium">
              {items.length} titles
            </span>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] rounded-xl bg-surface animate-pulse border border-border/40"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {items.map((item) => (
                  <MovieCard key={item.id} movie={item} />
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
      </main>

      <Footer />
    </div>
  );
}
