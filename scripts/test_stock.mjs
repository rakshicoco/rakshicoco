const SUPABASE_URL = 'https://woligfdwsweiqcxhtdtt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function testStock() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/stock_movements`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      godown_id: '00000000-0000-0000-0000-000000000001',
      product_type: 'COCONUT',
      qty: 900,
      from_state: 'PROCESSING',
      to_state: 'READY',
      reference_type: 'PURCHASE',
      notes: 'Ready stock after processing: 900 coconuts'
    })
  });
  console.log('Status:', res.status, await res.text());
}

testStock().catch(console.error);
