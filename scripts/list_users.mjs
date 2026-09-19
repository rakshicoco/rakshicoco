const SUPABASE_URL = 'https://woligfdwsweiqcxhtdtt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function listUsers() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    }
  });
  const data = await res.json();
  console.log('Total auth users:', data.users?.length);
  data.users?.forEach(u => console.log(` - ID: ${u.id}, Email: ${u.email}`));
}

listUsers().catch(console.error);
