import http from 'http';

const BASE_URL = 'http://localhost:3000';

function fetchGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: data, json: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data, json: null });
        }
      });
    }).on('error', reject);
  });
}

async function runSuite() {
  console.log('================================================================');
  console.log('WEARE PLATFORM: DYNAMIC TMDB CATALOG COMPREHENSIVE TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Home Page Verification
  try {
    const home = await fetchGet('/');
    assert('1. Home page returns HTTP 200', home.status === 200);
    assert('1. Home page renders hero banner and content sections', home.body.includes('TOP 10 CURRENT STREAMING'));
    assert('1. Home page renders TV section', home.body.includes('Television &amp; Serial Dramas') || home.body.includes('Television & Serial Dramas'));
    assert('1. Home page renders Action section', home.body.includes('Adrenaline'));
  } catch (err) {
    assert(`1. Home page failed: ${err.message}`, false);
  }

  // 2. Discover Popular Movies API
  try {
    const popMovies = await fetchGet('/api/catalog/discover?type=movie&category=popular&page=1');
    assert('2. Discover Popular Movies returns HTTP 200', popMovies.status === 200);
    assert('2. Discover Popular Movies returns > 10 items', popMovies.json?.items?.length > 10);
    assert('2. Discover Popular Movies has totalPages >= 100', popMovies.json?.totalPages >= 100);
    assert('2. Discover Popular Movies has totalResults > 1000', popMovies.json?.totalResults > 1000);
  } catch (err) {
    assert(`2. Discover Popular Movies failed: ${err.message}`, false);
  }

  // 3. Discover TV Series API
  try {
    const tvSeries = await fetchGet('/api/catalog/discover?type=tv&category=popular&page=1');
    assert('3. Discover TV Series returns HTTP 200', tvSeries.status === 200);
    assert('3. Discover TV Series returns > 10 items', tvSeries.json?.items?.length > 10);
    assert('3. Discover TV Series has totalPages >= 100', tvSeries.json?.totalPages >= 100);
  } catch (err) {
    assert(`3. Discover TV Series failed: ${err.message}`, false);
  }

  // 4. New & Popular Mixed Feed API (type=all)
  try {
    const newPop = await fetchGet('/api/catalog/discover?type=all&category=trending&page=1');
    assert('4. Discover All (Trending) returns HTTP 200', newPop.status === 200);
    assert('4. Discover All returns interleaved movie & series items', newPop.json?.items?.length >= 10);
    assert('4. Discover All has totalResults > 1000', newPop.json?.totalResults > 1000);
  } catch (err) {
    assert(`4. Discover All failed: ${err.message}`, false);
  }

  // 5. Search API
  try {
    const search = await fetchGet('/api/catalog/search?q=Matrix&type=all');
    assert('5. Search "Matrix" returns HTTP 200', search.status === 200);
    assert('5. Search returns matching results', search.json?.items?.some(i => i.title.toLowerCase().includes('matrix')));
  } catch (err) {
    assert(`5. Search failed: ${err.message}`, false);
  }

  // 6. Dynamic Movie Item Lookup (Fight Club - 550)
  try {
    const movieItem = await fetchGet('/api/catalog/item?id=550');
    assert('6. Dynamic item lookup (550) returns HTTP 200', movieItem.status === 200);
    assert('6. Dynamic item lookup returns "Fight Club"', movieItem.json?.title === 'Fight Club');
    assert('6. Dynamic item lookup has director "David Fincher"', movieItem.json?.director === 'David Fincher');
    assert('6. Dynamic item lookup has tmdb_id 550', movieItem.json?.tmdb_id === 550);
  } catch (err) {
    assert(`6. Dynamic item lookup failed: ${err.message}`, false);
  }

  // 7. Movie Details Page (/movie/550)
  try {
    const moviePage = await fetchGet('/movie/550');
    assert('7. Movie details (/movie/550) returns HTTP 200', moviePage.status === 200);
    assert('7. Movie details renders Fight Club title', moviePage.body.includes('Fight Club'));
    assert('7. Movie details renders Watch button linking to /watch/550', moviePage.body.includes('/watch/550'));
  } catch (err) {
    assert(`7. Movie details page failed: ${err.message}`, false);
  }

  // 8. Series Details Page (/series/1396 - Breaking Bad)
  try {
    const seriesPage = await fetchGet('/series/1396');
    assert('8. Series details (/series/1396) returns HTTP 200', seriesPage.status === 200);
    assert('8. Series details renders Breaking Bad', seriesPage.body.includes('Breaking Bad'));
    assert('8. Series details renders Season buttons', seriesPage.body.includes('Season 1'));
  } catch (err) {
    assert(`8. Series details page failed: ${err.message}`, false);
  }

  // 9. Watch Page for Movie (/watch/550)
  try {
    const watchMovie = await fetchGet('/watch/550');
    assert('9. Watch movie (/watch/550) returns HTTP 200', watchMovie.status === 200);
    assert('9. Watch movie shows Streaming Servers bar', watchMovie.body.includes('Streaming Servers'));
    assert('9. Watch movie contains NexStream Fast server button', watchMovie.body.includes('NexStream Fast'));
    assert('9. Watch movie contains VidFast server button', watchMovie.body.includes('VidFast'));
    assert('9. Watch movie DOES NOT contain WeAre HD', !watchMovie.body.includes('WeAre HD'));
    assert('9. Watch movie DOES NOT contain WeAre Backup', !watchMovie.body.includes('WeAre Backup'));
  } catch (err) {
    assert(`9. Watch movie failed: ${err.message}`, false);
  }

  // 10. Watch Page for Series Episode (/watch/1396)
  try {
    const watchSeries = await fetchGet('/watch/1396');
    assert('10. Watch series (/watch/1396) returns HTTP 200', watchSeries.status === 200);
    assert('10. Watch series shows Streaming Servers bar', watchSeries.body.includes('Streaming Servers'));
    assert('10. Watch series contains NexStream Fast', watchSeries.body.includes('NexStream Fast'));
    assert('10. Watch series contains VidFast', watchSeries.body.includes('VidFast'));
    assert('10. Watch series has episode subtitle', watchSeries.body.includes('Season') && watchSeries.body.includes('Episode'));
  } catch (err) {
    assert(`10. Watch series failed: ${err.message}`, false);
  }

  // 11. NexStream Stream Proxy Endpoints
  try {
    const nexMovie = await fetchGet('/api/stream/nexstream?type=movie&id=550');
    assert('11. NexStream movie stream proxy returns HTTP 200', nexMovie.status === 200);
    assert('11. NexStream movie stream proxy embeds codespecters', nexMovie.body.includes('codespecters.com/embed/movie/550'));

    const nexTv = await fetchGet('/api/stream/nexstream?type=tv&id=1396&s=1&e=1');
    assert('11. NexStream TV stream proxy returns HTTP 200', nexTv.status === 200);
    assert('11. NexStream TV stream proxy embeds codespecters', nexTv.body.includes('codespecters.com/embed/tv/1396/1/1'));
  } catch (err) {
    assert(`11. NexStream proxy failed: ${err.message}`, false);
  }

  // 12. Public Pages Verification
  try {
    const [moviesPage, seriesPage, newPopPage, searchPage] = await Promise.all([
      fetchGet('/movies'),
      fetchGet('/series'),
      fetchGet('/new-popular'),
      fetchGet('/search'),
    ]);
    assert('12. /movies page returns HTTP 200', moviesPage.status === 200);
    assert('12. /series page returns HTTP 200', seriesPage.status === 200);
    assert('12. /new-popular page returns HTTP 200', newPopPage.status === 200);
    assert('12. /search page returns HTTP 200', searchPage.status === 200);
  } catch (err) {
    assert(`12. Public pages check failed: ${err.message}`, false);
  }

  console.log(`\n================================================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================================================`);

  if (failed > 0) process.exit(1);
}

runSuite();
