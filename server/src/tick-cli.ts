import { seedIfEmpty, worldStats } from './seed.js';
import { runTick } from './tick.js';

seedIfEmpty();
const result = runTick();
console.log(
  JSON.stringify(
    {
      gameTime: result.gameTime,
      daysAdvanced: Number(result.daysAdvanced.toFixed(2)),
      snapshot: result.snapshot,
      world: worldStats(),
    },
    null,
    2,
  ),
);
