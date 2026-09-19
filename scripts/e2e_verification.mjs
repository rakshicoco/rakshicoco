import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://woligfdwsweiqcxhtdtt.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const client = createClient(supabaseUrl, serviceKey);

async function runE2E() {
  console.log('=== STARTING RAKSHI COCO E2E FUNCTIONAL WORKFLOW TEST ===\n');

  // 1. Initial State / Counts
  const { data: initialFarms } = await client.from('farms').select('*');
  const { data: initialPurchases } = await client.from('purchases').select('*');
  const { data: initialBuyers } = await client.from('buyers').select('*');
  const { data: initialOrders } = await client.from('sales_orders').select('*');
  const { data: initialBills } = await client.from('bills').select('*');
  const { data: initialPayments } = await client.from('buyer_payments').select('*');

  console.log('INITIAL COUNTS:');
  console.log('- Farms:', initialFarms?.length || 0);
  console.log('- Purchases:', initialPurchases?.length || 0);
  console.log('- Buyers:', initialBuyers?.length || 0);
  console.log('- Sales Orders:', initialOrders?.length || 0);
  console.log('- Bills:', initialBills?.length || 0);
  console.log('- Buyer Payments:', initialPayments?.length || 0);
  console.log('--------------------------------------------------\n');

  // PHASE 2: CREATE TEST FARM
  console.log('PHASE 2: Checking/Creating TEST FARM — RAKSHI E2E...');
  let farm;
  const existingFarm = initialFarms?.find(f => f.owner_name?.includes('TEST FARM — RAKSHI E2E') || f.name?.includes('TEST FARM — RAKSHI E2E'));
  if (existingFarm) {
    farm = existingFarm;
    console.log(`Reusing existing test farm: ${farm.id} (${farm.owner_name})`);
  } else {
    const { data: newFarm, error: farmErr } = await client.from('farms').insert({
      name: 'TEST FARM — RAKSHI E2E',
      owner_name: 'TEST FARM — RAKSHI E2E',
      phone: '9999999999',
      village: 'TEST VILLAGE',
      total_trees: 250,
      expected_yield: 25000,
      notes: 'Automated E2E Functional Test Farm',
      active: true
    }).select().single();

    if (farmErr) {
      console.error('FAILED to create farm:', farmErr);
      throw farmErr;
    }
    farm = newFarm;
    console.log(`Created new test farm: ${farm.id}`);
  }

  // PHASE 3: CREATE TEST PURCHASE
  console.log('\nPHASE 3: Creating TEST PURCHASE against farm...');
  const today = new Date().toISOString().split('T')[0];
  const { data: purchase, error: purErr } = await client.from('purchases').insert({
    farm_id: farm.id,
    expected_date: today,
    expected_quantity: 1000,
    actual_quantity: 950,
    harvest_date: today,
    rate: 20,
    advance_amount: 5000,
    balance: 14000,
    gross_amount: 19000,
    status: 'COMPLETED',
    notes: 'E2E Test purchase: 1000 expected, 950 harvested @ ₹20'
  }).select().single();

  if (purErr) {
    console.error('FAILED to create purchase:', purErr);
  } else {
    console.log(`Created test purchase: ${purchase.id} (Gross: ₹19,000, Qty: 950)`);
  }

  // PHASE 5: TEST TRANSPORT (FARM_TO_GODOWN)
  console.log('\nPHASE 5: Creating TEST TRANSPORT (FARM_TO_GODOWN)...');
  const { data: trip, error: tripErr } = await client.from('transport_trips').insert({
    source_type: 'FARM',
    source_id: farm.id,
    destination_type: 'GODOWN',
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
  }).select().single();

  if (tripErr) {
    console.error('FAILED to create transport trip:', tripErr);
  } else {
    console.log(`Created transport trip: ${trip.id} (Loaded: 950, Received: 940, Diff: 10)`);
  }

  // PHASE 6: TEST PROCESSING
  console.log('\nPHASE 6: Creating TEST PROCESSING BATCH...');
  const { data: procBatch, error: procErr } = await client.from('processing_batches').insert({
    date: today,
    purchase_id: purchase?.id,
    source_stock: 'Main Godown',
    qty_given: 940,
    qty_returned: 940,
    ready_qty: 900,
    damaged_qty: 25,
    rejected_qty: 15,
    status: 'COMPLETED',
    notes: '940 input = 900 ready + 25 damaged + 15 rejected'
  }).select().single();

  if (procErr) {
    console.error('FAILED to create processing batch:', procErr);
  } else {
    console.log(`Created processing batch: ${procBatch.id} (Ready: 900, Damaged: 25, Rejected: 15)`);
  }

  // PHASE 7: CREATE TEST BUYER & SALES ORDER
  console.log('\nPHASE 7: Checking/Creating TEST BUYER & SALES ORDER...');
  let buyer;
  const existingBuyer = initialBuyers?.find(b => b.name?.includes('TEST BUYER — RAKSHI E2E'));
  if (existingBuyer) {
    buyer = existingBuyer;
    console.log(`Reusing existing test buyer: ${buyer.id} (${buyer.name})`);
  } else {
    const { data: newBuyer, error: buyerErr } = await client.from('buyers').insert({
      name: 'TEST BUYER — RAKSHI E2E',
      company: 'Rakshi Test Agro Exports',
      phone: '9888888888',
      address: 'Industrial Estate, Pollachi',
      active: true
    }).select().single();

    if (buyerErr) {
      console.error('FAILED to create buyer:', buyerErr);
      throw buyerErr;
    }
    buyer = newBuyer;
    console.log(`Created test buyer: ${buyer.id}`);
  }

  const { data: order, error: orderErr } = await client.from('sales_orders').insert({
    buyer_id: buyer.id,
    date: today,
    product_type: 'COCONUT',
    quantity: 100,
    rate: 35,
    total_amount: 3500,
    status: 'CONFIRMED',
    delivery_address: 'Pollachi Hub'
  }).select().single();

  if (orderErr) {
    console.error('FAILED to create sales order:', orderErr);
  } else {
    console.log(`Created sales order: ${order.id} (100 nuts @ ₹35 = ₹3,500)`);
  }

  // PHASE 8: TEST DISPATCH & BILLING
  console.log('\nPHASE 8: Creating TEST DISPATCH & BILL...');
  let dispatchRec;
  if (order) {
    const { data: disp, error: dispErr } = await client.from('dispatch').insert({
      sales_order_id: order.id,
      dispatch_date: today,
      vehicle: 'TN38-DISP-1111',
      qty_dispatched: 100,
      qty_delivered: 100,
      status: 'DELIVERED'
    }).select().single();

    if (dispErr) {
      console.error('FAILED to create dispatch:', dispErr);
    } else {
      dispatchRec = disp;
      console.log(`Created dispatch record: ${disp.id} (Qty: 100 delivered)`);
    }

    const { data: bill, error: billErr } = await client.from('bills').insert({
      buyer_id: buyer.id,
      sales_order_id: order.id,
      bill_number: `RC-INV-${Date.now().toString().slice(-6)}`,
      bill_date: today,
      amount: 3500,
      freight_charges: 200,
      total_amount: 3700,
      status: 'UNPAID',
      balance_due: 3700,
      description: 'E2E Test invoice for 100 coconuts'
    }).select().single();

    if (billErr) {
      console.error('FAILED to create bill:', billErr);
    } else {
      console.log(`Created sales bill: ${bill.id} (${bill.bill_number}, Total: ₹${bill.total_amount || 3700})`);
    }
  }

  // PHASE 9: TEST PAYMENT
  console.log('\nPHASE 9: Creating TEST PAYMENT (Partial Buyer Collection)...');
  const { data: payment, error: payErr } = await client.from('buyer_payments').insert({
    buyer_id: buyer.id,
    sales_order_id: order?.id,
    amount: 1500,
    payment_date: today,
    payment_method: 'UPI',
    status: 'COMPLETED',
    notes: 'Partial payment of ₹1,500 towards order'
  }).select().single();

  if (payErr) {
    console.error('FAILED to create payment:', payErr);
  } else {
    console.log(`Created buyer payment: ${payment.id} (Amount: ₹1,500 via UPI)`);
  }

  // PHASE 11 & 12: VERIFY ALL PERSISTED DATA & COUNTS
  console.log('\n==================================================');
  console.log('FINAL DATABASE VERIFICATION:');
  const { data: finalFarms } = await client.from('farms').select('*');
  const { data: finalPurchases } = await client.from('purchases').select('*');
  const { data: finalBuyers } = await client.from('buyers').select('*');
  const { data: finalOrders } = await client.from('sales_orders').select('*');
  const { data: finalTrips } = await client.from('transport_trips').select('*');
  const { data: finalBatches } = await client.from('processing_batches').select('*');
  const { data: finalBills } = await client.from('bills').select('*');
  const { data: finalPayments } = await client.from('buyer_payments').select('*');

  console.log('- Total Farms in DB:', finalFarms?.length);
  console.log('- Total Purchases in DB:', finalPurchases?.length);
  console.log('- Total Transport Trips in DB:', finalTrips?.length);
  console.log('- Total Processing Batches in DB:', finalBatches?.length);
  console.log('- Total Buyers in DB:', finalBuyers?.length);
  console.log('- Total Sales Orders in DB:', finalOrders?.length);
  console.log('- Total Bills in DB:', finalBills?.length);
  console.log('- Total Buyer Payments in DB:', finalPayments?.length);
  console.log('==================================================\n');
}

runE2E().catch(console.error);
