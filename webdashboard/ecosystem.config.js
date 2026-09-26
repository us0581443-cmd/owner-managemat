module.exports = {
  apps: [{
    name: 'staydesk-web',
    cwd: '/home/admin/domains/staydesk.webscare.app/public_html',
    script: 'server.mjs',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
    },
  }],
};
