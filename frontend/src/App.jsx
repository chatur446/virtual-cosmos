import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useMovement } from './hooks/useMovement';
import { GameCanvas } from './components/GameCanvas';
import { ChatBox } from './components/ChatBox';
import { MiniMap } from './components/MiniMap';
import { HUD } from './components/HUD';
import { JoinScreen } from './components/JoinScreen';
import './index.css';

export default function App() {
  const [enteredName, setEnteredName] = useState(null);

  const {
    connected,
    self,
    users,
    proximityRadius,
    connections,
    messages,
    emitMove,
    sendMessage,
    setName,
  } = useSocket();

  const { pos } = useMovement(
    self ? { x: self.x, y: self.y } : null,
    emitMove
  );

  const handleJoin = (name) => {
    setEnteredName(name);
    setName(name);
  };

  // Show join screen first
  if (!enteredName) {
    return <JoinScreen onJoin={handleJoin} />;
  }

  // Show loading while waiting for server
  if (!self) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        background: '#020008',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 32,
          fontWeight: 700,
          color: '#60a5fa',
          letterSpacing: '0.2em',
          marginBottom: 24,
          animation: 'pulse 2s infinite',
        }}>
          ✦ VIRTUAL COSMOS
        </div>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          color: '#334155',
          fontSize: 13,
          letterSpacing: '0.2em',
        }}>
          ENTERING THE COSMOS...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      background: '#020008',
    }}>
      {/* Game world */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <GameCanvas
          self={self}
          users={users}
          proximityRadius={proximityRadius}
          connections={connections}
          pos={pos}
        />
      </div>

      {/* HUD */}
      <HUD
        self={self}
        users={users}
        connections={connections}
        connected={connected}
        pos={pos}
        setName={setName}
      />

      {/* Chat */}
      <ChatBox
        connections={connections}
        messages={messages}
        self={self}
        sendMessage={sendMessage}
      />

      {/* Minimap */}
      <MiniMap
        users={users}
        self={self}
        pos={pos}
      />
    </div>
  );
}