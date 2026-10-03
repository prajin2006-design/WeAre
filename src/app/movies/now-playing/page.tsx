import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import DynamicCatalogView from "@/components/catalog/DynamicCatalogView";

export default function NowPlayingMoviesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <DynamicCatalogView
          initialType="movie"
          initialCategory="now-playing"
          title="Now Playing"
          subtitle="Recent theatrical and digital releases available to stream now"
        />
      </main>
      <Footer />
    </div>
  );
}
