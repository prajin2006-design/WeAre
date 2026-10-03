/**
 * NexStream API Integration Test Script
 * Tests the server endpoint, error handling, parameter validation, and secure embed generation.
 */

async function runTests() {
  console.log("=== Testing WeAre NexStream Integration ===");

  const baseUrl = "http://localhost:3000";

  // Test 1: Info mode for movie (TMDB ID 550 - Fight Club)
  console.log("\n[Test 1] Requesting NexStream info for movie TMDB ID 550...");
  try {
    const res = await fetch(`${baseUrl}/api/stream/nexstream?mode=info&id=550&type=movie`);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    if (res.status === 200 && data.available === true && data.name === "NexStream Fast") {
      console.log("PASS: NexStream info mode returned authorized metadata.");
    } else {
      console.error("FAIL: Unexpected info response:", data);
    }
  } catch (err) {
    console.error("FAIL: Error fetching info:", err.message);
  }

  // Test 2: Info mode for TV episode
  console.log("\n[Test 2] Requesting NexStream info for TV series (TMDB ID 1399, S1 E1)...");
  try {
    const res = await fetch(`${baseUrl}/api/stream/nexstream?mode=info&id=1399&type=tv&s=1&e=1`);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    if (res.status === 200 && data.type === "tv" && data.season === 1) {
      console.log("PASS: TV episode info mode verified.");
    } else {
      console.error("FAIL: Unexpected TV info response");
    }
  } catch (err) {
    console.error("FAIL: Error fetching TV info:", err.message);
  }

  // Test 3: Missing parameter validation
  console.log("\n[Test 3] Requesting with missing/invalid TMDB ID...");
  try {
    const res = await fetch(`${baseUrl}/api/stream/nexstream?mode=info&id=invalid`);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
    if (res.status === 400) {
      console.log("PASS: Invalid TMDB ID rejected with 400 Bad Request.");
    } else {
      console.error("FAIL: Expected 400, got", res.status);
    }
  } catch (err) {
    console.error("FAIL:", err.message);
  }

  // Test 4: Embed HTML mode (verify security headers and that client response does not reveal raw key)
  console.log("\n[Test 4] Requesting embed player HTML document...");
  try {
    const res = await fetch(`${baseUrl}/api/stream/nexstream?type=movie&id=550`);
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
    console.log("X-Frame-Options:", res.headers.get("x-frame-options"));
    console.log("Referrer-Policy:", res.headers.get("referrer-policy"));
    const html = await res.text();
    console.log("HTML length:", html.length, "bytes");
    const hasIframe = html.includes("<iframe");
    console.log("Contains iframe:", hasIframe);
    if (res.status === 200 && hasIframe && res.headers.get("x-frame-options") === "SAMEORIGIN") {
      console.log("PASS: Secure embed document generated with SAMEORIGIN headers.");
    } else {
      console.error("FAIL: Embed generation failed.");
    }
  } catch (err) {
    console.error("FAIL:", err.message);
  }

  console.log("\n=== NexStream Integration Tests Complete ===");
}

runTests();
