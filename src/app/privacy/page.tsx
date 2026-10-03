import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { Lock, ShieldCheck, Database, KeyRound, UserCheck } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Header */}
          <div className="mb-10 pb-8 border-b border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-accent" />
              <span className="text-xs font-bold text-accent uppercase tracking-widest">
                Privacy & Data Protection
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Last updated: January 2025 • How WeAre collects, encrypts, and handles your information
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-10 text-foreground/80 leading-relaxed text-sm sm:text-base">
            <section className="rounded-2xl border border-border/50 bg-surface/30 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" />
                1. Our Privacy Pledge
              </h2>
              <p>
                At <strong>WeAre</strong>, your personal entertainment choices belong to you. We do not sell, rent, or monetize your viewing habits to third-party ad networks. We collect only what is strictly needed to stream your videos and preserve your personal queue.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-accent" />
                2. Information We Collect
              </h2>
              <ul className="space-y-2 text-sm text-muted list-disc pl-5">
                <li><strong>Account Credentials:</strong> Email address, hashed authentication credentials, and chosen display name.</li>
                <li><strong>Playback Progress:</strong> Exact timestamps and seconds watched to enable &quot;Continue Watching&quot; across your devices.</li>
                <li><strong>Watchlist Selections:</strong> Movies and series you explicitly save to &quot;My List&quot;.</li>
                <li><strong>Technical Data:</strong> Browser user-agent and adaptive bitrate diagnostics to optimize HLS video rendering.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">3. How Information Is Used</h2>
              <p className="text-sm text-muted leading-relaxed">
                Your data is exclusively utilized to deliver the streaming experience, resume playback at the exact second you left off, customize recommendation queues, and ensure system uptime.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-accent" />
                4. Data Security & Encryption
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                All data transmission between your browser and our streaming architecture is encrypted using industry-standard TLS 1.3 / HTTPS protocols. Passwords are cryptographically salted and hashed using Argon2/bcrypt algorithms and never stored in plain text.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-accent" />
                5. User Rights & Data Control
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                You possess the right to access, export, or permanently delete your account and viewing history. You can adjust playback preferences or wipe watch history anytime in{" "}
                <Link href="/settings" className="text-accent hover:underline font-semibold">
                  Settings
                </Link>
                .
              </p>
            </section>

            <section className="space-y-3 border-t border-border/40 pt-6">
              <h2 className="text-lg font-bold text-white">6. Privacy Inquiries</h2>
              <p className="text-sm text-muted leading-relaxed">
                For questions or requests concerning your privacy, submit an inquiry through our{" "}
                <Link href="/contact" className="text-accent hover:underline font-semibold">
                  Contact Form
                </Link>{" "}
                or reach out to privacy@weare-stream.com.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
