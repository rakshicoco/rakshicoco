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

async function queryTable(endpoint) {
  const res = await fetch(`${url}/rest/v1/${endpoint}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  return res.json();
}

async function inspect() {
  console.log('--- PURCHASES ROWS ---');
  const purchases = await queryTable('purchases?select=*');
  console.log(purchases);

  console.log('\n--- CUTTING BATCHES ROWS ---');
  const cutting = await queryTable('cutting_batches?select=*');
  console.log(cutting);

  console.log('\n--- TRANSPORT TRIPS ROWS ---');
  const trips = await queryTable('transport_trips?select=*');
  console.log(trips);

  console.log('\n--- PAYMENTS ROWS ---');
  const payments = await queryTable('payments?select=*');
  console.log(payments);

  console.log('\n--- EXPENSES ROWS ---');
  const expenses = await queryTable('expenses?select=*');
  console.log(expenses);
}

inspect().catch(console.error);
