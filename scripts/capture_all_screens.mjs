import { execSync } from 'child_process';

const ADB = 'C:\\Users\\RITHISH\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const ARTIFACT_DIR = 'C:\\Users\\RITHISH\\.gemini\\antigravity-ide\\brain\\25c8d6a0-98a6-4453-836a-94680bdd32ca';

const SCREENS = [
  { name: 'build16_dashboard', path: '/dashboard', label: 'Dashboard' },
  { name: 'build16_farms', path: '/dashboard/farms', label: 'Farms Mobile Card Layout' },
  { name: 'build16_purchases', path: '/dashboard/purchases', label: 'Purchases Mobile Card Layout' },
  { name: 'build16_sales', path: '/dashboard/sales', label: 'Sales Orders Mobile Card Layout' },
  { name: 'build16_bills', path: '/dashboard/bills', label: 'Bills Mobile Card Layout' },
  { name: 'build16_payments', path: '/dashboard/buyer-payments', label: 'Payments Mobile Card Layout' },
  { name: 'build16_transport', path: '/dashboard/transport', label: 'Transport Mobile Card Layout' },
  { name: 'build16_pnl', path: '/dashboard/pnl', label: 'P&L Mobile Layout' },
  { name: 'build16_new_farm', path: '/dashboard/farms/new', label: 'New Farm Form' },
  { name: 'build16_new_purchase', path: '/dashboard/purchases/new', label: 'New Purchase Form' },
  { name: 'build16_new_sale', path: '/dashboard/sales/new', label: 'New Sale Form' },
  { name: 'build16_new_payment', path: '/dashboard/buyer-payments/new', label: 'New Payment Form' },
  { name: 'build16_new_transport', path: '/dashboard/transport/new', label: 'New Transport Form' },
  { name: 'build16_final_dashboard', path: '/dashboard', label: 'Final Production APK Dashboard' }
];

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

async function main() {
  console.log('Connecting to WebView via DevTools...');
  const target = await getTarget();
  console.log(`Target: ${target.title} (${target.url})`);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  console.log('WebSocket connected successfully!\n');

  const results = [];

  for (const screen of SCREENS) {
    const fullUrl = `https://rakshicoco.vercel.app${screen.path}`;
    console.log(`Navigating to [${screen.label}] -> ${fullUrl}`);
    
    await sendCommand(ws, 'Page.navigate', { url: fullUrl });
    await sleep(3500); // Allow Next.js page to render completely

    // Check document dimensions and horizontal overflow
    const evalRes = await sendCommand(ws, 'Runtime.evaluate', {
      expression: `({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
        url: window.location.href,
        title: document.title,
        overflow: document.documentElement.scrollWidth > window.innerWidth
      })`,
      returnByValue: true
    });

    const info = evalRes.result?.value || {};
    console.log(`-> Loaded: ${info.url}`);
    console.log(`-> Dimensions: scrollWidth=${info.scrollWidth}px, innerWidth=${info.innerWidth}px, Overflow=${info.overflow ? 'YES (FAIL)' : 'NO (PASS)'}`);

    // Capture screenshot via ADB
    const remotePng = `/sdcard/${screen.name}.png`;
    const localPng = `${ARTIFACT_DIR}\\${screen.name}.png`;
    try {
      execSync(`"${ADB}" -s emulator-5554 shell screencap -p ${remotePng}`);
      execSync(`"${ADB}" -s emulator-5554 pull ${remotePng} "${localPng}"`);
      console.log(`-> Saved screenshot: ${screen.name}.png\n`);
    } catch (err) {
      console.error(`-> Error capturing screenshot:`, err.message);
    }

    results.push({
      screen: screen.label,
      path: screen.path,
      overflow: info.overflow ? 'FAIL' : 'PASS',
      scrollWidth: info.scrollWidth,
      innerWidth: info.innerWidth
    });
  }

  ws.close();

  console.log('=== MOBILE RESPONSIVE VERIFICATION MATRIX ===');
  console.table(results);
}

main().catch(console.error);
