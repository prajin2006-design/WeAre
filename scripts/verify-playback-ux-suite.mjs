import http from 'http';

const BASE_URL = 'http://localhost:3000';

function fetchPage(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${urlPath}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

function verifyWatchHtml(html, title, expectedType, expectedId, expectedSeason, expectedEpisode) {
  const tests = [];

  // 1. Iframe verification
  const iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"[^>]*>/i);
  if (!iframeMatch) {
    tests.push({ pass: false, msg: `${title}: No active iframe rendered` });
  } else {
    const src = iframeMatch[1].replace(/&amp;/g, '&');
    const isNexStream = src.startsWith('/api/stream/nexstream');
    tests.push({
      pass: isNexStream,
      msg: `${title}: Initial selected player is NexStream (${src})`
    });

    if (expectedType === 'movie') {
      tests.push({
        pass: src.includes(`type=movie`) && src.includes(`id=${expectedId}`),
        msg: `${title}: Correct NexStream movie route and ID in iframe`
      });
    } else if (expectedType === 'tv') {
      tests.push({
        pass:
          src.includes(`type=tv`) &&
          src.includes(`id=${expectedId}`) &&
          src.includes(`s=${expectedSeason}`) &&
          src.includes(`e=${expectedEpisode}`),
        msg: `${title}: Correct NexStream TV route, s=${expectedSeason}, e=${expectedEpisode} in iframe`
      });
    }
  }

  // 2. Server Selector Section verification
  const serverHeaderIdx = html.indexOf('Streaming Servers');
  if (serverHeaderIdx === -1) {
    tests.push({ pass: false, msg: `${title}: 'Streaming Servers' section not found` });
  } else {
    const serverSection = html.substring(serverHeaderIdx, serverHeaderIdx + 1400);
    const nexStreamIdx = serverSection.indexOf('NexStream Fast');
    const vidFastIdx = serverSection.indexOf('VidFast');

    tests.push({
      pass: nexStreamIdx !== -1 && vidFastIdx !== -1,
      msg: `${title}: Both NexStream Fast and VidFast are present in server list`
    });

    tests.push({
      pass: nexStreamIdx !== -1 && vidFastIdx !== -1 && nexStreamIdx < vidFastIdx,
      msg: `${title}: Server order is strictly 1. NexStream Fast, 2. VidFast`
    });

    // Verify NexStream button has active status (bg-accent)
    const nexButtonBlock = serverSection.substring(0, vidFastIdx);
    tests.push({
      pass: nexButtonBlock.includes('bg-accent') && nexButtonBlock.includes('lucide-check-circle-2'),
      msg: `${title}: NexStream button is marked as ACTIVE server`
    });
  }

  return tests;
}

async function runPlaybackSuite() {
  console.log('=== VERIFYING PLAYBACK UX SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function report(tests) {
    for (const t of tests) {
      if (t.pass) {
        console.log(`  [PASS] ${t.msg}`);
        passed++;
      } else {
        console.error(`  [FAIL] ${t.msg}`);
        failed++;
      }
    }
  }

  // Test 1: Movie 550 (Fight Club)
  console.log('Test 1: Movie 550 (Fight Club)');
  const res1 = await fetchPage('/watch/550');
  report([{ pass: res1.status === 200, msg: 'Movie 550 returns 200 OK' }]);
  report(verifyWatchHtml(res1.body, 'Movie 550', 'movie', '550'));

  // Test 2: Movie 27205 (Inception)
  console.log('\nTest 2: Movie 27205 (Inception)');
  const res2 = await fetchPage('/watch/27205');
  report([{ pass: res2.status === 200, msg: 'Movie 27205 returns 200 OK' }]);
  report(verifyWatchHtml(res2.body, 'Movie 27205', 'movie', '27205'));

  // Test 3: Movie 157336 (Interstellar)
  console.log('\nTest 3: Movie 157336 (Interstellar)');
  const res3 = await fetchPage('/watch/157336');
  report([{ pass: res3.status === 200, msg: 'Movie 157336 returns 200 OK' }]);
  report(verifyWatchHtml(res3.body, 'Movie 157336', 'movie', '157336'));

  // Test 4: TV Show 1396 (Breaking Bad) S1 E1
  console.log('\nTest 4: TV 1396 (Breaking Bad) S1 E1');
  const resTv1 = await fetchPage('/watch/tv-1396?ep=tv-1396-s1-e1');
  report([{ pass: resTv1.status === 200, msg: 'TV 1396 S1 E1 returns 200 OK' }]);
  report(verifyWatchHtml(resTv1.body, 'TV 1396 S1 E1', 'tv', '1396', 1, 1));

  // Test 5: TV Show 1396 (Breaking Bad) S2 E3
  console.log('\nTest 5: TV 1396 (Breaking Bad) S2 E3');
  const resTv2 = await fetchPage('/watch/tv-1396?ep=tv-1396-s2-e3');
  report([{ pass: resTv2.status === 200, msg: 'TV 1396 S2 E3 returns 200 OK' }]);
  report(verifyWatchHtml(resTv2.body, 'TV 1396 S2 E3', 'tv', '1396', 2, 3));

  // Test 6: TV Show 94605 (Arcane) S1 E1
  console.log('\nTest 6: TV 94605 (Arcane) S1 E1');
  const resTv3 = await fetchPage('/watch/tv-94605?ep=tv-94605-s1-e1');
  report([{ pass: resTv3.status === 200, msg: 'TV 94605 S1 E1 returns 200 OK' }]);
  report(verifyWatchHtml(resTv3.body, 'TV 94605 S1 E1', 'tv', '94605', 1, 1));

  // Test 7: Fallback & Server UI Elements
  console.log('\nTest 7: Fallback UI Verification');
  const hasTryVidFast = res1.body.includes('Try VidFast');
  const hasQuality1080p = res1.body.includes('1080p');
  const hasQualityAuto = res1.body.includes('Auto');
  report([
    { pass: hasTryVidFast, msg: 'NexStream error state includes [Try VidFast] fallback' },
    { pass: hasQuality1080p, msg: 'NexStream badge displays 1080p' },
    { pass: hasQualityAuto, msg: 'VidFast badge displays Auto' },
  ]);

  console.log(`\n========================================`);
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runPlaybackSuite().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
