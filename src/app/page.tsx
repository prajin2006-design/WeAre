import Navbar from "@/components/navigation/Navbar";
import HeroBanner from "@/components/hero/HeroBanner";
import TopRankedMarquee from "@/components/home/TopRankedMarquee";
import OriginalsShowcase from "@/components/home/OriginalsShowcase";
import WidescreenCinematheque from "@/components/home/WidescreenCinematheque";
import ContentRow from "@/components/movies/ContentRow";
import ContinueWatchingRow from "@/components/movies/ContinueWatchingRow";
import MyListRow from "@/components/movies/MyListRow";
import Footer from "@/components/layout/Footer";
import EmptyState from "@/components/ui/EmptyState";
import { ContentService } from "@/lib/content/content-service";

export const revalidate = 0; // Dynamic server rendering

export default async function HomePage() {
  const [
    heroItems,
    trending,
    originals,
    popularMovies,
    popularSeries,
    topRated,
    newReleases,
    scifiMovies,
    actionMovies,
  ] = await Promise.all([
    ContentService.getHeroCarouselItems(6),
    ContentService.getTrending(),
    ContentService.getWeAreOriginals(),
    ContentService.getPopularMovies(),
    ContentService.getPopularSeries(),
    ContentService.getTopRated(),
    ContentService.getNewReleases(),
    ContentService.getByGenre("sci-fi"),
    ContentService.getByGenre("action"),
  ]);

  const hasAnyContent = Boolean((heroItems && heroItems.length > 0) || trending.length > 0);

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-accent selection:text-black">
      <Navbar />

      <main className="flex-1 pb-20">
        {!hasAnyContent ? (
          <div className="mx-auto max-w-4xl px-4 py-32">
            <EmptyState
              title="Welcome to WeAre"
              description="No titles have been published yet in the database. Connect your Supabase instance or add movies in the admin dashboard."
              actionText="Open Admin Dashboard"
              actionHref="/admin"
            />
          </div>
        ) : (
          <>
            {/* 1. Dynamic Rotating Hero Carousel */}
            {heroItems && heroItems.length > 0 && (
              <HeroBanner items={heroItems} />
            )}

            {/* 2. User Watch Progress (Clean 16:9 Widescreen) */}
            <div className="relative z-20">
              <ContinueWatchingRow />
              <MyListRow />
            </div>

            {/* 3. Distinctive Top 10 Marquee (Architectural Numbered Cinema) */}
            <TopRankedMarquee
              title="TOP 10 CURRENT STREAMING"
              items={trending.length > 0 ? trending : popularMovies}
            />

            {/* 4. WeAre Originals & Signature Archive (Asymmetric Split Showcase) */}
            <OriginalsShowcase
              items={originals.length > 0 ? originals : topRated}
            />

            {/* 5. Widescreen Cinematheque (16:9 Stills Showcase) */}
            <WidescreenCinematheque
              title="Auteur Vision & Cyberpunk"
              subtitle="DIRECTOR CUTS & PANORAMIC RELEASES"
              items={scifiMovies.length > 0 ? scifiMovies : popularMovies}
            />

            {/* 6. Curated Thematic Rails (Selective & Uncluttered) */}
            <div className="my-8">
              <ContentRow
                title="Television & Serial Dramas"
                tag="TELEVISION"
                subtitle="High-concept narrative seasons"
                items={popularSeries}
              />
              <ContentRow
                title="Adrenaline & Espionage"
                tag="ACTION"
                subtitle="Choreographed spectacle and velocity"
                items={actionMovies}
              />
              <ContentRow
                title="Recent Additions"
                tag="PREMIERES"
                subtitle="Newly licensed masterworks"
                items={newReleases}
              />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
