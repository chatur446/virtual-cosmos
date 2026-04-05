import { useState } from 'react';

export function HUD({ self, users, connections, connected, pos, setName }) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setName(nameInput.trim());
    }
    setEditingName(false);
    setNameInput('');
  };

  return (
    <>
      {/* Top bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 52,
        background: 'rgba(2, 0, 8, 0.8)',
        borderBottom: '1px solid rgba(96, 165, 250, 0.15)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 24,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: '#60a5fa',
          letterSpacing: '0.15em',
        }}>
          ✦ VIRTUAL COSMOS
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connected ? '#34d399' : '#ef4444',
            boxShadow: connected ? '0 0 8px #34d399' : 'none',
          }} />
          <span style={{ color: '#64748b', fontSize: 11, fontFamily: 'Syne, sans-serif' }}>
            {connected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>

        {/* User count */}
        <div style={{ color: '#475569', fontSize: 11, fontFamily: 'Syne, sans-serif' }}>
          <span style={{ color: '#94a3b8' }}>{users.length}</span> voyagers in cosmos
        </div>

        <div style={{ flex: 1 }} />

        {/* Self info */}
        {self && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {editingName ? (
              <form onSubmit={handleNameSubmit} style={{ display: 'flex', gap: 6 }}>
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={self.name}
                  maxLength={20}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(96,165,250,0.4)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    color: '#e2e8f0',
                    fontSize: 12,
                    fontFamily: 'Syne, sans-serif',
                    outline: 'none',
                    width: 130,
                  }}
                />
                <button type="submit" style={{
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}>
                  Set
                </button>
              </form>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: self.color,
                  boxShadow: `0 0 10px ${self.color}50`,
                }} />
                <span style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'Syne, sans-serif', fontWeight: 500 }}>
                  {self.name}
                </span>
                <span style={{ color: '#475569', fontSize: 10 }}>✎</span>
              </button>
            )}
          </div>
        )}

        {/* Coords */}
        {pos && (
          <div style={{ color: '#334155', fontSize: 10, fontFamily: 'Orbitron, sans-serif' }}>
            {Math.round(pos.x)}, {Math.round(pos.y)}
          </div>
        )}
      </div>

      {/* Controls hint */}
      <div style={{
        position: 'absolute',
        top: 64,
        left: 16,
        background: 'rgba(2, 0, 8, 0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        padding: '8px 12px',
        fontFamily: 'Syne, sans-serif',
        fontSize: 10,
        color: '#334155',
        lineHeight: 1.8,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ color: '#475569', marginBottom: 4, fontWeight: 600 }}>CONTROLS</div>
        <div>WASD / Arrow keys to move</div>
        <div>Approach others to chat</div>
      </div>

      {/* Proximity notification */}
      {connections.size > 0 && (
        <div style={{
          position: 'absolute',
          top: 64,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(52, 211, 153, 0.1)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          borderRadius: 20,
          padding: '6px 16px',
          fontFamily: 'Syne, sans-serif',
          fontSize: 12,
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backdropFilter: 'blur(8px)',
          animation: 'fadeInDown 0.3s ease',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#34d399',
            boxShadow: '0 0 8px #34d399',
          }} />
          {Array.from(connections.values()).map(c => c.user.name).join(', ')} in range
        </div>
      )}
    </>
  );
}