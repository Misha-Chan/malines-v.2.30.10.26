import { HOST, PORT, TICK_MINUTES, TICK_SECONDS } from './config.js';
import { seedIfEmpty, worldStats } from './seed.js';
import { latestSnapshot } from './snapshot.js';
import { buildServer } from './server.js';
import { runTick } from './tick.js';

const seeded = seedIfEmpty();
if (seeded) console.log('[seed] minimal 1900 world created');

if (!latestSnapshot()) {
  const result = runTick();
  console.log(`[tick] initial snapshot ${result.snapshot.id} at ${result.gameTime}`);
}

console.log('[world]', worldStats());

const app = buildServer();
await app.listen({ port: PORT, host: HOST });
console.log(`[server] http://${HOST}:${PORT}`);

const intervalMs = TICK_SECONDS > 0 ? TICK_SECONDS * 1000 : TICK_MINUTES * 60 * 1000;
console.log(`[tick] every ${TICK_SECONDS > 0 ? `${TICK_SECONDS}s (dev)` : `${TICK_MINUTES}min`}`);

setInterval(() => {
  try {
    const result = runTick(TICK_SECONDS > 0 ? TICK_SECONDS / 60 : TICK_MINUTES);
    console.log(`[tick] ${result.snapshot.id} gameTime=${result.gameTime}`);
  } catch (error) {
    console.error('[tick] failed', error);
  }
}, intervalMs);

process.on('SIGINT', async () => {
  console.log('[server] shutting down');
  await app.close();
  process.exit(0);
});
