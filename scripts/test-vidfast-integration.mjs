import { vidFastClient } from "../src/lib/vidfast/client.ts";

console.log("WEARE STREAMING PLATFORM: VIDFAST INTEGRATION TESTS\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// Test 1: Movie Embed URL correctly generates https://vidfast.vc/movie/{id}?autoPlay=true
const movieUrl = vidFastClient.getMovieEmbedUrl({ tmdbId: 550 });
assert(
  movieUrl === "https://vidfast.vc/movie/550?autoPlay=true",
  `Test 1: Movie Embed URL correctly generates: ${movieUrl}`
);

// Test 2: TV Series Embed URL correctly generates https://vidfast.vc/tv/{id}/{season}/{episode}?autoPlay=true
const tvUrl = vidFastClient.getEpisodeEmbedUrl({
  tmdbId: 1399,
  seasonNumber: 1,
  episodeNumber: 1,
});
assert(
  tvUrl === "https://vidfast.vc/tv/1399/1/1?autoPlay=true",
  `Test 2: TV Series Embed URL correctly generates: ${tvUrl}`
);

// Test 3: Specific TV Season/Episode dynamically
const tvCustomUrl = vidFastClient.getEpisodeEmbedUrl({
  tmdbId: 1396,
  seasonNumber: 3,
  episodeNumber: 7,
});
assert(
  tvCustomUrl === "https://vidfast.vc/tv/1396/3/7?autoPlay=true",
  `Test 3: TV Season 3 Episode 7 generates: ${tvCustomUrl}`
);

// Test 4: Invalid TMDB IDs return null
assert(
  vidFastClient.getMovieEmbedUrl({ tmdbId: 0 }) === null &&
    vidFastClient.getMovieEmbedUrl({ tmdbId: -1 }) === null &&
    vidFastClient.getMovieEmbedUrl({ tmdbId: NaN }) === null,
  "Test 4: Invalid TMDB IDs return null safely"
);

// Test 5: Invalid TV seasons or episodes return null
assert(
  vidFastClient.getEpisodeEmbedUrl({ tmdbId: 1399, seasonNumber: 0, episodeNumber: 1 }) === null &&
    vidFastClient.getEpisodeEmbedUrl({ tmdbId: 1399, seasonNumber: 1, episodeNumber: 0 }) === null,
  "Test 5: Invalid TV season/episode numbers return null safely"
);

// Test 6: VideoSource normalization
const source = vidFastClient.getAuthorizedVideoSource("550", "movie", 550);
assert(
  source !== null &&
    source.name === "VidFast" &&
    source.source_type === "embed" &&
    source.url === "https://vidfast.vc/movie/550?autoPlay=true" &&
    source.priority === 2 &&
    source.quality === "Auto",
  "Test 6: VideoSource object correctly structured with priority 2, quality Auto"
);

console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
