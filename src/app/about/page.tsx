import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { Play, Sparkles, Cpu, Compass, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          {/* Hero Story Banner */}
          <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-surface via-surface/30 to-transparent p-8 sm:p-14 text-center mb-14 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-48 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 border border-accent/30 px-3.5 py-1 text-xs font-bold text-accent uppercase mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>The WeAre Story</span>
            </div>
            <h1 className="text-3xl sm:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
              Cinema, Reimagined For Every Screen.
            </h1>
            <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
              WeAre was founded with a singular conviction: streaming should feel like sitting in the front row of an iconic theater. No cluttered algorithms, no endless noise—just pure, uncompromised storytelling.
            </p>

            <div className="flex justify-center gap-4">
              <Link
                href="/movies"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-bold text-black hover:bg-accent-hover active:scale-95 transition-all shadow-xl shadow-accent/20"
              >
                <Play className="h-4 w-4 fill-black" />
                <span>Explore the Catalog</span>
              </Link>
              <Link
                href="/new-popular"
                className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-surface px-6 py-3.5 text-sm font-bold text-white hover:bg-surface-hover active:scale-95 transition-all"
              >
                <span>What&apos;s Trending</span>
              </Link>
            </div>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="rounded-2xl border border-border/60 bg-surface/40 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/30 text-accent mb-4">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Intuitive Discovery</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Browse by curated moods, genre tags, and director filmographies. We make finding your next cinematic favorite effortless rather than overwhelming.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-surface/40 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/30 text-accent mb-4">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">High-Fidelity Engine</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Powered by modern HLS stream delivery, adaptive bitrates, and hardware-accelerated rendering to deliver true 4K HDR clarity with zero lag.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-surface/40 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/30 text-accent mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Audience Respect</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                We believe your viewing queue is private. Zero tracking trackers, zero data harvesting, and full control over your playback history.
              </p>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="rounded-3xl border border-border/60 bg-surface/30 p-8 sm:p-12 mb-16">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-6 text-center">
              How WeAre Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center sm:text-left">
                <span className="text-3xl font-black text-accent block mb-2 font-mono">01</span>
                <h4 className="text-base font-bold text-white mb-1">Pick Your Title</h4>
                <p className="text-xs text-muted leading-relaxed">
                  Browse feature movies, original series, and documentaries across curated genre rows.
                </p>
              </div>

              <div className="text-center sm:text-left">
                <span className="text-3xl font-black text-accent block mb-2 font-mono">02</span>
                <h4 className="text-base font-bold text-white mb-1">Stream Instantly</h4>
                <p className="text-xs text-muted leading-relaxed">
                  Hit play and immerse yourself in high-bitrate streaming with customizable subtitles and speeds.
                </p>
              </div>

              <div className="text-center sm:text-left">
                <span className="text-3xl font-black text-accent block mb-2 font-mono">03</span>
                <h4 className="text-base font-bold text-white mb-1">Resume Anywhere</h4>
                <p className="text-xs text-muted leading-relaxed">
                  Switch between desktop and mobile. Continue Watching keeps your exact second intact.
                </p>
              </div>
            </div>
          </div>

          {/* TMDB Metadata Attribution */}
          <div className="rounded-3xl border border-border/60 bg-surface/30 p-8 sm:p-10 mb-16 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0 flex items-center justify-center h-16 w-28 rounded-xl bg-[#0d253f] border border-[#01b4e4]/30 px-3">
                <span className="text-sm font-black tracking-widest text-[#01b4e4]">TMDB</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white mb-1.5">
                  Metadata & Film Database Attribution
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  WeAre uses data and media assets provided by <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-white">The Movie Database (TMDB)</a>. This product uses the TMDB API but is not endorsed or certified by TMDB.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
