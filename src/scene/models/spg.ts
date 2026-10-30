import * as THREE from 'three';
import { M } from './materials';
import { box, cyl, shadowify, trackPair, tube } from './helpers';
import type { ModelBuild } from './types';

export function buildSpg(): ModelBuild {
  const g = new THREE.Group();

  trackPair(g, 3.6, 0.5, 0.48, 0.92, 0.28);

  // hull
  box(1.88, 0.42, 3.3, M.hull, 0, 0.68, 0, g);
  box(1.88, 0.2, 1.1, M.hullDark, 0, 0.92, -1.05, g); // engine deck

  // driver cab
  box(1.7, 0.52, 0.95, M.hull, 0, 1.05, 1.12, g);
  const windshield = box(1.5, 0.34, 0.06, M.glass, 0, 1.22, 1.62, g);
  windshield.rotation.x = -0.25;
  box(1.7, 0.08, 0.95, M.hullLight, 0, 1.35, 1.12, g);

  // gun mount
  const mount = new THREE.Group();
  mount.position.set(0, 1.02, -0.5);
  g.add(mount);

  cyl(0.46, 0.52, 0.24, 14, M.hullDark, 0, 0, 0, mount);
  box(0.66, 0.34, 0.9, M.hull, 0, 0.26, 0, mount);

  // elevated barrel
  const gun = new THREE.Group();
  gun.position.set(0, 0.36, 0.35);
  gun.rotation.x = -0.36;
  mount.add(gun);

  tube(0.075, 3.0, 10, M.metal, 0, 0, 1.4, gun);
  tube(0.105, 0.3, 8, M.dark, 0, 0, 2.95, gun);
  tube(0.1, 0.6, 8, M.hullDark, 0, 0.02, 0.4, gun);
  box(0.3, 0.16, 0.5, M.dark, 0, 0.13, 0.15, gun);

  // recoil cylinders
  for (const side of [-1, 1]) {
    tube(0.045, 1.1, 6, M.steel, side * 0.13, -0.08, 0.95, gun);
  }

  // rear spades
  for (const side of [-1, 1]) {
    const spade = box(0.34, 0.08, 0.5, M.metal, side * 0.62, 0.34, -1.85, g);
    spade.rotation.x = 0.55;
  }

  // details
  box(1.1, 0.026, 0.026, M.gold, 0, 0.9, 1.68, g);
  box(0.02, 0.08, 0.5, M.accent, 0.945, 0.7, 0.6, g);
  box(0.02, 0.08, 0.5, M.accent, -0.945, 0.7, 0.6, g);

  const antenna = cyl(0.012, 0.012, 1.0, 5, M.dark, -0.78, 1.0, -1.3, g);
  antenna.rotation.z = 0.12;

  // spent-shell rack on the cab side
  for (let i = 0; i < 3; i++) {
    const shell = cyl(0.04, 0.04, 0.4, 6, M.gold, 0.88, 0.92, 0.5 + i * 0.16, g);
    shell.rotation.z = Math.PI / 2;
  }

  shadowify(g);
  return { object: g };
}
