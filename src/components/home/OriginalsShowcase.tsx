"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Plus, Check, ArrowUpRight } from "lucide-react";
import { ContentItem } from "@/types/content";
import { useUserContent } from "@/lib/context/user-content-context";

interface OriginalsShowcaseProps {
  items: ContentItem[];
}

export default function OriginalsShowcase({ items }: OriginalsShowcaseProps) {
  const { isInList, toggleMyList } = useUserContent();

  if (!items || items.length === 0) return null;

  const leadItem = items[0];
  const sideItems = items.slice(1, 4);

  const inListLead = isInList(leadItem.id);

  return (
    <section className="relative my-16 sm:my-20">
      <div className="mx-auto max-w-[1800px] px-4 sm:px-8 lg:px-14">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-border/40 pb-3 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-accent font-bold">
                WEARE ARCHIVE
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              Original Productions & Exclusives
            </h2>
          </div>
          <Link
            href="/movies"
            className="group hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted hover:text-white transition-colors"
          >
            <span>VIEW COMPLETE CATALOG</span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Asymmetrical Editorial Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Main Feature Monolith (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-xl bg-surface border border-border/60 overflow-hidden relative group">
            {/* Backdrop Image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
              <Image
                src={leadItem.backdrop_url || leadItem.poster_url}
                alt={leadItem.title}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover transition-transform duration-700 group-hover:scale-103"
                unoptimized
              />
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-black/80 border border-white/20 px-2.5 py-1 text-[10px] font-mono tracking-widest text-accent uppercase rounded">
                  SIGNATURE WORK
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-center gap-3 text-xs font-mono text-muted mb-2">
                  <span>{leadItem.release_year}</span>
                  <span>/</span>
                  <span>{leadItem.genres.join(" · ")}</span>
                  {leadItem.rating && (
                    <>
                      <span>/</span>
                      <span className="text-accent font-bold">★ {leadItem.rating.toFixed(1)}</span>
                    </>
                  )}
                </div>

                <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
                  {leadItem.title}
                </h3>

                <p className="text-sm text-foreground/80 leading-relaxed max-w-xl line-clamp-3 mb-6">
                  {leadItem.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/40">
                <Link
                  href={`/watch/${leadItem.id}`}
                  className="inline-flex items-center gap-2.5 rounded-lg bg-white px-6 py-3 text-xs sm:text-sm font-bold text-black hover:bg-accent active:scale-95 transition-all shadow-lg"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>WATCH FEATURE</span>
                </Link>

                <button
                  type="button"
                  onClick={() => toggleMyList(leadItem)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-xs sm:text-sm font-medium transition-colors ${
                    inListLead
                      ? "border-accent text-accent bg-accent/10"
                      : "border-border text-foreground hover:border-white/40"
                  }`}
                >
                  {inListLead ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  <span>{inListLead ? "IN LIST" : "ADD TO LIST"}</span>
                </button>

                <Link
                  href={`/movie/${leadItem.id}`}
                  className="ml-auto text-xs font-mono text-muted hover:text-white transition-colors"
                >
                  CREDITS & DETAILS →
                </Link>
              </div>
            </div>
          </div>

          {/* Supporting Trio (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {sideItems.map((item, idx) => {
              const inList = isInList(item.id);

              return (
                <div
                  key={item.id}
                  className="flex-1 rounded-xl bg-surface border border-border/50 hover:border-border transition-colors p-4 flex gap-4 items-center group relative select-none"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-36 sm:w-44 flex-shrink-0 overflow-hidden rounded-lg bg-black">
                    <Image
                      src={item.backdrop_url || item.poster_url}
                      alt={item.title}
                      fill
                      sizes="180px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                    <Link
                      href={`/watch/${item.id}`}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center">
                        <Play className="h-3.5 w-3.5 fill-black translate-x-0.5" />
                      </div>
                    </Link>
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted uppercase">
                      <span>EDITION 0{idx + 2}</span>
                      <span>·</span>
                      <span>{item.release_year}</span>
                    </div>

                    <Link href={`/watch/${item.id}`}>
                      <h4 className="text-base font-bold text-white truncate mt-1 group-hover:text-accent transition-colors">
                        {item.title}
                      </h4>
                    </Link>

                    <p className="text-xs text-muted font-mono truncate mt-0.5">
                      {item.genres.slice(0, 2).join(" · ")}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <Link
                        href={`/watch/${item.id}`}
                        className="text-[11px] font-mono text-accent hover:underline font-bold"
                      >
                        STREAM NOW →
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggleMyList(item)}
                        className="text-[11px] font-mono text-muted hover:text-white transition-colors"
                      >
                        {inList ? "✓ IN LIST" : "+ LIST"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
