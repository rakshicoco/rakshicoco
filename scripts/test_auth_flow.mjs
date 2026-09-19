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

async function loginAndCapture() {
  const target = await getTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  console.log('Navigating to /login...');
  await sendCommand(ws, 'Page.navigate', { url: 'https://rakshicoco.vercel.app/login' });
  await sleep(3000);

  // Capture login screen
  execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/build16_login_screen.png`);
  execSync(`"${ADB}" -s emulator-5554 pull /sdcard/build16_login_screen.png "${ARTIFACT_DIR}\\build16_login_screen.png"`);
  console.log('Saved build16_login_screen.png');

  // Fill in login form
  console.log('Filling in login form...');
  const fillRes = await sendCommand(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const emailInput = document.getElementById('email');
      const passInput = document.getElementById('password');
      const form = document.querySelector('form');
      if (emailInput && passInput && form) {
        emailInput.value = 'rakshicoco@gmail.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        passInput.value = 'RakshiCoco@2026';
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
        else form.submit();
        return 'SUBMITTED';
      }
      return 'INPUTS_NOT_FOUND';
    })()`,
    returnByValue: true
  });
  console.log('Form submission result:', fillRes.result?.value);

  await sleep(5000); // Wait for auth session and redirect to /dashboard

  // Check current URL and title
  const postLoginRes = await sendCommand(ws, 'Runtime.evaluate', {
    expression: `({ url: window.location.href, title: document.title })`,
    returnByValue: true
  });
  console.log('Post-login state:', postLoginRes.result?.value);

  // Capture authenticated dashboard
  execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/build16_auth_dashboard.png`);
  execSync(`"${ADB}" -s emulator-5554 pull /sdcard/build16_auth_dashboard.png "${ARTIFACT_DIR}\\build16_auth_dashboard.png"`);
  console.log('Saved build16_auth_dashboard.png');

  // Navigate to /dashboard/farms to verify populated test farms
  console.log('Navigating to /dashboard/farms with authenticated session...');
  await sendCommand(ws, 'Page.navigate', { url: 'https://rakshicoco.vercel.app/dashboard/farms' });
  await sleep(4000);

  execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/build16_farms_authenticated.png`);
  execSync(`"${ADB}" -s emulator-5554 pull /sdcard/build16_farms_authenticated.png "${ARTIFACT_DIR}\\build16_farms_authenticated.png"`);
  console.log('Saved build16_farms_authenticated.png');

  // Navigate to /dashboard/purchases to verify populated test purchases
  console.log('Navigating to /dashboard/purchases with authenticated session...');
  await sendCommand(ws, 'Page.navigate', { url: 'https://rakshicoco.vercel.app/dashboard/purchases' });
  await sleep(4000);

  execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/build16_purchases_authenticated.png`);
  execSync(`"${ADB}" -s emulator-5554 pull /sdcard/build16_purchases_authenticated.png "${ARTIFACT_DIR}\\build16_purchases_authenticated.png"`);
  console.log('Saved build16_purchases_authenticated.png');

  ws.close();
}

loginAndCapture().catch(console.error);
