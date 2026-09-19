const SUPABASE_URL = 'https://woligfdwsweiqcxhtdtt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function getDefinitions() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    }
  });
  const data = await res.json();
  for (const [table, def] of Object.entries(data.definitions || {})) {
    console.log(`\nTable [${table}]:`);
    const props = Object.keys(def.properties || {});
    console.log(' ', props.join(', '));
  }
}

getDefinitions().catch(console.error);
