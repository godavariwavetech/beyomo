(async () => {
  const targets = await (await fetch('http://localhost:8085/json/list')).json();
  if (!targets.length) throw Error('Partner app is still starting');
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  const timer = setTimeout(() => { ws.close(); process.exit(1); }, 12000);
  ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
    expression: "fetch('http://localhost:3000/health').then(async r => ({status:r.status,body:await r.text()})).catch(e => ({error:String(e)}))",
    awaitPromise: true, returnByValue: true,
  } }));
  ws.onmessage = e => {
    const message = JSON.parse(e.data);
    if (message.id === 1) {
      console.log(JSON.stringify(message.result));
      clearTimeout(timer); ws.close();
    }
  };
})().catch(error => { console.error(error.message); process.exit(1); });
