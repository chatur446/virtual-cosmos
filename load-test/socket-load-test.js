const { io } = require('socket.io-client');

const SERVER_URL =
  process.argv[2] || 'http://localhost:3001';

const CLIENT_COUNT = Number(process.argv[3]) || 10;
const TEST_DURATION_MS = Number(process.argv[4]) || 30000;
const MOVE_INTERVAL_MS = 100;

const clients = [];
const stats = {
  connectionAttempts: 0,
  connections: 0,
  connectionErrors: 0,
  disconnects: 0,
  moveEvents: 0,
  worldUpdates: 0,
  worldUpdateLatencies: []
};

function percentile(values, percentile) {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;

  return sorted[Math.max(0, index)];
}

function average(values) {
  if (!values.length) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function createClient(index) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    stats.connectionAttempts++;

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 10000
    });

    let initialized = false;
    let lastMoveSentAt = 0;

    socket.on('connect', () => {
      stats.connections++;

      socket.on('init', () => {
        initialized = true;

        socket.emit('setName', `LoadTest_${index}`);

        resolve({
          socket,
          get initialized() {
            return initialized;
          },
          get lastMoveSentAt() {
            return lastMoveSentAt;
          },
          set lastMoveSentAt(value) {
            lastMoveSentAt = value;
          }
        });
      });
    });

    socket.on('world:update', () => {
      stats.worldUpdates++;

      if (lastMoveSentAt > 0) {
        const latency = Date.now() - lastMoveSentAt;

        if (latency >= 0 && latency < 5000) {
          stats.worldUpdateLatencies.push(latency);
        }
      }
    });

    socket.on('connect_error', () => {
      stats.connectionErrors++;

      resolve(null);
    });

    socket.on('disconnect', () => {
      stats.disconnects++;
    });

    setTimeout(() => {
      if (!initialized) {
        socket.disconnect();
        resolve(null);
      }
    }, 10000);

    console.log(
      `Connecting client ${index}/${CLIENT_COUNT}...`
    );
  });
}

async function run() {
  console.log('');
  console.log('========================================');
  console.log('Virtual Cosmos Socket.IO Load Test');
  console.log('========================================');
  console.log(`Server: ${SERVER_URL}`);
  console.log(`Clients: ${CLIENT_COUNT}`);
  console.log(`Duration: ${TEST_DURATION_MS / 1000}s`);
  console.log('');

  const startTime = Date.now();

  const results = await Promise.all(
    Array.from(
      { length: CLIENT_COUNT },
      (_, index) => createClient(index + 1)
    )
  );

  for (const result of results) {
    if (result) {
      clients.push(result);
    }
  }

  console.log('');
  console.log(
    `Connected clients: ${clients.length}/${CLIENT_COUNT}`
  );

  if (!clients.length) {
    console.log('No clients connected. Test stopped.');
    process.exit(1);
  }

  const movementTimer = setInterval(() => {
    for (const client of clients) {
      if (!client.socket.connected) continue;

      const x = 400 + Math.random() * 1200;
      const y = 300 + Math.random() * 600;

      client.lastMoveSentAt = Date.now();

      client.socket.emit('move', {
        x,
        y
      });

      stats.moveEvents++;
    }
  }, MOVE_INTERVAL_MS);

  await new Promise((resolve) => {
    setTimeout(resolve, TEST_DURATION_MS);
  });

  clearInterval(movementTimer);

  for (const client of clients) {
    client.socket.disconnect();
  }

  const elapsedSeconds =
    (Date.now() - startTime) / 1000;

  const averageLatency = average(
    stats.worldUpdateLatencies
  );

  const p95Latency = percentile(
    stats.worldUpdateLatencies,
    95
  );

  const p99Latency = percentile(
    stats.worldUpdateLatencies,
    99
  );

  console.log('');
  console.log('========================================');
  console.log('Load Test Results');
  console.log('========================================');
  console.log(`Server: ${SERVER_URL}`);
  console.log(`Requested clients: ${CLIENT_COUNT}`);
  console.log(`Successful connections: ${stats.connections}`);
  console.log(`Connection errors: ${stats.connectionErrors}`);
  console.log(`Disconnects: ${stats.disconnects}`);
  console.log(`Move events sent: ${stats.moveEvents}`);
  console.log(`World updates received: ${stats.worldUpdates}`);
  console.log(
    `Move events/sec: ${(stats.moveEvents / elapsedSeconds).toFixed(2)}`
  );
  console.log(
    `World updates/sec: ${(stats.worldUpdates / elapsedSeconds).toFixed(2)}`
  );
  console.log(
    `Average update latency: ${averageLatency.toFixed(2)} ms`
  );
  console.log(
    `P95 update latency: ${p95Latency.toFixed(2)} ms`
  );
  console.log(
    `P99 update latency: ${p99Latency.toFixed(2)} ms`
  );
  console.log('========================================');
  console.log('');
}

run().catch((error) => {
  console.error('Load test failed:', error);
  process.exit(1);
});