/* eslint-disable */
const http = require('http');

async function getWsUrl() {
  const res = await fetch('http://localhost:9222/json');
  const list = await res.json();
  const page = list.find((item) => item.type === 'page' && item.url.includes('localhost:3000')) || list.find((item) => item.type === 'page');
  return page.webSocketDebuggerUrl;
}

async function runCdpTests() {
  const wsUrl = await getWsUrl();
  console.log('Connecting to Chrome CDP WebSocket:', wsUrl);

  const WS = globalThis.WebSocket;
  const ws = new WS(wsUrl);

  let idCounter = 1;
  const pending = new Map();
  const consoleMessages = [];
  const errors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }

    if (msg.method === 'Runtime.consoleAPICalled') {
      const type = msg.params.type;
      const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
      consoleMessages.push({ type, text });
      if (type === 'error') {
        errors.push(text);
      }
    }

    if (msg.method === 'Runtime.exceptionThrown') {
      const text = msg.params.exceptionDetails?.text || msg.params.exceptionDetails?.exception?.description || 'Exception thrown';
      errors.push(text);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = idCounter++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  const testPages = [
    'http://localhost:3000/',
    'http://localhost:3000/movies',
    'http://localhost:3000/series',
    'http://localhost:3000/my-list',
    'http://localhost:3000/new-popular',
    'http://localhost:3000/login',
    'http://localhost:3000/profile',
  ];

  console.log('\n--- TESTING ALL PAGES WITH HARD RELOADS ---\n');

  for (const url of testPages) {
    console.log(`Navigating to: ${url}`);
    errors.length = 0;

    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1500));

    // Hard reload
    console.log(`Performing hard reload on: ${url}`);
    await send('Page.reload', { ignoreCache: true });
    await new Promise(r => setTimeout(r, 2000));

    const hydrationErrors = errors.filter(e => 
      e.toLowerCase().includes('hydration') || 
      e.toLowerCase().includes('server rendered') ||
      e.toLowerCase().includes('did not match') ||
      e.toLowerCase().includes('mismatch')
    );

    if (hydrationErrors.length > 0) {
      console.error(`✗ HYDRATION ERROR on ${url}:`, hydrationErrors);
    } else {
      console.log(`✓ ${url}: 0 Hydration Errors!`);
    }

    if (errors.length > 0) {
      console.log(`  Console errors on ${url}:`, errors);
    }
  }

  ws.close();
  console.log('\n--- BROWSER VERIFICATION COMPLETED ---');
}

runCdpTests().catch(console.error);
