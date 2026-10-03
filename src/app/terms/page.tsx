import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { Scale, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Header */}
          <div className="mb-10 pb-8 border-b border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-5 w-5 text-accent" />
              <span className="text-xs font-bold text-accent uppercase tracking-widest">
                Legal Documents
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Last revised: January 2025 • Effective immediately for all WeAre viewers and creators
            </p>
          </div>

          {/* Structured Document Content */}
          <div className="space-y-10 text-foreground/80 leading-relaxed text-sm sm:text-base">
            <section className="rounded-2xl border border-border/50 bg-surface/30 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing, browsing, or creating an account on the <strong>WeAre</strong> streaming platform, you agree to comply with and be bound by these Terms of Service. If you do not accept these terms, you must refrain from using the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">2. Content & Intellectual Property</h2>
              <p className="text-sm text-muted leading-relaxed">
                All media content, including but not limited to films, series, trailers, visual artwork, original soundtracks, character assets, logos, and UI designs featured on WeAre are the property of WeAre Entertainment or licensed by copyright owners. Unauthorized reproduction, rebroadcasting, extraction, or redistribution of streaming assets is strictly prohibited.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">3. User Accounts & Security</h2>
              <p className="text-sm text-muted leading-relaxed">
                You are responsible for safeguarding your login credentials. You agree to notify WeAre immediately upon discovering any unauthorized access to your account. WeAre is not liable for losses caused by unauthorized use of your credentials.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">4. Acceptable Streaming Use</h2>
              <ul className="space-y-2 text-sm text-muted list-disc pl-5">
                <li>You may stream video content solely for personal, non-commercial viewing.</li>
                <li>You may not use bots, scrapers, automated downloaders, or tools designed to bypass stream security.</li>
                <li>You may not reverse-engineer, decompile, or attempt to extract source streams without authorization.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">5. Third-Party Services</h2>
              <p className="text-sm text-muted leading-relaxed">
                WeAre may provide links or utilize third-party infrastructure (such as CDN providers, authentication relays, or analytics). WeAre is not responsible for external services or third-party web content.
              </p>
            </section>

            {/* Cookies Policy Section with anchor #cookies */}
            <section id="cookies" className="rounded-2xl border border-accent/30 bg-accent/5 p-6 sm:p-8 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" />
                6. Cookie Policy & Preferences
              </h2>
              <p className="text-sm text-foreground/90 leading-relaxed">
                WeAre uses local storage and strictly necessary session cookies to preserve your video playback progress, keep your active session authenticated, and store your My List selections. We do not deploy invasive third-party tracking or behavioral advertising cookies.
              </p>
              <div className="flex items-center gap-2 text-xs text-accent font-semibold pt-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Cookies comply with GDPR and CCPA privacy standards.</span>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">7. Revisions & Termination</h2>
              <p className="text-sm text-muted leading-relaxed">
                WeAre reserves the right to modify these Terms at any time. Continued use of the service following modifications constitutes your acceptance of updated provisions.
              </p>
            </section>

            <section className="space-y-3 border-t border-border/40 pt-6">
              <h2 className="text-lg font-bold text-white">8. Contact Information</h2>
              <p className="text-sm text-muted leading-relaxed">
                For questions concerning these Terms, reach out to our legal department via our{" "}
                <Link href="/contact" className="text-accent hover:underline font-semibold">
                  Contact Page
                </Link>{" "}
                or email legal@weare-stream.com.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
