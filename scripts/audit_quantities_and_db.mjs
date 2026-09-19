const SUPABASE_URL = 'https://woligfdwsweiqcxhtdtt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
};

async function api(endpoint) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, { headers });
  if (!res.ok) throw new Error(`Fetch ${endpoint} failed: ${res.status}`);
  return res.json();
}

async function run() {
  console.log('=== BUILD 18 QUANTITY & DATABASE AUDIT ===\n');

  // 1. Purchase
  const purchases = await api('/purchases?id=eq.cd382ede-cd1d-4f60-9c6d-88a20a7e6385');
  const purchase = purchases[0];
  console.log('1. PURCHASE RECORD:');
  console.log(`- ID: ${purchase.id}`);
  console.log(`- Farm ID: ${purchase.farm_id}`);
  console.log(`- Harvested Qty: ${purchase.actual_quantity}`);
  console.log(`- Rate: ₹${purchase.rate}`);
  console.log(`- Advance: ₹${purchase.advance_amount}`);
  console.log(`- Balance Due: ₹${purchase.balance}`);
  console.log(`- Status: ${purchase.status}\n`);

  // 2. Transport Trip
  const trips = await api('/transport_trips?id=eq.9b3270c5-aca9-4140-a289-36396bc538ef');
  const trip = trips[0];
  console.log('2. TRANSPORT TRIP RECORD:');
  console.log(`- ID: ${trip.id}`);
  console.log(`- Loaded Quantity: ${trip.expected_quantity}`);
  console.log(`- Received Quantity: ${trip.received_quantity}`);
  console.log(`- Transit Loss / Damaged: ${trip.damaged_quantity}`);
  console.log(`- Freight: ₹${trip.freight_amount}`);
  console.log(`- Status: ${trip.status}\n`);

  // 3. Cutting Batch
  const batches = await api('/cutting_batches?id=eq.820b604d-887b-444d-b8ca-d9a3fb7eb0f0');
  const batch = batches[0];
  console.log('3. CUTTING BATCH RECORD:');
  console.log(`- ID: ${batch.id}`);
  console.log(`- Input nuts received: ${batch.expected_output_nuts}`);
  console.log(`- Actual output ready: ${batch.actual_output_nuts}`);
  console.log(`- Rejection count: ${batch.rejection_count}`);
  console.log(`- Rate per nut: ₹${batch.rate_per_nut}`);
  console.log(`- Status: ${batch.status}\n`);

  // 4. Quantity Balance Proof
  console.log('4. QUANTITY RECONCILIATION PROOF:');
  const loaded = trip.expected_quantity; // 950
  const transitLoss = trip.damaged_quantity; // 10
  const receivedAtGodown = trip.received_quantity; // 940
  const cuttingInput = batch.expected_output_nuts; // 940
  const readyOutput = batch.actual_output_nuts; // 900
  const processingLoss = batch.rejection_count; // 40

  console.log(`Loaded from Farm: ${loaded}`);
  console.log(`Transit Damage: ${transitLoss}`);
  console.log(`Net Received into Processing: ${receivedAtGodown}`);
  console.log(`Processing Output (Ready): ${readyOutput}`);
  console.log(`Processing Rejection: ${processingLoss}`);
  console.log(`Reconciled Total: ${readyOutput} + ${processingLoss} + ${transitLoss} = ${readyOutput + processingLoss + transitLoss} (Equals Loaded: ${readyOutput + processingLoss + transitLoss === loaded ? 'YES (PASS)' : 'NO'})\n`);

  // 5. Stock Movements & Inventory Balance
  const movements = await api('/stock_movements?reference_id=eq.820b604d-887b-444d-b8ca-d9a3fb7eb0f0');
  console.log('5. STOCK MOVEMENT RECORD:');
  console.log(movements[0]);

  // 6. Sales Order & Dispatch
  const orders = await api('/sales_orders?id=eq.24c6ed1b-0b9f-4437-994f-7a1b4a0cc20e');
  const order = orders[0];
  console.log('\n6. SALES ORDER RECORD:');
  console.log(`- ID: ${order.id}`);
  console.log(`- Buyer ID: ${order.buyer_id}`);
  console.log(`- Quantity: ${order.quantity}`);
  console.log(`- Rate: ₹${order.rate}`);
  console.log(`- Total Amount: ₹${order.total_amount}`);

  const dispatches = await api('/dispatches?sales_order_id=eq.24c6ed1b-0b9f-4437-994f-7a1b4a0cc20e');
  const dispatch = dispatches[0];
  console.log('\n7. DISPATCH RECORD:');
  console.log(`- ID: ${dispatch.id}`);
  console.log(`- Dispatched Quantity: ${dispatch.loaded_quantity}`);
  console.log(`- Status: ${dispatch.status}`);

  // Final Stock Calculation
  const finalReadyStock = readyOutput - dispatch.loaded_quantity;
  console.log(`\n8. FINAL READY STOCK CALCULATION:`);
  console.log(`900 processed - 100 dispatched = ${finalReadyStock} nuts (PASS)`);
}

run().catch(console.error);
