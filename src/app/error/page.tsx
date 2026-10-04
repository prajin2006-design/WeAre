"use client";

import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export default function ErrorPageRoute() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-24 pb-16 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 shadow-2xl">
            <AlertTriangle className="h-10 w-10" />
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            Playback Interrupted
          </h1>
          <p className="text-sm text-muted mb-8 leading-relaxed">
            The requested stream or page encountered a connection timeout. Please reload the stream or return to the main lobby.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs sm:text-sm font-bold text-black hover:bg-accent-hover active:scale-95 transition-all shadow-lg shadow-accent/20"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reload Stream</span>
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-on-primary bg-surface px-6 py-3 text-xs sm:text-sm font-bold text-foreground hover:border-accent hover:text-accent transition-all"
            >
              <Home className="h-4 w-4" />
              <span>Back to Lobby</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
