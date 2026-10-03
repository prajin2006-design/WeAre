/* eslint-disable */
async function testInteraction() {
  const res = await fetch('http://localhost:9222/json');
  const list = await res.json();
  const page = list.find((item) => item.type === 'page' && item.url.includes('localhost:3000'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();
  const errors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(msg.params.args.map((a) => a.value || a.description || '').join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails?.text || 'Exception');
    }
  };

  const send = (method, params = {}) =>
    new Promise((r) => {
      const id = idCounter++;
      pending.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await new Promise((r) => (ws.onopen = r));
  await send('Runtime.enable');
  await send('Page.enable');

  // Set item in localStorage
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('weare_user_mylist_v1', JSON.stringify([{ id: 'test-1', content_id: '123', content_type: 'movie', content: { id: '123', title: 'Test Movie', poster_url: '', backdrop_url: '', rating: 8, genres: ['Action'] } }]))`,
  });

  // Hard reload
  console.log('Hard reloading with item in My List...');
  await send('Page.reload', { ignoreCache: true });
  await new Promise((r) => setTimeout(r, 2500));

  const hydrationErrors = errors.filter(
    (e) =>
      e.toLowerCase().includes('hydration') ||
      e.toLowerCase().includes('server rendered') ||
      e.toLowerCase().includes('did not match') ||
      e.toLowerCase().includes('mismatch')
  );
  console.log('Hydration errors with items in My List:', hydrationErrors.length);
  if (hydrationErrors.length > 0) {
    console.error('Errors:', hydrationErrors);
  } else {
    console.log('PASS: Zero hydration errors when My List has items!');
  }

  // Clear localStorage
  await send('Runtime.evaluate', { expression: 'localStorage.clear()' });
  ws.close();
}

testInteraction().catch(console.error);
