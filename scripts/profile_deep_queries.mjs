import fs from 'fs';

import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://woligfdwsweiqcxhtdtt.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': 'Bearer ' + SERVICE_KEY,
  'Content-Type': 'application/json'
};

async function timeQuery(name, path, customHeaders = {}) {
  const t0 = performance.now();
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: { ...headers, ...customHeaders }
  });
  const duration = Math.round(performance.now() - t0);
  const data = await res.json().catch(() => null);
  const countHeader = res.headers.get('content-range');
  const rowCount = Array.isArray(data) ? data.length : (countHeader || (data ? 1 : 0));
  const payloadBytes = JSON.stringify(data || '').length;

  return {
    name,
    path,
    status: res.status,
    durationMs: duration,
    rowCount,
    payloadBytes
  };
}

async function runProfiling() {
  console.log('=== PROFILING INDIVIDUAL SUPABASE QUERIES (PHASE 2) ===');

  const queryProfiles = {};

  // 1. Dashboard Queries
  console.log('\n--- 1. Dashboard Queries ---');
  const dashQueries = [
    { name: 'Dashboard: Active Farms Count', path: 'farms?active=eq.true&select=id', headers: { 'Prefer': 'count=exact', 'Range': '0-0' } },
    { name: 'Dashboard: Confirmed Harvest Count', path: 'purchases?status=eq.CONFIRMED&select=id', headers: { 'Prefer': 'count=exact', 'Range': '0-0' } },
    { name: 'Dashboard: Pending Sales Count', path: 'sales_orders?status=eq.Draft&select=id', headers: { 'Prefer': 'count=exact', 'Range': '0-0' } },
    { name: 'Dashboard: Ready Stock Inflows', path: 'stock_movements?to_state=eq.READY&select=qty' },
    { name: 'Dashboard: Dispatched Outflows', path: 'dispatches?select=loaded_quantity' },
    { name: 'Dashboard: Receivables Balance', path: 'bills?balance_due=gt.0&select=balance_due' },
    { name: 'Dashboard: Payables Balance', path: 'purchases?balance=gt.0&select=balance' }
  ];

  const dashIndividual = [];
  for (const q of dashQueries) {
    const res = await timeQuery(q.name, q.path, q.headers);
    console.log(`  ${res.name}: ${res.durationMs}ms | Rows: ${res.rowCount} | Size: ${res.payloadBytes}B`);
    dashIndividual.push(res);
  }

  // Measure Concurrent Promise.all for Dashboard
  const tDash0 = performance.now();
  await Promise.all(dashQueries.map(q => timeQuery(q.name, q.path, q.headers)));
  const dashConcurrentMs = Math.round(performance.now() - tDash0);
  console.log(`  >> DASHBOARD CONCURRENT BATCH LATENCY: ${dashConcurrentMs}ms (vs ${dashIndividual.reduce((a, b) => a + b.durationMs, 0)}ms sequential)`);

  queryProfiles['/dashboard'] = {
    individual: dashIndividual,
    sequentialTotalMs: dashIndividual.reduce((a, b) => a + b.durationMs, 0),
    concurrentBatchMs: dashConcurrentMs
  };

  // 2. P&L Queries
  console.log('\n--- 2. P&L Queries ---');
  const pnlQueries = [
    { name: 'P&L: Sales Orders', path: 'sales_orders?status=neq.CANCELLED&select=total_amount,quantity,rate' },
    { name: 'P&L: Confirmed Purchases', path: 'purchases?status=in.(CONFIRMED,COMPLETED)&actual_quantity=not.is.null&select=actual_quantity,expected_quantity,rate' },
    { name: 'P&L: Cutting Batches', path: 'cutting_batches?status=neq.CANCELLED&select=actual_output_nuts,rate_per_nut' },
    { name: 'P&L: Transport Freight', path: 'transport_trips?status=neq.CANCELLED&select=freight_amount' },
    { name: 'P&L: Expenses', path: 'expenses?select=amount' }
  ];

  const pnlIndividual = [];
  for (const q of pnlQueries) {
    const res = await timeQuery(q.name, q.path);
    console.log(`  ${res.name}: ${res.durationMs}ms | Rows: ${res.rowCount} | Size: ${res.payloadBytes}B`);
    pnlIndividual.push(res);
  }

  const tPnl0 = performance.now();
  await Promise.all(pnlQueries.map(q => timeQuery(q.name, q.path)));
  const pnlConcurrentMs = Math.round(performance.now() - tPnl0);
  console.log(`  >> P&L CONCURRENT BATCH LATENCY: ${pnlConcurrentMs}ms (vs ${pnlIndividual.reduce((a, b) => a + b.durationMs, 0)}ms sequential)`);

  queryProfiles['/dashboard/pnl'] = {
    individual: pnlIndividual,
    sequentialTotalMs: pnlIndividual.reduce((a, b) => a + b.durationMs, 0),
    concurrentBatchMs: pnlConcurrentMs
  };

  // 3. Farms List
  console.log('\n--- 3. Farms List ---');
  const farmsQuery = await timeQuery('Farms List', 'farms?select=id,name,owner_name,village,active,last_harvest_date,expected_yield&order=name.asc&limit=30');
  console.log(`  Farms List: ${farmsQuery.durationMs}ms | Rows: ${farmsQuery.rowCount}`);
  queryProfiles['/dashboard/farms'] = farmsQuery;

  // 4. Purchases List
  console.log('\n--- 4. Purchases List ---');
  const purchasesQuery = await timeQuery('Purchases List (with Farm Join)', 'purchases?select=id,farm_id,expected_date,expected_quantity,actual_quantity,rate,advance_amount,status,created_at,farms:farm_id(id,name,village)&order=created_at.desc&limit=30');
  console.log(`  Purchases List: ${purchasesQuery.durationMs}ms | Rows: ${purchasesQuery.rowCount}`);
  queryProfiles['/dashboard/purchases'] = purchasesQuery;

  // 5. Transport List
  console.log('\n--- 5. Transport List ---');
  const transportQuery = await timeQuery('Transport List', 'transport_trips?select=id,date,vehicle_number,driver_name,source_type,source_id,destination_type,destination_id,expected_quantity,actual_quantity,freight_amount,status,created_at&order=created_at.desc&limit=30');
  console.log(`  Transport List: ${transportQuery.durationMs}ms | Rows: ${transportQuery.rowCount}`);
  queryProfiles['/dashboard/transport'] = transportQuery;

  // 6. Sales List
  console.log('\n--- 6. Sales List ---');
  const salesQuery = await timeQuery('Sales List (with Buyer Join)', 'sales_orders?select=id,buyer_id,order_date,product_type,quantity,rate,total_amount,status,delivery_address,buyers:buyer_id(name)&order=order_date.desc&limit=30');
  console.log(`  Sales List: ${salesQuery.durationMs}ms | Rows: ${salesQuery.rowCount}`);
  queryProfiles['/dashboard/sales'] = salesQuery;

  // 7. Bills List
  console.log('\n--- 7. Bills List ---');
  const billsQ1 = await timeQuery('Bills: List', 'bills?select=id,buyer_id,bill_number,bill_date,total_amount,balance_due,status,created_at&order=created_at.desc&limit=30');
  const billsQ2 = await timeQuery('Bills: Buyers Lookup', 'buyers?select=id,name&limit=30');
  const tBills0 = performance.now();
  await Promise.all([
    timeQuery('Bills: List', 'bills?select=id,buyer_id,bill_number,bill_date,total_amount,balance_due,status,created_at&order=created_at.desc&limit=30'),
    timeQuery('Bills: Buyers Lookup', 'buyers?select=id,name&limit=30')
  ]);
  const billsConcurrentMs = Math.round(performance.now() - tBills0);
  console.log(`  Bills List: ${billsQ1.durationMs}ms | Buyers: ${billsQ2.durationMs}ms | Concurrent: ${billsConcurrentMs}ms`);
  queryProfiles['/dashboard/bills'] = { billsQ1, billsQ2, concurrentMs: billsConcurrentMs };

  // 8. Stock List
  console.log('\n--- 8. Stock List ---');
  const stockQueries = [
    { name: 'Stock Movements (30)', path: 'stock_movements?select=id,godown_id,product_type,qty,from_state,to_state,reference_type,reference_id,notes,created_at&order=created_at.desc&limit=30' },
    { name: 'Stock Ready Inflows', path: 'stock_movements?to_state=eq.READY&select=qty' },
    { name: 'Stock Dispatches', path: 'dispatches?select=loaded_quantity' },
    { name: 'Stock Waste', path: 'stock_movements?to_state=in.(DAMAGED,REJECTED,WASTAGE)&select=qty' }
  ];
  const stockIndividual = [];
  for (const q of stockQueries) {
    const res = await timeQuery(q.name, q.path);
    console.log(`  ${res.name}: ${res.durationMs}ms | Rows: ${res.rowCount}`);
    stockIndividual.push(res);
  }
  const tStock0 = performance.now();
  await Promise.all(stockQueries.map(q => timeQuery(q.name, q.path)));
  const stockConcurrentMs = Math.round(performance.now() - tStock0);
  console.log(`  >> STOCK CONCURRENT BATCH: ${stockConcurrentMs}ms`);
  queryProfiles['/dashboard/stock'] = { individual: stockIndividual, concurrentBatchMs: stockConcurrentMs };

  // Save profiling data
  fs.writeFileSync('scripts/deep_profile_results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    queryProfiles
  }, null, 2));

  console.log('\n=== ALL QUERIES PROFILED & SAVED TO scripts/deep_profile_results.json ===');
}

runProfiling().catch(console.error);
