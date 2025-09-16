module.exports = {
  apps: [{
    name: 'backend',
    script: 'src/server.ts',
    interpreter: 'node',
    interpreter_args: '-r ts-node/register',
    env: {
      NODE_ENV: 'development'
    },
    watch: true,
    ignore_watch: ['node_modules', 'logs', 'dist'],
    max_memory_restart: '1G'
  }]
};