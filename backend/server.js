const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { ProximityManager, PROXIMITY_RADIUS } = require('./proximity');

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
  });

  socket.broadcast.emit('user:join', userData);

  socket.on('move', ({ x, y }) => {
    const { added, removed } = proximity.updatePosition(socket.id, x, y);

    for (const { a, b } of added) {
      const roomId = proximity.getRoomId(a, b);
      const userA = proximity.getUser(a);
      const userB = proximity.getUser(b);
      const socketA = io.sockets.sockets.get(a);
      const socketB = io.sockets.sockets.get(b);
      if (socketA) socketA.join(roomId);
      if (socketB) socketB.join(roomId);
      io.to(a).emit('proximity:connect', { with: userB, roomId });
      io.to(b).emit('proximity:connect', { with: userA, roomId });
    }

    for (const { a, b } of removed) {
      const roomId = proximity.getRoomId(a, b);
      const socketA = io.sockets.sockets.get(a);
      const socketB = io.sockets.sockets.get(b);
      if (socketA) socketA.leave(roomId);
      if (socketB) socketB.leave(roomId);
      io.to(a).emit('proximity:disconnect', { with: b, roomId });
      io.to(b).emit('proximity:disconnect', { with: a, roomId });
    }
  });

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

  socket.on('setName', (name) => {
    const user = proximity.getUser(socket.id);
    if (!user || !name || name.length > 20) return;
    user.name = name.replace(/[<>]/g, '').trim() || user.name;
    io.emit('user:update', { id: socket.id, name: user.name });
  });

  socket.on('disconnect', () => {
    console.log(`[-] User disconnected: ${socket.id}`);
    proximity.removeUser(socket.id);
    socket.broadcast.emit('user:leave', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🌌 Virtual Cosmos server running on port ${PORT}`);
});