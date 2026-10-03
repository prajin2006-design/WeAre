import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import DynamicCatalogView from "@/components/catalog/DynamicCatalogView";

export default function UpcomingMoviesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <DynamicCatalogView
          initialType="movie"
          initialCategory="upcoming"
          title="Upcoming Releases"
          subtitle="Anticipated upcoming titles scheduled to premiere soon"
        />
      </main>
      <Footer />
    </div>
  );
}
