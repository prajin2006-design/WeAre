import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import DynamicCatalogView from "@/components/catalog/DynamicCatalogView";

export default function TVPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <DynamicCatalogView
          initialType="tv"
          initialCategory="popular"
          title="TV Series & Shows"
          subtitle="Explore award-winning series, limited dramas, docuseries, and original seasons"
        />
      </main>
      <Footer />
    </div>
  );
}
