import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Play, Film } from "lucide-react";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import ContentRow from "@/components/movies/ContentRow";
import MovieDetailActions from "./actions";
import { ContentService } from "@/lib/content/content-service";
import { resolveContentById } from "@/lib/catalog/content-resolver";
import { VideoSourceService } from "@/lib/video/video-source-service";

import { getMovieRecommendations } from "@/lib/tmdb/movies";
import { getTMDBPosterUrl, getTMDBBackdropUrl } from "@/lib/tmdb/images";
import { ContentItem } from "@/types/content";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export default async function MovieDetailsPage({ params }: MoviePageProps) {
  const { id } = await params;
  const content = await resolveContentById(id, "movie");

  if (!content) {
    notFound();
  }

  const primaryGenre = content.genres[0] || "Action";

  const [hasPlayableSource, generalRecommended] = await Promise.all([
    VideoSourceService.hasPlayableSource(content.id, "movie", content.tmdb_id),
    ContentService.getRecommended(content.id),
  ]);

  let similarMovies: ContentItem[] = [];
  if (content.tmdb_id) {
    try {
      const tmdbRecs = await getMovieRecommendations(content.tmdb_id);
      if (tmdbRecs && tmdbRecs.length > 0) {
        similarMovies = tmdbRecs.slice(0, 8).map((m) => ({
          id: String(m.id),
          tmdb_id: m.id,
          title: m.title,
          description: m.overview || '',
          release_year: m.release_date ? new Date(m.release_date).getFullYear() : 2025,
          duration: '2h 00m',
          duration_seconds: 7200,
          age_rating: m.adult ? 'R' : 'PG-13',
          rating: Number(m.vote_average.toFixed(1)),
          genres: [primaryGenre],
          poster_url: getTMDBPosterUrl(m.poster_path, 'w500', `rec-${m.id}`),
          backdrop_url: getTMDBBackdropUrl(m.backdrop_path, 'w1280', `rec-bg-${m.id}`),
          video_url: '',
          language: m.original_language || 'English',
          cast: ['TMDB Ensemble'],
          director: 'Featured Director',
          is_featured: false,
          is_published: true,
          is_original: false,
          created_at: new Date().toISOString(),
        }));
      }
    } catch {
      // Fallback below
    }
  }

  if (similarMovies.length === 0) {
    similarMovies = await ContentService.getByGenre(primaryGenre).then((res) =>
      res.filter((m) => m.id !== content.id).slice(0, 8)
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Full-width Backdrop Hero Header */}
        <div className="relative h-[65vh] min-h-[480px] w-full overflow-hidden">
          <Image
            src={content.backdrop_url}
            alt={content.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        </div>

        {/* Content Details Layer */}
        <div className="mx-auto max-w-[1800px] px-4 sm:px-8 lg:px-14 -mt-44 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-14 items-start">
            {/* Poster Card */}
            <div className="w-52 sm:w-64 lg:w-80 aspect-[2/3] relative rounded-lg overflow-hidden shadow-2xl shadow-black border border-border/80 bg-surface flex-shrink-0">
              <Image
                src={content.poster_url}
                alt={content.title}
                fill
                sizes="(max-width: 768px) 208px, (max-width: 1024px) 256px, 320px"
                className="object-cover"
                unoptimized
              />
              {content.is_original && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="bg-black/90 border border-white/20 text-accent font-mono text-[9px] px-2 py-0.5 tracking-widest uppercase rounded">
                    WEARE ORIGINAL
                  </span>
                </div>
              )}
            </div>

            {/* Info and Actions */}
            <div className="flex-1 pt-2 sm:pt-6">
              {/* Minimal Architectural Metadata Header */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted mb-3">
                <span className="text-accent font-bold tracking-widest uppercase">
                  {content.is_original ? "// SIGNATURE ARCHIVE" : "// FEATURE RELEASE"}
                </span>
                <span>·</span>
                {content.rating && (
                  <span className="text-white font-bold">
                    ★ {content.rating.toFixed(1)} / 10
                  </span>
                )}
                <span>·</span>
                <span>{content.release_year}</span>
                <span>·</span>
                <span>{"duration" in content ? content.duration : "MULTIPLE SEASONS"}</span>
                {content.age_rating && (
                  <>
                    <span>·</span>
                    <span className="border border-border/80 px-1.5 py-0.5 rounded text-[10px] text-white/80">
                      {content.age_rating}
                    </span>
                  </>
                )}
              </div>

              {/* Monumental Title */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight uppercase leading-[0.95] mb-4 text-cinema-shadow">
                {content.title}
              </h1>

              {/* Genres as clean typographic breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-mono text-accent/90 mb-5">
                <span>GENRES:</span>
                <span className="text-white/80">{content.genres.join("  /  ")}</span>
              </div>

              {/* Synopsis */}
              <p className="max-w-3xl text-sm sm:text-base text-foreground/85 leading-relaxed mb-8 font-normal">
                {content.description}
              </p>

              {/* Interactive Actions - Commanding CTA Focal Point */}
              <div className="flex flex-wrap items-center gap-4 mb-10">
                {hasPlayableSource ? (
                  <Link
                    href={`/watch/${content.id}`}
                    className="flex items-center gap-3 rounded-lg bg-white px-9 py-4 text-xs sm:text-sm font-black tracking-wider uppercase text-black hover:bg-accent active:scale-95 transition-all cta-white-glow shadow-2xl"
                  >
                    <Play className="h-4 w-4 fill-black" />
                    <span>WATCH NOW</span>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="flex items-center gap-2.5 rounded-lg border border-white/20 bg-white/5 px-7 py-3.5 text-xs sm:text-sm font-mono tracking-wider uppercase text-muted cursor-not-allowed"
                    title="No video stream is currently available for this title."
                  >
                    <Film className="h-4 w-4" />
                    <span>NOT AVAILABLE</span>
                  </button>
                )}

                {/* Client component for live My List toggle */}
                <MovieDetailActions content={content} />
              </div>

              {/* Cast & Crew Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl border-t border-border/40 pt-6">
                {content.cast && content.cast.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                      Starring
                    </h3>
                    <p className="text-sm text-foreground/90 font-medium">
                      {content.cast.join(", ")}
                    </p>
                  </div>
                )}
                {content.director && (
                  <div>
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                      Director
                    </h3>
                    <p className="text-sm text-foreground/90 font-medium flex items-center gap-1.5">
                      <Film className="h-4 w-4 text-accent" />
                      {content.director}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Similar Movies Row */}
          {similarMovies.length > 0 && (
            <div className="mt-16 border-t border-border/40 pt-10">
              <ContentRow
                title={`Similar Movies in ${primaryGenre}`}
                subtitle="Titles featuring similar themes and cinematic tones"
                items={similarMovies}
              />
            </div>
          )}

          {/* Recommended Row */}
          <div className="mt-8 border-t border-border/30 pt-8">
            <ContentRow
              title="Recommended For You"
              subtitle="Audience favorites and critically acclaimed titles on WeAre"
              items={generalRecommended}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
