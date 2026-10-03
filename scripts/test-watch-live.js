async function testWatchPage() {
  const baseUrl = "http://localhost:3000";

  // First fetch catalog movies to get an ID
  console.log("Fetching catalog from /api/stream/nexstream?mode=info&id=550...");
  const nexRes = await fetch(`${baseUrl}/api/stream/nexstream?mode=info&id=550`);
  console.log("NexStream endpoint response:", nexRes.status, await nexRes.json());

  // Test real movie watch page
  // Movie 0af0a002-68e5-4817-96b9-c1ebf420ec29 from earlier tests
  const watchUrl = `${baseUrl}/watch/0af0a002-68e5-4817-96b9-c1ebf420ec29`;
  console.log(`\nFetching Watch Page: ${watchUrl}...`);
  const pageRes = await fetch(watchUrl);
  console.log("Watch Page HTTP status:", pageRes.status);
  const html = await pageRes.text();
  console.log("Watch Page HTML bytes:", html.length);

  const hasNexStreamText = html.includes("NexStream");
  console.log("Contains NexStream source:", hasNexStreamText);
  const hasPlayer = html.includes("video") || html.includes("iframe");
  console.log("Contains Video Player:", hasPlayer);

  if (pageRes.status === 200 && hasPlayer) {
    console.log("\nPASS: Watch page rendered successfully with video player.");
  } else {
    console.error("\nFAIL: Watch page rendering issue.");
  }
}

testWatchPage().catch(console.error);
