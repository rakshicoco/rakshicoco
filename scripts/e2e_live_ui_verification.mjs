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

async function run() {
  console.log('Connecting to Android WebView DevTools on port 9223...');
  const target = await getTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  console.log('WebSocket connected to WebView target:', target.title);

  // 1. Check current URL and content
  let state = await sendCommand(ws, 'Runtime.evaluate', {
    expression: `({ url: window.location.href, title: document.title, html: document.body.innerText.slice(0, 300) })`,
    returnByValue: true
  });
  console.log('Initial WebView state:', state.result?.value);

  // If on /login or needs login:
  if (state.result?.value?.url?.includes('/login')) {
    console.log('On login page, submitting credentials...');
    await sendCommand(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const email = document.getElementById('email');
        const pass = document.getElementById('password');
        const form = document.querySelector('form');
        if (email && pass && form) {
          email.value = 'rakshicoco@gmail.com';
          email.dispatchEvent(new Event('input', { bubbles: true }));
          pass.value = 'RakshiCoco@2026';
          pass.dispatchEvent(new Event('input', { bubbles: true }));
          const btn = form.querySelector('button[type="submit"]');
          if (btn) btn.click();
          else form.submit();
          return 'SUBMITTED';
        }
        return 'FORM_NOT_FOUND';
      })()`,
      returnByValue: true
    });
    await sleep(6000);
  }

  // 2. Navigate to /dashboard and reload to get latest Vercel deployment
  console.log('Navigating to https://rakshicoco.vercel.app/dashboard...');
  await sendCommand(ws, 'Page.navigate', { url: 'https://rakshicoco.vercel.app/dashboard' });
  await sleep(5000);

  // Read Dashboard Text & Numbers
  const dashInfo = await sendCommand(ws, 'Runtime.evaluate', {
    expression: `(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyText: document.body.innerText
      };
    })()`,
    returnByValue: true
  });
  console.log('\n--- DASHBOARD PAGE CONTENT ---');
  console.log(dashInfo.result?.value?.bodyText);
  console.log('-------------------------------\n');

  // Screenshot Dashboard
  execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/build16_dashboard_live.png`);
  execSync(`"${ADB}" -s emulator-5554 pull /sdcard/build16_dashboard_live.png "${ARTIFACT_DIR}\\build16_dashboard_live.png"`);
  console.log('Saved build16_dashboard_live.png');

  // 3. Navigate to /dashboard/farms
  console.log('\nNavigating to /dashboard/farms...');
  await sendCommand(ws, 'Page.navigate', { url: 'https://rakshicoco.vercel.app/dashboard/farms' });
  await sleep(4000);

  const farmsInfo = await sendCommand(ws, 'Runtime.evaluate', {
    expression: `(() => {
      return {
        url: window.location.href,
        bodyText: document.body.innerText,
        cardsCount: document.querySelectorAll('.grid > div').length
      };
    })()`,
    returnByValue: true
  });
  console.log('\n--- FARMS PAGE CONTENT ---');
  console.log(farmsInfo.result?.value?.bodyText);
  console.log('Card elements found:', farmsInfo.result?.value?.cardsCount);
  console.log('---------------------------\n');

  execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/build16_farms_live.png`);
  execSync(`"${ADB}" -s emulator-5554 pull /sdcard/build16_farms_live.png "${ARTIFACT_DIR}\\build16_farms_live.png"`);
  console.log('Saved build16_farms_live.png');

  // 4. Navigate to /dashboard/purchases
  console.log('\nNavigating to /dashboard/purchases...');
  await sendCommand(ws, 'Page.navigate', { url: 'https://rakshicoco.vercel.app/dashboard/purchases' });
  await sleep(4000);

  const purchasesInfo = await sendCommand(ws, 'Runtime.evaluate', {
    expression: `(() => {
      return {
        url: window.location.href,
        bodyText: document.body.innerText
      };
    })()`,
    returnByValue: true
  });
  console.log('\n--- PURCHASES PAGE CONTENT ---');
  console.log(purchasesInfo.result?.value?.bodyText);
  console.log('------------------------------\n');

  execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/build16_purchases_live.png`);
  execSync(`"${ADB}" -s emulator-5554 pull /sdcard/build16_purchases_live.png "${ARTIFACT_DIR}\\build16_purchases_live.png"`);
  console.log('Saved build16_purchases_live.png');

  ws.close();
  console.log('E2E Live UI verification completed successfully!');
}

run().catch(console.error);
