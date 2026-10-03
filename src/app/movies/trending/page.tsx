import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import DynamicCatalogView from "@/components/catalog/DynamicCatalogView";

export default function TrendingMoviesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <DynamicCatalogView
          initialType="movie"
          initialCategory="trending"
          title="Trending Movies"
          subtitle="Films with the highest audience engagement this week"
        />
      </main>
      <Footer />
    </div>
  );
}
