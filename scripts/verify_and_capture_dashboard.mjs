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

  let found = false;
  for (let i = 0; i < 10; i++) {
    console.log(`Attempt ${i + 1}: Navigating to Dashboard...`);
    await send('Page.navigate', { url: 'https://rakshicoco.vercel.app/dashboard' });
    await new Promise(r => setTimeout(r, 6000));

    const text = await evaluate('document.body.innerText');
    console.log('Snippet:', text.substring(0, 300));
    if (text.includes('800 nuts')) {
      console.log('SUCCESS: Dashboard shows 800 nuts!');
      found = true;
      break;
    }
    console.log('Waiting 10s for Vercel deployment to propagate...');
    await new Promise(r => setTimeout(r, 10000));
  }

  execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/build20_dashboard_reconciled.png`);
  execSync(`"${ADB}" -s emulator-5554 pull /sdcard/build20_dashboard_reconciled.png "${ARTIFACT_DIR}\\build20_dashboard_reconciled.png"`);
  console.log('Saved build20_dashboard_reconciled.png');

  ws.close();
}

run().catch(console.error);
