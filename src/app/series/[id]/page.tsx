import { notFound } from "next/navigation";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { resolveContentById } from "@/lib/catalog/content-resolver";
import SeriesView from "./series-view";

interface SeriesPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ season?: string }>;
}

export default async function SeriesDetailsPage({ params, searchParams }: SeriesPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialSeason = resolvedSearchParams?.season ? parseInt(resolvedSearchParams.season, 10) : undefined;
  const content = await resolveContentById(id, "tv");

  if (!content || !('seasons' in content)) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 pb-16">
        <SeriesView series={content} initialSeason={initialSeason && !isNaN(initialSeason) ? initialSeason : undefined} />
      </main>
      <Footer />
    </div>
  );
}
