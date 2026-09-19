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

async function verifyMetrics() {
  console.log('=== VERIFYING AUTHORITATIVE BUSINESS METRICS ===\n');

  // 1. Ready Stock
  const stockMovements = await queryTable('stock_movements?select=qty,to_state');
  const dispatches = await queryTable('dispatches?select=loaded_quantity');
  
  const readyInflow = stockMovements
    .filter(m => m.to_state === 'READY')
    .reduce((sum, m) => sum + Number(m.qty || 0), 0);
  const dispatchedOutflow = dispatches
    .reduce((sum, d) => sum + Number(d.loaded_quantity || 0), 0);
  const readyStock = readyInflow - dispatchedOutflow;

  // 2. Active Farms
  const farms = await queryTable('farms?select=id,name,active');
  const activeFarms = farms.filter(f => f.active === true).length;

  // 3. Receivables: Unpaid balance on commercial bills
  const bills = await queryTable('bills?select=id,balance_due&balance_due=gt.0');
  const receivables = bills.reduce((sum, b) => sum + Number(b.balance_due || 0), 0);

  // 4. Payables: Outstanding procurement balance to farm partners
  const purchases = await queryTable('purchases?select=id,balance&balance=gt.0');
  const payables = purchases.reduce((sum, p) => sum + Number(p.balance || 0), 0);

  // 5. Revenue: Non-cancelled sales orders
  const salesOrders = await queryTable('sales_orders?select=id,total_amount,quantity,rate,status&status=neq.CANCELLED');
  const revenue = salesOrders.reduce((sum, so) => sum + Number(so.total_amount || (so.quantity * so.rate) || 0), 0);

  // 6. COGS: Direct harvest procurement cost per unit sold
  const totalDispatchedQty = salesOrders.reduce((sum, so) => sum + Number(so.quantity || 0), 0);
  const confirmedPurchases = await queryTable('purchases?select=actual_quantity,rate,status&status=in.(CONFIRMED,COMPLETED,HARVESTED)');
  const totalPurchasedNuts = confirmedPurchases.reduce((sum, p) => sum + Number(p.actual_quantity || 0), 0);
  const totalSpend = confirmedPurchases.reduce((sum, p) => sum + Number((p.actual_quantity || 0) * (p.rate || 0)), 0);
  const avgRate = totalPurchasedNuts > 0 ? (totalSpend / totalPurchasedNuts) : 20;
  const cogs = totalDispatchedQty * avgRate;

  // 7. Gross Profit
  const grossProfit = revenue - cogs;

  // 8. OPEX: Cutting & Processing Labour (₹2,250) + Transport Freight (₹1,500) + Direct Expenses (₹0)
  const cutting = await queryTable('cutting_batches?select=actual_output_nuts,rate_per_nut,status&status=neq.CANCELLED');
  const labour = cutting.reduce((sum, c) => sum + Number((c.actual_output_nuts || 0) * (c.rate_per_nut || 0)), 0);
  const trips = await queryTable('transport_trips?select=freight_amount,status&status=neq.CANCELLED');
  const freight = trips.reduce((sum, t) => sum + Number(t.freight_amount || 0), 0);
  const expenses = await queryTable('expenses?select=amount');
  const directExp = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const opex = labour + freight + directExp;

  // 9. Net Result
  const netResult = grossProfit - opex;

  const results = [
    { metric: 'Ready Stock', target: 800, actual: readyStock, unit: 'nuts', pass: readyStock === 800 },
    { metric: 'Active Farms', target: 2, actual: activeFarms, unit: 'farms', pass: activeFarms === 2 },
    { metric: 'Receivables', target: 2000, actual: receivables, unit: 'INR', pass: receivables === 2000 },
    { metric: 'Payables', target: 14000, actual: payables, unit: 'INR', pass: payables === 14000 },
    { metric: 'Revenue', target: 3500, actual: revenue, unit: 'INR', pass: revenue === 3500 },
    { metric: 'COGS', target: 2000, actual: cogs, unit: 'INR', pass: cogs === 2000 },
    { metric: 'Gross Profit', target: 1500, actual: grossProfit, unit: 'INR', pass: grossProfit === 1500 },
    { metric: 'OPEX', target: 3750, actual: opex, unit: 'INR', pass: opex === 3750 },
    { metric: 'Net Result', target: -2250, actual: netResult, unit: 'INR', pass: netResult === -2250 },
  ];

  console.table(results);

  const allPass = results.every(r => r.pass);
  console.log('Final Invariance Result:', allPass ? 'ALL METRICS PASS INVARIANCE AUDIT' : 'RELEASE BLOCKER: METRIC MISMATCH');
}

verifyMetrics().catch(console.error);
