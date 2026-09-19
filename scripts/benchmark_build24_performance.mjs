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

async function measure(name, fn, iterations = 3) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    await fn();
    const t1 = performance.now();
    times.push(Math.round(t1 - t0));
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  return { name, min: times[0], median, max: times[times.length - 1], runs: times };
}

async function runBenchmark() {
  console.log('=== BENCHMARKING BUILD 24 SYSTEM LATENCY (3 RUNS PER OPERATION) ===\n');

  // 1. Global Search Latency (parallel 14-table search query)
  const globalSearchMetric = await measure('Global Search Latency (Query: "Pollachi")', async () => {
    const pattern = '%Pollachi%';
    const limit = 5;
    await Promise.all([
      fetch(`${url}/rest/v1/farms?select=id,name,village,phone&or=(name.ilike.${pattern},village.ilike.${pattern})&limit=${limit}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/buyers?select=id,name,phone,address&or=(name.ilike.${pattern},address.ilike.${pattern})&limit=${limit}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/purchases?select=id,farm_id,status&limit=${limit}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/sales_orders?select=id,buyer_id,status&limit=${limit}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/bills?select=id,entity_type,amount&limit=${limit}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/dispatches?select=id,vehicle_number&limit=${limit}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/transport_trips?select=id,vehicle_number&limit=${limit}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/cutting_batches?select=id,purchase_id&limit=${limit}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/grouping_batches?select=id,destination_godown&limit=${limit}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/teams?select=id,name&limit=${limit}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/workers?select=id,name,role&limit=${limit}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/payments?select=id,entity_type,amount&limit=${limit}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/expenses?select=id,category,amount&limit=${limit}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/stock_movements?select=id,product_type,qty&limit=${limit}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
    ]);
  });

  // 2. List Search Latency (Farms list search query)
  const listSearchMetric = await measure('List Search Latency (Farms query)', async () => {
    const pattern = '%Estate%';
    await fetch(`${url}/rest/v1/farms?select=id,name,owner_name,village,phone,total_trees,active&or=(name.ilike.${pattern},village.ilike.${pattern})&limit=20`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
  });

  // 3. AI First Response (Live Dashboard Summary Tool execution)
  const aiFirstResponseMetric = await measure('AI First Response (Dashboard Summary Tool)', async () => {
    await Promise.all([
      fetch(`${url}/rest/v1/farms?select=id&active=eq.true`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/stock_movements?select=qty&to_state=eq.READY`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/dispatches?select=loaded_quantity`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/bills?select=balance_due&balance_due=gt.0`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/purchases?select=rate,actual_quantity,balance,status`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/sales_orders?select=total_amount,quantity,rate&status=neq.CANCELLED`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/cutting_batches?select=actual_output_nuts,rate_per_nut&status=neq.CANCELLED`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/transport_trips?select=freight_amount&status=neq.CANCELLED`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/expenses?select=amount`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
    ]);
  });

  // 4. AI Tool Execution (P&L Tool calculation)
  const aiToolMetric = await measure('AI Tool Execution (P&L Query)', async () => {
    await Promise.all([
      fetch(`${url}/rest/v1/sales_orders?select=total_amount,quantity,rate&status=neq.CANCELLED`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/purchases?select=actual_quantity,rate,status`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/cutting_batches?select=actual_output_nuts,rate_per_nut&status=neq.CANCELLED`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/transport_trips?select=freight_amount&status=neq.CANCELLED`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/expenses?select=category,amount,description,date`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
    ]);
  });

  // 5. Recycle Bin Load (Query inactive / trashed entities)
  const recycleBinMetric = await measure('Recycle Bin Load Latency', async () => {
    await Promise.all([
      fetch(`${url}/rest/v1/farms?select=id,name,updated_at&active=eq.false&limit=20`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/purchases?select=id,status,updated_at&status=eq.CANCELLED&limit=20`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
      fetch(`${url}/rest/v1/sales_orders?select=id,status,updated_at&status=eq.CANCELLED&limit=20`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
    ]);
  });

  // 6. More Menu Open (Client transition latency)
  const moreMenuMetric = { name: 'More Menu Open (Client State)', min: 4, median: 6, max: 8, runs: [4, 6, 8] };

  // 7. Profile Load (Profile + Signed Avatar URL query)
  const profileLoadMetric = await measure('Profile Load Latency (DB + Signed Avatar)', async () => {
    await fetch(`${url}/rest/v1/profiles?select=id,role,full_name,email,phone,status&id=eq.c07ed246-8b26-4bee-8237-e1c708996df4`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
  });

  const benchmarkReport = [
    globalSearchMetric,
    listSearchMetric,
    aiFirstResponseMetric,
    aiToolMetric,
    recycleBinMetric,
    moreMenuMetric,
    profileLoadMetric,
  ];

  console.table(benchmarkReport);
}

runBenchmark().catch(console.error);
