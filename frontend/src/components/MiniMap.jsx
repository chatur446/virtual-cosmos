export function MiniMap({ users, self, pos }) {
  const WORLD_W = 2000;
  const WORLD_H = 1200;
  const MAP_W = 160;
  const MAP_H = 96;
  const scaleX = MAP_W / WORLD_W;
  const scaleY = MAP_H / WORLD_H;

  return (
    <div style={{
      position: 'absolute',
      bottom: 16,
      left: 16,
      width: MAP_W,
      height: MAP_H,
      background: 'rgba(2, 0, 8, 0.85)',
      border: '1px solid rgba(96, 165, 250, 0.2)',
      borderRadius: 8,
      overflow: 'hidden',
      backdropFilter: 'blur(8px)',
    }}>
      {/* Label */}
      <div style={{
        position: 'absolute',
        top: 3,
        left: 6,
        fontSize: 8,
        color: 'rgba(148,163,184,0.6)',
        fontFamily: 'Orbitron, sans-serif',
        letterSpacing: '0.1em',
        zIndex: 10,
      }}>
        COSMOS MAP
      </div>

      {/* Users */}
      {users.map((user) => {
        const isSelf = user.id === self?.id;
        const ux = (isSelf ? pos.x : user.x) * scaleX;
        const uy = (isSelf ? pos.y : user.y) * scaleY;

        return (
          <div
            key={user.id}
            style={{
              position: 'absolute',
              left: ux - (isSelf ? 4 : 2),
              top: uy - (isSelf ? 4 : 2),
              width: isSelf ? 8 : 4,
              height: isSelf ? 8 : 4,
              borderRadius: '50%',
              background: user.color || '#60a5fa',
              boxShadow: isSelf ? `0 0 6px ${user.color}` : 'none',
              opacity: user.isNPC ? 0.6 : 1,
            }}
          />
        );
      })}

      {/* Viewport indicator */}
      <div style={{
        position: 'absolute',
        left: ((pos?.x || 1000) - 400) * scaleX,
        top: ((pos?.y || 600) - 240) * scaleY,
        width: 800 * scaleX,
        height: 480 * scaleY,
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 2,
        pointerEvents: 'none',
      }} />
    </div>
  );
}