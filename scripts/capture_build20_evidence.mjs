import { execSync } from 'child_process';

const ADB = 'C:\\Users\\RITHISH\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const ARTIFACT_DIR = 'C:\\Users\\RITHISH\\.gemini\\antigravity-ide\\brain\\25c8d6a0-98a6-4453-836a-94680bdd32ca';

async function run() {
  const target = await (await fetch('http://127.0.0.1:9223/json')).json();
  const page = target.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) {
    console.error('No page found');
    return;
  }
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

  // 1. Dashboard
  console.log('Navigating to Dashboard...');
  await send('Page.navigate', { url: 'https://rakshicoco.vercel.app/dashboard' });
  await new Promise(r => setTimeout(r, 6000));
  
  // Extract text content from dashboard
  const bodyText = await evaluate('document.body.innerText');
  console.log('--- DASHBOARD TEXT EXCERPT ---');
  console.log(bodyText.substring(0, 500));

  execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/build20_dashboard.png`);
  execSync(`"${ADB}" -s emulator-5554 pull /sdcard/build20_dashboard.png "${ARTIFACT_DIR}\\build20_dashboard.png"`);
  console.log('Saved build20_dashboard.png');

  // 2. Godown Stock
  console.log('Navigating to Stock...');
  await send('Page.navigate', { url: 'https://rakshicoco.vercel.app/dashboard/stock' });
  await new Promise(r => setTimeout(r, 6000));

  const stockText = await evaluate('document.body.innerText');
  console.log('--- STOCK TEXT EXCERPT ---');
  console.log(stockText.substring(0, 500));

  execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/build20_stock.png`);
  execSync(`"${ADB}" -s emulator-5554 pull /sdcard/build20_stock.png "${ARTIFACT_DIR}\\build20_stock.png"`);
  console.log('Saved build20_stock.png');

  // 3. Farms
  console.log('Navigating to Farms...');
  await send('Page.navigate', { url: 'https://rakshicoco.vercel.app/dashboard/farms' });
  await new Promise(r => setTimeout(r, 6000));

  const farmsText = await evaluate('document.body.innerText');
  console.log('--- FARMS TEXT EXCERPT ---');
  console.log(farmsText.substring(0, 500));

  execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/build20_farms.png`);
  execSync(`"${ADB}" -s emulator-5554 pull /sdcard/build20_farms.png "${ARTIFACT_DIR}\\build20_farms.png"`);
  console.log('Saved build20_farms.png');

  ws.close();
}

run().catch(console.error);
