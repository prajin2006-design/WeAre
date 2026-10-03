import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import DynamicCatalogView from "@/components/catalog/DynamicCatalogView";

export default function PopularTVPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <DynamicCatalogView
          initialType="tv"
          initialCategory="popular"
          title="Popular TV Shows"
          subtitle="The most-watched television series streaming today"
        />
      </main>
      <Footer />
    </div>
  );
}
