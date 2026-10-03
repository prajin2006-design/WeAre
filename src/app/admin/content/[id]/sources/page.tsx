import { notFound } from "next/navigation";
import { ContentService } from "@/lib/database/content-service";
import { VideoSourceService } from "@/lib/video/video-source-service";
import AdminSourcesClient from "./sources-client";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";

interface AdminSourcesPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSourcesPage({ params }: AdminSourcesPageProps) {
  const { id } = await params;
  const content = await ContentService.getContentById(id);

  if (!content) {
    notFound();
  }

  const sources = await VideoSourceService.getSourcesForContent(content.id, "movie");

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar />
      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <AdminSourcesClient content={content} initialSources={sources} />
      </main>
      <Footer />
    </div>
  );
}
