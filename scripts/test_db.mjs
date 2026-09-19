import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://woligfdwsweiqcxhtdtt.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const client = createClient(supabaseUrl, serviceKey);

async function main() {
  console.log('Testing read from farms...');
  const { data: initialFarms, error: readErr } = await client.from('farms').select('*');
  console.log('Initial farms count:', initialFarms?.length, 'Read error:', readErr);

  console.log('Testing insert into farms...');
  const { data: inserted, error: insertErr } = await client.from('farms').insert({
    name: 'Pollachi Green Estate',
    owner_name: 'Rithish Kumar',
    phone: '9876543210',
    village: 'Pollachi',
    total_trees: 500,
    expected_yield: 45000,
    notes: 'Premium coconut plantation in Pollachi',
    active: true
  }).select().single();

  console.log('Insert result:', inserted ? `SUCCESS ID: ${inserted.id}` : 'FAILED', 'Insert error:', insertErr);

  const { data: updatedFarms } = await client.from('farms').select('*');
  console.log('Updated farms count:', updatedFarms?.length);

  // Test insert into purchases if farm exists
  if (inserted?.id) {
    console.log('Testing insert into purchases...');
    const { data: newPurchase, error: pErr } = await client.from('purchases').insert({
      farm_id: inserted.id,
      expected_harvest_date: '2026-09-25',
      expected_quantity: 10000,
      rate_per_nut: 12.5,
      advance_amount: 5000,
      status: 'SCHEDULED',
      notes: 'Initial harvest batch'
    }).select().single();
    console.log('Purchase insert result:', newPurchase ? `SUCCESS ID: ${newPurchase.id}` : 'FAILED', 'Error:', pErr);
  }
}

main().catch(console.error);
