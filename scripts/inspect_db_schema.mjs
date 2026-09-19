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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function inspect() {
  console.log('--- CHECKING SUPABASE POSTGREST ENDPOINTS ---');
  const tables = [
    'profiles', 'farms', 'farm_followups', 'purchases', 'teams', 'workers',
    'cutting_batches', 'grouping_batches', 'processing_batches', 'buyers',
    'sales_orders', 'transport_trips', 'dispatches', 'dispatch_batches',
    'stock_movements', 'bills', 'payments', 'expenses', 'audit_logs',
    'notifications', 'settings', 'buyer_payments', 'farm_payments', 'labour_payments'
  ];

  for (const t of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Range-Unit': 'items',
          'Prefer': 'count=exact'
        }
      });
      const contentRange = res.headers.get('content-range');
      if (res.ok) {
        const rows = await res.json();
        console.log(`Table ${t}: EXISTS (count: ${contentRange || rows.length}, sample keys: ${rows[0] ? Object.keys(rows[0]).join(', ') : 'empty'})`);
      } else {
        const errText = await res.text();
        console.log(`Table ${t}: HTTP ${res.status} (${errText.slice(0, 100)})`);
      }
    } catch (e) {
      console.log(`Table ${t}: FETCH ERROR (${e.message})`);
    }
  }
}

inspect();
