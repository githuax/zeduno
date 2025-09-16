module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './backend',
      script: 'src/server.ts',
      interpreter: 'node',
      interpreter_args: '-r ts-node/register',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      watch: true,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      max_memory_restart: '1G'
    },
    {
      name: 'frontend',
      script: 'pm2-frontend.js',
      cwd: './',
      env: {
        NODE_ENV: 'development'
      },
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
