module.exports = {
  apps: [
    {
      name: 'badenya-api',
      script: 'dist/index.js',
      cwd: '/opt/apps/badenya/backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5054
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // Restart delay
      min_uptime: '10s',
      max_restarts: 10,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Auto restart on file changes (disabled in production)
      autorestart: true,
      // Cron restart (restart at 3 AM daily)
      cron_restart: '0 3 * * *',
      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100
    }
  ]
};
