import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [self, setSelf] = useState(null);
  const [users, setUsers] = useState([]);
  const [proximityRadius, setProximityRadius] = useState(120);
  const [requestTimeoutMs, setRequestTimeoutMs] = useState(15000);
  const [connections, setConnections] = useState(new Map());
  const [messages, setMessages] = useState([]);

  // Incoming request: someone wants to connect with ME
  const [incomingRequest, setIncomingRequest] = useState(null);
  // { requestId, from: { id, name, color } }

  // Outgoing request: I sent a request, waiting for response
  const [outgoingRequest, setOutgoingRequest] = useState(null);
  // { requestId, to: { id, name, color } }

  // Denial notification: my request was denied or timed out
  const [denial, setDenial] = useState(null);
  // { byId, byName, reason }

  // Flash effect: a user ID to flash red on canvas
  const [flashUserId, setFlashUserId] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('init', ({ self, users, proximityRadius, requestTimeoutMs }) => {
      setSelf(self);
      setUsers(users);
      setProximityRadius(proximityRadius);
      if (requestTimeoutMs) setRequestTimeoutMs(requestTimeoutMs);
    });

    socket.on('world:update', (allUsers) => setUsers(allUsers));

    socket.on('user:join', (user) => {
      setUsers((prev) => {
        if (prev.find((u) => u.id === user.id)) return prev;
        return [...prev, user];
      });
    });

    socket.on('user:leave', (userId) => {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setConnections((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
      // Clear any requests involving this user
      setIncomingRequest((prev) => (prev?.from?.id === userId ? null : prev));
      setOutgoingRequest((prev) => (prev?.to?.id === userId ? null : prev));
    });

    socket.on('user:update', ({ id, name }) => {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, name } : u)));
      setSelf((prev) => (prev?.id === id ? { ...prev, name } : prev));
    });

    // ── Connection request events ──────────────────────────────────────────────

    // Someone entered MY range and wants to connect
    socket.on('connection:request', ({ requestId, from }) => {
      setIncomingRequest({ requestId, from });
    });

    // I moved into someone's range — my request was sent
    socket.on('connection:request:sent', ({ requestId, to }) => {
      setOutgoingRequest({ requestId, to });
    });

    // Request expired (target didn't respond in time) — shown to target
    socket.on('connection:request:expired', ({ requestId }) => {
      setIncomingRequest((prev) => (prev?.requestId === requestId ? null : prev));
    });

    // Request was canceled (one of us moved out of range)
    socket.on('connection:request:canceled', ({ requestId }) => {
      setIncomingRequest((prev) => (prev?.requestId === requestId ? null : prev));
      setOutgoingRequest((prev) => (prev?.requestId === requestId ? null : prev));
    });

    // My request was denied or timed out
    socket.on('connection:denied', ({ requestId, byId, byName, reason }) => {
      setOutgoingRequest((prev) => (prev?.requestId === requestId ? null : prev));
      setDenial({ byId, byName, reason });
      // Auto-clear denial notification after 3 seconds
      setTimeout(() => setDenial(null), 3000);
    });

    // Flash a user red on canvas (they denied me)
    socket.on('connection:flash', ({ userId }) => {
      setFlashUserId(userId);
      setTimeout(() => setFlashUserId(null), 1000);
    });

    // ── Confirmed proximity events ─────────────────────────────────────────────

    socket.on('proximity:connect', ({ with: other, roomId }) => {
      setOutgoingRequest(null);
      setIncomingRequest(null);
      setConnections((prev) => {
        const next = new Map(prev);
        next.set(other.id, { user: other, roomId });
        return next;
      });
    });

    socket.on('proximity:disconnect', ({ with: otherId }) => {
      setConnections((prev) => {
        const next = new Map(prev);
        next.delete(otherId);
        return next;
      });
    });

    socket.on('message', (msg) => {
      setMessages((prev) => [...prev.slice(-99), msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emitMove = useCallback((x, y) => {
    socketRef.current?.emit('move', { x, y });
  }, []);

  const sendMessage = useCallback((roomId, text) => {
    socketRef.current?.emit('message', { roomId, text });
  }, []);

  const setName = useCallback((name) => {
    sessionStorage.setItem('cosmos_name', name);
    socketRef.current?.emit('setName', name);
    setSelf((prev) => (prev ? { ...prev, name } : prev));
    setUsers((prev) =>
      prev.map((u) => (u.id === socketRef.current?.id ? { ...u, name } : u))
    );
  }, []);

  const respondToRequest = useCallback((requestId, accept) => {
    socketRef.current?.emit('connection:respond', { requestId, accept });
    setIncomingRequest(null);
  }, []);

  return {
    connected,
    self,
    users,
    proximityRadius,
    requestTimeoutMs,
    connections,
    messages,
    incomingRequest,
    outgoingRequest,
    denial,
    flashUserId,
    emitMove,
    sendMessage,
    setName,
    respondToRequest,
  };
}