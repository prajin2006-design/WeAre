"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { sanitizeAuthError } from "@/lib/auth/auth-error-helper";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const emailTrimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const emailInlineError =
    touched.email && !emailTrimmed
      ? "Enter your email"
      : touched.email && !emailRegex.test(emailTrimmed)
      ? "Enter a valid email address"
      : null;

  const passwordInlineError =
    touched.password && !password
      ? "Enter your password"
      : null;

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    setTouched({ email: true, password: true });

    if (!emailTrimmed) {
      setErrorMsg("Enter your email");
      return;
    }

    if (!emailRegex.test(emailTrimmed)) {
      setErrorMsg("Enter a valid email address");
      return;
    }

    if (!password) {
      setErrorMsg("Enter your password");
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password,
      });

      if (error) {
        setErrorMsg(sanitizeAuthError(error));
      } else if (data?.user) {
        setSuccessMsg("Signed in successfully. Redirecting...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 600);
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
    } catch (err: unknown) {
      setErrorMsg(sanitizeAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-accent/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Brand Logo Header */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-1 group">
          <span className="text-accent text-3xl font-extrabold tracking-tighter">WE</span>
          <span className="text-foreground text-3xl font-light tracking-widest pl-0.5">ARE</span>
        </Link>
        <p className="mt-1 text-xs font-mono text-muted">CINEMATIC STREAMING PLATFORM</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-surface/90 p-7 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
          Welcome back
        </h1>
        <p className="text-xs text-muted mb-6">
          Sign in to access your watchlist, continue watching, and personalized recommendations.
        </p>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
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
                onBlur={() => handleBlur("email")}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="you@example.com"
                className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors ${
                  emailInlineError ? "border-red-500 focus:border-red-500" : "border-border focus:border-accent"
                }`}
              />
            </div>
            {emailInlineError && (
              <p className="mt-1 text-[11px] text-red-400 font-medium">{emailInlineError}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-muted">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-accent hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="password"
                required
                value={password}
                onBlur={() => handleBlur("password")}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="••••••••"
                className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors ${
                  passwordInlineError ? "border-red-500 focus:border-red-500" : "border-border focus:border-accent"
                }`}
              />
            </div>
            {passwordInlineError && (
              <p className="mt-1 text-[11px] text-red-400 font-medium">{passwordInlineError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-black hover:bg-accent-hover transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-accent/20 mt-2 flex items-center justify-center gap-2"
          >
            <span>{loading ? "Signing in..." : "Sign In"}</span>
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-6 border-t border-border/50 pt-5 text-center text-xs text-muted">
          New to WeAre?{" "}
          <Link href="/signup" className="text-accent font-semibold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

