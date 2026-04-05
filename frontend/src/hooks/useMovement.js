import { useEffect, useRef, useState, useCallback } from 'react';

const SPEED = 4;
const WORLD_W = 2000;
const WORLD_H = 1200;
const EMIT_INTERVAL = 50;

export function useMovement(initialPos, emitMove) {
  const posRef = useRef(initialPos || { x: 1000, y: 600 });
  const [pos, setPos] = useState(posRef.current);
  const keysRef = useRef(new Set());
  const lastEmitRef = useRef(0);
  const rafRef = useRef(null);
  const joystickRef = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    if (initialPos && !posRef.current._initialized) {
      posRef.current = { ...initialPos, _initialized: true };
      setPos(initialPos);
    }
  }, [initialPos]);

  useEffect(() => {
    const onKeyDown = (e) => {
      keysRef.current.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e) => keysRef.current.delete(e.code);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const setJoystick = useCallback((dx, dy) => {
    joystickRef.current = { dx, dy };
  }, []);

  useEffect(() => {
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);

      const keys = keysRef.current;
      const joy = joystickRef.current;

      let dx = joy.dx * SPEED;
      let dy = joy.dy * SPEED;

      if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= SPEED;
      if (keys.has('KeyS') || keys.has('ArrowDown')) dy += SPEED;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= SPEED;
      if (keys.has('KeyD') || keys.has('ArrowRight')) dx += SPEED;

      if (dx !== 0 || dy !== 0) {
        if (dx !== 0 && dy !== 0) {
          const len = Math.sqrt(dx * dx + dy * dy);
          dx = (dx / len) * SPEED;
          dy = (dy / len) * SPEED;
        }

        const newX = Math.max(40, Math.min(WORLD_W - 40, posRef.current.x + dx));
        const newY = Math.max(40, Math.min(WORLD_H - 40, posRef.current.y + dy));
        posRef.current = { ...posRef.current, x: newX, y: newY };
        setPos({ x: newX, y: newY });

        const now = Date.now();
        if (now - lastEmitRef.current >= EMIT_INTERVAL) {
          emitMove(newX, newY);
          lastEmitRef.current = now;
        }
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [emitMove]);

  return { pos, setJoystick };
}