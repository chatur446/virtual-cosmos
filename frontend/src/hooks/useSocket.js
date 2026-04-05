import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [self, setSelf] = useState(null);
  const [users, setUsers] = useState([]);
  const [proximityRadius, setProximityRadius] = useState(120);
  const [connections, setConnections] = useState(new Map());
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('init', ({ self, users, proximityRadius }) => {
      setSelf(self);
      setUsers(users);
      setProximityRadius(proximityRadius);
    });

    socket.on('world:update', (allUsers) => {
      setUsers(allUsers);
    });

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
    });

    socket.on('user:update', ({ id, name }) => {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, name } : u)));
      setSelf((prev) => (prev?.id === id ? { ...prev, name } : prev));
    });

    socket.on('proximity:connect', ({ with: other, roomId }) => {
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
    socketRef.current?.emit('setName', name);
    setSelf((prev) => (prev ? { ...prev, name } : prev));
  }, []);

  return {
    connected,
    self,
    users,
    proximityRadius,
    connections,
    messages,
    emitMove,
    sendMessage,
    setName,
  };
}