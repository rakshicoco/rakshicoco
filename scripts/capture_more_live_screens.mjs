import { execSync } from 'child_process';

const ADB = 'C:\\Users\\RITHISH\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const ARTIFACT_DIR = 'C:\\Users\\RITHISH\\.gemini\\antigravity-ide\\brain\\25c8d6a0-98a6-4453-836a-94680bdd32ca';

async function getTarget() {
  const res = await fetch('http://127.0.0.1:9223/json');
  const list = await res.json();
  const target = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!target) throw new Error('No inspectable WebView target found!');
  return target;
}

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000);
    const handler = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      } catch (e) {}
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function captureScreen(ws, path, filename) {
  console.log(`Navigating to ${path}...`);
  await sendCommand(ws, 'Page.navigate', { url: `https://rakshicoco.vercel.app${path}` });
  await sleep(4000);
  execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/${filename}`);
  execSync(`"${ADB}" -s emulator-5554 pull /sdcard/${filename} "${ARTIFACT_DIR}\\${filename}"`);
  console.log(`Saved ${filename}`);
}

async function run() {
  const target = await getTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  await captureScreen(ws, '/dashboard/sales', 'build16_sales_live.png');
  await captureScreen(ws, '/dashboard/bills', 'build16_bills_live.png');
  await captureScreen(ws, '/dashboard/buyer-payments', 'build16_payments_live.png');
  await captureScreen(ws, '/dashboard/transport', 'build16_transport_live.png');
  await captureScreen(ws, '/dashboard/stock', 'build16_stock_live.png');
  await captureScreen(ws, '/dashboard/pnl', 'build16_pnl_live.png');

  ws.close();
  console.log('All remaining live screens captured successfully!');
}

run().catch(console.error);
