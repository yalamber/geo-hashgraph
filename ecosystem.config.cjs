module.exports = {
  apps: [
    {
      name: 'chat-graph-agent',
      script: './src/server/agent.ts',
      interpreter: 'node',
      interpreterArgs: '--experimental-strip-types --env-file=.env',
      instances: 1,
      autorestart: true,
      watch: false,
      error_file: '/dev/null',
      out_file: '/dev/null',
      max_memory_restart: '900M',
    },
  ],
};
