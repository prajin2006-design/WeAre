import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { Film, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-24 pb-16 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-surface/80 border border-border text-accent shadow-2xl relative">
            <Film className="h-12 w-12 text-accent" />
            <span className="absolute -top-2 -right-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-black text-black">
              404
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            Lost in the Stream?
          </h1>
          <p className="text-sm text-muted mb-8 leading-relaxed">
            The film, series, or page you were looking for doesn&apos;t exist, has ended its broadcast run, or was moved to another coordinates.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs sm:text-sm font-bold text-black hover:bg-accent-hover transition-all active:scale-95 shadow-lg shadow-accent/20"
            >
              <Home className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
            <Link
              href="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-surface-hover transition-all"
            >
              <Search className="h-4 w-4" />
              <span>Search Catalog</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
