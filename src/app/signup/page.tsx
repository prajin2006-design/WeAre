"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, User, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { sanitizeAuthError } from "@/lib/auth/auth-error-helper";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Field validation checks
  const nameError =
    touched.fullName && (!fullName.trim() || fullName.trim().length < 2)
      ? "Enter your name"
      : null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailError =
    touched.email && (!email.trim() || !emailRegex.test(email.trim()))
      ? "Enter a valid email address"
      : null;

  const passwordError =
    touched.password && (!password || password.length < 8)
      ? "Password must be at least 8 characters"
      : null;

  const confirmPasswordError =
    touched.confirmPassword && password !== confirmPassword
      ? "Passwords do not match"
      : null;

  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleResendVerification = async () => {
    if (!email.trim()) return;
    setResending(true);
    setResendStatus(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });
      if (error) {
        setResendStatus(sanitizeAuthError(error));
      } else {
        setResendStatus("Verification email sent! Please check your inbox.");
      }
    } catch {
      setResendStatus("Could not resend email right now. Please try again shortly.");
    } finally {
      setResending(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);
    setNeedsVerification(false);

    // Mark all touched
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError("Enter your name");
      return;
    }

    if (!email.trim() || !emailRegex.test(email.trim())) {
      setFormError("Enter a valid email address");
      return;
    }

    if (!password || password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // 1. Call server-side signup route
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Could not create account. Please try again.");
        setLoading(false);
        return;
      }

      if (data.requiresVerification) {
        setNeedsVerification(true);
        setSuccessMsg("Account created successfully. Check your email to verify your WeAre account.");
        setLoading(false);
        return;
      }

      setSuccessMsg("Account created successfully! Signing you in...");

      // 2. Automatically sign in with client Supabase instance
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        const errorLower = signInError.message.toLowerCase();
        if (errorLower.includes("confirm") || errorLower.includes("verify")) {
          setNeedsVerification(true);
          setSuccessMsg("Account created successfully. Check your email to verify your WeAre account.");
        } else {
          router.push("/login");
        }
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setFormError(sanitizeAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-accent/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Brand Logo Header */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-1 group">
          <span className="text-accent text-3xl font-extrabold tracking-tighter">WE</span>
          <span className="text-foreground text-3xl font-light tracking-widest pl-0.5">ARE</span>
        </Link>
        <p className="mt-1 text-xs font-mono text-muted">CINEMATIC STREAMING PLATFORM</p>
      </div>

      {/* Sign Up Card */}
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-surface/90 p-7 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
          Create your WeAre account
        </h1>
        <p className="text-xs text-muted mb-6">
          Stream movies, series, and originals with your personalized library.
        </p>

        {formError && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 space-y-2 text-xs text-emerald-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
            {needsVerification && (
              <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="text-xs font-bold text-accent hover:underline disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend verification email"}
                </button>
                {resendStatus && (
                  <span className="text-[11px] text-muted">{resendStatus}</span>
                )}
              </div>
            )}
          </div>
        )}


        <form onSubmit={handleSignUp} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => handleBlur("fullName")}
                placeholder="Alex Hunter"
                className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors ${
                  nameError ? "border-red-500/70 focus:border-red-500" : "border-border focus:border-accent"
                }`}
              />
            </div>
            {nameError && (
              <p className="text-[11px] text-red-400 mt-1 font-medium">{nameError}</p>
            )}
          </div>

          {/* Email */}
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
                onBlur={() => handleBlur("email")}
                placeholder="you@example.com"
                className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors ${
                  emailError ? "border-red-500/70 focus:border-red-500" : "border-border focus:border-accent"
                }`}
              />
            </div>
            {emailError && (
              <p className="text-[11px] text-red-400 mt-1 font-medium">{emailError}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                placeholder="At least 8 characters"
                className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors ${
                  passwordError ? "border-red-500/70 focus:border-red-500" : "border-border focus:border-accent"
                }`}
              />
            </div>
            {passwordError && (
              <p className="text-[11px] text-red-400 mt-1 font-medium">{passwordError}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur("confirmPassword")}
                placeholder="Re-enter password"
                className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors ${
                  confirmPasswordError ? "border-red-500/70 focus:border-red-500" : "border-border focus:border-accent"
                }`}
              />
            </div>
            {confirmPasswordError && (
              <p className="text-[11px] text-red-400 mt-1 font-medium">{confirmPasswordError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-black hover:bg-accent-hover transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-accent/20 mt-2 flex items-center justify-center gap-2"
          >
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-6 border-t border-border/50 pt-5 text-center text-xs text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
