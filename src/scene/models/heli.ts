import * as THREE from 'three';
import { M } from './materials';
import { box, cyl, shadowify, sphere, tube } from './helpers';
import type { ModelBuild } from './types';

export function buildHeli(): ModelBuild {
  const g = new THREE.Group();
  const hull = new THREE.Group();
  hull.position.y = 0.55;
  g.add(hull);

  // fuselage
  const body = sphere(0.62, M.hull, 0, 1.42, 0.1, hull, 16, 12);
  body.scale.set(0.95, 0.95, 1.75);

  // cockpit glass
  const cockpit = sphere(0.5, M.glass, 0, 1.42, 1.0, hull, 14, 10);
  cockpit.scale.set(0.86, 0.82, 0.75);

  // tail boom
  const boom = cyl(0.09, 0.18, 2.1, 8, M.hull, 0, 1.55, -1.55, hull);
  boom.rotation.x = Math.PI / 2;

  // tail fin
  const fin = box(0.08, 0.6, 0.5, M.hull, 0, 1.85, -2.45, hull);
  fin.rotation.x = -0.25;
  box(0.09, 0.1, 0.32, M.accent, 0, 2.1, -2.55, hull).rotation.x = -0.25;

  // horizontal stabilizer
  box(1.0, 0.05, 0.26, M.hull, 0, 1.72, -2.3, hull);

  // tail rotor
  const tailRotor = new THREE.Group();
  tailRotor.position.set(0.14, 1.85, -2.55);
  hull.add(tailRotor);
  for (let i = 0; i < 2; i++) {
    const blade = box(0.02, 0.72, 0.07, M.dark, 0, 0, 0, tailRotor);
    blade.rotation.x = i * Math.PI;
  }

  // engine housing
  box(0.62, 0.22, 0.9, M.hullDark, 0, 1.86, -0.15, hull);
  box(0.5, 0.08, 0.2, M.steel, 0, 1.98, -0.5, hull);

  // main rotor
  const rotor = new THREE.Group();
  rotor.position.set(0, 2.02, 0.08);
  hull.add(rotor);
  cyl(0.14, 0.16, 0.16, 10, M.dark, 0, 0, 0, rotor);
  cyl(0.05, 0.05, 0.3, 8, M.steel, 0, 0.18, 0, rotor);
  for (let i = 0; i < 4; i++) {
    const blade = box(0.18, 0.025, 3.5, M.dark, 0, 0.16, 0, rotor);
    blade.rotation.y = (i * Math.PI) / 4;
  }

  // stub wings + rocket pods
  for (const side of [-1, 1]) {
    box(0.9, 0.07, 0.4, M.hull, side * 0.62, 1.32, 0.05, hull);
    const pod = cyl(0.13, 0.13, 0.6, 8, M.hullDark, side * 0.95, 1.18, 0.1, hull);
    pod.rotation.x = Math.PI / 2;
    cylinderCap(side * 0.95, 1.18, 0.42, hull);
    tube(0.02, 0.5, 6, M.dark, side * 0.85, 1.32, 0.15, hull);
  }

  // skids
  for (const side of [-1, 1]) {
    tube(0.035, 2.0, 6, M.steel, side * 0.55, 0.62, 0.1, hull);
    for (const z of [-0.45, 0.55]) {
      const strut = box(0.05, 0.5, 0.05, M.steel, side * 0.55, 0.9, z, hull);
      strut.rotation.z = side * 0.18;
    }
  }

  // gold stripe + sensor
  box(0.03, 0.1, 1.1, M.gold, 0.58, 1.42, 0.1, hull);
  box(0.03, 0.1, 1.1, M.gold, -0.58, 1.42, 0.1, hull);
  const sensor = sphere(0.1, M.glowRed, 0, 1.3, 1.36, hull, 10, 8);
  sensor.scale.set(1, 1, 0.8);

  // nose gun
  tube(0.025, 0.55, 6, M.dark, 0, 1.16, 1.25, hull);

  shadowify(g);

  return {
    object: g,
    update: (_elapsed, delta) => {
      rotor.rotation.y += delta * 7.5;
      tailRotor.rotation.x += delta * 16;
      hull.position.y = 0.55 + Math.sin(_elapsed * 1.1) * 0.035;
    },
  };
}

function cylinderCap(x: number, y: number, z: number, parent: THREE.Object3D): void {
  const cap = cyl(0.135, 0.135, 0.03, 8, M.accent, x, y, z, parent);
  cap.rotation.x = Math.PI / 2;
}
