import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Play, ArrowLeft, Calendar } from "lucide-react";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { resolveContentById } from "@/lib/catalog/content-resolver";
import { DynamicCatalogService } from "@/lib/tmdb/dynamic-catalog";
import { isMovie, Series, Season } from "@/types/content";

interface SeasonPageProps {
  params: Promise<{ id: string; season: string }>;
}

export default async function SeasonDetailsPage({ params }: SeasonPageProps) {
  const { id, season } = await params;
  const seasonNumber = parseInt(season, 10);

  if (isNaN(seasonNumber) || seasonNumber <= 0) {
    notFound();
  }

  const content = await resolveContentById(id);
  if (!content || isMovie(content)) {
    notFound();
  }

  const series = content as Series;
  const tmdbId = series.tmdb_id || parseInt(series.id.replace(/^(s-|tv-|series-|tmdb-)/, ""), 10);

  let seasonData: Season | null = null;
  if (!isNaN(tmdbId) && tmdbId > 0) {
    seasonData = await DynamicCatalogService.getSeason(tmdbId, seasonNumber, series.backdrop_url);
  }

  if (!seasonData) {
    // Check if season was already in series.seasons
    seasonData = series.seasons?.find((s) => s.season_number === seasonNumber) || null;
  }

  if (!seasonData) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Backdrop Header */}
        <div className="relative h-[45vh] min-h-[360px] w-full overflow-hidden">
          <Image
            src={series.backdrop_url}
            alt={series.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />

          <div className="absolute bottom-8 left-0 right-0 z-10 mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-12">
            <Link
              href={`/tv/${series.id}`}
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-white transition-colors mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to {series.title}</span>
            </Link>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {series.title}: Season {seasonNumber}
            </h1>
            {seasonData.description && (
              <p className="mt-2 max-w-3xl text-sm text-foreground/80 leading-relaxed">
                {seasonData.description}
              </p>
            )}
          </div>
        </div>

        {/* Season Episodes List */}
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-12 pt-8">
          <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold">
                {"//"} SEASON DIRECTORY
              </span>
              <span className="text-muted text-xs">•</span>
              <span className="text-xs text-muted">
                {seasonData.episodes.length} Episodes
              </span>
            </div>

            {/* Quick switcher to other seasons */}
            {series.seasons && series.seasons.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto">
                {series.seasons.map((s) => (
                  <Link
                    key={s.id}
                    href={`/tv/${series.id}/season/${s.season_number}`}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                      s.season_number === seasonNumber
                        ? "bg-accent text-black font-bold"
                        : "bg-surface border border-border/60 text-muted hover:text-white"
                    }`}
                  >
                    S{s.season_number}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {seasonData.episodes.map((ep) => (
              <div
                key={ep.id}
                className="group relative flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-2xl border border-border/50 bg-surface/50 p-4 sm:p-5 transition-all duration-300 hover:border-accent/40 hover:bg-surface/90"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full sm:w-56 lg:w-64 flex-shrink-0 overflow-hidden rounded-xl bg-surface border border-border/40">
                  <Image
                    src={ep.thumbnail_url}
                    alt={ep.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 256px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  <Link
                    href={`/watch/${series.id}?ep=${ep.id}`}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="h-10 w-10 rounded-full bg-accent text-black flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                      <Play className="h-4 w-4 fill-black translate-x-0.5" />
                    </div>
                  </Link>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-baseline justify-between gap-4 mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-accent transition-colors">
                      {ep.episode_number}. {ep.title}
                    </h3>
                    <span className="font-mono text-xs text-muted flex-shrink-0">
                      {ep.duration}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed line-clamp-3 mb-3">
                    {ep.description}
                  </p>

                  <div className="flex items-center gap-4">
                    <Link
                      href={`/watch/${series.id}?ep=${ep.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                    >
                      <Play className="h-3 w-3 fill-accent" />
                      <span>Play Episode</span>
                    </Link>
                    {ep.published_at && (
                      <span className="text-xs text-muted flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {ep.published_at}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
