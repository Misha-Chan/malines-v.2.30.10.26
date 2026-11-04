import fs from 'node:fs';
import { all } from './db.js';

const region = Number(process.argv[2] ?? 4);
const out = process.argv[3] ?? `region${region}.geojson`;

const rows = all<Record<string, unknown>>('SELECT * FROM provinces WHERE region_id = ? ORDER BY id', region);

const features = rows.map((row) => ({
  type: 'Feature' as const,
  properties: {
    id: row.id,
    name: row.name,
    name_ar: row.name_ar,
    owner: row.owner_id,
    sea: row.is_sea === 1,
    population: row.population,
    terrain: row.terrain,
  },
  geometry: row.geometry ? JSON.parse(String(row.geometry)) : null,
}));

fs.writeFileSync(
  out,
  JSON.stringify({ type: 'FeatureCollection', features }, null, 1),
  'utf8',
);
console.log(`wrote ${features.length} features to ${out}`);
