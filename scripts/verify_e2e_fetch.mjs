const SUPABASE_URL = 'https://woligfdwsweiqcxhtdtt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function api(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`API ${options.method || 'GET'} ${endpoint} failed (${res.status}): ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function run() {
  console.log('=== STARTING RAKSHI COCO ERP E2E FUNCTIONAL VERIFICATION ===\n');

  // 1. Initial State / Counts
  const [initialFarms, initialPurchases, initialTrips, initialBuyers, initialOrders, initialDispatches, initialBills, initialPayments] = await Promise.all([
    api('/farms?select=*'),
    api('/purchases?select=*'),
    api('/transport_trips?select=*'),
    api('/buyers?select=*'),
    api('/sales_orders?select=*'),
    api('/dispatches?select=*'),
    api('/bills?select=*'),
    api('/payments?select=*')
  ]);

  console.log('INITIAL COUNTS IN SUPABASE:');
  console.log(`- Farms: ${initialFarms.length}`);
  console.log(`- Purchases: ${initialPurchases.length}`);
  console.log(`- Transport Trips: ${initialTrips.length}`);
  console.log(`- Buyers: ${initialBuyers.length}`);
  console.log(`- Sales Orders: ${initialOrders.length}`);
  console.log(`- Dispatches: ${initialDispatches.length}`);
  console.log(`- Bills: ${initialBills.length}`);
  console.log(`- Payments: ${initialPayments.length}\n`);

  const today = new Date().toISOString().split('T')[0];

  // PHASE 2: TEST FARM
  console.log('PHASE 2: Checking/Creating TEST FARM — RAKSHI E2E...');
  let farm = initialFarms.find(f => f.name?.includes('TEST FARM — RAKSHI E2E') || f.owner_name?.includes('TEST FARM — RAKSHI E2E'));
  if (!farm) {
    const created = await api('/farms', {
      method: 'POST',
      body: JSON.stringify({
        name: 'TEST FARM — RAKSHI E2E',
        owner_name: 'TEST FARM — RAKSHI E2E',
        phone: '9999999999',
        village: 'TEST VILLAGE',
        total_trees: 250,
        expected_yield: 25000,
        notes: 'Automated E2E Functional Test Farm',
        active: true
      })
    });
    farm = created[0];
    console.log(`-> Farm Created: ${farm.id} (${farm.name})`);
  } else {
    console.log(`-> Reusing Test Farm: ${farm.id} (${farm.name})`);
  }

  // PHASE 3: TEST PURCHASE
  console.log('\nPHASE 3: Checking/Creating TEST PURCHASE (1000 nuts expected, 950 harvested @ ₹20)...');
  let purchase = initialPurchases.find(p => p.farm_id === farm.id);
  if (!purchase) {
    const created = await api('/purchases', {
      method: 'POST',
      body: JSON.stringify({
        farm_id: farm.id,
        expected_date: today,
        expected_quantity: 1000,
        actual_quantity: 950,
        harvest_date: today,
        rate: 20,
        advance_amount: 5000,
        balance: 14000,
        status: 'CONFIRMED',
        notes: 'E2E Test purchase: 1000 expected, 950 harvested @ ₹20 (Total ₹19,000)'
      })
    });
    purchase = created[0];
    console.log(`-> Purchase Created: ${purchase.id} (Gross: ₹19,000, Actual Qty: 950)`);
  } else {
    console.log(`-> Reusing Test Purchase: ${purchase.id}`);
  }

  // PHASE 5: TEST TRANSPORT
  console.log('\nPHASE 5: Checking/Creating FARM_TO_GODOWN Transport Trip...');
  let trip = initialTrips.find(t => t.source_id === farm.id);
  if (!trip) {
    const created = await api('/transport_trips', {
      method: 'POST',
      body: JSON.stringify({
        source_type: 'FARM',
        source_id: farm.id,
        destination_type: 'GODOWN',
        destination_id: farm.id,
        vehicle_number: 'TN38-E2E-9999',
        driver_name: 'Test Driver E2E',
        driver_phone: '9888812345',
        expected_quantity: 950,
        received_quantity: 940,
        damaged_quantity: 10,
        freight_amount: 1500,
        date: today,
        status: 'DELIVERED',
        notes: 'Handling / transit loss: 10 nuts difference'
      })
    });
    trip = created[0];
    console.log(`-> Transport Trip Created: ${trip.id} (Loaded: 950, Received: 940, Difference: 10)`);
  } else {
    console.log(`-> Reusing Transport Trip: ${trip.id}`);
  }

  // PHASE 6: TEST PROCESSING / CUTTING / STOCK
  console.log('\nPHASE 6: Checking/Creating Processing & Stock records...');
  const cuttingBatches = await api('/cutting_batches?select=*');
  let cuttingBatch = cuttingBatches.find(c => c.purchase_id === purchase.id);
  if (!cuttingBatch) {
    const created = await api('/cutting_batches', {
      method: 'POST',
      body: JSON.stringify({
        purchase_id: purchase.id,
        date: today,
        expected_output_nuts: 940,
        actual_output_nuts: 900,
        rejection_count: 40,
        rate_per_nut: 1.5,
        status: 'COMPLETED'
      })
    });
    cuttingBatch = created[0];
    console.log(`-> Cutting/Processing Batch Created: ${cuttingBatch.id} (Output: 900 ready, 40 rejected/damaged)`);
  } else {
    console.log(`-> Reusing Cutting Batch: ${cuttingBatch.id}`);
  }

  // Stock Movement: Record 900 ready coconuts in Godown
  const stockMoves = await api('/stock_movements?select=*');
  let readyStockMove = stockMoves.find(s => s.reference_id === purchase.id);
  if (!readyStockMove) {
    const created = await api('/stock_movements', {
      method: 'POST',
      body: JSON.stringify({
        godown_id: '00000000-0000-0000-0000-000000000001',
        product_type: 'COCONUT',
        qty: 900,
        from_state: 'PROCESSING',
        to_state: 'READY',
        reference_type: 'PURCHASE',
        reference_id: purchase.id,
        notes: 'Ready stock after processing: 900 coconuts'
      })
    });
    readyStockMove = created[0];
    console.log(`-> Stock Movement Created: ${readyStockMove.id} (900 coconuts moved to READY)`);
  } else {
    console.log(`-> Reusing Stock Movement: ${readyStockMove.id}`);
  }

  // PHASE 7: TEST BUYER & SALES ORDER
  console.log('\nPHASE 7: Checking/Creating TEST BUYER & SALES ORDER (100 nuts @ ₹35 = ₹3,500)...');
  let buyer = initialBuyers.find(b => b.name?.includes('TEST BUYER — RAKSHI E2E'));
  if (!buyer) {
    const created = await api('/buyers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'TEST BUYER — RAKSHI E2E',
        contact_person: 'Rithish Buyer',
        phone: '9888888888',
        gstin: '33AABCR1234F1Z9',
        address: 'Industrial Estate, Pollachi'
      })
    });
    buyer = created[0];
    console.log(`-> Buyer Created: ${buyer.id} (${buyer.name})`);
  } else {
    console.log(`-> Reusing Test Buyer: ${buyer.id} (${buyer.name})`);
  }

  let order = initialOrders.find(o => o.buyer_id === buyer.id);
  if (!order) {
    const created = await api('/sales_orders', {
      method: 'POST',
      body: JSON.stringify({
        buyer_id: buyer.id,
        date: today,
        product_type: 'COCONUT',
        quantity: 100,
        rate: 35,
        total_amount: 3500,
        status: 'CONFIRMED',
        delivery_address: 'Pollachi Delivery Point'
      })
    });
    order = created[0];
    console.log(`-> Sales Order Created: ${order.id} (100 nuts @ ₹35 = ₹3,500)`);
  } else {
    console.log(`-> Reusing Sales Order: ${order.id}`);
  }

  // PHASE 8: TEST DISPATCH & BILLING
  console.log('\nPHASE 8: Checking/Creating DISPATCH & SALES BILL...');
  let dispatch = initialDispatches.find(d => d.sales_order_id === order.id);
  if (!dispatch) {
    const created = await api('/dispatches', {
      method: 'POST',
      body: JSON.stringify({
        sales_order_id: order.id,
        date: today,
        vehicle_number: 'TN38-DISP-5555',
        driver_name: 'Driver Murugan',
        driver_phone: '9842112345',
        loaded_quantity: 100,
        status: 'DELIVERED'
      })
    });
    dispatch = created[0];
    console.log(`-> Dispatch Created: ${dispatch.id} (100 nuts delivered)`);
  } else {
    console.log(`-> Reusing Dispatch: ${dispatch.id}`);
  }

  let bill = initialBills.find(b => b.entity_id === buyer.id);
  if (!bill) {
    const created = await api('/bills', {
      method: 'POST',
      body: JSON.stringify({
        entity_type: 'BUYER',
        entity_id: buyer.id,
        amount: 3500,
        date: today,
        due_date: today,
        status: 'PARTIAL',
        balance_due: 2000,
        description: `Invoice for Sales Order ${order.id.slice(0, 8)} (100 nuts @ ₹35)`
      })
    });
    bill = created[0];
    console.log(`-> Bill / Invoice Created: ${bill.id} (Amount: ₹3,500, Balance Due: ₹2,000, Status: PARTIAL)`);
  } else {
    console.log(`-> Reusing Bill / Invoice: ${bill.id}`);
  }

  // PHASE 9: TEST PAYMENT (₹1,500 partial buyer collection)
  console.log('\nPHASE 9: Checking/Creating Partial Buyer Payment (₹1,500 inward)...');
  let payment = initialPayments.find(p => p.entity_id === buyer.id);
  if (!payment) {
    const created = await api('/payments', {
      method: 'POST',
      body: JSON.stringify({
        entity_type: 'BUYER',
        entity_id: buyer.id,
        amount: 1500,
        date: today,
        payment_method: 'UPI',
        reference: `UPI-REF-${Date.now().toString().slice(-6)}`,
        notes: 'Partial payment ₹1,500 towards sales order',
        type: 'IN'
      })
    });
    payment = created[0];
    console.log(`-> Inward Payment Created: ${payment.id} (₹1,500 received via UPI)`);
  } else {
    console.log(`-> Reusing Payment: ${payment.id}`);
  }

  // PHASE 12: FARM FOLLOW-UP VERIFICATION
  console.log('\nPHASE 12: Checking/Creating Farm Follow-up (40-day harvest cycle)...');
  const followups = await api('/farm_followups?select=*');
  let followup = followups.find(f => f.farm_id === farm.id);
  if (!followup) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 40);
    const created = await api('/farm_followups', {
      method: 'POST',
      body: JSON.stringify({
        farm_id: farm.id,
        date: today,
        status: 'UPCOMING',
        next_follow_up: nextDate.toISOString().split('T')[0],
        notes: 'Follow-up scheduled after completed harvest cycle (40 days)'
      })
    });
    followup = created[0];
    console.log(`-> Farm Follow-up Created: ${followup.id} (Next follow-up: ${followup.next_follow_up})`);
  } else {
    console.log(`-> Reusing Farm Follow-up: ${followup.id}`);
  }

  // PHASE 10 & 11: FINAL DASHBOARD & FINANCIAL METRICS
  console.log('\n============================================================');
  console.log('FINAL DATABASE VERIFICATION SUMMARY & METRICS:');
  const [fFarms, fPurchases, fTrips, fBuyers, fOrders, fDispatches, fBills, fPayments, fMovements, fCutting] = await Promise.all([
    api('/farms?select=*'),
    api('/purchases?select=*'),
    api('/transport_trips?select=*'),
    api('/buyers?select=*'),
    api('/sales_orders?select=*'),
    api('/dispatches?select=*'),
    api('/bills?select=*'),
    api('/payments?select=*'),
    api('/stock_movements?select=*'),
    api('/cutting_batches?select=*')
  ]);

  console.log(`- Total Farms in DB: ${fFarms.length}`);
  console.log(`- Total Purchases in DB: ${fPurchases.length}`);
  console.log(`- Total Transport Trips in DB: ${fTrips.length}`);
  console.log(`- Total Cutting Batches in DB: ${fCutting.length}`);
  console.log(`- Total Stock Movements in DB: ${fMovements.length}`);
  console.log(`- Total Buyers in DB: ${fBuyers.length}`);
  console.log(`- Total Sales Orders in DB: ${fOrders.length}`);
  console.log(`- Total Dispatches in DB: ${fDispatches.length}`);
  console.log(`- Total Bills in DB: ${fBills.length}`);
  console.log(`- Total Payments in DB: ${fPayments.length}`);

  // Calculate Ready Stock
  const inReady = fMovements.filter(m => m.to_state === 'READY').reduce((sum, m) => sum + m.qty, 0);
  const outReady = fDispatches.reduce((sum, d) => sum + (d.loaded_quantity || 0), 0);
  const readyStock = Math.max(0, inReady - outReady);

  // Calculate Receivables (Total Sales - Inward Payments from Buyers)
  const totalSalesVal = fOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalInwardPaid = fPayments.filter(p => p.type === 'IN').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const receivables = Math.max(0, totalSalesVal - totalInwardPaid);

  // Calculate Payables (Unpaid Purchase balances + Farmer payments due)
  const totalPayable = fPurchases.reduce((sum, p) => sum + (Number(p.balance) || 0), 0);

  console.log('\n--- DASHBOARD KPI VERIFICATION ---');
  console.log(`Farm Network: Before ${initialFarms.length} -> After ${fFarms.length}`);
  console.log(`Ready Stock: ${readyStock} nuts`);
  console.log(`Receivables: ₹${receivables.toLocaleString()} (Total Sales: ₹${totalSalesVal.toLocaleString()}, Inward Paid: ₹${totalInwardPaid.toLocaleString()})`);
  console.log(`Payables: ₹${totalPayable.toLocaleString()}`);
  console.log(`Pending Harvests: ${fPurchases.filter(p => p.status !== 'COMPLETED').length}`);
  console.log(`Pending Deliveries: ${fOrders.filter(o => o.status !== 'DELIVERED').length}`);
  console.log('============================================================\n');
}

run().catch(console.error);
