"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import SafeImage from "@/components/ui/SafeImage";
import { useUserContent } from "@/lib/context/user-content-context";
import { useToast } from "@/components/ui/Toast";
import { UserService } from "@/lib/content/user-service";
import { createClient } from "@/lib/supabase/client";
import { sanitizeAuthError } from "@/lib/auth/auth-error-helper";
import {
  User,
  KeyRound,
  Bookmark,
  Play,
  History,
  Trash2,
  Edit3,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronRight,
  X,
  Check,
  ArrowRight,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const {
    userId,
    userEmail,
    userProfile,
    myList,
    continueWatching,
    watchHistory,
    removeFromWatchProgress,
    removeFromWatchHistory,
    refreshUserData,
    signOut,
  } = useUserContent();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"continue" | "mylist" | "history">("continue");

  // Edit Profile Modal
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNameInput, setEditNameInput] = useState("");
  const [selectedAvatarColor, setSelectedAvatarColor] = useState(
    userProfile?.avatar_url || "from-amber-500 to-amber-700"
  );
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password Modal
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPasswordLoading, setChangingPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const profileName =
    userProfile?.display_name || userEmail?.split("@")[0] || "WeAre Member";

  const memberSince = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Member";

  const avatarColorPresets = [
    { label: "Amber Gold", value: "from-amber-500 to-amber-700", bg: "bg-amber-500" },
    { label: "Cyber Cyan", value: "from-cyan-500 to-blue-700", bg: "bg-cyan-500" },
    { label: "Neon Purple", value: "from-purple-500 to-indigo-700", bg: "bg-purple-500" },
    { label: "Emerald Matrix", value: "from-emerald-500 to-teal-800", bg: "bg-emerald-500" },
    { label: "Crimson Red", value: "from-rose-500 to-red-700", bg: "bg-rose-500" },
  ];

  const handleOpenEditProfile = () => {
    setEditNameInput(profileName);
    setSelectedAvatarColor(userProfile?.avatar_url || "from-amber-500 to-amber-700");
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNameInput.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }

    setSavingProfile(true);
    if (userId) {
      const res = await UserService.updateProfile(userId, {
        display_name: editNameInput.trim(),
        avatar_url: selectedAvatarColor,
      });
      if (res.success) {
        await refreshUserData();
        showToast("Profile updated successfully", "success");
      } else {
        showToast(res.error || "Could not update profile", "error");
      }
    }
    setSavingProfile(false);
    setIsEditingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!newPassword || newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setChangingPasswordLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(sanitizeAuthError(error));
      } else {
        showToast("Password updated successfully", "success");
        setIsChangingPassword(false);
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (err) {
      setPasswordError(sanitizeAuthError(err));
    } finally {
      setChangingPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    showToast("Signed out successfully", "info");
    router.push("/");
    router.refresh();
  };

  const handleRemoveContinue = async (contentId: string, episodeId?: string, title?: string) => {
    await removeFromWatchProgress(contentId, episodeId);
    showToast(`Removed "${title || "item"}" from continue watching`, "info");
  };

  const handleRemoveHistory = async (historyId: string, title?: string) => {
    await removeFromWatchHistory(historyId);
    showToast(`Removed "${title || "item"}" from watch history`, "info");
  };

  // If user is not authenticated, show sleek sign-in prompt
  if (!userId) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-24 sm:py-32 relative overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accent/10 rounded-full blur-[130px] pointer-events-none" />

          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-surface/90 p-8 text-center shadow-2xl backdrop-blur-xl relative z-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 border border-accent/30 text-accent shadow-lg shadow-accent/10">
              <User className="h-8 w-8" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">WeAre Account</h1>
            <p className="text-xs text-muted mb-8 leading-relaxed">
              Sign in to manage your profile, view your personal watchlist, and resume watching right where you left off.
            </p>

            <div className="space-y-3">
              <Link
                href="/login"
                className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-black hover:bg-accent-hover transition-all active:scale-95 shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
              >
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="w-full rounded-xl border border-border bg-background/60 py-2.5 text-xs font-semibold text-white hover:bg-surface transition-all flex items-center justify-center"
              >
                Create Account
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const activeAvatarClass = userProfile?.avatar_url || "from-amber-500 to-amber-700";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* ============================================================== */}
          {/* 1. WEARE ACCOUNT HEADER CARD (Inspired by modern streaming UI) */}
          {/* ============================================================== */}
          <section className="rounded-2xl border border-border/70 bg-surface/75 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
              {/* Left: Avatar + Details */}
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
                {/* Profile Avatar */}
                <div
                  className={`flex h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${activeAvatarClass} text-3xl sm:text-4xl font-black text-black shadow-xl ring-2 ring-white/10`}
                >
                  {profileName.charAt(0).toUpperCase()}
                </div>

                {/* Display Name & Email Address */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] font-mono tracking-widest text-accent uppercase font-bold">
                      {"//"} WEARE ACCOUNT
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                      <ShieldCheck className="w-3 h-3" />
                      Active
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {profileName}
                  </h1>

                  <p className="text-xs text-muted font-mono">{userEmail}</p>

                  <p className="text-[11px] text-muted/80 pt-0.5">
                    Member since {memberSince}
                  </p>
                </div>
              </div>

              {/* Right: Edit Profile Button */}
              <button
                type="button"
                onClick={handleOpenEditProfile}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 hover:bg-surface px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-md active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5 text-accent" />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Quick Activity Stats Ribbon */}
            <div className="grid grid-cols-3 gap-4 border-t border-border/50 mt-6 pt-5">
              <div className="text-center sm:text-left">
                <span className="block text-xl sm:text-2xl font-bold text-white">
                  {continueWatching.length}
                </span>
                <span className="text-[11px] font-mono text-muted uppercase">
                  Continue Watching
                </span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block text-xl sm:text-2xl font-bold text-white">
                  {myList.length}
                </span>
                <span className="text-[11px] font-mono text-muted uppercase">
                  My List Titles
                </span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block text-xl sm:text-2xl font-bold text-white">
                  {watchHistory.length}
                </span>
                <span className="text-[11px] font-mono text-muted uppercase">
                  Watch History
                </span>
              </div>
            </div>
          </section>

          {/* ============================================================== */}
          {/* 2. PROFILE DETAILS (Name, Email, Change Password)              */}
          {/* ============================================================== */}
          <section className="rounded-2xl border border-border/70 bg-surface/60 p-6 sm:p-7 backdrop-blur-md space-y-4">
            <h2 className="text-xs font-mono tracking-widest text-muted uppercase font-bold">
              PROFILE INFORMATION
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background/50">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono text-muted uppercase block">
                    Full Name
                  </span>
                  <span className="text-sm font-semibold text-white block">
                    {profileName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenEditProfile}
                  className="text-xs text-accent hover:underline font-medium"
                >
                  Edit
                </button>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background/50">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono text-muted uppercase block">
                    Email Address
                  </span>
                  <span className="text-sm font-semibold text-white block truncate max-w-[200px]">
                    {userEmail}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Verified
                </span>
              </div>
            </div>

            {/* Change Password Bar */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center text-accent">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block">
                    Password
                  </span>
                  <span className="text-xs text-muted block font-mono">
                    ••••••••••••
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasswordError(null);
                  setIsChangingPassword(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-surface transition-colors"
              >
                Change Password
              </button>
            </div>
          </section>

          {/* ============================================================== */}
          {/* 3. MY ACTIVITY (My List, Continue Watching, Watch History)     */}
          {/* ============================================================== */}
          <section className="rounded-2xl border border-border/70 bg-surface/60 p-6 sm:p-7 backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <h2 className="text-xs font-mono tracking-widest text-muted uppercase font-bold">
                MY ACTIVITY
              </h2>

              {/* Tabs */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("continue")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "continue"
                      ? "bg-accent text-black font-bold shadow-md shadow-accent/20"
                      : "text-muted hover:text-white hover:bg-surface"
                  }`}
                >
                  Continue Watching ({continueWatching.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("mylist")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "mylist"
                      ? "bg-accent text-black font-bold shadow-md shadow-accent/20"
                      : "text-muted hover:text-white hover:bg-surface"
                  }`}
                >
                  My List ({myList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "history"
                      ? "bg-accent text-black font-bold shadow-md shadow-accent/20"
                      : "text-muted hover:text-white hover:bg-surface"
                  }`}
                >
                  Watch History ({watchHistory.length})
                </button>
              </div>
            </div>

            {/* TAB CONTENT: CONTINUE WATCHING */}
            {activeTab === "continue" && (
              <div>
                {continueWatching.length === 0 ? (
                  <div className="text-center py-12 rounded-xl border border-dashed border-border/60 bg-background/30 p-6">
                    <Play className="w-10 h-10 text-muted/40 mx-auto mb-2.5" />
                    <h3 className="text-base font-bold text-white mb-1">
                      No Unfinished Content
                    </h3>
                    <p className="text-xs text-muted mb-4 max-w-sm mx-auto">
                      Movies and series you begin watching will automatically appear here to easily resume playback.
                    </p>
                    <Link
                      href="/movies"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-black font-bold text-xs hover:bg-accent-hover transition-colors"
                    >
                      Browse Movies
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {continueWatching.map((item) => {
                      const watchUrl = item.episode_id
                        ? `/watch/${item.content_id}?ep=${item.episode_id}`
                        : `/watch/${item.content_id}`;
                      const detailsUrl = item.episode_id
                        ? `/series/${item.content_id}`
                        : `/movie/${item.content_id}`;
                      const remSecs = Math.max(0, (item.duration || 7200) - item.current_position);
                      const remMins = Math.ceil(remSecs / 60);
                      const timeStr =
                        remMins >= 60
                          ? `${Math.floor(remMins / 60)}h ${remMins % 60}m remaining`
                          : `${remMins}m remaining`;

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-border/60 bg-background/60 overflow-hidden group hover:border-accent/60 transition-all shadow-md flex flex-col justify-between"
                        >
                          <div>
                            <Link href={detailsUrl} className="block relative aspect-video w-full bg-black/40 overflow-hidden">
                              <SafeImage
                                src={item.backdrop_url || item.poster_url}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute bottom-0 inset-x-0 h-1 bg-black/80">
                                <div
                                  className="h-full bg-accent"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                            </Link>
                            <div className="p-3.5 space-y-1">
                              <Link href={detailsUrl}>
                                <h4 className="text-sm font-bold text-white truncate group-hover:text-accent transition-colors">
                                  {item.title}
                                </h4>
                              </Link>
                              {item.episode_title ? (
                                <p className="text-[11px] font-mono text-muted truncate">
                                  S{item.season_number}:E{item.episode_number} · {item.episode_title}
                                </p>
                              ) : (
                                <p className="text-[11px] font-mono text-accent">
                                  {timeStr}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="p-3.5 pt-0 flex items-center justify-between border-t border-border/40 mt-2">
                            <Link
                              href={watchUrl}
                              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                            >
                              <Play className="h-3 w-3 fill-accent" />
                              <span>Resume</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleRemoveContinue(item.content_id, item.episode_id, item.title)}
                              className="p-1 text-muted hover:text-red-400 transition-colors"
                              title="Dismiss from Continue Watching"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: MY LIST */}
            {activeTab === "mylist" && (
              <div>
                {myList.length === 0 ? (
                  <div className="text-center py-12 rounded-xl border border-dashed border-border/60 bg-background/30 p-6">
                    <Bookmark className="w-10 h-10 text-muted/40 mx-auto mb-2.5" />
                    <h3 className="text-base font-bold text-white mb-1">Your List is Empty</h3>
                    <p className="text-xs text-muted mb-4 max-w-sm mx-auto">
                      Save movies and television series to your personal queue to watch anytime.
                    </p>
                    <Link
                      href="/movies"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-black font-bold text-xs hover:bg-accent-hover transition-colors"
                    >
                      Explore Titles
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {myList.map((item) => (
                      <Link
                        key={item.id}
                        href={item.content_type === "movie" ? `/movie/${item.content_id}` : `/series/${item.content_id}`}
                        className="group relative block aspect-[2/3] rounded-xl overflow-hidden bg-black/40 border border-border/60 hover:border-accent/60 transition-all shadow-md"
                      >
                        <SafeImage
                          src={item.content.poster_url}
                          alt={item.content.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <span className="text-xs font-bold text-white truncate">
                            {item.content.title}
                          </span>
                          <span className="text-[10px] text-accent font-mono uppercase">
                            {item.content_type}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: WATCH HISTORY */}
            {activeTab === "history" && (
              <div>
                {watchHistory.length === 0 ? (
                  <div className="text-center py-12 rounded-xl border border-dashed border-border/60 bg-background/30 p-6">
                    <History className="w-10 h-10 text-muted/40 mx-auto mb-2.5" />
                    <h3 className="text-base font-bold text-white mb-1">No Watch History</h3>
                    <p className="text-xs text-muted mb-4 max-w-sm mx-auto">
                      Titles you start watching will automatically appear in your chronological viewing archive.
                    </p>
                    <Link
                      href="/movies"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-black font-bold text-xs hover:bg-accent-hover transition-colors"
                    >
                      Start Watching
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {watchHistory.map((item) => {
                      const watchUrl = item.episode_id
                        ? `/watch/${item.content_id}?ep=${item.episode_id}`
                        : `/watch/${item.content_id}`;
                      const detailsUrl = item.episode_id
                        ? `/series/${item.content_id}`
                        : `/movie/${item.content_id}`;
                      const formattedDate = item.watched_at
                        ? new Date(item.watched_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Recently";

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-border/60 bg-background/50 hover:bg-surface/80 transition-colors"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <Link href={detailsUrl} className="relative w-14 h-9 sm:w-16 sm:h-10 rounded-md overflow-hidden bg-black/40 flex-shrink-0 group/thumb">
                              <SafeImage
                                src={item.backdrop_url || item.poster_url}
                                alt={item.title}
                                fill
                                className="object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                              />
                            </Link>
                            <div className="min-w-0">
                              <Link href={detailsUrl}>
                                <h4 className="text-xs sm:text-sm font-bold text-white truncate hover:text-accent transition-colors">
                                  {item.title}
                                </h4>
                              </Link>
                              <p className="text-[11px] text-muted font-mono truncate">
                                {item.episode_title
                                  ? `S${item.season_number}:E${item.episode_number} · ${item.episode_title}`
                                  : `Watched ${formattedDate}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <Link
                              href={watchUrl}
                              className="px-3 py-1.5 rounded-lg bg-accent text-black text-xs font-bold flex items-center gap-1 hover:bg-accent-hover transition-colors shadow-sm"
                            >
                              <Play className="w-3 h-3 fill-black" />
                              <span>Watch</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleRemoveHistory(item.id, item.title)}
                              className="p-1.5 text-muted hover:text-red-400 transition-colors"
                              title="Remove from history"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ============================================================== */}
          {/* 4. ACCOUNT SETTINGS & SIGN OUT                                 */}
          {/* ============================================================== */}
          <section className="rounded-2xl border border-border/70 bg-surface/60 p-6 sm:p-7 backdrop-blur-md space-y-4">
            <h2 className="text-xs font-mono tracking-widest text-muted uppercase font-bold">
              ACCOUNT CONTROLS
            </h2>

            <div className="divide-y divide-border/40 rounded-xl border border-border/60 bg-background/50 overflow-hidden">
              {/* Account Settings link */}
              <Link
                href="/settings"
                className="flex items-center justify-between p-4 hover:bg-surface/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-muted">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      Account Settings & Preferences
                    </span>
                    <span className="text-xs text-muted block">
                      Playback defaults, language, and system configuration
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </Link>

              {/* Sign Out Action */}
              <div className="flex items-center justify-between p-4 bg-red-500/5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      Sign Out
                    </span>
                    <span className="text-xs text-muted block">
                      Log out from this device and end current session
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 active:scale-95 transition-all shadow-sm"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ================================================================ */}
      {/* EDIT PROFILE MODAL                                               */}
      {/* ================================================================ */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                <span>Edit Profile</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-muted hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  placeholder="Your Name"
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-4 text-sm text-foreground outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-2">
                  Avatar Color Style
                </label>
                <div className="grid grid-cols-5 gap-2.5">
                  {avatarColorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setSelectedAvatarColor(preset.value)}
                      className={`h-11 rounded-xl bg-gradient-to-br ${preset.value} flex items-center justify-center transition-all ${
                        selectedAvatarColor === preset.value
                          ? "ring-2 ring-white scale-105 shadow-lg"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      title={preset.label}
                    >
                      {selectedAvatarColor === preset.value && (
                        <Check className="h-4 w-4 text-black stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-white hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl bg-accent px-5 py-2 text-xs font-bold text-black hover:bg-accent-hover transition-colors shadow-md disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* CHANGE PASSWORD MODAL                                            */}
      {/* ================================================================ */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-accent" />
                <span>Change Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="text-muted hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-4 text-sm text-foreground outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-4 text-sm text-foreground outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-white hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPasswordLoading}
                  className="rounded-xl bg-accent px-5 py-2 text-xs font-bold text-black hover:bg-accent-hover transition-colors shadow-md disabled:opacity-50"
                >
                  {changingPasswordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
