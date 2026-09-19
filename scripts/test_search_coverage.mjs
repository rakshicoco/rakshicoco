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
process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  const { searchGlobal } = await import('../src/lib/actions/search.ts');
  console.log('--- EXECUTING GLOBAL SEARCH COVERAGE TEST ---');
  
  const testQueries = ['a', 'PO', 'SO', 'Bill', 'Trip', 'Farm', 'Worker', 'Stock'];
  for (const q of testQueries) {
    const results = await searchGlobal(q);
    console.log(`Query "${q}": returned ${results.length} items`);
    const types = [...new Set(results.map(r => r.type))];
    console.log(`  Types: ${types.join(', ')}`);
  }
}

run().catch(console.error);
