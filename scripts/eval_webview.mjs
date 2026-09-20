async function runEval(expr) {
  const port = process.env.DEVTOOLS_PORT || 9225;
  const res = await fetch(`http://127.0.0.1:${port}/json`);
  const targets = await res.json();
  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) {
    console.error('No page target found');
    return;
  }
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  return new Promise((resolve, reject) => {
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: expr, returnByValue: true, awaitPromise: true }
      }));
    });
    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.id === 1) {
        ws.close();
        resolve(data.result);
      }
    });
    ws.addEventListener('error', reject);
  });
}

export { runEval };

if (process.argv[1] && process.argv[1].endsWith('eval_webview.mjs')) {
  const expr = process.argv[2] || 'window.location.href';
  runEval(expr).then(res => console.log('Result:', JSON.stringify(res, null, 2))).catch(console.error);
}
