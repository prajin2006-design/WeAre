import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import DynamicCatalogView from "@/components/catalog/DynamicCatalogView";

export default function TopRatedMoviesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <DynamicCatalogView
          initialType="movie"
          initialCategory="top-rated"
          title="Top Rated Movies"
          subtitle="All-time cinematic masterpieces celebrated by audiences and critics"
        />
      </main>
      <Footer />
    </div>
  );
}
