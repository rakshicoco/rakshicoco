// Using Node 22 built-in WebSocket

async function reload() {
  const res = await fetch('http://127.0.0.1:9223/json');
  const targets = await res.json();
  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) {
    console.error('No page target found');
    return;
  }
  console.log('Connecting to', pageTarget.webSocketDebuggerUrl);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  ws.addEventListener('open', () => {
    console.log('Reloading page...');
    ws.send(JSON.stringify({ id: 1, method: 'Page.reload', params: { ignoreCache: true } }));
    setTimeout(() => {
      ws.close();
      process.exit(0);
    }, 2000);
  });
  ws.addEventListener('message', (event) => {
    console.log('Received:', event.data);
  });
}

reload().catch(console.error);
