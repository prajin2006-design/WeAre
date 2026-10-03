import { notFound } from "next/navigation";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { resolveContentById } from "@/lib/catalog/content-resolver";
import SeriesView from "./series-view";

interface SeriesPageProps {
  params: Promise<{ id: string }>;
}

export default async function SeriesDetailsPage({ params }: SeriesPageProps) {
  const { id } = await params;
  const content = await resolveContentById(id, "tv");

  if (!content || !('seasons' in content)) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 pb-16">
        <SeriesView series={content} />
      </main>
      <Footer />
    </div>
  );
}
