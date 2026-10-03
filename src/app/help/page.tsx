"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import {
  HelpCircle,
  Search,
  ChevronDown,
  UserCheck,
  PlaySquare,
  Subtitles,
  Bookmark,
  Wrench,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";

interface FAQItem {
  id: string;
  category: "account" | "playback" | "subtitles" | "mylist" | "troubleshooting" | "privacy";
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  // Account
  {
    id: "f-1",
    category: "account",
    question: "How do I create and manage a WeAre account?",
    answer: "You can create an account by clicking Sign Up in the top right navigation. Enter your name, email address, and a secure password. Once registered, visit your Profile page at any time to view account status and watch history.",
  },
  {
    id: "f-2",
    category: "account",
    question: "Can I use WeAre on multiple devices?",
    answer: "Yes, WeAre is designed for cross-platform viewing. When logged in, your My List watchlist and Continue Watching playback markers automatically synchronize across desktop browsers, tablets, and smartphones.",
  },
  // Playback
  {
    id: "f-3",
    category: "playback",
    question: "What video resolutions and formats does WeAre support?",
    answer: "WeAre streams in 4K Ultra HD, 1080p Full HD, and 720p HD with adaptive HLS bitrate streaming. It automatically selects the optimal quality for your current internet bandwidth to ensure smooth, buffer-free playback.",
  },
  {
    id: "f-4",
    category: "playback",
    question: "What keyboard shortcuts are available in the video player?",
    answer: "During playback you can press: Spacebar or 'K' to Play/Pause, Left Arrow to Rewind 10 seconds, Right Arrow to Fast-forward 10 seconds, Up/Down Arrows to adjust volume, 'M' to Mute, and 'F' to enter Fullscreen.",
  },
  // Subtitles
  {
    id: "f-5",
    category: "subtitles",
    question: "How do I turn on subtitles or change their size?",
    answer: "Click the Subtitles icon in the bottom right of the video player to switch audio and caption languages. You can also customize font sizing and background opacity in Settings under Subtitle Appearance.",
  },
  // My List
  {
    id: "f-6",
    category: "mylist",
    question: "How do I add or remove movies from My List?",
    answer: "Hover over any movie card or click on a title's details page, then click the '+' Add to List button. The title will immediately appear in your My List tab and on your homepage watchlist row.",
  },
  // Troubleshooting
  {
    id: "f-7",
    category: "troubleshooting",
    question: "What should I do if a video encounters buffering or fails to load?",
    answer: "First check your internet connection speed. Refresh the page or toggle the streaming quality to 720p or Auto in the player. If issues persist, clearing your browser cache or switching hardware acceleration in browser settings usually resolves stream decoder hiccups.",
  },
  {
    id: "f-8",
    category: "troubleshooting",
    question: "Why does audio play without video?",
    answer: "This may happen if your browser hardware video decoding is disabled. Ensure your browser is updated to the latest version and that WebGL / video acceleration is enabled.",
  },
  // Privacy
  {
    id: "f-9",
    category: "privacy",
    question: "How does WeAre protect my viewing privacy?",
    answer: "We never sell your viewing data to advertising networks. Viewing progress and list bookmarks are stored securely and encrypted. You can toggle off watch history tracking anytime in your Settings.",
  },
];

const categories = [
  { key: "all", label: "All Topics", icon: HelpCircle },
  { key: "account", label: "Account & Profile", icon: UserCheck },
  { key: "playback", label: "Playback & Quality", icon: PlaySquare },
  { key: "subtitles", label: "Subtitles & Audio", icon: Subtitles },
  { key: "mylist", label: "My List & Queue", icon: Bookmark },
  { key: "troubleshooting", label: "Troubleshooting", icon: Wrench },
  { key: "privacy", label: "Privacy & Security", icon: ShieldCheck },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>("f-1");

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCat = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          {/* Hero Search Box */}
          <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-surface via-surface/40 to-transparent p-8 sm:p-12 text-center mb-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

            <span className="text-xs font-bold text-accent tracking-widest uppercase mb-2 block">
              WeAre Support Center
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              How can we help you?
            </h1>
            <p className="text-sm text-muted max-w-lg mx-auto mb-8 leading-relaxed">
              Find answers regarding streaming, playback controls, account setup, audio, and device compatibility.
            </p>

            {/* Search Input */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-accent" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, e.g. subtitles, buffering, shortcuts..."
                className="w-full rounded-2xl border border-border/80 bg-background/90 py-3.5 pl-12 pr-4 text-sm text-white placeholder-muted outline-none focus:border-accent shadow-lg shadow-black/40"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                  selectedCategory === key
                    ? "bg-accent text-black shadow-md shadow-accent/20"
                    : "border border-border/60 bg-surface/50 text-muted hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-3 mb-12">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-border/40 bg-surface/30 p-8">
                <HelpCircle className="h-8 w-8 text-muted mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No matching answers found</h3>
                <p className="text-xs text-muted max-w-md mx-auto mb-4">
                  We couldn&apos;t find any FAQs matching &quot;{searchQuery}&quot;. Try a different keyword or contact our support team directly.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="rounded-xl bg-surface border border-border px-4 py-2 text-xs font-semibold text-white hover:bg-surface-hover"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = expandedId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl border border-border/60 bg-surface/40 overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => toggleExpand(faq.id)}
                      className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-surface/80"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm sm:text-base font-bold text-white pr-4">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 text-accent flex-shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-foreground/80 leading-relaxed border-t border-border/30">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Contact Support Banner */}
          <div className="rounded-2xl border border-border/60 bg-surface/50 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Still need assistance?</h3>
              <p className="text-xs text-muted">
                Our support team is ready to help resolve technical or account questions.
              </p>
            </div>
            <Link
              href="/contact"
              className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs sm:text-sm font-bold text-black hover:bg-accent-hover active:scale-95 transition-all shadow-md shadow-accent/20 whitespace-nowrap"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Contact Support</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
