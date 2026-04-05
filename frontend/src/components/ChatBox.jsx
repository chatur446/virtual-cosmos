import { useState, useRef, useEffect } from 'react';

export function ChatBox({ connections, messages, self, sendMessage }) {
  const [input, setInput] = useState('');
  const [activeRoomId, setActiveRoomId] = useState(null);
  const messagesEndRef = useRef(null);

  const connectionList = Array.from(connections.values());
  const isOpen = connectionList.length > 0;

  useEffect(() => {
    if (connectionList.length > 0) {
      if (!activeRoomId || !connectionList.find((c) => c.roomId === activeRoomId)) {
        setActiveRoomId(connectionList[0].roomId);
      }
    } else {
      setActiveRoomId(null);
    }
  }, [connections]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const roomMessages = messages.filter((m) => m.roomId === activeRoomId);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !activeRoomId) return;
    sendMessage(activeRoomId, text);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 320,
        maxHeight: 420,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(5, 2, 20, 0.92)',
        border: '1px solid rgba(96, 165, 250, 0.3)',
        borderRadius: 12,
        boxShadow: '0 0 30px rgba(96, 165, 250, 0.15)',
        backdropFilter: 'blur(12px)',
        fontFamily: 'Syne, sans-serif',
        animation: 'fadeInUp 0.3s ease',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(96, 165, 250, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#34d399',
          boxShadow: '0 0 8px #34d399',
          animation: 'pulse 2s infinite',
        }} />
        <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em' }}>
          PROXIMITY CHAT
        </span>
        <span style={{ marginLeft: 'auto', color: '#60a5fa', fontSize: 11 }}>
          {connectionList.length} connected
        </span>
      </div>

      {/* Tabs */}
      {connectionList.length > 1 && (
        <div style={{
          display: 'flex',
          gap: 4,
          padding: '6px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          overflowX: 'auto',
        }}>
          {connectionList.map(({ user, roomId }) => (
            <button
              key={roomId}
              onClick={() => setActiveRoomId(roomId)}
              style={{
                padding: '3px 10px',
                borderRadius: 20,
                border: 'none',
                background: activeRoomId === roomId ? user.color || '#60a5fa' : 'rgba(255,255,255,0.08)',
                color: activeRoomId === roomId ? '#000' : '#94a3b8',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {user.name}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 160,
        maxHeight: 220,
      }}>
        {roomMessages.length === 0 ? (
          <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
            You are in range. Say hello! 👋
          </div>
        ) : (
          roomMessages.map((msg, i) => {
            const isSelf = msg.from === self?.id;
            return (
              <div key={i} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isSelf ? 'flex-end' : 'flex-start',
              }}>
                {!isSelf && (
                  <span style={{ color: msg.color || '#60a5fa', fontSize: 10, marginBottom: 2, fontWeight: 600 }}>
                    {msg.name}
                  </span>
                )}
                <div style={{
                  padding: '6px 10px',
                  borderRadius: isSelf ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: isSelf ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${isSelf ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: '#e2e8f0',
                  fontSize: 13,
                  maxWidth: '85%',
                  wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        gap: 8,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message..."
          maxLength={200}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(96,165,250,0.2)',
            borderRadius: 8,
            padding: '7px 12px',
            color: '#e2e8f0',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'Syne, sans-serif',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            padding: '7px 14px',
            borderRadius: 8,
            border: 'none',
            background: input.trim() ? '#3b82f6' : 'rgba(255,255,255,0.06)',
            color: input.trim() ? '#fff' : '#475569',
            cursor: input.trim() ? 'pointer' : 'default',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}