import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import DynamicCatalogView from "@/components/catalog/DynamicCatalogView";

export default function TopRatedTVPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <DynamicCatalogView
          initialType="tv"
          initialCategory="top-rated"
          title="Top Rated TV Shows"
          subtitle="Highest critically acclaimed television series of all time"
        />
      </main>
      <Footer />
    </div>
  );
}
