const PROXIMITY_RADIUS = 120;
const GRID_CELL_SIZE = 200;
const REQUEST_TIMEOUT_MS = 15000;

function getDistance(pos1, pos2) {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getCellKey(x, y) {
  const cellX = Math.floor(x / GRID_CELL_SIZE);
  const cellY = Math.floor(y / GRID_CELL_SIZE);
  return `${cellX}:${cellY}`;
}

function getNeighborKeys(x, y) {
  const cellX = Math.floor(x / GRID_CELL_SIZE);
  const cellY = Math.floor(y / GRID_CELL_SIZE);
  const keys = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      keys.push(`${cellX + dx}:${cellY + dy}`);
    }
  }

  return keys;
}

class ProximityManager {
  constructor() {
    this.users = new Map();
    this.grid = new Map();
    this.connections = new Map();
    this.pendingRequests = new Map();
    this.nearbyPairs = new Set();
  }

  _connectionKey(a, b) {
    return [a, b].sort().join(':');
  }

  addUser(user) {
    this.users.set(user.id, user);
    this._addToGrid(user);
  }

  removeUser(userId) {
    const user = this.users.get(userId);

    if (!user) {
      return {
        removedConnections: [],
        canceledRequests: []
      };
    }

    this._removeFromGrid(user);
    this.users.delete(userId);

    const removedConnections = [];
    const canceledRequests = [];

    for (const [key] of this.connections) {
      if (key.includes(userId)) {
        const otherId = key.split(':').find((id) => id !== userId);
        removedConnections.push({
          userId,
          otherId
        });
        this.connections.delete(key);
      }
    }

    for (const [requestId, request] of this.pendingRequests) {
      if (request.from === userId || request.to === userId) {
        clearTimeout(request.timer);
        canceledRequests.push({
          requestId,
          from: request.from,
          to: request.to
        });
        this.pendingRequests.delete(requestId);
      }
    }

    for (const pair of this.nearbyPairs) {
      if (pair.includes(userId)) {
        this.nearbyPairs.delete(pair);
      }
    }

    return {
      removedConnections,
      canceledRequests
    };
  }

  updatePosition(userId, x, y) {
    const user = this.users.get(userId);

    if (!user) {
      return {
        added: [],
        removed: [],
        canceledRequests: []
      };
    }

    this._removeFromGrid(user);

    user.x = x;
    user.y = y;

    this._addToGrid(user);

    return this._checkProximityChanges(userId);
  }

  _addToGrid(user) {
    const key = getCellKey(user.x, user.y);

    if (!this.grid.has(key)) {
      this.grid.set(key, new Set());
    }

    this.grid.get(key).add(user.id);
  }

  _removeFromGrid(user) {
    const key = getCellKey(user.x, user.y);
    const cell = this.grid.get(key);

    if (!cell) return;

    cell.delete(user.id);

    if (cell.size === 0) {
      this.grid.delete(key);
    }
  }

  addPendingRequest(from, to, onTimeout) {
    const requestId = `req:${this._connectionKey(from, to)}:${Date.now()}`;

    const timer = setTimeout(() => {
      const request = this.pendingRequests.get(requestId);

      if (!request) return;

      this.pendingRequests.delete(requestId);

      onTimeout(requestId, from, to);
    }, REQUEST_TIMEOUT_MS);

    this.pendingRequests.set(requestId, {
      from,
      to,
      timer
    });

    return requestId;
  }

  getPendingRequest(requestId) {
    return this.pendingRequests.get(requestId);
  }

  removePendingRequest(requestId) {
    const request = this.pendingRequests.get(requestId);

    if (!request) return null;

    clearTimeout(request.timer);
    this.pendingRequests.delete(requestId);

    return request;
  }

  hasPendingRequest(a, b) {
    const key = this._connectionKey(a, b);

    for (const [, request] of this.pendingRequests) {
      if (this._connectionKey(request.from, request.to) === key) {
        return true;
      }
    }

    return false;
  }

  confirmConnection(a, b) {
    const key = this._connectionKey(a, b);
    this.connections.set(key, true);
  }

  removeConnection(a, b) {
    const key = this._connectionKey(a, b);
    this.connections.delete(key);
  }

  areConnected(a, b) {
    return this.connections.has(this._connectionKey(a, b));
  }

  _checkProximityChanges(userId) {
    const user = this.users.get(userId);

    if (!user) {
      return {
        added: [],
        removed: [],
        canceledRequests: []
      };
    }

    const neighborKeys = getNeighborKeys(user.x, user.y);
    const nearbyUserIds = new Set();

    for (const key of neighborKeys) {
      const cell = this.grid.get(key);

      if (!cell) continue;

      for (const otherId of cell) {
        if (otherId !== userId) {
          nearbyUserIds.add(otherId);
        }
      }
    }

    const added = [];
    const removed = [];
    const canceledRequests = [];

    for (const otherId of nearbyUserIds) {
      const other = this.users.get(otherId);

      if (!other) continue;

      const pairKey = this._connectionKey(userId, otherId);
      const distance = getDistance(user, other);
      const isNearby = distance < PROXIMITY_RADIUS;
      const wasNearby = this.nearbyPairs.has(pairKey);

      if (isNearby && !wasNearby) {
        this.nearbyPairs.add(pairKey);

        if (
          !this.connections.has(pairKey) &&
          !this.hasPendingRequest(userId, otherId)
        ) {
          added.push({
            a: userId,
            b: otherId
          });
        }
      }

      if (!isNearby && wasNearby) {
        this.nearbyPairs.delete(pairKey);

        if (this.connections.has(pairKey)) {
          this.connections.delete(pairKey);

          removed.push({
            a: userId,
            b: otherId
          });
        }

        for (const [requestId, request] of this.pendingRequests) {
          if (this._connectionKey(request.from, request.to) === pairKey) {
            clearTimeout(request.timer);
            this.pendingRequests.delete(requestId);

            canceledRequests.push({
              requestId,
              from: request.from,
              to: request.to
            });
          }
        }
      }
    }

    const currentNeighborPairs = new Set();

    for (const otherId of nearbyUserIds) {
      const other = this.users.get(otherId);

      if (!other) continue;

      const pairKey = this._connectionKey(userId, otherId);

      if (getDistance(user, other) < PROXIMITY_RADIUS) {
        currentNeighborPairs.add(pairKey);
      }
    }

    for (const pairKey of this.nearbyPairs) {
      if (!pairKey.includes(userId)) continue;

      if (!currentNeighborPairs.has(pairKey)) {
        this.nearbyPairs.delete(pairKey);

        if (this.connections.has(pairKey)) {
          this.connections.delete(pairKey);

          const [a, b] = pairKey.split(':');

          removed.push({
            a,
            b
          });
        }
      }
    }

    return {
      added,
      removed,
      canceledRequests
    };
  }
}

module.exports = {
  ProximityManager,
  PROXIMITY_RADIUS,
  GRID_CELL_SIZE,
  REQUEST_TIMEOUT_MS,
  getDistance
};