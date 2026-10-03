import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import DynamicCatalogView from "@/components/catalog/DynamicCatalogView";

export default function TrendingTVPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <DynamicCatalogView
          initialType="tv"
          initialCategory="trending"
          title="Trending TV Shows"
          subtitle="Top trending episodic stories capturing viewer attention worldwide"
        />
      </main>
      <Footer />
    </div>
  );
}
