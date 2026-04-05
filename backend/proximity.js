const PROXIMITY_RADIUS = 120;
const GRID_CELL_SIZE = 200;

function getDistance(pos1, pos2) {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getGridKey(x, y) {
  const gx = Math.floor(x / GRID_CELL_SIZE);
  const gy = Math.floor(y / GRID_CELL_SIZE);
  return `${gx},${gy}`;
}

function getNeighborKeys(x, y) {
  const gx = Math.floor(x / GRID_CELL_SIZE);
  const gy = Math.floor(y / GRID_CELL_SIZE);
  const neighbors = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      neighbors.push(`${gx + dx},${gy + dy}`);
    }
  }
  return neighbors;
}

class ProximityManager {
  constructor() {
    this.users = new Map();
    this.grid = new Map();
    this.connections = new Map();
  }

  addUser(userId, userData) {
    const gridKey = getGridKey(userData.x, userData.y);
    this.users.set(userId, { ...userData, id: userId, gridKey });
    this._addToGrid(userId, gridKey);
  }

  removeUser(userId) {
    const user = this.users.get(userId);
    if (!user) return [];
    this._removeFromGrid(userId, user.gridKey);
    this.users.delete(userId);
    const removed = [];
    for (const key of this.connections.keys()) {
      if (key.includes(userId)) {
        const [a, b] = key.split(':');
        removed.push({ a, b });
        this.connections.delete(key);
      }
    }
    return removed;
  }

  updatePosition(userId, x, y) {
    const user = this.users.get(userId);
    if (!user) return { added: [], removed: [] };
    const oldGridKey = user.gridKey;
    const newGridKey = getGridKey(x, y);
    user.x = x;
    user.y = y;
    if (oldGridKey !== newGridKey) {
      this._removeFromGrid(userId, oldGridKey);
      user.gridKey = newGridKey;
      this._addToGrid(userId, newGridKey);
    }
    return this._checkProximityChanges(userId);
  }

  _addToGrid(userId, gridKey) {
    if (!this.grid.has(gridKey)) this.grid.set(gridKey, new Set());
    this.grid.get(gridKey).add(userId);
  }

  _removeFromGrid(userId, gridKey) {
    const cell = this.grid.get(gridKey);
    if (cell) {
      cell.delete(userId);
      if (cell.size === 0) this.grid.delete(gridKey);
    }
  }

  _connectionKey(a, b) {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  _checkProximityChanges(userId) {
    const user = this.users.get(userId);
    if (!user) return { added: [], removed: [] };
    const neighborKeys = getNeighborKeys(user.x, user.y);
    const nearbyUserIds = new Set();
    for (const key of neighborKeys) {
      const cell = this.grid.get(key);
      if (cell) {
        for (const otherId of cell) {
          if (otherId !== userId) nearbyUserIds.add(otherId);
        }
      }
    }
    const added = [];
    const removed = [];
    for (const key of this.connections.keys()) {
      if (key.includes(userId)) {
        const [a, b] = key.split(':');
        const otherId = a === userId ? b : a;
        const other = this.users.get(otherId);
        if (!other) continue;
        if (getDistance(user, other) >= PROXIMITY_RADIUS) {
          this.connections.delete(key);
          removed.push({ a: userId, b: otherId });
        }
      }
    }
    for (const otherId of nearbyUserIds) {
      const other = this.users.get(otherId);
      if (!other) continue;
      const connKey = this._connectionKey(userId, otherId);
      if (this.connections.has(connKey)) continue;
      if (getDistance(user, other) < PROXIMITY_RADIUS) {
        this.connections.set(connKey, true);
        added.push({ a: userId, b: otherId });
      }
    }
    return { added, removed };
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  getRoomId(a, b) {
    return `room:${this._connectionKey(a, b)}`;
  }
}

module.exports = { ProximityManager, PROXIMITY_RADIUS };