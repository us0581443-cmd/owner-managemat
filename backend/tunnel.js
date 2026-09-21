const localtunnel = require('localtunnel');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const DESIRED_SUBDOMAIN = process.env.SUBDOMAIN || 'smart-trams-give';

let activeTunnel = null;
let isConnecting = false;
let consecutiveFailures = 0;

async function startTunnel() {
  if (isConnecting) return;
  isConnecting = true;

  if (activeTunnel) {
    try {
      activeTunnel.close();
    } catch (e) {}
    activeTunnel = null;
  }

  console.log(`[Tunnel] Requesting subdomain "${DESIRED_SUBDOMAIN}" on port ${PORT}...`);

  try {
    const tunnel = await localtunnel({
      port: PORT,
      subdomain: DESIRED_SUBDOMAIN
    });

    if (tunnel.url !== `https://${DESIRED_SUBDOMAIN}.loca.lt`) {
      console.warn(`[Tunnel] Warning: got "${tunnel.url}" instead of "https://${DESIRED_SUBDOMAIN}.loca.lt". Retrying in 5s...`);
      try { tunnel.close(); } catch (e) {}
      isConnecting = false;
      setTimeout(startTunnel, 12000);
      return;
    }

    activeTunnel = tunnel;
    isConnecting = false;
    consecutiveFailures = 0;
    console.log(`[Tunnel] >>> CONNECTED SUCCESSFULLY to ${tunnel.url} <<<`);

    tunnel.on('close', () => {
      console.warn('[Tunnel] Connection closed by remote host. Reconnecting in 4s...');
      setTimeout(startTunnel, 4000);
    });

    tunnel.on('error', (err) => {
      console.error('[Tunnel] Socket error:', err ? err.message : 'Unknown');
      try { tunnel.close(); } catch (e) {}
      setTimeout(startTunnel, 4000);
    });

  } catch (err) {
    console.error('[Tunnel] Connect error:', err ? err.message : 'Unknown');
    isConnecting = false;
    setTimeout(startTunnel, 5000);
  }
}

// Gentle keep-alive ping every 25 seconds
setInterval(async () => {
  if (!activeTunnel || !activeTunnel.url) return;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(`${activeTunnel.url}/api/health`, {
      headers: { 'Bypass-Tunnel-Reminder': 'true' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.status === 200) {
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      console.warn(`[Tunnel Heartbeat] Warning: HTTP ${res.status} (${consecutiveFailures}/3)`);
    }
  } catch (err) {
    consecutiveFailures++;
    console.warn(`[Tunnel Heartbeat] Ping error: ${err.message} (${consecutiveFailures}/3)`);
  }

  if (consecutiveFailures >= 3) {
    console.error('[Tunnel Heartbeat] 3 failed pings. Re-establishing tunnel...');
    consecutiveFailures = 0;
    startTunnel();
  }
}, 25000);

process.on('SIGINT', () => {
  if (activeTunnel) activeTunnel.close();
  process.exit();
});

process.on('SIGTERM', () => {
  if (activeTunnel) activeTunnel.close();
  process.exit();
});

startTunnel();
