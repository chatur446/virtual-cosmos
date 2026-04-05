import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

const WORLD_W = 2000;
const WORLD_H = 1200;
const STAR_COUNT = 200;

function hexToNum(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

function createStarfield(container) {
  const stars = new PIXI.Graphics();
  for (let i = 0; i < STAR_COUNT; i++) {
    const x = Math.random() * WORLD_W;
    const y = Math.random() * WORLD_H;
    const r = Math.random() * 1.5 + 0.3;
    const alpha = Math.random() * 0.8 + 0.2;
    stars.beginFill(0xffffff, alpha);
    stars.drawCircle(x, y, r);
    stars.endFill();
  }
  container.addChild(stars);

  for (let i = 0; i < 8; i++) {
    const g = new PIXI.Graphics();
    const colors = [0x1a0a3a, 0x0a1a3a, 0x0a3a1a, 0x2a0a1a];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const x = Math.random() * WORLD_W;
    const y = Math.random() * WORLD_H;
    const rx = 80 + Math.random() * 200;
    const ry = 60 + Math.random() * 150;
    g.beginFill(color, 0.3);
    g.drawEllipse(x, y, rx, ry);
    g.endFill();
    container.addChildAt(g, 0);
  }
}

export function GameCanvas({ self, users, proximityRadius, connections, pos }) {
  const mountRef = useRef(null);
  const appRef = useRef(null);
  const worldRef = useRef(null);
  const avatarsRef = useRef(new Map());
  const selfIdRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || appRef.current) return;

    const app = new PIXI.Application({
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: 0x020008,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    container.appendChild(app.view);
    appRef.current = app;

    const world = new PIXI.Container();
    app.stage.addChild(world);
    worldRef.current = world;

    const bg = new PIXI.Graphics();
    bg.beginFill(0x020008);
    bg.drawRect(0, 0, WORLD_W, WORLD_H);
    bg.endFill();
    world.addChild(bg);

    createStarfield(world);

    const grid = new PIXI.Graphics();
    grid.lineStyle(1, 0x1a1040, 0.3);
    for (let x = 0; x <= WORLD_W; x += 100) {
      grid.moveTo(x, 0); grid.lineTo(x, WORLD_H);
    }
    for (let y = 0; y <= WORLD_H; y += 100) {
      grid.moveTo(0, y); grid.lineTo(WORLD_W, y);
    }
    world.addChild(grid);

    const handleResize = () => {
      app.renderer.resize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      app.destroy(true);
      appRef.current = null;
      worldRef.current = null;
      avatarsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (self) selfIdRef.current = self.id;
  }, [self]);

  useEffect(() => {
    const world = worldRef.current;
    if (!world || !users.length) return;

    const connectedIds = new Set(connections.keys());
    const currentIds = new Set(users.map((u) => u.id));

    for (const [id, avatar] of avatarsRef.current) {
      if (!currentIds.has(id)) {
        world.removeChild(avatar.container);
        avatar.container.destroy({ children: true });
        avatarsRef.current.delete(id);
      }
    }

    for (const user of users) {
      const isSelf = user.id === selfIdRef.current;
      const isConnected = connectedIds.has(user.id);
      const color = hexToNum(user.color || '#60a5fa');

      let avatar = avatarsRef.current.get(user.id);

      if (!avatar) {
        const container = new PIXI.Container();

        const ring = new PIXI.Graphics();
        container.addChild(ring);

        const glow = new PIXI.Graphics();
        glow.beginFill(color, 0.15);
        glow.drawCircle(0, 0, 26);
        glow.endFill();
        container.addChild(glow);

        const circle = new PIXI.Graphics();
        circle.beginFill(color, 1);
        circle.lineStyle(2, 0xffffff, 0.6);
        circle.drawCircle(0, 0, 14);
        circle.endFill();
        container.addChild(circle);

        const label = new PIXI.Text(user.name || '?', {
          fontFamily: 'Syne, sans-serif',
          fontSize: 11,
          fill: 0xffffff,
          align: 'center',
        });
        label.anchor.set(0.5, 0);
        label.y = 18;
        container.addChild(label);

        if (isSelf) {
          const selfRing = new PIXI.Graphics();
          selfRing.lineStyle(2, 0xffffff, 0.8);
          selfRing.drawCircle(0, 0, 18);
          container.addChild(selfRing);
        }

        world.addChild(container);
        avatar = { container, circle, ring, glow, label };
        avatarsRef.current.set(user.id, avatar);
      }

      const targetX = isSelf ? pos.x : user.x;
      const targetY = isSelf ? pos.y : user.y;

      if (!isSelf) {
        avatar.container.x += (targetX - avatar.container.x) * 0.15;
        avatar.container.y += (targetY - avatar.container.y) * 0.15;
      } else {
        avatar.container.x = targetX;
        avatar.container.y = targetY;
      }

      avatar.ring.clear();
      if (isConnected || isSelf) {
        avatar.ring.lineStyle(1.5, color, isConnected ? 0.6 : 0.25);
        avatar.ring.drawCircle(0, 0, isSelf ? proximityRadius : 20);
      }

      avatar.circle.alpha = isConnected ? 1 : 0.85;
      avatar.glow.alpha = isConnected ? 0.4 : 0.15;

      if (avatar.label.text !== user.name) {
        avatar.label.text = user.name || '?';
      }
    }
  }, [users, pos, connections, proximityRadius]);

  useEffect(() => {
    const app = appRef.current;
    const world = worldRef.current;
    if (!app || !world || !pos) return;

    const screenW = app.screen.width;
    const screenH = app.screen.height;
    const targetX = screenW / 2 - pos.x;
    const targetY = screenH / 2 - pos.y;
    const minX = screenW - WORLD_W;
    const minY = screenH - WORLD_H;

    world.x += (Math.max(minX, Math.min(0, targetX)) - world.x) * 0.1;
    world.y += (Math.max(minY, Math.min(0, targetY)) - world.y) * 0.1;
  });

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    const tick = () => {
      for (const [id, avatar] of avatarsRef.current) {
        const isSelf = id === selfIdRef.current;
        if (!isSelf) {
          const user = users.find((u) => u.id === id);
          if (user && avatar.container) {
            avatar.container.x += (user.x - avatar.container.x) * 0.12;
            avatar.container.y += (user.y - avatar.container.y) * 0.12;
          }
        }
      }
    };

    app.ticker.add(tick);
    return () => {
      if (appRef.current) {
        appRef.current.ticker.remove(tick);
      }
    };
  }, [users]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ cursor: 'crosshair' }}
    />
  );
}