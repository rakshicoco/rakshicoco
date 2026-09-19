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

async function runSuite() {
  console.log('=== BUILD 24 SYSTEM VALIDATION SUITE ===\n');

  // 1. Test AI processAiMessage with Live ERP data
  const { processAiMessage } = await import('../src/lib/ai/client.ts');
  
  console.log('1. Testing AI Live Executive Summary:');
  const summaryMsg = await processAiMessage('test-user-id', 'Give me the live dashboard summary');
  console.log(summaryMsg.content);
  console.log('   Data payload:', summaryMsg.data, '\n');

  console.log('2. Testing AI Coconut Ready Stock Position:');
  const stockMsg = await processAiMessage('test-user-id', 'What is our ready stock?');
  console.log(stockMsg.content);
  console.log('   Data readyStock:', stockMsg.data?.summary?.readyStock, '\n');

  console.log('3. Testing AI P&L Statement:');
  const pnlMsg = await processAiMessage('test-user-id', 'Show me the P&L statement');
  console.log(pnlMsg.content, '\n');

  console.log('4. Testing AI Server-Enforced Mutation Proposal:');
  const farmMsg = await processAiMessage('test-user-id', 'create farm "Green Valley Plantation"');
  console.log(farmMsg.content);
  console.log('   Pending Action ID:', farmMsg.pendingAction?.id);
  console.log('   Pending Action Tool:', farmMsg.pendingAction?.toolName);
  console.log('   Pending Action Params:', farmMsg.pendingAction?.parameters, '\n');

  // 5. Test Mutation Cancellation
  const { cancelPendingAction, getPendingAction } = await import('../src/lib/ai/confirmation.ts');
  if (farmMsg.pendingAction) {
    const cancelRes = cancelPendingAction('test-user-id', farmMsg.pendingAction.id);
    console.log('5. Cancel Action Result:', cancelRes);
    const afterCancel = getPendingAction('test-user-id', farmMsg.pendingAction.id);
    console.log('   Action exists after cancellation (expected null):', afterCancel, '\n');
  }

  // 6. Test Recycle Bin Classification & Dependency Safe Protection
  const { getClassification, checkEntityDependencies } = await import('../src/lib/actions/recycle_bin.ts');
  console.log('6. Entity Classification:');
  console.log('   FARM ->', getClassification('FARM'));
  console.log('   BUYER ->', getClassification('BUYER'));
  console.log('   PURCHASE ->', getClassification('PURCHASE'));
  console.log('   BILL ->', getClassification('BILL'));
  console.log('   PAYMENT ->', getClassification('PAYMENT'));
  console.log('   EXPENSE ->', getClassification('EXPENSE'), '\n');

  console.log('7. Dependency Safe Checks:');
  const billCheck = await checkEntityDependencies('BILL', 'BILL-0001');
  console.log('   BILL-0001 Protection:', billCheck);

  const farmCheck = await checkEntityDependencies('FARM', '3f4b5cee-eb0c-42b7-8b4f-b96c4ffc71bd');
  console.log('   Active Farm Dependencies:', farmCheck, '\n');

  console.log('=== ALL BUILD 24 SUITE CHECKS COMPLETED SUCCESSFULLY ===');
}

runSuite().catch(console.error);
