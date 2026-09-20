// Data cleanup script — deletes all test/demo data from Supabase
// Uses service role key so RLS is bypassed
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://woligfdwsweiqcxhtdtt.supabase.co';
const SERVICE_KEY = readFileSync('e:/Rakshi Coco/.env.local', 'utf8')
  .split('\n')
  .find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY='))
  ?.split('=').slice(1).join('=').trim();

if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not found in .env.local');

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

async function deleteAll(table) {
  // Use `created_at=gt.1970-01-01` to match all rows (Supabase requires a filter for DELETE)
  const url = `${SUPABASE_URL}/rest/v1/${table}?created_at=gt.1970-01-01T00:00:00.000Z`;
  try {
    const r = await fetch(url, { method: 'DELETE', headers: HEADERS });
    console.log(`  ${table}: HTTP ${r.status}${r.status >= 400 ? ' — ' + await r.text() : ' OK'}`);
  } catch (e) {
    console.log(`  ${table}: SKIP (${e.message})`);
  }
}

// Tables ordered to respect FK constraints (children first)
const TABLES = [
  'notifications',
  'audit_logs',
  'payments',
  'bills',
  'dispatches',
  'sales_orders',
  'farm_followups',
  'cutting_batches',
  'grouping_batches',
  'transport_trips',
  'purchases',
  'workers',
  'teams',
  'buyers',
  'expenses',
  'farms',
];

console.log('🗑️  Cleaning all demo/test data from Supabase...\n');
for (const table of TABLES) {
  await deleteAll(table);
}
console.log('\n✅ Done. All test data removed.');
