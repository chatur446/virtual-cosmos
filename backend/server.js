const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const {
  ProximityManager,
  PROXIMITY_RADIUS,
  REQUEST_TIMEOUT_MS
} = require('./proximity');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*'
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const proximity = new ProximityManager();

const COLORS = [
  '#60a5fa',
  '#f472b6',
  '#34d399',
  '#fbbf24',
  '#a78bfa',
  '#fb7185',
  '#38bdf8',
  '#4ade80'
];

let colorIndex = 0;

io.on('connection', (socket) => {
  console.log(`[+] User connected: ${socket.id}`);

  const color = COLORS[colorIndex++ % COLORS.length];

  const userData = {
    id: socket.id,
    name: `Voyager_${socket.id.slice(0, 4)}`,
    x: 400 + Math.random() * 1200,
    y: 300 + Math.random() * 600,
    color,
    isNPC: false
  };

  proximity.addUser(userData);

  socket.emit('init', {
    self: userData,
    users: proximity.getAllUsers(),
    proximityRadius: PROXIMITY_RADIUS,
    requestTimeoutMs: REQUEST_TIMEOUT_MS
  });

  socket.broadcast.emit('user:join', userData);

  socket.on('move', ({ x, y }) => {
    if (typeof x !== 'number' || typeof y !== 'number') {
      return;
    }

    const result = proximity.updatePosition(socket.id, x, y);

    const { added, removed, canceledRequests } = result;

    if (added.length > 0) {
      console.log(
        `[PROXIMITY] ${socket.id} entered range of:`,
        added
      );
    }

    for (const { a, b } of added) {
      const requester = proximity.getUser(a);
      const target = proximity.getUser(b);

      if (!requester || !target) {
        continue;
      }

      const requestId = proximity.addPendingRequest(
        a,
        b,
        (reqId, from, to) => {
          const targetUser = proximity.getUser(to);

          io.to(from).emit('connection:denied', {
            requestId: reqId,
            byId: to,
            byName: targetUser?.name || 'Unknown',
            reason: 'timeout'
          });

          io.to(to).emit('connection:request:expired', {
            requestId: reqId
          });
        }
      );

      console.log('[REQUEST SENT]', {
        requestId,
        from: requester.id,
        to: target.id
      });

      io.to(b).emit('connection:request', {
        requestId,
        from: {
          id: requester.id,
          name: requester.name,
          color: requester.color
        }
      });

      io.to(a).emit('connection:request:sent', {
        requestId,
        to: {
          id: target.id,
          name: target.name,
          color: target.color
        }
      });
    }

    for (const { a, b } of removed) {
      const roomId = proximity.getRoomId(a, b);

      const socketA = io.sockets.sockets.get(a);
      const socketB = io.sockets.sockets.get(b);

      if (socketA) {
        socketA.leave(roomId);
      }

      if (socketB) {
        socketB.leave(roomId);
      }

      io.to(a).emit('proximity:disconnect', {
        with: b,
        roomId
      });

      io.to(b).emit('proximity:disconnect', {
        with: a,
        roomId
      });
    }

    for (const { requestId, from, to } of canceledRequests) {
      io.to(from).emit('connection:request:canceled', {
        requestId,
        byId: to
      });

      io.to(to).emit('connection:request:canceled', {
        requestId,
        byId: from
      });
    }
  });

  socket.on('connection:respond', ({ requestId, accept }) => {
    const request = proximity.removePendingRequest(requestId);

    if (!request) {
      return;
    }

    const { from, to } = request;

    const fromUser = proximity.getUser(from);
    const toUser = proximity.getUser(to);

    if (!fromUser || !toUser) {
      return;
    }

    if (!proximity.areConnected(from, to)) {
      const distance = Math.sqrt(
        Math.pow(toUser.x - fromUser.x, 2) +
        Math.pow(toUser.y - fromUser.y, 2)
      );

      if (distance >= PROXIMITY_RADIUS) {
        io.to(from).emit('connection:denied', {
          requestId,
          byId: to,
          byName: toUser.name,
          reason: 'out_of_range'
        });

        return;
      }
    }

    if (accept) {
      proximity.confirmConnection(from, to);

      const roomId = proximity.getRoomId(from, to);

      const socketFrom = io.sockets.sockets.get(from);
      const socketTo = io.sockets.sockets.get(to);

      if (socketFrom) {
        socketFrom.join(roomId);
      }

      if (socketTo) {
        socketTo.join(roomId);
      }

      io.to(from).emit('proximity:connect', {
        with: toUser,
        roomId
      });

      io.to(to).emit('proximity:connect', {
        with: fromUser,
        roomId
      });
    } else {
      io.to(from).emit('connection:denied', {
        requestId,
        byId: to,
        byName: toUser.name,
        reason: 'denied'
      });

      io.to(from).emit('connection:flash', {
        userId: to
      });
    }
  });

  socket.on('message', ({ roomId, text }) => {
    if (!text || !roomId || text.length > 500) {
      return;
    }

    const user = proximity.getUser(socket.id);

    if (!user) {
      return;
    }

    io.to(roomId).emit('message', {
      from: socket.id,
      name: user.name,
      color: user.color,
      text,
      roomId,
      timestamp: Date.now()
    });
  });

  socket.on('setName', (name) => {
    const user = proximity.getUser(socket.id);

    if (!user || !name || name.length > 20) {
      return;
    }

    user.name = name.replace(/[<>]/g, '').trim() || user.name;

    io.emit('user:update', {
      id: socket.id,
      name: user.name
    });
  });

  socket.on('disconnect', () => {
    console.log(`[-] User disconnected: ${socket.id}`);

    const result = proximity.removeUser(socket.id);

    for (const { userId, otherId } of result.removedConnections) {
      const roomId = proximity.getRoomId(userId, otherId);

      const otherSocket = io.sockets.sockets.get(otherId);

      if (otherSocket) {
        otherSocket.leave(roomId);
      }

      io.to(otherId).emit('proximity:disconnect', {
        with: userId,
        roomId
      });
    }

    for (const { requestId, from, to } of result.canceledRequests) {
      io.to(from).emit('connection:request:canceled', {
        requestId,
        byId: to
      });

      io.to(to).emit('connection:request:canceled', {
        requestId,
        byId: from
      });
    }

    socket.broadcast.emit('user:leave', socket.id);
  });
});

setInterval(() => {
  io.emit('world:update', proximity.getAllUsers());
}, 50);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🌌 Virtual Cosmos server running on port ${PORT}`);
});