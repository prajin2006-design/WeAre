import { notFound } from "next/navigation";
import { ContentService } from "@/lib/content/content-service";
import { resolveContentById, resolveEpisode } from "@/lib/catalog/content-resolver";
import { DynamicCatalogService } from "@/lib/tmdb/dynamic-catalog";
import { VideoSourceService } from "@/lib/video/video-source-service";
import { isMovie, Episode } from "@/types/content";
import WatchPlayerClient from "./player-client";

interface WatchPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    ep?: string;
    season?: string;
    episode?: string;
  }>;
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const { id } = await params;
  const { ep, season, episode: queryEpisode } = await searchParams;

  let effectiveEpParam = ep;
  if (!effectiveEpParam && (season || queryEpisode)) {
    const s = season ? parseInt(season, 10) : 1;
    const e = queryEpisode ? parseInt(queryEpisode, 10) : 1;
    effectiveEpParam = `s${s}-e${e}`;
  }

  const isExplicitSeries = Boolean(effectiveEpParam) || /^(s-|tv-|series-)/i.test(id);
  const preferredType: "movie" | "tv" | undefined = isExplicitSeries
    ? "tv"
    : /^(m-|movie-)/i.test(id)
    ? "movie"
    : undefined;

  const [content, recommended] = await Promise.all([
    resolveContentById(id, preferredType),
    ContentService.getRecommended(id, preferredType, 10),
  ]);

  if (!content) {
    notFound();
  }

  const title = content.title;
  let subtitle = "";
  let episodeData: Episode | undefined = undefined;
  let nextEpisodeUrl: string | undefined = undefined;
  let prevEpisodeUrl: string | undefined = undefined;
  let initialSeasonEpisodes: Episode[] = [];

  let contentTargetId = content.id;
  let targetType: "movie" | "episode" = "movie";

  if (!isMovie(content)) {
    targetType = "episode";
    // Series: look for requested episode or default to season 1 episode 1
    const episode = effectiveEpParam
      ? await resolveEpisode(content.id, effectiveEpParam)
      : content.seasons?.[0]?.episodes?.[0];

    if (episode) {
      contentTargetId = episode.id;
      subtitle = `Season ${episode.season_number} • Episode ${episode.episode_number}: ${episode.title}`;
      episodeData = episode;

      // Find previous & next episode in season
      let currentSeason = content.seasons?.find(
        (s) => s.id === episode.season_id || s.season_number === episode.season_number
      );
      if (!currentSeason || !currentSeason.episodes || currentSeason.episodes.length === 0) {
        if (content.tmdb_id) {
          try {
            const tmdbSeason = await DynamicCatalogService.getSeason(
              content.tmdb_id,
              episode.season_number
            );
            if (tmdbSeason) currentSeason = tmdbSeason;
          } catch {
            // Non-blocking
          }
        }
      }
      if (currentSeason && currentSeason.episodes) {
        initialSeasonEpisodes = currentSeason.episodes;
        const prevEp = currentSeason.episodes.find(
          (e) => e.episode_number === episode.episode_number - 1
        );
        if (prevEp) {
          prevEpisodeUrl = `/watch/${content.id}?season=${episode.season_number}&episode=${prevEp.episode_number}`;
        }

        const nextEp = currentSeason.episodes.find(
          (e) => e.episode_number === episode.episode_number + 1
        );
        if (nextEp) {
          nextEpisodeUrl = `/watch/${content.id}?season=${episode.season_number}&episode=${nextEp.episode_number}`;
        }
      }
    }
  }

  const effectiveTmdbId =
    content.tmdb_id ||
    (() => {
      const clean = String(content.id).replace(/^(m-|movie-|s-|tv-|series-|tmdb-)/i, "");
      const num = parseInt(clean, 10);
      return !isNaN(num) && num > 0 ? num : undefined;
    })();

  if (!content.tmdb_id && effectiveTmdbId) {
    content.tmdb_id = effectiveTmdbId;
  }

  // Fetch real video sources and subtitles
  const [sources, subtitles] = await Promise.all([
    VideoSourceService.getSourcesForContent(
      contentTargetId,
      targetType,
      effectiveTmdbId,
      episodeData?.season_number,
      episodeData?.episode_number
    ),
    VideoSourceService.getSubtitlesForContent(contentTargetId, targetType),
  ]);

  return (
    <WatchPlayerClient
      content={content}
      sources={sources}
      subtitles={subtitles}
      title={title}
      subtitle={subtitle}
      episode={episodeData}
      prevEpisodeUrl={prevEpisodeUrl}
      nextEpisodeUrl={nextEpisodeUrl}
      recommended={recommended}
      initialSeasonEpisodes={initialSeasonEpisodes}
    />
  );
}
