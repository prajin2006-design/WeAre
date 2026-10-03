"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for diagnostics
    console.error("WeAre Platform Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <div className="max-w-md w-full">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 shadow-2xl">
          <AlertTriangle className="h-10 w-10" />
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
          Playback Glitch Detected
        </h1>
        <p className="text-sm text-muted mb-8 leading-relaxed">
          An unexpected interruption occurred while streaming this view. The issue has been logged.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs sm:text-sm font-bold text-black hover:bg-accent-hover active:scale-95 transition-all shadow-lg shadow-accent/20"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-surface-hover transition-all"
          >
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
