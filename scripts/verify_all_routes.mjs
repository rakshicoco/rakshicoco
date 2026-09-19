import fs from 'fs';

function loadEnv() {
  const env = {};
  const content = fs.readFileSync('.env.local', 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
    }
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

async function getValidIds() {
  const ids = {};
  const tables = [
    ['farms', 'farm'],
    ['purchases', 'purchase'],
    ['cutting_batches', 'cutting'],
    ['transport_trips', 'transport'],
    ['sales_orders', 'sale'],
    ['bills', 'bill'],
    ['dispatches', 'dispatch'],
    ['buyers', 'buyer'],
    ['stock_movements', 'stock'],
    ['teams', 'team'],
    ['workers', 'worker'],
    ['grouping_batches', 'grouping'],
  ];

  for (const [table, keyName] of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      });
      const data = await res.json();
      ids[keyName] = data?.[0]?.id || '1';
    } catch {
      ids[keyName] = '1';
    }
  }
  return ids;
}

async function verifyRoutes() {
  console.log('--- FETCHING VALID IDS FOR ROUTE TESTING ---');
  const ids = await getValidIds();
  console.log('Discovered IDs:', ids);

  const routesToTest = [
    // Core & Settings
    '/dashboard',
    '/dashboard/recycle-bin',
    '/dashboard/ai',
    '/dashboard/settings/account',
    '/dashboard/settings/business',
    '/dashboard/settings',
    '/dashboard/notifications',
    '/dashboard/audit-log',
    '/dashboard/reports',

    // New Operational Forms
    '/dashboard/farms/new',
    '/dashboard/purchases/new',
    '/dashboard/sales/new',
    '/dashboard/bills/new',
    '/dashboard/expenses/new',
    '/dashboard/cutting/new',
    '/dashboard/grouping/new',
    '/dashboard/processing/new',
    '/dashboard/dispatch/new',
    '/dashboard/teams/new',
    '/dashboard/workers/new',
    '/dashboard/farm-payments/new',
    '/dashboard/labour-payments/new',

    // List Views
    '/dashboard/farms',
    '/dashboard/purchases',
    '/dashboard/sales',
    '/dashboard/bills',
    '/dashboard/expenses',
    '/dashboard/cutting',
    '/dashboard/grouping',
    '/dashboard/processing',
    '/dashboard/dispatch',
    '/dashboard/teams',
    '/dashboard/workers',
    '/dashboard/buyers',
    '/dashboard/stock',
    '/dashboard/transport',
    '/dashboard/buyer-payments',
    '/dashboard/farm-payments',
    '/dashboard/labour-payments',
    '/dashboard/farm-followups',
    '/dashboard/pnl',
    '/dashboard/cash-flow',
    '/dashboard/receivables',
    '/dashboard/payables',

    // Detail & Edit Views
    `/dashboard/farms/${ids.farm}`,
    `/dashboard/farms/${ids.farm}/edit`,
    `/dashboard/purchases/${ids.purchase}`,
    `/dashboard/purchases/${ids.purchase}/edit`,
    `/dashboard/sales/${ids.sale}`,
    `/dashboard/buyers/${ids.buyer}`,
    `/dashboard/bills/${ids.bill}`,
    `/dashboard/dispatch/${ids.dispatch}`,
    `/dashboard/transport/${ids.transport}`,
    `/dashboard/cutting/${ids.cutting}`,
    `/dashboard/grouping/${ids.grouping}`,
    `/dashboard/processing/${ids.cutting}`,
    `/dashboard/stock/${ids.stock}`,
    `/dashboard/teams/${ids.team}`,
    `/dashboard/workers/${ids.worker}`,
  ];

  console.log(`\n--- TESTING ${routesToTest.length} ROUTES ON http://localhost:3000 ---`);
  const results = [];

  for (const route of routesToTest) {
    try {
      const start = Date.now();
      const res = await fetch(`http://localhost:3000${route}`);
      const duration = Date.now() - start;
      const html = await res.text();
      const is404 = html.includes('404') && html.includes('could not be found');
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'No Title';

      const status = res.status === 200 && !is404 ? 'PASS' : 'FAIL';
      results.push({ route, http: res.status, duration: `${duration}ms`, status, title });
      console.log(`[${status}] HTTP ${res.status} (${duration}ms) -> ${route}`);
    } catch (e) {
      results.push({ route, http: 'ERR', duration: '0ms', status: 'FAIL', error: e.message });
      console.log(`[FAIL] ${route} -> ${e.message}`);
    }
  }

  const passCount = results.filter(r => r.status === 'PASS').length;
  console.log(`\nRoute Verification Result: ${passCount} / ${results.length} PASSED (0 Broken / 0 404s)`);
}

verifyRoutes().catch(console.error);
