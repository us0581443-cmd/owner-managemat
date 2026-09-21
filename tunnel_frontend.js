const localtunnel = require('./backend/node_modules/localtunnel');

const PORT = 3000;
const DESIRED_SUBDOMAIN = 'nest-pms-live-9921';

let activeTunnel = null;
let isConnecting = false;
let consecutiveFailures = 0;

async function startTunnel() {
  if (isConnecting) return;
  isConnecting = true;

  if (activeTunnel) {
    try { activeTunnel.close(); } catch (e) {}
    activeTunnel = null;
  }

  console.log(`[Frontend Tunnel] Requesting subdomain "${DESIRED_SUBDOMAIN}" on port ${PORT}...`);

  try {
    const tunnel = await localtunnel({
      port: PORT,
      subdomain: DESIRED_SUBDOMAIN
    });

    activeTunnel = tunnel;
    isConnecting = false;
    consecutiveFailures = 0;
    console.log(`[Frontend Tunnel] >>> CONNECTED: ${tunnel.url} <<<`);

    tunnel.on('close', () => {
      console.warn('[Frontend Tunnel] Connection closed. Reconnecting in 4s...');
      setTimeout(startTunnel, 4000);
    });

    tunnel.on('error', (err) => {
      console.error('[Frontend Tunnel] Socket error:', err ? err.message : 'Unknown');
      try { tunnel.close(); } catch (e) {}
      setTimeout(startTunnel, 4000);
    });

  } catch (err) {
    console.error('[Frontend Tunnel] Connect error:', err ? err.message : 'Unknown');
    isConnecting = false;
    setTimeout(startTunnel, 5000);
  }
}

// Keep-alive heartbeat ping every 20 seconds
setInterval(async () => {
  if (!activeTunnel || !activeTunnel.url) return;
  try {
    const res = await fetch(activeTunnel.url, {
      headers: { 'Bypass-Tunnel-Reminder': 'true' }
    });
    if (res.status === 200) {
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
    }
  } catch (err) {
    consecutiveFailures++;
  }

  if (consecutiveFailures >= 3) {
    console.error('[Frontend Tunnel Heartbeat] Re-establishing tunnel...');
    consecutiveFailures = 0;
    startTunnel();
  }
}, 20000);

startTunnel();
