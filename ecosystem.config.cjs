module.exports = {
  apps: [
    {
      name: 'zeduno-frontend',
      script: 'npm',
      args: 'run dev:frontend',
      cwd: '/home/osbui/applications/zeduno/dine-serve-hub',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'zeduno-backend',
      script: 'npm',
      args: 'run dev:backend', 
      cwd: '/home/osbui/applications/zeduno/dine-serve-hub',
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
