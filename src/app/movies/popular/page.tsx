import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import DynamicCatalogView from "@/components/catalog/DynamicCatalogView";

export default function PopularMoviesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <DynamicCatalogView
          initialType="movie"
          initialCategory="popular"
          title="Popular Movies"
          subtitle="Top movies currently making waves across the globe"
        />
      </main>
      <Footer />
    </div>
  );
}
