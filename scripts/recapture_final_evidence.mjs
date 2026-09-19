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

  // 1. Dashboard
  console.log('Navigating to Dashboard...');
  await send('Page.navigate', { url: 'https://rakshicoco.vercel.app/dashboard' });
  await new Promise(r => setTimeout(r, 6000));
  execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/build19_dashboard_final.png`);
  execSync(`"${ADB}" -s emulator-5554 pull /sdcard/build19_dashboard_final.png "${ARTIFACT_DIR}\\build19_dashboard_final.png"`);
  console.log('Saved build19_dashboard_final.png');

  // 2. P&L
  console.log('Navigating to P&L...');
  await send('Page.navigate', { url: 'https://rakshicoco.vercel.app/dashboard/pnl' });
  await new Promise(r => setTimeout(r, 6000));
  execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/build19_pnl_final.png`);
  execSync(`"${ADB}" -s emulator-5554 pull /sdcard/build19_pnl_final.png "${ARTIFACT_DIR}\\build19_pnl_final.png"`);
  console.log('Saved build19_pnl_final.png');

  ws.close();
}

run().catch(console.error);
