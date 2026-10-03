import http from 'http';

function fetchGet(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: data, json });
      });
    });
    req.on('error', (err) => reject(err));
  });
}

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`[PASS] ${description}`);
    passed++;
  } else {
    console.error(`[FAIL] ${description}`);
    failed++;
  }
}

async function run() {
  console.log('================================================================');
  console.log('WEARE PLATFORM: COMPREHENSIVE DYNAMIC TMDB FLOW TEST SUITE');
  console.log('================================================================\n');

  // 1. SEARCH: 2 Queries & Multi-Type
  console.log('--- TEST GROUP 1: SEARCH FUNCTIONALITY ---');
  try {
    const avatarSearch = await fetchGet('/api/catalog/search?q=avatar&type=all&page=1');
    assert('1.1 Search "avatar" returns HTTP 200', avatarSearch.status === 200);
    assert('1.1 Search "avatar" has items', avatarSearch.json?.items?.length > 0);
    assert('1.1 Search "avatar" contains Avatar title', avatarSearch.json?.items?.some((i) => i.title.toLowerCase().includes('avatar')));

    const batmanSearch = await fetchGet('/api/catalog/search?q=batman&type=all&page=1');
    assert('1.2 Search "batman" returns HTTP 200', batmanSearch.status === 200);
    assert('1.2 Search "batman" has items', batmanSearch.json?.items?.length > 0);
    assert('1.2 Search "batman" contains Batman title', batmanSearch.json?.items?.some((i) => i.title.toLowerCase().includes('batman')));

    const movieOnlySearch = await fetchGet('/api/catalog/search?q=avatar&type=movie&page=1');
    assert('1.3 Search "avatar" movies-only returns HTTP 200', movieOnlySearch.status === 200);
    assert('1.3 Search "avatar" movies-only items do not have seasons', movieOnlySearch.json?.items?.every((i) => !('seasons' in i)));

    const tvOnlySearch = await fetchGet('/api/catalog/search?q=avatar&type=tv&page=1');
    assert('1.4 Search "avatar" tv-only returns HTTP 200', tvOnlySearch.status === 200);
    assert('1.4 Search "avatar" tv-only returns series items', tvOnlySearch.json?.items?.every((i) => 'seasons' in i || i.id.startsWith('tv-') || i.total_seasons !== undefined));

    const emptySearch = await fetchGet('/api/catalog/search?q=');
    assert('1.5 Empty search returns 0 items', emptySearch.json?.items?.length === 0);

    const searchUi = await fetchGet('/search?q=avatar');
    assert('1.6 Search UI /search?q=avatar returns HTTP 200', searchUi.status === 200);
    assert('1.6 Search UI renders search input and header', searchUi.body.includes('Search millions of movies') || searchUi.body.includes('Results for'));
  } catch (err) {
    assert(`1. Search functionality failed: ${err.message}`, false);
  }

  // 2. MOVIE DETAILS (3 different movies: 550 Fight Club, 27205 Inception, 157336 Interstellar)
  console.log('\n--- TEST GROUP 2: MOVIE DETAILS (3 DIFFERENT MOVIES) ---');
  try {
    // Movie 1: Fight Club (550)
    const m1 = await fetchGet('/api/catalog/item?id=550&type=movie');
    assert('2.1 Movie 1 (550) returns HTTP 200', m1.status === 200);
    assert('2.1 Movie 1 is Fight Club', m1.json?.title === 'Fight Club');
    assert('2.1 Movie 1 has overview', Boolean(m1.json?.description));
    assert('2.1 Movie 1 has poster_url', m1.json?.poster_url?.includes('image.tmdb.org'));
    assert('2.1 Movie 1 has backdrop_url', m1.json?.backdrop_url?.includes('image.tmdb.org'));
    assert('2.1 Movie 1 has rating', typeof m1.json?.rating === 'number');
    assert('2.1 Movie 1 has director David Fincher', m1.json?.director === 'David Fincher');

    const m1Page = await fetchGet('/movie/550');
    assert('2.1 Movie 1 details page returns HTTP 200', m1Page.status === 200);
    assert('2.1 Movie 1 details renders title Fight Club', m1Page.body.includes('Fight Club'));

    // Movie 2: Inception (27205)
    const m2 = await fetchGet('/api/catalog/item?id=27205&type=movie');
    assert('2.2 Movie 2 (27205) returns HTTP 200', m2.status === 200);
    assert('2.2 Movie 2 is Inception', m2.json?.title === 'Inception');
    assert('2.2 Movie 2 has director Christopher Nolan', m2.json?.director === 'Christopher Nolan');

    const m2Page = await fetchGet('/movie/27205');
    assert('2.2 Movie 2 details page returns HTTP 200', m2Page.status === 200);
    assert('2.2 Movie 2 details renders Inception', m2Page.body.includes('Inception'));

    // Movie 3: Interstellar (157336)
    const m3 = await fetchGet('/api/catalog/item?id=157336&type=movie');
    assert('2.3 Movie 3 (157336) returns HTTP 200', m3.status === 200);
    assert('2.3 Movie 3 is Interstellar', m3.json?.title === 'Interstellar');
    assert('2.3 Movie 3 has release_year 2014', m3.json?.release_year === 2014);

    const m3Page = await fetchGet('/movie/157336');
    assert('2.3 Movie 3 details page returns HTTP 200', m3Page.status === 200);
    assert('2.3 Movie 3 details renders Interstellar', m3Page.body.includes('Interstellar'));
  } catch (err) {
    assert(`2. Movie details tests failed: ${err.message}`, false);
  }

  // 3. MOVIE → WATCH & NEXSTREAM
  console.log('\n--- TEST GROUP 3: MOVIE → WATCH PLAYBACK & NEXSTREAM ---');
  try {
    const watch550 = await fetchGet('/watch/550');
    assert('3.1 Watch 550 returns HTTP 200', watch550.status === 200);
    assert('3.1 Watch 550 has NexStream Fast server', watch550.body.includes('NexStream Fast'));

    const watch27205 = await fetchGet('/watch/27205');
    assert('3.2 Watch 27205 returns HTTP 200', watch27205.status === 200);
    assert('3.2 Watch 27205 has NexStream Fast server', watch27205.body.includes('NexStream Fast'));

    const watch157336 = await fetchGet('/watch/157336');
    assert('3.3 Watch 157336 returns HTTP 200', watch157336.status === 200);
    assert('3.3 Watch 157336 has NexStream Fast server', watch157336.body.includes('NexStream Fast'));

    const nexInception = await fetchGet('/api/stream/nexstream?type=movie&id=27205');
    assert('3.4 NexStream movie proxy for Inception returns HTTP 200', nexInception.status === 200);
    assert('3.4 NexStream movie proxy embeds codespecters /movie/27205', nexInception.body.includes('codespecters.com/embed/movie/27205'));
  } catch (err) {
    assert(`3. Movie playback tests failed: ${err.message}`, false);
  }

  // 4. TV DETAILS (2 different TV shows: 1396 Breaking Bad, 1399 Game of Thrones)
  console.log('\n--- TEST GROUP 4: TV DETAILS (2 DIFFERENT TV SHOWS) ---');
  try {
    // TV 1: Breaking Bad (1396)
    const tv1 = await fetchGet('/api/catalog/item?id=1396&type=tv');
    assert('4.1 TV 1 (1396) returns HTTP 200', tv1.status === 200);
    assert('4.1 TV 1 is Breaking Bad', tv1.json?.title === 'Breaking Bad');
    assert('4.1 TV 1 has seasons array', Array.isArray(tv1.json?.seasons) && tv1.json?.seasons.length > 0);
    assert('4.1 TV 1 has total_seasons 5', tv1.json?.total_seasons === 5);

    const tv1Page = await fetchGet('/series/1396');
    assert('4.1 TV 1 details page returns HTTP 200', tv1Page.status === 200);
    assert('4.1 TV 1 details renders Breaking Bad', tv1Page.body.includes('Breaking Bad'));

    // TV 2: Game of Thrones (1399)
    const tv2 = await fetchGet('/api/catalog/item?id=1399&type=tv');
    assert('4.2 TV 2 (1399) returns HTTP 200', tv2.status === 200);
    assert('4.2 TV 2 is Game of Thrones', tv2.json?.title === 'Game of Thrones');
    assert('4.2 TV 2 has total_seasons 8', tv2.json?.total_seasons === 8);

    const tv2Page = await fetchGet('/series/1399');
    assert('4.2 TV 2 details page returns HTTP 200', tv2Page.status === 200);
    assert('4.2 TV 2 details renders Game of Thrones', tv2Page.body.includes('Game of Thrones'));
  } catch (err) {
    assert(`4. TV details tests failed: ${err.message}`, false);
  }

  // 5. SEASON SELECTOR & EPISODES (Multiple seasons & episodes)
  console.log('\n--- TEST GROUP 5: SEASONS & EPISODES DYNAMIC RESOLUTION ---');
  try {
    // Breaking Bad Season 1
    const bbS1 = await fetchGet('/api/catalog/season?seriesId=1396&season=1');
    assert('5.1 BB Season 1 returns HTTP 200', bbS1.status === 200);
    assert('5.1 BB Season 1 has 7 episodes', bbS1.json?.season?.episodes?.length === 7);
    assert('5.1 BB S1E1 is "Pilot"', bbS1.json?.season?.episodes?.[0]?.title === 'Pilot');

    // Breaking Bad Season 2
    const bbS2 = await fetchGet('/api/catalog/season?seriesId=1396&season=2');
    assert('5.2 BB Season 2 returns HTTP 200', bbS2.status === 200);
    assert('5.2 BB Season 2 has 13 episodes', bbS2.json?.season?.episodes?.length === 13);
    assert('5.2 BB S2E1 is "Seven Thirty-Seven"', bbS2.json?.season?.episodes?.[0]?.title === 'Seven Thirty-Seven');

    // Game of Thrones Season 3
    const gotS3 = await fetchGet('/api/catalog/season?seriesId=1399&season=3');
    assert('5.3 GoT Season 3 returns HTTP 200', gotS3.status === 200);
    assert('5.3 GoT Season 3 has 10 episodes', gotS3.json?.season?.episodes?.length === 10);
    assert('5.3 GoT S3E9 is "The Rains of Castamere"', gotS3.json?.season?.episodes?.[8]?.title === 'The Rains of Castamere');
  } catch (err) {
    assert(`5. Season/episodes tests failed: ${err.message}`, false);
  }

  // 6. TV → WATCH & NEXSTREAM (Multiple episodes across seasons)
  console.log('\n--- TEST GROUP 6: TV → WATCH PLAYBACK & NEXSTREAM ---');
  try {
    // BB S1E1
    const watchBbS1E1 = await fetchGet('/watch/1396?ep=tv-1396-s1-e1');
    assert('6.1 Watch BB S1E1 returns HTTP 200', watchBbS1E1.status === 200);
    assert('6.1 Watch BB S1E1 has episode title "Pilot"', watchBbS1E1.body.includes('Pilot'));
    assert('6.1 Watch BB S1E1 has NexStream Fast', watchBbS1E1.body.includes('NexStream Fast'));

    // BB S2E3
    const watchBbS2E3 = await fetchGet('/watch/1396?ep=tv-1396-s2-e3');
    assert('6.2 Watch BB S2E3 returns HTTP 200', watchBbS2E3.status === 200);
    assert('6.2 Watch BB S2E3 has Season 2 subtitle', watchBbS2E3.body.includes('Season 2') && watchBbS2E3.body.includes('Episode 3'));

    // GoT S3E9
    const watchGotS3E9 = await fetchGet('/watch/1399?ep=tv-1399-s3-e9');
    assert('6.3 Watch GoT S3E9 returns HTTP 200', watchGotS3E9.status === 200);
    assert('6.3 Watch GoT S3E9 has "The Rains of Castamere"', watchGotS3E9.body.includes('The Rains of Castamere'));

    // NexStream TV stream proxy checks
    const nexTvS1E1 = await fetchGet('/api/stream/nexstream?type=tv&id=1396&s=1&e=1');
    assert('6.4 NexStream TV stream proxy for S1E1 returns HTTP 200', nexTvS1E1.status === 200);
    assert('6.4 NexStream TV stream proxy embeds codespecters /tv/1396/1/1', nexTvS1E1.body.includes('codespecters.com/embed/tv/1396/1/1'));

    const nexTvS2E3 = await fetchGet('/api/stream/nexstream?type=tv&id=1396&s=2&e=3');
    assert('6.5 NexStream TV stream proxy for S2E3 returns HTTP 200', nexTvS2E3.status === 200);
    assert('6.5 NexStream TV stream proxy embeds codespecters /tv/1396/2/3', nexTvS2E3.body.includes('codespecters.com/embed/tv/1396/2/3'));
  } catch (err) {
    assert(`6. TV watch tests failed: ${err.message}`, false);
  }

  // 7. PAGINATION (Page 2 of catalogs)
  console.log('\n--- TEST GROUP 7: PAGINATION / LOAD MORE ---');
  try {
    const moviePage2 = await fetchGet('/api/catalog/discover?category=popular&type=movie&page=2');
    assert('7.1 Movies discover page 2 returns HTTP 200', moviePage2.status === 200);
    assert('7.1 Movies discover page 2 has page = 2', moviePage2.json?.page === 2);
    assert('7.1 Movies discover page 2 returns > 10 items', moviePage2.json?.items?.length > 10);

    const tvPage2 = await fetchGet('/api/catalog/discover?category=popular&type=tv&page=2');
    assert('7.2 TV discover page 2 returns HTTP 200', tvPage2.status === 200);
    assert('7.2 TV discover page 2 has page = 2', tvPage2.json?.page === 2);
    assert('7.2 TV discover page 2 returns > 10 items', tvPage2.json?.items?.length > 10);

    const searchPage2 = await fetchGet('/api/catalog/search?q=avatar&type=all&page=2');
    assert('7.3 Search page 2 returns HTTP 200', searchPage2.status === 200);
    assert('7.3 Search page 2 has page = 2', searchPage2.json?.page === 2);
  } catch (err) {
    assert(`7. Pagination tests failed: ${err.message}`, false);
  }

  // 8. REGRESSION: ALL CORE PUBLIC PAGES
  console.log('\n--- TEST GROUP 8: REGRESSION & CORE ROUTES ---');
  try {
    const [home, movies, tv, newPop, search, admin] = await Promise.all([
      fetchGet('/'),
      fetchGet('/movies'),
      fetchGet('/tv'),
      fetchGet('/new-popular'),
      fetchGet('/search'),
      fetchGet('/admin'),
    ]);
    assert('8.1 Home page returns HTTP 200', home.status === 200);
    assert('8.2 Movies page returns HTTP 200', movies.status === 200);
    assert('8.3 TV page returns HTTP 200', tv.status === 200);
    assert('8.4 New & Popular page returns HTTP 200', newPop.status === 200);
    assert('8.5 Search page returns HTTP 200', search.status === 200);
    assert('8.6 Admin page returns HTTP 200', admin.status === 200);
  } catch (err) {
    assert(`8. Regression tests failed: ${err.message}`, false);
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

run();
