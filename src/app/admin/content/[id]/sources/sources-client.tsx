"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ContentItem, VideoSource } from "@/types/content";
import {
  Server,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  Loader2,
  Play,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface AdminSourcesClientProps {
  content: ContentItem;
  initialSources: VideoSource[];
}

export default function AdminSourcesClient({
  content,
  initialSources,
}: AdminSourcesClientProps) {
  const { showToast } = useToast();
  const [sources, setSources] = useState<VideoSource[]>(initialSources);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"hls" | "mp4">("hls");
  const [formUrl, setFormUrl] = useState("");
  const [formHlsUrl, setFormHlsUrl] = useState("");
  const [formQuality, setFormQuality] = useState("1080p");
  const [formLanguage, setFormLanguage] = useState("en");
  const [formPriority, setFormPriority] = useState(1);
  const [formActive, setFormActive] = useState(true);

  const handleToggleActive = async (source: VideoSource) => {
    try {
      const res = await fetch("/api/admin/sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: source.id, is_active: !source.is_active }),
      });
      if (res.ok) {
        setSources((prev) =>
          prev.map((s) => (s.id === source.id ? { ...s, is_active: !s.is_active } : s))
        );
        showToast(
          `Source "${source.name}" is now ${!source.is_active ? "active" : "disabled"}`,
          "info"
        );
      } else {
        showToast("Failed to update source status", "error");
      }
    } catch {
      showToast("Network error updating source", "error");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete video source "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/sources?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSources((prev) => prev.filter((s) => s.id !== id));
        showToast(`Deleted source "${name}"`, "info");
      } else {
        showToast("Failed to delete source", "error");
      }
    } catch {
      showToast("Network error deleting source", "error");
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) return;

    try {
      setSaving(true);
      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: content.id,
          content_type: "movie",
          name: formName.trim(),
          source_type: formType,
          url: formUrl.trim(),
          hls_url: formType === "hls" ? (formHlsUrl.trim() || formUrl.trim()) : null,
          quality: formQuality,
          language: formLanguage,
          priority: Number(formPriority) || 1,
          is_active: formActive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.source) {
        setSources((prev) => [...prev, data.source]);
        setShowAddModal(false);
        setFormName("");
        setFormUrl("");
        setFormHlsUrl("");
        showToast(`Added source "${formName}" successfully!`, "success");
      } else {
        showToast(data.error || "Failed to create source", "error");
      }
    } catch {
      showToast("Network error creating video source", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
      {/* Header */}
      <div className="mb-8 border-b border-border/40 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Admin Console</span>
          </Link>
          <div className="flex items-center gap-2">
            <Server className="h-6 w-6 text-accent" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Manage Authorized Streams
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Configure multi-bitrate HLS and MP4 sources for:{" "}
            <strong className="text-white">{content.title}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/watch/${content.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-on-primary bg-surface/80 px-4 py-2.5 text-xs font-bold text-foreground hover:border-accent hover:text-accent hover:bg-accent/10 active:scale-95 transition-all"
          >
            <Play className="h-4 w-4" />
            <span>Test Watch Player</span>
          </Link>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-black hover:bg-accent-hover active:scale-95 transition-all shadow-lg shadow-accent/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add Video Source</span>
          </button>
        </div>
      </div>

      {/* Sources Table */}
      <div className="rounded-2xl border border-border/60 bg-surface/40 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              Configured Streaming Servers ({sources.length})
            </h2>
          </div>
          <span className="text-xs text-muted font-medium">Legitimate Authorized Sources Only</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/80 text-muted uppercase tracking-wider border-b border-border/40 font-semibold">
              <tr>
                <th className="py-3 px-4">Server Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Quality</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Stream URL</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-foreground/90">
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted">
                    No streaming sources attached to this title. Click &quot;Add Video Source&quot; above.
                  </td>
                </tr>
              ) : (
                sources.map((s) => (
                  <tr key={s.id} className="hover:bg-surface/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{s.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-accent uppercase">
                        {s.source_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted">{s.quality || "Auto"}</td>
                    <td className="py-3.5 px-4 uppercase text-muted">{s.language || "en"}</td>
                    <td className="py-3.5 px-4 text-muted font-mono">{s.priority}</td>
                    <td className="py-3.5 px-4">
                      {s.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted">
                          <XCircle className="h-3.5 w-3.5" />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted font-mono text-[11px] max-w-xs truncate" title={s.url}>
                      {s.url}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(s)}
                          className="px-2 py-1 rounded text-[11px] font-semibold text-muted hover:text-white hover:bg-white/10"
                        >
                          {s.is_active ? "Disable" : "Enable"}
                        </button>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-muted hover:text-white"
                          title="Open URL"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 text-red-400/80 hover:text-red-400"
                          title="Delete Source"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Add Authorized Video Source</h2>
            <p className="text-xs text-muted mb-4">
              Enter stream details. Supports HLS (.m3u8) adaptive manifests or standard MP4 streams.
            </p>

            <form onSubmit={handleAddSource} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Server / Source Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. WeAre HD (Primary)"
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Source Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as "hls" | "mp4")}
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent"
                  >
                    <option value="hls">HLS (.m3u8)</option>
                    <option value="mp4">MP4 Video</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Stream URL</label>
                <input
                  type="url"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://.../manifest.m3u8 or video.mp4"
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent font-mono text-[11px]"
                />
              </div>

              {formType === "hls" && (
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">HLS Manifest URL (Optional if identical)</label>
                  <input
                    type="url"
                    value={formHlsUrl}
                    onChange={(e) => setFormHlsUrl(e.target.value)}
                    placeholder="https://.../master.m3u8"
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent font-mono text-[11px]"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Quality</label>
                  <select
                    value={formQuality}
                    onChange={(e) => setFormQuality(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent"
                  >
                    <option value="Auto">Auto / Multi</option>
                    <option value="1080p">1080p Full HD</option>
                    <option value="720p">720p HD</option>
                    <option value="480p">480p SD</option>
                    <option value="360p">360p Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Language</label>
                  <input
                    type="text"
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value)}
                    placeholder="en"
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Priority Order</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formPriority}
                    onChange={(e) => setFormPriority(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-white outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="source-active-check"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded border-border accent-accent"
                />
                <label htmlFor="source-active-check" className="text-xs text-foreground cursor-pointer">
                  Activate stream immediately for users
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-on-primary px-4 py-2 text-xs font-semibold text-foreground hover:border-accent hover:text-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs font-bold text-black hover:bg-accent-hover transition-all disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Stream</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
