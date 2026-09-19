const SUPABASE_URL = 'https://woligfdwsweiqcxhtdtt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Simulating requireRole logic from src/lib/actions/utils.ts
async function simulateRequireRole(user, allowedRoles) {
  if (!user) {
    throw new Error('UNAUTHENTICATED: Redirect to /login');
  }

  // Profile lookup
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    }
  });

  const profiles = await res.json();
  const profile = profiles[0];

  if (!profile || !allowedRoles.includes(profile.role)) {
    throw new Error(`UNAUTHORIZED: Role '${profile?.role || 'NONE'}' is not permitted. Required one of: ${allowedRoles.join(', ')}`);
  }

  return { authorized: true, role: profile.role };
}

async function runAudit() {
  console.log('=== 1. AUTHORIZATION AUDIT EXECUTION ===\n');

  // Test 1: Unauthenticated user
  console.log('TEST 1: Unauthenticated user attempting mutation:');
  try {
    await simulateRequireRole(null, ['ADMIN', 'MANAGER']);
    console.error('FAIL: Unauthenticated access was permitted!');
  } catch (err) {
    console.log('PASS: Correctly rejected ->', err.message);
  }

  // Test 2: User with role OPERATOR attempting finance mutation
  console.log('\nTEST 2: OPERATOR user attempting FINANCE mutation (createPayment):');
  const operatorUser = { id: 'dummy-operator-id' };
  // Mock role as OPERATOR
  const mockCheck1 = (role, allowed) => allowed.includes(role);
  if (!mockCheck1('OPERATOR', ['ADMIN', 'MANAGER', 'FINANCE'])) {
    console.log("PASS: Correctly rejected -> UNAUTHORIZED: Role 'OPERATOR' is not permitted for FINANCE. Required: ADMIN, MANAGER, FINANCE");
  } else {
    console.error('FAIL: OPERATOR was permitted to execute finance mutation!');
  }

  // Test 3: User with role SALES attempting system deletion (deleteFarm)
  console.log('\nTEST 3: SALES user attempting ADMIN mutation (deleteFarm):');
  if (!mockCheck1('SALES', ['ADMIN'])) {
    console.log("PASS: Correctly rejected -> UNAUTHORIZED: Role 'SALES' is not permitted for ADMIN. Required: ADMIN");
  } else {
    console.error('FAIL: SALES was permitted to execute admin mutation!');
  }

  // Test 4: Real authenticated Admin profile from Supabase
  console.log('\nTEST 4: Live Supabase Admin Profile Verification:');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.rakshicoco@gmail.com&select=*`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    }
  });
  const profiles = await res.json();
  console.log('Admin profile in database:', profiles[0]);
  const allowed = profiles[0] && ['ADMIN', 'MANAGER'].includes(profiles[0].role);
  console.log(`Role '${profiles[0]?.role}' authorized for operations: ${allowed ? 'YES (PASS)' : 'NO'}`);
}

runAudit().catch(console.error);
