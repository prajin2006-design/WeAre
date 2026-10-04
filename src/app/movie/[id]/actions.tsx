"use client";

import { useState } from "react";
import { Plus, Check, Share2, Film, X } from "lucide-react";
import { ContentItem, isMovie } from "@/types/content";
import { useUserContent } from "@/lib/context/user-content-context";
import { useToast } from "@/components/ui/Toast";

export default function MovieDetailActions({ content }: { content: ContentItem }) {
  const { isInList, toggleMyList } = useUserContent();
  const { showToast } = useToast();
  const inList = isInList(content.id);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  const trailerUrl = content.trailer_url || (isMovie(content) ? content.video_url : "");

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard!", "success");
    } else {
      showToast("Link copied to clipboard!", "success");
    }
  };

  const handleToggleList = async () => {
    const isAdded = await toggleMyList(content);
    showToast(
      isAdded ? `Added "${content.title}" to My List` : `Removed "${content.title}" from My List`,
      "info"
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {/* Watch Trailer Button */}
        {trailerUrl && (
          <button
            type="button"
            onClick={() => setShowTrailerModal(true)}
            className="flex items-center gap-2 rounded-xl border border-on-primary bg-surface/80 px-5 py-3.5 text-sm sm:text-base font-semibold text-foreground backdrop-blur-md hover:border-accent hover:text-accent hover:bg-accent/10 active:scale-95 transition-all shadow-md"
          >
            <Film className="h-5 w-5 text-accent" />
            <span>Trailer</span>
          </button>
        )}

        {/* Add to List Toggle */}
        <button
          type="button"
          onClick={handleToggleList}
          className={`flex items-center gap-2 rounded-xl border px-6 py-3.5 text-sm sm:text-base font-semibold backdrop-blur-md transition-all active:scale-95 shadow-md ${
            inList
              ? "border-accent bg-accent/20 text-accent"
              : "border-on-primary bg-surface/80 text-foreground hover:border-accent hover:text-accent hover:bg-accent/10"
          }`}
          aria-label={inList ? "In My List" : "Add to My List"}
        >
          {inList ? (
            <>
              <Check className="h-5 w-5 stroke-[2.5]" />
              <span>In My List</span>
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              <span>Add to My List</span>
            </>
          )}
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-on-primary bg-surface/80 text-foreground hover:border-accent hover:text-accent hover:bg-accent/10 active:scale-95 transition-all shadow-md"
          title="Share title"
          aria-label="Share movie link"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      {/* Trailer Modal Player */}
      {showTrailerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden border border-border bg-black shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-surface/90 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-bold text-white">
                  {content.title} — Official Teaser Trailer
                </h3>
              </div>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-white hover:bg-surface-hover transition-colors"
                aria-label="Close trailer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Video Element */}
            <div className="relative aspect-video w-full bg-black">
              <video
                src={trailerUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
