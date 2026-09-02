// Attaches Socket.io to the same HTTP server as the REST API (see server.js).
// This is the reference for architecture doc §10 Approach B — rooms per
// centre and per farmer, so events never leak across tenants.
//
// Once the queue service exists, call e.g.
//   getIO().to(`centre:${centreId}:queue`).emit('queueUpdated', payload)
// from inside queue.service.js after any status change — never emit
// directly from a controller.

let io = null;

function initSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_ORIGIN || '*' },
  });

  io.on('connection', (socket) => {
    socket.on('joinCentreQueue', (centreId) => {
      socket.join(`centre:${centreId}:queue`);
    });
    socket.on('joinFarmerRoom', (farmerId) => {
      socket.join(`farmer:${farmerId}:token`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized — call initSocket(server) first');
  return io;
}

module.exports = { initSocket, getIO };
