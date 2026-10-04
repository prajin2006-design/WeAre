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
  
  const { ContentService } = await import("@/lib/content/content-service");
  const [content, recommended] = await Promise.all([
    resolveContentById(id, "tv"),
    ContentService.getRecommended(id, "tv", 10),
  ]);

  if (!content || !('seasons' in content)) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 pb-16">
        <SeriesView
          key={content.id}
          series={content}
          initialSeason={initialSeason && !isNaN(initialSeason) ? initialSeason : undefined}
          recommended={recommended}
        />
      </main>
      <Footer />
    </div>
  );
}
