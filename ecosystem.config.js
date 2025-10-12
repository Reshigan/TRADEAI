module.exports = {
  apps: [
    {
      name: 'tradeai-backend',
      script: './backend/src/server.js',
      cwd: '/var/www/tradeai',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      log_file: '/var/log/tradeai/backend.log',
      error_file: '/var/log/tradeai/backend-error.log',
      out_file: '/var/log/tradeai/backend-out.log',
      time: true,
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
