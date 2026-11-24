import Link from "next/link";
import { ArrowRight } from "lucide-react";

const footerSections = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Movies", href: "/movies" },
      { label: "Series & Shows", href: "/series" },
      { label: "New & Popular", href: "/new-popular" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My List", href: "/my-list" },
      { label: "Profile", href: "/profile" },
      { label: "Playback Settings", href: "/settings" },
      { label: "Admin Console", href: "/admin" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Contact Us", href: "/contact" },
      { label: "Report an Issue", href: "/contact?subject=report" },
    ],
  },
  {
    title: "Legal & About",
    links: [
      { label: "About WeAre", href: "/about" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/terms#cookies" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/95 mt-auto">
      <div className="mx-auto max-w-[1800px] px-4 py-12 sm:px-6 sm:py-16 lg:px-12">
        {/* Editorial Feature Banner (inspired by reference terrain theme) */}
        <div className="mb-14 rounded-2xl border border-border/70 bg-gradient-to-r from-surface via-surface/90 to-surface/40 p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-xl">
          <div className="absolute -top-12 -right-12 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold mb-2 block">
              Cinematic Frontier
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-snug">
              We curate the stories. <span className="font-light italic text-muted">You know the destination.</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed">
              Experience handpicked indie masterworks, 4K HDR original releases, and award-winning series unified in one immersive stream.
            </p>
          </div>
          <div className="relative z-10 flex-shrink-0">
            <Link
              href="/movies"
              className="inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-xs sm:text-sm font-bold text-black hover:bg-accent-hover hover:scale-102 active:scale-98 transition-all cta-primary-glow shadow-lg shadow-accent/25"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Brand Header */}
        <div className="mb-10 pb-8 border-b border-border/40">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-accent text-2xl font-black tracking-tighter">WE</span>
            <span className="text-foreground text-2xl font-light tracking-widest pl-0.5">ARE</span>
          </Link>
          <p className="text-xs text-muted mt-1 max-w-sm leading-relaxed">
            Original cinematic streaming platform built for high-fidelity entertainment, 4K HDR, and creator-led storytelling.
          </p>
        </div>

        {/* Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3.5">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted hover:text-accent transition-colors leading-relaxed block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright & Disclaimer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border/30 pt-8 text-xs text-muted">
          <div>
            <p>© {new Date().getFullYear()} WeAre Entertainment Inc. All rights reserved. By Prajin</p>
            <p className="text-[11px] text-muted/70 mt-1">
              Film metadata and posters provided by The Movie Database (TMDB). This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/about" className="hover:text-foreground transition-colors">
              Credits & TMDB
            </Link>
            <span>•</span>
            <span className="text-accent/80 font-mono font-medium">v1.0.0 Production</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
