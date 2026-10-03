"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Plus, Check, Star, Calendar, Clock, Film } from "lucide-react";
import { Series, Season } from "@/types/content";
import { useUserContent } from "@/lib/context/user-content-context";
import Badge from "@/components/ui/Badge";

export default function SeriesView({ series, initialSeason }: { series: Series; initialSeason?: number }) {
  const { isInList, toggleMyList } = useUserContent();
  const inList = isInList(series.id);

  const [seasons, setSeasons] = useState<Season[]>(series.seasons || []);
  const [activeSeasonNumber, setActiveSeasonNumber] = useState(
    initialSeason || (series.seasons && series.seasons.length > 0 ? series.seasons[0].season_number : 1)
  );
  const [loadingSeason, setLoadingSeason] = useState(false);

  const handleSeasonSelect = async (seasonNum: number) => {
    setActiveSeasonNumber(seasonNum);
    const targetSeason = seasons.find((s) => s.season_number === seasonNum);
    if (!targetSeason || !targetSeason.episodes || targetSeason.episodes.length === 0) {
      setLoadingSeason(true);
      try {
        const res = await fetch(
          `/api/catalog/season?seriesId=${series.tmdb_id || series.id}&season=${seasonNum}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.season) {
            setSeasons((prev) => {
              const existingIdx = prev.findIndex((s) => s.season_number === seasonNum);
              if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx] = data.season;
                return updated;
              }
              return [...prev, data.season].sort((a, b) => a.season_number - b.season_number);
            });
          }
        }
      } catch (err) {
        console.error("Failed to load season episodes:", err);
      } finally {
        setLoadingSeason(false);
      }
    }
  };

  useEffect(() => {
    if (!initialSeason) return;
    const targetSeason = seasons.find((s) => s.season_number === initialSeason);
    if (targetSeason && targetSeason.episodes && targetSeason.episodes.length > 0) return;

    let isMounted = true;
    fetch(`/api/catalog/season?seriesId=${series.tmdb_id || series.id}&season=${initialSeason}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.season) {
          setSeasons((prev) => {
            const existingIdx = prev.findIndex((s) => s.season_number === initialSeason);
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = data.season;
              return updated;
            }
            return [...prev, data.season].sort((a, b) => a.season_number - b.season_number);
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load initial season episodes:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [initialSeason, seasons, series.id, series.tmdb_id]);

  const currentSeason = seasons.find((s) => s.season_number === activeSeasonNumber) || seasons[0];

  return (
    <>
      {/* Full Backdrop */}
      <div className="relative h-[60vh] min-h-[440px] w-full overflow-hidden">
        <Image
          src={series.backdrop_url}
          alt={series.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
      </div>

      {/* Series Metadata Layer */}
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-12 -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          {/* Poster */}
          <div className="w-48 sm:w-60 lg:w-72 aspect-[2/3] relative rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-border/60 bg-surface flex-shrink-0">
            <Image
              src={series.poster_url}
              alt={series.title}
              fill
              sizes="(max-width: 768px) 192px, 288px"
              className="object-cover"
              unoptimized
            />
            {series.is_original && (
              <div className="absolute top-3 left-3 z-10">
                <Badge variant="gold">WEARE ORIGINAL</Badge>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 pt-2 sm:pt-6">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge variant="outline">{series.age_rating}</Badge>
              <Badge variant="accent">{series.total_seasons} Seasons</Badge>
              {series.rating && (
                <span className="flex items-center gap-1 text-accent font-bold text-sm">
                  <Star className="h-4 w-4 fill-accent" />
                  {series.rating.toFixed(1)} / 10
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              {series.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted mb-6">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {series.release_year}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Film className="h-4 w-4" />
                {series.total_episodes} Episodes
              </span>
            </div>

            {/* Genres */}
            {series.genres && series.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {series.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-lg bg-surface px-3 py-1 text-xs font-semibold text-foreground/80 border border-border/60"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            <p className="max-w-3xl text-sm sm:text-base text-foreground/80 leading-relaxed mb-8">
              {series.description}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              {currentSeason?.episodes?.[0] ? (
                <Link
                  href={`/watch/${series.id}?ep=${currentSeason.episodes[0].id}`}
                  className="flex items-center gap-2.5 rounded-xl bg-accent px-8 py-3.5 text-sm sm:text-base font-bold text-black transition-all hover:bg-accent-hover active:scale-95 shadow-xl shadow-accent/20"
                >
                  <Play className="h-5 w-5 fill-black" />
                  <span>Play Episode</span>
                </Link>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-muted cursor-not-allowed"
                >
                  <span>Episodes Coming Soon</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => toggleMyList(series)}
                className={`flex items-center gap-2 rounded-xl border px-6 py-3.5 text-sm sm:text-base font-semibold backdrop-blur-md transition-all active:scale-95 ${
                  inList
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-border/80 bg-surface/80 text-white hover:bg-surface"
                }`}
              >
                {inList ? <Check className="h-5 w-5 stroke-[2.5]" /> : <Plus className="h-5 w-5" />}
                <span>{inList ? "In My List" : "Add to My List"}</span>
              </button>
            </div>

            {/* Starring / Cast */}
            {series.cast && series.cast.length > 0 && (
              <div className="border-t border-border/40 pt-4 max-w-2xl">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                  Starring
                </h3>
                <p className="text-sm text-foreground/90 font-medium">
                  {series.cast.join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Season Selector Tabs */}
        <div className="mt-14 border-t border-border/40 pt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Episodes</h2>

            {/* Season buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {seasons.map((season) => (
                <button
                  key={season.id}
                  onClick={() => handleSeasonSelect(season.season_number)}
                  className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                    activeSeasonNumber === season.season_number
                      ? "bg-accent text-black shadow-md shadow-accent/20"
                      : "bg-surface border border-border/60 text-muted hover:text-white"
                  }`}
                >
                  Season {season.season_number}
                </button>
              ))}
            </div>
          </div>

          {/* Episode List */}
          {loadingSeason ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 rounded-2xl border border-border/40 bg-surface/40 p-4 sm:p-5 animate-pulse"
                >
                  <div className="aspect-video w-36 sm:w-44 rounded-xl bg-surface/80 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-24 bg-surface/80 rounded" />
                    <div className="h-5 w-48 bg-surface/80 rounded" />
                    <div className="h-3 w-full max-w-md bg-surface/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : currentSeason?.episodes && currentSeason.episodes.length > 0 ? (
            <div className="space-y-4">
              {currentSeason.episodes.map((ep) => (
                <div
                  key={ep.id}
                  className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 rounded-2xl border border-border/40 bg-surface/40 p-4 sm:p-5 hover:border-accent/40 hover:bg-surface/80 transition-all duration-200"
                >
                  <div className="flex items-start sm:items-center gap-4 flex-1">
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-36 sm:w-44 flex-shrink-0 rounded-xl overflow-hidden bg-surface border border-border/40">
                      <Image
                        src={ep.thumbnail_url}
                        alt={ep.title}
                        fill
                        sizes="176px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                      <Link
                        href={`/watch/${series.id}?ep=${ep.id}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Play episode ${ep.episode_number}`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-black shadow-lg">
                          <Play className="h-5 w-5 fill-black translate-x-0.5" />
                        </div>
                      </Link>
                    </div>

                    {/* Episode details */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-accent">
                          EPISODE {ep.episode_number}
                        </span>
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {ep.duration}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-accent transition-colors">
                        {ep.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-foreground/70 line-clamp-2 max-w-2xl">
                        {ep.description}
                      </p>
                    </div>
                  </div>

                  {/* Play Button */}
                  <Link
                    href={`/watch/${series.id}?ep=${ep.id}`}
                    className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-2.5 text-xs font-bold text-white hover:bg-white hover:text-black hover:border-white transition-all active:scale-95"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Play Episode</span>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted text-sm border border-border/20 rounded-2xl bg-surface/20">
              No episodes available for Season {activeSeasonNumber}.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
