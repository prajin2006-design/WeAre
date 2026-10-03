import http from 'http';

const BASE_URL = 'http://localhost:3000';

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, text: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- WEARE DYNAMIC CATALOG & NEXSTREAM VALIDATION ---\n');

  // Test 1: Discover Popular Movies
  try {
    const res = await get('/api/catalog/discover?type=movie&category=popular&page=1');
    console.log(`[TEST 1] Discover Popular Movies: HTTP ${res.status}`);
    console.log(`         Total Results: ${res.data.totalResults}, Total Pages: ${res.data.totalPages}`);
    console.log(`         First Title: "${res.data.items?.[0]?.title}" (ID: ${res.data.items?.[0]?.id})`);
  } catch (err) {
    console.error('[TEST 1 FAILED]', err.message);
  }

  // Test 2: Discover Trending TV Series
  try {
    const res = await get('/api/catalog/discover?type=tv&category=trending&page=1');
    console.log(`\n[TEST 2] Discover Trending TV: HTTP ${res.status}`);
    console.log(`         Total Results: ${res.data.totalResults}, Total Pages: ${res.data.totalPages}`);
    console.log(`         First Title: "${res.data.items?.[0]?.title}" (ID: ${res.data.items?.[0]?.id})`);
  } catch (err) {
    console.error('[TEST 2 FAILED]', err.message);
  }

  // Test 3: Search Dynamic TMDB Catalog
  try {
    const res = await get('/api/catalog/search?q=Inception&type=all');
    console.log(`\n[TEST 3] Search "Inception": HTTP ${res.status}`);
    console.log(`         Found ${res.data.items?.length} results`);
    const match = res.data.items?.find(i => i.title.toLowerCase().includes('inception'));
    console.log(`         Best Match: "${match?.title}" (${match?.release_year}) - Rating: ${match?.rating}`);
  } catch (err) {
    console.error('[TEST 3 FAILED]', err.message);
  }

  // Test 4: Dynamic Item API lookup (Fight Club - TMDB 550)
  try {
    const res = await get('/api/catalog/item?id=550');
    console.log(`\n[TEST 4] Dynamic Item Lookup (TMDB 550): HTTP ${res.status}`);
    console.log(`         Title: "${res.data.title}", Release: ${res.data.release_year}, Director: "${res.data.director}"`);
  } catch (err) {
    console.error('[TEST 4 FAILED]', err.message);
  }

  // Test 5: NexStream Authorized Stream Proxy for Movie
  try {
    const res = await get('/api/stream/nexstream?type=movie&id=550');
    console.log(`\n[TEST 5] NexStream Movie Proxy (TMDB 550): HTTP ${res.status}`);
    const hasIframe = res.text?.includes('<iframe') && res.text?.includes('codespecters.com/embed/movie/550');
    console.log(`         Contains Authorized Stream Embed: ${hasIframe}`);
  } catch (err) {
    console.error('[TEST 5 FAILED]', err.message);
  }

  // Test 6: NexStream Authorized Stream Proxy for TV Episode
  try {
    const res = await get('/api/stream/nexstream?type=tv&id=1399&s=1&e=1');
    console.log(`\n[TEST 6] NexStream TV Proxy (TMDB 1399 S1:E1): HTTP ${res.status}`);
    const hasIframe = res.text?.includes('<iframe') && res.text?.includes('codespecters.com/embed/tv/1399/1/1');
    console.log(`         Contains Authorized Stream Embed: ${hasIframe}`);
  } catch (err) {
    console.error('[TEST 6 FAILED]', err.message);
  }

  console.log('\n--- ALL ARCHITECTURAL TESTS EXECUTED ---');
}

runTests();
