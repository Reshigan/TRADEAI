module.exports = {
  apps: [{
    name: 'tradeai-backend',
    script: './server-production.js',
    cwd: '/opt/tradeai/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      MONGODB_URI: 'mongodb://localhost:27017/tradeai',
      CORS_ORIGIN: 'https://tradeai.gonxt.tech,http://localhost:5173',
      JWT_SECRET: 'b8f9e2c4d6a1f3e5c7b9d2e4f6a8c1e3d5b7c9e1f3a5c7e9b1d3f5a7c9e1b3d5',
      JWT_EXPIRES_IN: '24h',
      JWT_REFRESH_SECRET: 'c9e1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3d5b7c9e1f3a5c7e9b1d3f5a7c9e1',
      JWT_REFRESH_EXPIRES_IN: '7d'
    }
  }]
};
