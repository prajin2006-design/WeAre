"use client";

import { useState } from "react";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";
import Switch from "@/components/ui/Switch";
import {
  Settings,
  Sliders,
  Languages,
  Subtitles,
  Shield,
  CheckCircle2,
  Moon,
  Volume2,
} from "lucide-react";

export default function SettingsPage() {
  const { showToast } = useToast();

  // Settings State with active interactivity
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [autoplayPreview, setAutoplayPreview] = useState(false);
  const [streamQuality, setStreamQuality] = useState("auto");
  const [appLanguage, setAppLanguage] = useState("en");
  const [audioLanguage, setAudioLanguage] = useState("original");
  const [subtitleSize, setSubtitleSize] = useState("medium");
  const [subtitleBg, setSubtitleBg] = useState("semi");
  const [themeMode, setThemeMode] = useState("dark");
  const [shareWatchHistory, setShareWatchHistory] = useState(true);

  const handleSave = () => {
    showToast("Playback and account preferences updated successfully!", "success");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8 border-b border-border/40 pb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Settings className="h-5 w-5 text-accent" />
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                  Settings
                </h1>
              </div>
              <p className="text-sm text-muted">
                Configure your viewing preferences, subtitles, languages, and privacy
              </p>
            </div>

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs sm:text-sm font-bold text-black hover:bg-accent-hover active:scale-95 transition-all shadow-md shadow-accent/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>

          <div className="space-y-8">
            {/* Playback Settings */}
            <div className="rounded-2xl border border-border/60 bg-surface/40 p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-6 text-white font-bold text-lg border-b border-border/30 pb-4">
                <Sliders className="h-5 w-5 text-accent" />
                <h2>Playback Controls</h2>
              </div>

              <div className="space-y-6">
                {/* Autoplay Next Episode */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Autoplay Next Episode</h3>
                    <p className="text-xs text-muted">
                      Automatically play the next episode when watching a series
                    </p>
                  </div>
                  <Switch
                    id="autoplay-next"
                    checked={autoplayNext}
                    onChange={setAutoplayNext}
                    ariaLabel="Toggle autoplay next episode"
                  />
                </div>

                {/* Autoplay Previews */}
                <div className="flex items-center justify-between border-t border-border/30 pt-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Autoplay Video Previews</h3>
                    <p className="text-xs text-muted">
                      Play teaser video trailers while browsing movie cards
                    </p>
                  </div>
                  <Switch
                    id="autoplay-preview"
                    checked={autoplayPreview}
                    onChange={setAutoplayPreview}
                    ariaLabel="Toggle video preview autoplay"
                  />
                </div>

                {/* Video Quality */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/30 pt-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Streaming Quality</h3>
                    <p className="text-xs text-muted">Adaptive bitrate and resolution preference</p>
                  </div>
                  <select
                    value={streamQuality}
                    onChange={(e) => setStreamQuality(e.target.value)}
                    className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-white focus:border-accent outline-none"
                  >
                    <option value="auto">Auto (Best for network speed)</option>
                    <option value="4k">4K Ultra HD (Highest quality)</option>
                    <option value="1080p">High Definition (1080p)</option>
                    <option value="saver">Data Saver (Optimized bandwidth)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Language & Audio */}
            <div className="rounded-2xl border border-border/60 bg-surface/40 p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-6 text-white font-bold text-lg border-b border-border/30 pb-4">
                <Languages className="h-5 w-5 text-accent" />
                <h2>Language & Audio</h2>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Display Language</h3>
                    <p className="text-xs text-muted">Interface buttons, menus, and headings</p>
                  </div>
                  <select
                    value={appLanguage}
                    onChange={(e) => setAppLanguage(e.target.value)}
                    className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-white focus:border-accent outline-none"
                  >
                    <option value="en">English (Default)</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/30 pt-4">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-muted" />
                    <div>
                      <h3 className="text-sm font-semibold text-white">Preferred Audio Track</h3>
                      <p className="text-xs text-muted">Default dialogue language for international titles</p>
                    </div>
                  </div>
                  <select
                    value={audioLanguage}
                    onChange={(e) => setAudioLanguage(e.target.value)}
                    className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-white focus:border-accent outline-none"
                  >
                    <option value="original">Original Audio</option>
                    <option value="en">English Dub</option>
                    <option value="hi">Hindi Dub</option>
                    <option value="ta">Tamil Dub</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subtitles & Closed Captions */}
            <div className="rounded-2xl border border-border/60 bg-surface/40 p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-6 text-white font-bold text-lg border-b border-border/30 pb-4">
                <Subtitles className="h-5 w-5 text-accent" />
                <h2>Subtitle Appearance</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-2">Font Size</label>
                  <select
                    value={subtitleSize}
                    onChange={(e) => setSubtitleSize(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-white focus:border-accent outline-none"
                  >
                    <option value="small">Small (75%)</option>
                    <option value="medium">Medium (100% - Default)</option>
                    <option value="large">Large (125%)</option>
                    <option value="xl">Extra Large (150%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-2">Background Box</label>
                  <select
                    value={subtitleBg}
                    onChange={(e) => setSubtitleBg(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-white focus:border-accent outline-none"
                  >
                    <option value="semi">Semi-Transparent Black</option>
                    <option value="solid">Solid Black</option>
                    <option value="none">None (Shadowed Text)</option>
                  </select>
                </div>
              </div>

              {/* Subtitle Live Preview Box */}
              <div className="mt-6 rounded-xl border border-border/50 bg-black/60 p-6 text-center">
                <span className="text-xs text-muted block mb-2 uppercase tracking-wider font-semibold">
                  Live Preview
                </span>
                <span
                  className={`inline-block text-white font-medium px-3 py-1 rounded transition-all ${
                    subtitleSize === "small"
                      ? "text-xs"
                      : subtitleSize === "large"
                      ? "text-lg"
                      : subtitleSize === "xl"
                      ? "text-xl font-bold"
                      : "text-sm"
                  } ${
                    subtitleBg === "solid"
                      ? "bg-black"
                      : subtitleBg === "none"
                      ? "drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                      : "bg-black/60 backdrop-blur-sm"
                  }`}
                >
                  &quot;We must go beyond the horizon to survive.&quot;
                </span>
              </div>
            </div>

            {/* Appearance & Privacy */}
            <div className="rounded-2xl border border-border/60 bg-surface/40 p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-6 text-white font-bold text-lg border-b border-border/30 pb-4">
                <Shield className="h-5 w-5 text-accent" />
                <h2>Appearance & Privacy</h2>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-accent" />
                    <div>
                      <h3 className="text-sm font-semibold text-white">Visual Theme</h3>
                      <p className="text-xs text-muted">High-contrast dark streaming palette</p>
                    </div>
                  </div>
                  <select
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value)}
                    className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-white focus:border-accent outline-none"
                  >
                    <option value="dark">Cinematic Dark (Default)</option>
                    <option value="oled">Pure OLED Black</option>
                  </select>
                </div>

                <div className="flex items-center justify-between border-t border-border/30 pt-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Keep Watch History Active</h3>
                    <p className="text-xs text-muted">
                      Allows Continue Watching to remember your last playback second
                    </p>
                  </div>
                  <Switch
                    id="share-watch-history"
                    checked={shareWatchHistory}
                    onChange={setShareWatchHistory}
                    ariaLabel="Toggle watch history"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
