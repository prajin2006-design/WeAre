"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { ContentService, SystemMetrics } from "@/lib/database/content-service";
import { Movie } from "@/types/content";
import {
  Shield,
  Film,
  Tv,
  Plus,
  Trash2,
  Database,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Play,
  Layers,
  Sparkles,
  Loader2,
  Video,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  // New movie form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newYear, setNewYear] = useState(2025);
  const [newDuration, setNewDuration] = useState("2h 10m");
  const [newAgeRating, setNewAgeRating] = useState("PG-13");
  const [newRating, setNewRating] = useState(8.5);
  const [newGenres, setNewGenres] = useState("Sci-Fi, Action");
  const [newPoster, setNewPoster] = useState("https://picsum.photos/seed/admin-movie/600/900");
  const [newBackdrop, setNewBackdrop] = useState("https://picsum.photos/seed/admin-bg/1920/1080");
  const [newVideoUrl, setNewVideoUrl] = useState(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
  );
  const [isOriginal, setIsOriginal] = useState(true);

  const refreshCatalog = async () => {
    setLoading(true);
    const m = await ContentService.getMetrics();
    const movieList = await ContentService.getPopularMovies();
    setMetrics(m);
    setMovies(movieList);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([
      ContentService.getMetrics(),
      ContentService.getPopularMovies(),
    ]).then(([m, list]) => {
      if (mounted) {
        setMetrics(m);
        setMovies(list);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await ContentService.addMovie({
      title: newTitle.trim(),
      description: newDescription.trim() || "A cinematic journey by WeAre Productions.",
      release_year: Number(newYear),
      duration: newDuration,
      duration_seconds: 7800,
      age_rating: newAgeRating,
      rating: Number(newRating),
      genres: newGenres.split(",").map((g) => g.trim()).filter(Boolean),
      poster_url: newPoster,
      backdrop_url: newBackdrop,
      video_url: newVideoUrl,
      language: "English",
      cast: ["WeAre Ensemble"],
      director: "WeAre Studio",
      is_featured: false,
      is_published: true,
      is_original: isOriginal,
    });

    setShowAddModal(false);
    // Reset form
    setNewTitle("");
    setNewDescription("");
    await refreshCatalog();
  };

  const handleDeleteMovie = async (id: string) => {
    if (confirm("Are you sure you want to remove this movie from the catalog?")) {
      await ContentService.deleteMovie(id);
      await refreshCatalog();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-12">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-6 w-6 text-accent" />
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-sm text-muted">
                Manage WeAre catalog, monitor streaming metrics, and view database status
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    setImporting(true);
                    setImportFeedback(null);
                    const res = await fetch("/api/admin/import", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: "all", movieLimit: 20, seriesLimit: 10 }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setImportFeedback(`Error: ${data.error || "Import failed"}`);
                    } else if (data.moviesImported !== undefined || data.seriesImported !== undefined) {
                      setImportFeedback(`Imported ${data.moviesImported ?? 0} movies and ${data.seriesImported ?? 0} series`);
                      await refreshCatalog();
                    } else {
                      setImportFeedback(`Success: ${data.message || "Import completed"}`);
                      await refreshCatalog();
                    }
                  } catch (err: unknown) {
                    setImportFeedback(`Error: Network error requesting TMDB import (${err instanceof Error ? err.message : String(err)})`);
                  } finally {
                    setImporting(false);
                  }
                }}
                disabled={importing}
                className="inline-flex items-center gap-2 rounded-xl border border-on-primary bg-surface/80 px-5 py-3 text-xs sm:text-sm font-bold text-foreground hover:border-accent hover:text-accent hover:bg-accent/10 active:scale-95 transition-all disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                ) : (
                  <Sparkles className="h-4 w-4 text-accent" />
                )}
                <span>{importing ? "Importing TMDB (20 movies, 10 series)..." : "Import from TMDB"}</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-xs sm:text-sm font-bold text-black hover:bg-accent-hover active:scale-95 transition-all shadow-lg shadow-accent/20"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Movie</span>
              </button>
            </div>
          </div>

          {importFeedback && (
            <div className="mb-6 rounded-xl border border-white/15 bg-white/5 p-4 text-xs font-semibold text-white flex items-center justify-between">
              <span>{importFeedback}</span>
              <button
                onClick={() => setImportFeedback(null)}
                className="text-foreground-muted hover:text-white ml-4 text-xs underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Database Connection Status Card */}
          <div className="mb-8 rounded-2xl border border-border/60 bg-surface/50 p-6 backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                    metrics?.isSupabaseConnected
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-400"
                  }`}
                >
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Database Status:</h3>
                    {metrics?.isSupabaseConnected ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Connected to Supabase PostgreSQL
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        Development In-Memory Store Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-1 max-w-2xl leading-relaxed">
                    {metrics?.isSupabaseConnected
                      ? "Your production Supabase instance is live. Content mutations, authentication, and progress updates write directly to your cloud PostgreSQL database."
                      : "Operating in development store mode. Connect Supabase by populating NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to persist data in cloud tables."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  onClick={(e) => {
                    e.preventDefault();
                    refreshCatalog();
                  }}
                  className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-white hover:bg-surface-hover transition-colors"
                >
                  Refresh Data
                </Link>
              </div>
            </div>
          </div>

          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="rounded-2xl border border-border/40 bg-surface/40 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted uppercase">Total Movies</span>
                <Film className="h-4 w-4 text-accent" />
              </div>
              <p className="text-3xl font-black text-white">{metrics?.totalMovies ?? "—"}</p>
              <p className="text-[11px] text-muted mt-1">Feature length films</p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-surface/40 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted uppercase">Total Series</span>
                <Tv className="h-4 w-4 text-accent" />
              </div>
              <p className="text-3xl font-black text-white">{metrics?.totalSeries ?? "—"}</p>
              <p className="text-[11px] text-muted mt-1">Episodic originals & shows</p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-surface/40 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted uppercase">Total Episodes</span>
                <Layers className="h-4 w-4 text-accent" />
              </div>
              <p className="text-3xl font-black text-white">{metrics?.totalEpisodes ?? "—"}</p>
              <p className="text-[11px] text-muted mt-1">Across all seasons</p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-surface/40 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted uppercase">Genres</span>
                <Shield className="h-4 w-4 text-accent" />
              </div>
              <p className="text-3xl font-black text-white">{metrics?.totalGenres ?? "—"}</p>
              <p className="text-[11px] text-muted mt-1">Catalog taxonomy tags</p>
            </div>
          </div>

          {/* Catalog Content Management Table */}
          <div className="rounded-2xl border border-border/60 bg-surface/40 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Movie Catalog Management</h2>
              <span className="text-xs text-muted font-medium">{movies.length} published titles</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface/80 text-muted uppercase tracking-wider border-b border-border/40 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Title</th>
                    <th className="py-3.5 px-4">Year</th>
                    <th className="py-3.5 px-4">Rating</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Genres</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-foreground/90">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted">
                        Loading catalog data...
                      </td>
                    </tr>
                  ) : movies.map((movie) => (
                    <tr key={movie.id} className="hover:bg-surface/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{movie.title}</span>
                          {movie.is_original && (
                            <span className="rounded bg-accent/20 text-accent px-1.5 py-0.2 text-[9px] font-bold">
                              ORIGINAL
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted">{movie.release_year}</td>
                      <td className="py-3.5 px-4 font-bold text-accent">★ {movie.rating}</td>
                      <td className="py-3.5 px-4 text-muted">{movie.duration}</td>
                      <td className="py-3.5 px-4 text-muted">{movie.genres.join(", ")}</td>
                      <td className="py-3.5 px-4 text-muted">Feature Film</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/content/${movie.id}/sources`}
                            className="p-1.5 text-muted hover:text-cyan-400 transition-colors"
                            title="Manage Authorized Sources"
                          >
                            <Video className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/watch/${movie.id}`}
                            className="p-1.5 text-muted hover:text-white transition-colors"
                            title="Test Player Stream"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/movie/${movie.id}`}
                            className="p-1.5 text-muted hover:text-white transition-colors"
                            title="View Page"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteMovie(movie.id)}
                            className="p-1.5 text-red-400/80 hover:text-red-400 transition-colors"
                            title="Delete Title"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add Movie Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Add New Movie to WeAre</h2>
            <p className="text-xs text-muted mb-4">
              Enter title metadata. The title will immediately become searchable and playable.
            </p>

            <form onSubmit={handleCreateMovie} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Celestial Mirage"
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Plot summary..."
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Year</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Duration</label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Genres (comma separated)</label>
                  <input
                    type="text"
                    value={newGenres}
                    onChange={(e) => setNewGenres(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Age Rating</label>
                  <select
                    value={newAgeRating}
                    onChange={(e) => setNewAgeRating(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent"
                  >
                    <option value="G">G</option>
                    <option value="PG">PG</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                    <option value="TV-MA">TV-MA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Poster URL</label>
                  <input
                    type="url"
                    value={newPoster}
                    onChange={(e) => setNewPoster(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Backdrop URL</label>
                  <input
                    type="url"
                    value={newBackdrop}
                    onChange={(e) => setNewBackdrop(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Video Stream URL (MP4 or HLS .m3u8)</label>
                <input
                  type="url"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="original-check"
                  checked={isOriginal}
                  onChange={(e) => setIsOriginal(e.target.checked)}
                  className="rounded border-border accent-accent"
                />
                <label htmlFor="original-check" className="text-xs text-foreground cursor-pointer">
                  Mark as WeAre Original Title
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-on-primary px-4 py-2 text-xs font-semibold text-foreground hover:border-accent hover:text-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-accent px-5 py-2 text-xs font-bold text-black hover:bg-accent-hover transition-all"
                >
                  Save and Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
