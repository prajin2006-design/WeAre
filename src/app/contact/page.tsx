"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { Mail, User, MessageSquare, Send, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import Link from "next/link";

function ContactForm() {
  const searchParams = useSearchParams();
  const preselectedSubject = searchParams.get("subject") === "report" ? "bug" : "general";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(preselectedSubject);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Please provide your name.");
      return;
    }
    if (!email || !email.includes("@")) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setErrorMsg("Please provide a descriptive message (at least 10 characters).");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl border border-border/70 bg-surface/60 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
      {!submitted ? (
        <>
          <h2 className="text-2xl font-bold text-white mb-2">Send us a message</h2>
          <p className="text-xs text-muted mb-6 leading-relaxed">
            Have questions about content rights, reporting a video playback bug, or platform inquiries? Fill out the form below.
          </p>

          {errorMsg && (
            <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                Topic / Category
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="general">General Inquiry</option>
                <option value="bug">Report Playback / Content Issue</option>
                <option value="feature">Feature Suggestion</option>
                <option value="licensing">Creator & Film Licensing</option>
                <option value="account">Account Support</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                Message Details
              </label>
              <div className="relative">
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question or issue in detail..."
                  className="w-full rounded-xl border border-border bg-background py-3 px-3.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-black hover:bg-accent-hover active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-accent/20"
            >
              <Send className="h-4 w-4" />
              <span>{loading ? "Transmitting..." : "Send Message"}</span>
            </button>
          </form>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Message Received</h2>
          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed mb-6">
            Thank you, <strong className="text-white">{name}</strong>. Your feedback has been recorded in the platform queue. A support specialist will follow up at <strong className="text-white">{email}</strong> if action is needed.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setSubmitted(false);
                setMessage("");
              }}
              className="rounded-xl border border-border bg-surface px-5 py-2.5 text-xs font-bold text-white hover:bg-surface-hover"
            >
              Send Another Message
            </button>
            <Link
              href="/"
              className="rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-black hover:bg-accent-hover"
            >
              Back to Movies
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/30 px-3 py-1 text-xs font-bold text-accent uppercase mb-3">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Get in Touch</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
              Contact WeAre
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
              We welcome audience questions, bug reports, and partnership inquiries.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="text-center py-12 text-muted">
                <HelpCircle className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
                Loading contact form...
              </div>
            }
          >
            <ContactForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
