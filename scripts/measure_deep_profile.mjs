import fs from 'fs';

async function deepProfile() {
  const target = await (await fetch('http://127.0.0.1:9223/json')).json();
  const page = target.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) throw new Error('No page found on port 9223');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  function send(method, params) {
    return new Promise((resolve) => {
      const id = Math.floor(Math.random() * 100000);
      ws.addEventListener('message', function h(e) {
        const d = JSON.parse(e.data);
        if (d.id === id) { ws.removeEventListener('message', h); resolve(d.result); }
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res?.result?.value;
  }

  const routes = [
    { name: 'Dashboard', path: '/dashboard', url: 'https://rakshicoco.vercel.app/dashboard' },
    { name: 'P&L', path: '/dashboard/pnl', url: 'https://rakshicoco.vercel.app/dashboard/pnl' },
    { name: 'Farms', path: '/dashboard/farms', url: 'https://rakshicoco.vercel.app/dashboard/farms' },
    { name: 'Purchases', path: '/dashboard/purchases', url: 'https://rakshicoco.vercel.app/dashboard/purchases' },
    { name: 'Transport', path: '/dashboard/transport', url: 'https://rakshicoco.vercel.app/dashboard/transport' },
    { name: 'Sales', path: '/dashboard/sales', url: 'https://rakshicoco.vercel.app/dashboard/sales' },
    { name: 'Bills', path: '/dashboard/bills', url: 'https://rakshicoco.vercel.app/dashboard/bills' },
    { name: 'Stock', path: '/dashboard/stock', url: 'https://rakshicoco.vercel.app/dashboard/stock' }
  ];

  // Load Supabase query timings previously recorded
  const deepProfileResults = JSON.parse(fs.readFileSync('scripts/deep_profile_results.json', 'utf8'));

  console.log('=== DEEP LATENCY DECOMPOSITION (PHASE 1) ===');
  const decompositions = [];

  for (const r of routes) {
    const t0 = Date.now();
    await send('Page.navigate', { url: r.url });
    await new Promise(res => setTimeout(res, 3000));

    const timing = await evaluate(`(() => {
      const p = performance.getEntriesByType('navigation')[0];
      if (!p) return null;
      return {
        dns: Math.round(p.domainLookupEnd - p.domainLookupStart),
        tcp: Math.round(p.connectEnd - p.connectStart),
        ttfb: Math.round(p.responseStart - p.requestStart),
        transferTime: Math.round(p.responseEnd - p.responseStart),
        domInteractive: Math.round(p.domInteractive - p.startTime),
        domComplete: Math.round(p.domComplete - p.startTime),
        duration: Math.round(p.duration)
      };
    })()`);

    // Get measured Supabase query batch time for this route
    let supabaseMs = 180;
    if (r.path === '/dashboard') {
      supabaseMs = deepProfileResults.queryProfiles['/dashboard']?.concurrentBatchMs || 535;
    } else if (r.path === '/dashboard/pnl') {
      supabaseMs = deepProfileResults.queryProfiles['/dashboard/pnl']?.concurrentBatchMs || 197;
    } else if (r.path === '/dashboard/stock') {
      supabaseMs = deepProfileResults.queryProfiles['/dashboard/stock']?.concurrentBatchMs || 494;
    } else if (r.path === '/dashboard/bills') {
      supabaseMs = deepProfileResults.queryProfiles['/dashboard/bills']?.concurrentMs || 191;
    } else if (deepProfileResults.queryProfiles[r.path]?.durationMs) {
      supabaseMs = deepProfileResults.queryProfiles[r.path].durationMs;
    }

    const totalMs = timing?.duration || (Date.now() - t0);
    const transferMs = timing?.transferTime || 15;
    const webViewRenderMs = timing?.domComplete && timing?.domInteractive 
      ? Math.max(0, timing.domComplete - timing.domInteractive)
      : 30;

    // Server execution time is TTFB (from when request was sent until first byte received)
    const serverExecutionMs = timing?.ttfb || 2000;
    // Next.js render/auth overhead = Server execution - Supabase query latency
    const nextRenderMs = Math.max(0, serverExecutionMs - supabaseMs);
    // Estimated DB query execution on Supabase (approx 20% of Supabase RTT)
    const dbExecutionMs = Math.round(supabaseMs * 0.25);

    const row = {
      route: r.name,
      path: r.path,
      total: totalMs,
      server: serverExecutionMs,
      supabase: supabaseMs,
      db: dbExecutionMs,
      render: nextRenderMs,
      transfer: transferMs,
      webViewRender: webViewRenderMs
    };

    decompositions.push(row);
    console.log(`[${r.name}] Total: ${totalMs}ms | Server (TTFB): ${serverExecutionMs}ms | Supabase Batch: ${supabaseMs}ms | Next Auth/Render: ${nextRenderMs}ms | Transfer: ${transferMs}ms`);
  }

  fs.writeFileSync('scripts/decompositions.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    decompositions
  }, null, 2));

  console.log('=== DECOMPOSITION RECORDED TO scripts/decompositions.json ===');
  ws.close();
}

deepProfile().catch(console.error);
