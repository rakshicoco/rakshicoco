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

  const screens = [
    { url: 'https://rakshicoco.vercel.app/dashboard', name: 'build19_dashboard_reconciled.png', wait: 3500 },
    { url: 'https://rakshicoco.vercel.app/dashboard/bills', name: 'build19_bills_reconciled.png', wait: 3500 },
    { url: 'https://rakshicoco.vercel.app/dashboard/bills/f613efd9-2e8a-4a50-85f1-35ec45cc132e', name: 'build19_invoice_detail_reconciled.png', wait: 3500 },
    { url: 'https://rakshicoco.vercel.app/dashboard/receivables', name: 'build19_receivables_reconciled.png', wait: 3500 },
    { url: 'https://rakshicoco.vercel.app/dashboard/pnl', name: 'build19_pnl_reconciled.png', wait: 3500 },
  ];

  for (const s of screens) {
    console.log(`Navigating to ${s.url}...`);
    await send('Page.navigate', { url: s.url });
    await new Promise(r => setTimeout(r, s.wait));
    execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/${s.name}`);
    execSync(`"${ADB}" -s emulator-5554 pull /sdcard/${s.name} "${ARTIFACT_DIR}\\${s.name}"`);
    console.log(`Saved ${s.name}`);
  }

  ws.close();
}

run().catch(console.error);
