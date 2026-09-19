import { execSync } from 'child_process';

async function measure() {
  const target = await (await fetch('http://127.0.0.1:9223/json')).json();
  const page = target.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) throw new Error('No page found on port 9223');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  function send(method, params) {
    return new Promise((resolve) => {
      const id = Math.floor(Math.random() * 10000);
      ws.addEventListener('message', function h(e) {
        const d = JSON.parse(e.data);
        if (d.id === id) { ws.removeEventListener('message', h); resolve(d.result); }
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true });
    return res?.result?.value;
  }

  const results = [];

  const routes = [
    { name: 'Initial Load / Login Check', url: 'https://rakshicoco.vercel.app/' },
    { name: 'Dashboard Load', url: 'https://rakshicoco.vercel.app/dashboard' },
    { name: 'Farm List', url: 'https://rakshicoco.vercel.app/dashboard/farms' },
    { name: 'Farm Creation Form', url: 'https://rakshicoco.vercel.app/dashboard/farms/new' },
    { name: 'Purchases List', url: 'https://rakshicoco.vercel.app/dashboard/purchases' },
    { name: 'Purchase Creation Form', url: 'https://rakshicoco.vercel.app/dashboard/purchases/new' },
    { name: 'Cutting / Operations', url: 'https://rakshicoco.vercel.app/dashboard/cuttings' },
    { name: 'Transport List', url: 'https://rakshicoco.vercel.app/dashboard/transport' },
    { name: 'Transport Creation Form', url: 'https://rakshicoco.vercel.app/dashboard/transport/new' },
    { name: 'Godown Stock Loading', url: 'https://rakshicoco.vercel.app/dashboard/stock' },
    { name: 'Sales Order List', url: 'https://rakshicoco.vercel.app/dashboard/sales' },
    { name: 'Sales Order Creation Form', url: 'https://rakshicoco.vercel.app/dashboard/sales/new' },
    { name: 'Dispatch List', url: 'https://rakshicoco.vercel.app/dashboard/dispatches' },
    { name: 'Bills / Invoices List', url: 'https://rakshicoco.vercel.app/dashboard/bills' },
    { name: 'Payments List', url: 'https://rakshicoco.vercel.app/dashboard/payments' },
    { name: 'Buyer Payments Form', url: 'https://rakshicoco.vercel.app/dashboard/buyer-payments/new' },
    { name: 'P&L Statement', url: 'https://rakshicoco.vercel.app/dashboard/pnl' }
  ];

  console.log('=== STARTING PERFORMANCE BASELINE MEASUREMENT ON EMULATOR-5554 ===');

  for (const r of routes) {
    const tStart = Date.now();
    await send('Page.navigate', { url: r.url });
    
    // Wait for network idle or completion
    await new Promise(res => setTimeout(res, 3500));
    
    const navTiming = await evaluate(`(() => {
      const p = performance.getEntriesByType('navigation')[0];
      if (!p) return null;
      return {
        ttfb: Math.round(p.responseStart - p.requestStart),
        domInteractive: Math.round(p.domInteractive - p.startTime),
        domComplete: Math.round(p.domComplete - p.startTime),
        duration: Math.round(p.duration)
      };
    })()`);

    const totalElapsed = Date.now() - tStart;
    results.push({
      operation: r.name,
      url: r.url,
      totalLatencyMs: totalElapsed,
      ttfb: navTiming?.ttfb || 'N/A',
      domInteractive: navTiming?.domInteractive || 'N/A',
      domComplete: navTiming?.domComplete || 'N/A',
      duration: navTiming?.duration || totalElapsed
    });
    console.log(`[${r.name}] -> Duration: ${navTiming?.duration || totalElapsed}ms | TTFB: ${navTiming?.ttfb || 'N/A'}ms | DOM Interactive: ${navTiming?.domInteractive || 'N/A'}ms`);
  }

  // Measure client-side tab navigation (Dashboard -> Operations -> Sales -> Finance -> More -> Dashboard)
  console.log('=== MEASURING BOTTOM NAVIGATION TAB SWITCHING LATENCY ===');
  const tabSwitches = [
    { from: '/dashboard', to: '/dashboard/cuttings', label: 'Dashboard -> Operations' },
    { from: '/dashboard/cuttings', to: '/dashboard/sales', label: 'Operations -> Sales' },
    { from: '/dashboard/sales', to: '/dashboard/pnl', label: 'Sales -> Finance' },
    { from: '/dashboard/pnl', to: '/dashboard', label: 'Finance -> Dashboard' }
  ];

  for (const tab of tabSwitches) {
    const t0 = Date.now();
    await send('Page.navigate', { url: 'https://rakshicoco.vercel.app' + tab.to });
    await new Promise(res => setTimeout(res, 2500));
    const dt = Date.now() - t0;
    console.log(`[TAB NAV] ${tab.label}: ${dt}ms total perceived`);
    results.push({
      operation: `Tab Nav: ${tab.label}`,
      url: tab.to,
      totalLatencyMs: dt,
      ttfb: 'Client Link',
      domInteractive: 'N/A',
      domComplete: 'N/A',
      duration: dt
    });
  }

  console.log('\n=== COMPLETE BASELINE RESULTS JSON ===');
  console.log(JSON.stringify(results, null, 2));

  ws.close();
}

measure().catch(console.error);
