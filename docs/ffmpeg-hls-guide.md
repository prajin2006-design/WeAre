# WeAre FFmpeg Video to HLS Transcoding Guide

This document details the authorized workflow for converting master video assets into multi-bitrate HTTP Live Streaming (HLS) manifests (`.m3u8`) and segmented transport stream (`.ts`) files.

---

## 1. Prerequisites

- FFmpeg 5.0+ installed with `libx264` and `aac` support.
- Hardware acceleration (optional): NVIDIA NVENC (`h264_nvenc`) or Intel QuickSync (`h264_qsv`).

---

## 2. Multi-Bitrate HLS Architecture

Target variants:
- **1080p High**: 1920x1080 @ 4500k video, 192k audio
- **720p Medium**: 1280x720 @ 2500k video, 128k audio
- **480p SD**: 854x480 @ 1200k video, 96k audio
- **360p Low**: 640x360 @ 600k video, 64k audio

Segment length: **6 seconds** (`-hls_time 6`)
Playlist type: **VOD** (`-hls_playlist_type vod`)

---

## 3. Transcoding Command (Single-Pass Multi-Variant)

```bash
ffmpeg -i input_movie.mp4 \
  -filter_complex \
  "[0:v]split=4[v1][v2][v3][v4]; \
   [v1]scale=w=1920:h=1080[v1out]; \
   [v2]scale=w=1280:h=720[v2out]; \
   [v3]scale=w=854:h=480[v3out]; \
   [v4]scale=w=640:h=360[v4out]" \
  -map "[v1out]" -c:v:0 libx264 -b:v:0 4500k -maxrate:v:0 4800k -bufsize:v:0 9000k \
  -map "[v2out]" -c:v:1 libx264 -b:v:1 2500k -maxrate:v:1 2700k -bufsize:v:1 5000k \
  -map "[v3out]" -c:v:2 libx264 -b:v:2 1200k -maxrate:v:2 1400k -bufsize:v:2 2400k \
  -map "[v4out]" -c:v:3 libx264 -b:v:3 600k  -maxrate:v:3 750k  -bufsize:v:3 1200k \
  -map a:0 -c:a:0 aac -b:a:0 192k \
  -map a:0 -c:a:1 aac -b:a:1 128k \
  -map a:0 -c:a:2 aac -b:a:2 96k \
  -map a:0 -c:a:3 aac -b:a:3 64k \
  -f hls \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_flags independent_segments \
  -hls_segment_type mpegts \
  -hls_segment_filename "stream_%v/data%03d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3" \
  stream_%v/manifest.m3u8
```

---

## 4. Directory Output Structure

```
output_directory/
├── master.m3u8              <- Master manifest referencing stream_0, stream_1, etc.
├── stream_0/                <- 1080p stream
│   ├── manifest.m3u8
│   ├── data000.ts
│   └── ...
├── stream_1/                <- 720p stream
│   ├── manifest.m3u8
│   └── ...
├── stream_2/                <- 480p stream
│   ├── manifest.m3u8
│   └── ...
└── stream_3/                <- 360p stream
    ├── manifest.m3u8
    └── ...
```

---

## 5. WebVTT Subtitle Generation

To extract and format embedded subtitles into WebVTT:

```bash
# Extract stream 0:s:0 into WebVTT
ffmpeg -i input_movie.mp4 -map 0:s:0 english.vtt
```

---

## 6. Uploading to WeAre Storage

1. Upload the output directory recursively to the Supabase Storage `videos` bucket or custom CDN:
   ```bash
   # Using Supabase CLI or Storage API:
   supabase storage cp -r ./output_directory ss:///videos/content-id/
   ```
2. Register the master manifest URL (`https://.../videos/content-id/master.m3u8`) in the `video_sources` table:
   ```sql
   INSERT INTO public.video_sources (content_id, content_type, name, source_type, url, hls_url, quality)
   VALUES ('<content-uuid>', 'movie', 'WeAre HD', 'hls', 'https://.../master.m3u8', 'https://.../master.m3u8', 'Auto');
   ```
