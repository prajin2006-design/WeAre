import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import DynamicCatalogView from "@/components/catalog/DynamicCatalogView";

export default function MoviesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <DynamicCatalogView
          initialType="movie"
          initialCategory="popular"
          title="Movies Catalog"
          subtitle="Explore feature films, cinematic epics, animations, and WeAre Originals"
        />
      </main>
      <Footer />
    </div>
  );
}
