"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import { sanitizeAuthError } from "@/lib/auth/auth-error-helper";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
          redirectTo: `${origin}/reset-password`,
        });
        if (error) {
          const lower = error.message.toLowerCase();
          // Rate limit or service unavailability
          if (lower.includes("rate") || lower.includes("too many")) {
            setErrorMsg(sanitizeAuthError(error));
            setLoading(false);
            return;
          }
          // For any other error (including user not found), treat as success to prevent user enumeration
        }
      } catch (err: unknown) {
        console.warn("[ForgotPassword] Notice:", err);
      }
    }

    setLoading(false);
    setSubmitted(true);
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-accent/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-1 group">
          <span className="text-accent text-3xl font-extrabold tracking-tighter">WE</span>
          <span className="text-foreground text-3xl font-light tracking-widest pl-0.5">ARE</span>
        </Link>
        <p className="mt-1 text-xs font-mono text-muted">PASSWORD RECOVERY</p>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-surface/90 p-7 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {!submitted ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
              Reset your password
            </h1>
            <p className="text-xs text-muted mb-6">
              Enter the email address associated with your account, and we will send you a reset link.
            </p>

            {errorMsg && (
              <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 flex items-center gap-2.5 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-black hover:bg-accent-hover transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-accent/20 mt-2"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Instructions Sent</h2>
            <p className="text-xs text-muted leading-relaxed mb-6">
              Password reset instructions have been sent to your email.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-xs text-accent font-semibold hover:underline"
            >
              Didn&apos;t receive it? Try another email
            </button>
          </div>
        )}

        <div className="mt-6 border-t border-border/50 pt-5 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
