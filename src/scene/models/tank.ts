import * as THREE from 'three';
import { M } from './materials';
import { box, cyl, shadowify, trackPair, tube } from './helpers';
import type { ModelBuild } from './types';

export function buildTank(): ModelBuild {
  const g = new THREE.Group();

  trackPair(g, 3.5, 0.52, 0.5, 0.95, 0.3);

  // hull
  box(1.95, 0.42, 3.2, M.hull, 0, 0.72, 0, g);
  const glacis = box(1.95, 0.4, 0.9, M.hull, 0, 0.83, 1.6, g);
  glacis.rotation.x = -0.6;
  box(1.95, 0.28, 0.42, M.hullDark, 0, 0.68, -1.62, g);

  for (const side of [-1, 1]) {
    box(0.06, 0.3, 3.0, M.hullLight, side * 0.985, 0.68, 0, g);
    // headlight
    const light = cyl(0.04, 0.04, 0.05, 8, M.glowGold, side * 0.55, 0.86, 1.98, g);
    light.rotation.x = Math.PI / 2;
  }

  // turret
  const turret = new THREE.Group();
  turret.position.set(0, 1.05, -0.18);
  g.add(turret);

  box(1.34, 0.4, 1.5, M.hull, 0, 0, 0, turret);
  const turretFront = box(1.34, 0.34, 0.55, M.hull, 0, -0.01, 0.93, turret);
  turretFront.rotation.x = -0.35;
  box(0.44, 0.28, 0.32, M.hullDark, 0, 0.01, 1.19, turret);

  tube(0.07, 2.0, 10, M.metal, 0, 0.01, 2.0, turret);
  tube(0.11, 0.24, 8, M.dark, 0, 0.01, 3.0, turret);

  // cupola + hatch
  cyl(0.27, 0.29, 0.16, 12, M.hullDark, 0.33, 0.27, -0.32, turret);
  cyl(0.2, 0.2, 0.05, 12, M.hullLight, 0.33, 0.37, -0.32, turret);

  // commander sight
  box(0.16, 0.13, 0.2, M.dark, -0.37, 0.26, 0.15, turret);
  const lens = cyl(0.045, 0.045, 0.03, 8, M.glass, -0.37, 0.26, 0.26, turret);
  lens.rotation.x = Math.PI / 2;

  // smoke launchers
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const tubeMesh = cyl(0.035, 0.035, 0.16, 6, M.dark, side * (0.5 + i * 0.01), 0.14, 0.72, turret);
      tubeMesh.rotation.x = -0.6;
      tubeMesh.position.x = side * (0.36 + i * 0.13);
    }
    box(0.02, 0.09, 0.66, M.accent, side * 0.677, 0.02, -0.1, turret);
  }

  // antenna
  const antenna = cyl(0.012, 0.012, 0.9, 5, M.dark, -0.55, 0.52, -0.55, turret);
  antenna.rotation.z = 0.18;

  // gold unit strip on the glacis
  box(1.1, 0.026, 0.026, M.gold, 0, 0.98, 2.02, g);

  shadowify(g);
  return { object: g };
}
