import { execSync } from 'child_process';

const ADB = 'C:\\Users\\RITHISH\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const ARTIFACT_DIR = 'C:\\Users\\RITHISH\\.gemini\\antigravity-ide\\brain\\25c8d6a0-98a6-4453-836a-94680bdd32ca';

async function run() {
  const target = await (await fetch('http://127.0.0.1:9223/json')).json();
  const page = target.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  function send(method, params) {
    return new Promise((resolve) => {
      const id = Math.floor(Math.random() * 10000);
      ws.addEventListener('message', function h(e) {
        const d = JSON.parse(e.data);
        if (d.id === id) { ws.removeEventListener('message', h); resolve(d.result); }
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true });
    return res?.result?.value;
  }

  const pages = [
    { url: '/dashboard', name: 'build20_dashboard_800.png' },
    { url: '/dashboard/stock', name: 'build20_stock_800.png' },
    { url: '/dashboard/farms', name: 'build20_farms_2.png' },
    { url: '/dashboard/pnl', name: 'build20_pnl.png' },
    { url: '/dashboard/bills', name: 'build20_bills.png' },
    { url: '/dashboard/purchases', name: 'build20_purchases.png' }
  ];

  for (const p of pages) {
    console.log(`Navigating to ${p.url}...`);
    await send('Page.navigate', { url: 'https://rakshicoco.vercel.app' + p.url });
    await new Promise(r => setTimeout(r, 4500));
    const text = await evaluate('document.body.innerText');
    console.log(`[${p.url}] text snippet:`, text.replace(/\\n+/g, ' ').substring(0, 150));
    execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/${p.name}`);
    execSync(`"${ADB}" -s emulator-5554 pull /sdcard/${p.name} "${ARTIFACT_DIR}\\${p.name}"`);
    console.log(`Saved ${p.name}`);
  }

  ws.close();
}

run().catch(console.error);
