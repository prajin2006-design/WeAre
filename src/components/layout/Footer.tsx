import Link from "next/link";

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
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
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
