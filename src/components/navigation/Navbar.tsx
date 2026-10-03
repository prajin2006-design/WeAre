"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu, X, Shield, Bookmark, User } from "lucide-react";
import { useUserContent } from "@/lib/context/user-content-context";

const emptySubscribe = () => () => {};

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Movies", href: "/movies" },
  { label: "TV Shows", href: "/tv" },
  { label: "New & Popular", href: "/new-popular" },
  { label: "My List", href: "/my-list" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const pathname = usePathname();
  const router = useRouter();
  const { myList, userEmail, userProfile, isAdmin } = useUserContent();


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-xl shadow-black/40"
          : "bg-gradient-to-b from-black/90 via-black/50 to-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Left: Brand & Main Navigation */}
          <div className="flex items-center gap-8 lg:gap-10">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-2xl font-black tracking-tight group focus:outline-none"
            >
              <div className="flex items-center">
                <span className="text-accent text-3xl font-extrabold tracking-tighter">WE</span>
                <span className="text-foreground text-3xl font-light tracking-widest pl-0.5">ARE</span>
              </div>
              <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-accent mb-3 group-hover:scale-125 transition-transform" />
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3.5 py-1.5 text-sm font-medium transition-all duration-200 rounded-lg ${
                      isActive
                        ? "text-accent font-semibold"
                        : "text-muted hover:text-foreground hover:bg-surface/50"
                    }`}
                  >
                    {link.label}
                    {link.href === "/my-list" && mounted && myList.length > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-accent/20 px-1.5 py-0.2 text-[10px] font-bold text-accent">
                        {myList.length}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-accent rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Search, Admin, Profile, Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Bar / Icon */}
            <div className="relative">
              {searchOpen ? (
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex items-center overflow-hidden rounded-full border border-accent/50 bg-surface/90 px-3 py-1 shadow-lg shadow-black/40 animate-in fade-in zoom-in-95 duration-150"
                >
                  <Search className="h-4 w-4 text-accent mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search movies, series, cast..."
                    className="w-44 sm:w-64 bg-transparent py-1 text-sm text-foreground placeholder-muted outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="p-1 text-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground hover:bg-surface/60"
                  aria-label="Open search"
                >
                  <Search className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Quick My List icon shortcut */}
            <Link
              href="/my-list"
              className="hidden lg:flex relative h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground hover:bg-surface/60"
              title="My List"
            >
              <Bookmark className="h-4 w-4" />
              {mounted && myList.length > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent" />
              )}
            </Link>

            {/* Admin Dashboard link - strictly only visible to verified admins */}
            {mounted && isAdmin && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface/40 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:border-accent/40 transition-colors"
                title="Admin Dashboard"
              >
                <Shield className="h-3.5 w-3.5 text-accent" />
                <span>Admin</span>
              </Link>
            )}


            {/* Profile Avatar / Login */}
            {mounted && userEmail ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full p-1 transition-transform hover:scale-105"
                title="Account & Profile"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${
                    userProfile?.avatar_url || "from-accent via-amber-600 to-amber-900"
                  } font-bold text-black text-sm shadow-md shadow-accent/20`}
                >
                  {(userProfile?.display_name || userEmail).charAt(0).toUpperCase()}
                </div>
              </Link>
            ) : (

              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-bold text-black hover:bg-accent-hover active:scale-95 transition-all shadow-md shadow-accent/20"
              >
                <User className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:text-foreground md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-border/60 bg-background/98 px-6 py-6 backdrop-blur-2xl animate-in slide-in-from-top-4">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                    isActive
                      ? "bg-accent/15 text-accent font-semibold"
                      : "text-muted hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.href === "/my-list" && mounted && myList.length > 0 && (
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent font-bold">
                      {myList.length}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="mt-4 pt-4 border-t border-border/40 flex flex-col gap-2">
              {mounted && isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
                >
                  <Shield className="h-4 w-4 text-accent" />
                  <span>Admin Dashboard</span>
                </Link>
              )}

              {mounted && userEmail ? (
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
                >
                  <User className="h-4 w-4 text-accent" />
                  <span>My Profile ({userEmail.split("@")[0]})</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-accent hover:bg-surface"
                >
                  <User className="h-4 w-4 text-accent" />
                  <span>Sign In / Register</span>
                </Link>
              )}
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
              >
                <Bookmark className="h-4 w-4 text-accent" />
                <span>Playback & Settings</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
