const http = require('http');
const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/queue.socket');

async function start() {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`API running on http://localhost:${env.port} and http://127.0.0.1:${env.port}`);
  });
}

start();
