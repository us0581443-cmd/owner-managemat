const { spawn } = require('child_process');

let child = null;
let restartTimeout = null;

function startTunnel() {
  console.log('[Tunnel Watchdog] Starting localtunnel with subdomain smart-trams-give...');
  
  child = spawn('npx.cmd', ['-y', 'localtunnel', '--port', '5000', '--subdomain', 'smart-trams-give'], {
    shell: true,
    stdio: 'pipe'
  });

  child.stdout.on('data', (data) => {
    const text = data.toString().trim();
    console.log('[Tunnel stdout]:', text);
  });

  child.stderr.on('data', (data) => {
    console.error('[Tunnel stderr]:', data.toString().trim());
  });

  child.on('close', (code) => {
    console.log(`[Tunnel Watchdog] localtunnel exited with code ${code}. Reconnecting in 1.5s...`);
    child = null;
    clearTimeout(restartTimeout);
    restartTimeout = setTimeout(startTunnel, 1500);
  });

  child.on('error', (err) => {
    console.error('[Tunnel Watchdog] Process error:', err);
    child = null;
    clearTimeout(restartTimeout);
    restartTimeout = setTimeout(startTunnel, 1500);
  });
}

// Keep-alive heartbeat: ping the health check every 20 seconds to prevent idle timeout
setInterval(async () => {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/health');
    if (res.ok) {
      // Local backend is alive
    }
  } catch (e) {
    // Backend ping error
  }

  // Also ping through localtunnel to keep TCP socket active
  try {
    await fetch('https://smart-trams-give.loca.lt/api/health', {
      headers: { 'Bypass-Tunnel-Reminder': 'true' }
    });
  } catch (e) {
    // Ignore ping network glitches
  }
}, 20000);

startTunnel();
