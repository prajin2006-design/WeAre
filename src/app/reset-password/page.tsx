"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import { sanitizeAuthError } from "@/lib/auth/auth-error-helper";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password || password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) {
          setErrorMsg(sanitizeAuthError(error));
          setLoading(false);
          return;
        }
      } catch (err) {
        setErrorMsg(sanitizeAuthError(err));
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setSuccess(true);
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
        <p className="mt-1 text-xs font-mono text-muted">SECURE ACCOUNT UPDATE</p>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-surface/90 p-7 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {!success ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
              Create New Password
            </h1>
            <p className="text-xs text-muted mb-6">
              Enter your new password below. It must be at least 8 characters.
            </p>

            {errorMsg && (
              <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 flex items-center gap-2.5 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-black hover:bg-accent-hover transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-accent/20 mt-2 flex items-center justify-center gap-2"
              >
                <span>{loading ? "Updating..." : "Update Password"}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Password Updated</h2>
            <p className="text-xs text-muted leading-relaxed mb-6">
              Password updated successfully.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-accent py-3 text-sm font-bold text-black hover:bg-accent-hover transition-all active:scale-95 shadow-lg shadow-accent/20"
            >
              <span>Continue to WeAre</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
