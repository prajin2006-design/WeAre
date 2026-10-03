import http from 'http';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('======================================================');
  console.log('VIDFAST INTEGRATION & REGRESSION TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function test(desc, condition) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Movie Watch Page Server Check (TMDB 550)
  try {
    const movieRes = await fetchPage('http://localhost:3000/watch/550');
    test('1. TMDB Movie (550) HTTP status is 200', movieRes.status === 200);
    test('1. Movie watch page contains Streaming Servers bar', movieRes.body.includes('Streaming Servers'));
    test('1. Movie watch page contains NexStream Fast server button', movieRes.body.includes('NexStream Fast'));
    test('1. Movie watch page contains VidFast server button', movieRes.body.includes('VidFast'));
    test('1. Movie watch page DOES NOT contain Videasy', !movieRes.body.includes('Videasy'));
    test('1. Movie watch page DOES NOT contain WeAre HD', !movieRes.body.includes('WeAre HD'));
    test('1. Movie watch page DOES NOT contain WeAre Backup', !movieRes.body.includes('WeAre Backup'));
    test('1. Movie watch page DOES NOT contain WeAre Mobile', !movieRes.body.includes('WeAre Mobile'));
  } catch (err) {
    test('1. TMDB Movie check failed with exception: ' + err.message, false);
  }

  // 2. TV Series Watch Page Server Check (TMDB 1396)
  try {
    const tvRes = await fetchPage('http://localhost:3000/watch/1396');
    test('2. TMDB TV Series (1396) HTTP status is 200', tvRes.status === 200);
    test('2. TV watch page contains Streaming Servers bar', tvRes.body.includes('Streaming Servers'));
    test('2. TV watch page contains NexStream Fast server button', tvRes.body.includes('NexStream Fast'));
    test('2. TV watch page contains VidFast server button', tvRes.body.includes('VidFast'));
    test('2. TV watch page DOES NOT contain Videasy', !tvRes.body.includes('Videasy'));
    test('2. TV watch page DOES NOT contain WeAre HD', !tvRes.body.includes('WeAre HD'));
    test('2. TV watch page DOES NOT contain WeAre Backup', !tvRes.body.includes('WeAre Backup'));
    test('2. TV watch page DOES NOT contain WeAre Mobile', !tvRes.body.includes('WeAre Mobile'));
    test('2. TV watch page contains episode controls', tvRes.body.includes('Season') || tvRes.body.includes('Episode'));
  } catch (err) {
    test('2. TMDB TV Series check failed with exception: ' + err.message, false);
  }

  // 3. NexStream Regression Check (Movie)
  try {
    const nexMovie = await fetchPage('http://localhost:3000/api/stream/nexstream?type=movie&id=550');
    test('3. NexStream Movie proxy responds with HTTP 200', nexMovie.status === 200);
    test('3. NexStream Movie proxy returns iframe with codespecters embed', nexMovie.body.includes('codespecters.com/embed/movie/550'));
  } catch (err) {
    test('3. NexStream Movie check failed with exception: ' + err.message, false);
  }

  // 4. NexStream Regression Check (TV Episode)
  try {
    const nexTv = await fetchPage('http://localhost:3000/api/stream/nexstream?type=tv&id=1396&s=1&e=1');
    test('4. NexStream TV proxy responds with HTTP 200', nexTv.status === 200);
    test('4. NexStream TV proxy returns iframe with codespecters embed', nexTv.body.includes('codespecters.com/embed/tv/1396/1/1'));
  } catch (err) {
    test('4. NexStream TV check failed with exception: ' + err.message, false);
  }

  console.log(`\n======================================================`);
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`======================================================`);

  if (failed > 0) process.exit(1);
}

run();
