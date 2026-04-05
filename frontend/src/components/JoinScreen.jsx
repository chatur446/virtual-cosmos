import { useState } from 'react';

export function JoinScreen({ onJoin }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim());
    }
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: '#020008',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: 36,
        fontWeight: 900,
        color: '#60a5fa',
        letterSpacing: '0.2em',
        marginBottom: 8,
      }}>
        ✦ VIRTUAL COSMOS
      </div>

      {/* Tagline */}
    <div style={{
        fontFamily: 'Syne, sans-serif',
        color: '#334155',
        fontSize: 13,
        letterSpacing: '0.2em',
        marginBottom: 48,
    }}>
        A REAL&#8209;TIME MULTIPLAYER UNIVERSE
    </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        width: 300,
      }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          color: '#64748b',
          fontSize: 12,
          letterSpacing: '0.15em',
          alignSelf: 'flex-start',
        }}>
          CHOOSE YOUR NAME
        </div>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name..."
          maxLength={20}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(96,165,250,0.3)',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#e2e8f0',
            fontSize: 15,
            fontFamily: 'Syne, sans-serif',
            outline: 'none',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}
        />

        <button
          type="submit"
          disabled={!name.trim()}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 10,
            border: 'none',
            background: name.trim() ? '#3b82f6' : 'rgba(255,255,255,0.05)',
            color: name.trim() ? '#fff' : '#334155',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.15em',
            cursor: name.trim() ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
        >
          ENTER COSMOS
        </button>
      </form>

      {/* Stars hint */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        fontFamily: 'Syne, sans-serif',
        color: '#1e293b',
        fontSize: 11,
        letterSpacing: '0.1em',
      }}>
        USE WASD OR ARROW KEYS TO MOVE • APPROACH OTHERS TO CHAT
      </div>
    </div>
  );
}