const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { ProximityManager, PROXIMITY_RADIUS, REQUEST_TIMEOUT_MS } = require('./proximity');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const proximity = new ProximityManager();

const COLORS = [
  '#60a5fa', '#f472b6', '#34d399', '#fbbf24',
  '#a78bfa', '#fb7185', '#38bdf8', '#4ade80',
];

let colorIndex = 0;

io.on('connection', (socket) => {
  console.log(`[+] User connected: ${socket.id}`);

  const color = COLORS[(colorIndex++) % COLORS.length];
  const userData = {
    id: socket.id,
    name: `Voyager_${socket.id.slice(0, 4)}`,
    x: 400 + Math.random() * 1200,
    y: 300 + Math.random() * 600,
    color,
    isNPC: false,
  };

  proximity.addUser(socket.id, userData);

  socket.emit('init', {
    self: userData,
    users: proximity.getAllUsers(),
    proximityRadius: PROXIMITY_RADIUS,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
  });

  socket.broadcast.emit('user:join', userData);

  // ─── Movement ───────────────────────────────────────────────────────────────
  socket.on('move', ({ x, y }) => {
    const { added, removed, canceledRequests } = proximity.updatePosition(socket.id, x, y);

    // New proximity entries → send connection requests
    for (const { a, b } of added) {
      // A is always the mover; B receives the request
      const requester = proximity.getUser(a);
      const target = proximity.getUser(b);
      if (!requester || !target) continue;

      // Determine who gets the request: the *other* person (not the mover)
      // Actually we always send from mover (a) to the other (b)
      const requestId = proximity.addPendingRequest(a, b, (reqId, from, to) => {
        // Timeout handler — auto deny
        const fromUser = proximity.getUser(from);
        io.to(from).emit('connection:denied', {
          requestId: reqId,
          byId: to,
          byName: proximity.getUser(to)?.name || 'Unknown',
          reason: 'timeout',
        });
        io.to(to).emit('connection:request:expired', { requestId: reqId });
      });

      // Send request to B
      io.to(b).emit('connection:request', {
        requestId,
        from: { id: requester.id, name: requester.name, color: requester.color },
      });

      // Tell A that a request was sent
      io.to(a).emit('connection:request:sent', {
        requestId,
        to: { id: target.id, name: target.name, color: target.color },
      });
    }

    // Out of range → disconnect confirmed connections
    for (const { a, b } of removed) {
      const roomId = proximity.getRoomId(a, b);
      const socketA = io.sockets.sockets.get(a);
      const socketB = io.sockets.sockets.get(b);
      if (socketA) socketA.leave(roomId);
      if (socketB) socketB.leave(roomId);
      io.to(a).emit('proximity:disconnect', { with: b, roomId });
      io.to(b).emit('proximity:disconnect', { with: a, roomId });
    }

    // Canceled pending requests (moved out of range before responding)
    for (const { reqId, from, to } of canceledRequests) {
      io.to(from).emit('connection:request:canceled', { requestId: reqId, byId: to });
      io.to(to).emit('connection:request:canceled', { requestId: reqId, byId: from });
    }
  });

  // ─── Connection request response ────────────────────────────────────────────
  socket.on('connection:respond', ({ requestId, accept }) => {
    const req = proximity.resolvePendingRequest(requestId);
    if (!req) return; // already expired or resolved

    const { from, to } = req;

    if (accept) {
      // Confirm connection
      proximity.confirmConnection(from, to);
      const roomId = proximity.getRoomId(from, to);

      const socketFrom = io.sockets.sockets.get(from);
      const socketTo = io.sockets.sockets.get(to);
      if (socketFrom) socketFrom.join(roomId);
      if (socketTo) socketTo.join(roomId);

      const userFrom = proximity.getUser(from);
      const userTo = proximity.getUser(to);

      io.to(from).emit('proximity:connect', { with: userTo, roomId });
      io.to(to).emit('proximity:connect', { with: userFrom, roomId });
    } else {
      // Denied
      const denier = proximity.getUser(to);
      io.to(from).emit('connection:denied', {
        requestId,
        byId: to,
        byName: denier?.name || 'Unknown',
        reason: 'denied',
      });
      // Flash red signal to the requester's canvas
      io.to(from).emit('connection:flash', { userId: to });
    }
  });

  // ─── Messaging ──────────────────────────────────────────────────────────────
  socket.on('message', ({ roomId, text }) => {
    if (!text || !roomId || text.length > 500) return;
    const user = proximity.getUser(socket.id);
    if (!user) return;
    io.to(roomId).emit('message', {
      from: socket.id,
      name: user.name,
      color: user.color,
      text,
      roomId,
      timestamp: Date.now(),
    });
  });

  // ─── Name change ────────────────────────────────────────────────────────────
  socket.on('setName', (name) => {
    const user = proximity.getUser(socket.id);
    if (!user || !name || name.length > 20) return;
    user.name = name.replace(/[<>]/g, '').trim() || user.name;
    io.emit('user:update', { id: socket.id, name: user.name });
  });

  // ─── Disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] User disconnected: ${socket.id}`);
    proximity.removeUser(socket.id);
    socket.broadcast.emit('user:leave', socket.id);
  });
});

// Broadcast all positions every 50ms
setInterval(() => {
  io.emit('world:update', proximity.getAllUsers());
}, 50);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🌌 Virtual Cosmos server running on port ${PORT}`);
});