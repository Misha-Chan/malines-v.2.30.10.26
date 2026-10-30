import * as THREE from 'three';
import { M, hullDouble } from './materials';
import { box, cyl, sphere, shadowify, tube, wingGeo } from './helpers';
import type { ModelBuild } from './types';

function wingMesh(points: Array<[number, number]>, thickness = 0.09): THREE.Mesh {
  return new THREE.Mesh(wingGeo(points, thickness), hullDouble);
}

export function buildJet(): ModelBuild {
  const g = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 0.95;
  g.add(body);

  // fuselage
  const fuselage = cyl(0.26, 0.26, 3.3, 8, M.hull, 0, 0, -0.1, body);
  fuselage.rotation.x = Math.PI / 2;

  const nose = cyl(0.02, 0.26, 1.35, 8, M.hull, 0, 0, 2.22, body);
  nose.rotation.x = Math.PI / 2;

  const tail = cyl(0.26, 0.03, 0.75, 8, M.hullDark, 0, 0, -2.12, body);
  tail.rotation.x = Math.PI / 2;

  // canopy
  const canopy = sphere(0.3, M.glass, 0, 0.17, 1.1, body, 12, 8);
  canopy.scale.set(0.72, 0.55, 1.65);

  // spine
  box(0.22, 0.12, 1.5, M.hullLight, 0, 0.24, -0.15, body);

  // wings
  const wingR = wingMesh([
    [0.2, 1.15],
    [2.05, -0.35],
    [1.95, -0.92],
    [0.2, -1.12],
  ]);
  body.add(wingR);
  const wingL = wingMesh([
    [-0.2, 1.15],
    [-2.05, -0.35],
    [-1.95, -0.92],
    [-0.2, -1.12],
  ]);
  body.add(wingL);

  // wingtip accents
  for (const side of [-1, 1]) {
    box(0.06, 0.13, 0.38, M.accent, side * 1.98, 0.01, -0.6, body);
  }

  // intakes
  for (const side of [-1, 1]) {
    const intake = box(0.18, 0.26, 1.05, M.hullDark, side * 0.42, -0.06, 0.55, body);
    intake.rotation.z = side * 0.12;
    box(0.06, 0.2, 0.9, M.dark, side * 0.52, -0.06, 0.5, body);
  }

  // horizontal stabilizers
  body.add(
    wingMesh(
      [
        [0.16, -1.42],
        [1.0, -1.95],
        [0.98, -2.2],
        [0.16, -2.05],
      ],
      0.07,
    ),
  );
  body.add(
    wingMesh(
      [
        [-0.16, -1.42],
        [-1.0, -1.95],
        [-0.98, -2.2],
        [-0.16, -2.05],
      ],
      0.07,
    ),
  );

  // twin vertical tails
  for (const side of [-1, 1]) {
    const fin = box(0.06, 0.72, 0.62, M.hull, side * 0.3, 0.42, -1.62, body);
    fin.rotation.z = side * 0.22;
    fin.rotation.x = -0.28;
    box(0.065, 0.12, 0.4, M.accent, side * 0.36, 0.74, -1.78, body).rotation.z = side * 0.22;
  }

  // twin engines
  for (const side of [-1, 1]) {
    const nozzle = tube(0.13, 0.5, 10, M.steel, side * 0.17, 0, -2.35, body);
    nozzle.rotation.x = Math.PI / 2;
    tube(0.1, 0.1, 10, M.glowRed, side * 0.17, 0, -2.62, body).rotation.x = Math.PI / 2;
  }

  // underwing missiles
  for (const side of [-1, 1]) {
    tube(0.05, 0.85, 8, M.hullDark, side * 1.15, -0.09, -0.15, body);
    tube(0.035, 0.18, 6, M.accent, side * 1.15, -0.09, 0.34, body);
    box(0.5, 0.02, 0.12, M.hullDark, side * 1.15, -0.09, 0.0, body);
  }

  // gold canopy frame + red stripe
  box(0.02, 0.3, 0.02, M.gold, 0.19, 0.19, 1.72, body);
  box(0.02, 0.3, 0.02, M.gold, -0.19, 0.19, 1.72, body);

  // nose sensor
  const sensor = cyl(0.07, 0.07, 0.18, 8, M.gold, 0, 0, 2.92, body);
  sensor.rotation.x = Math.PI / 2;

  let phase = 0;
  shadowify(g);

  return {
    object: g,
    update: (elapsed) => {
      phase = elapsed;
      body.position.y = 0.95 + Math.sin(phase * 0.9) * 0.05;
      g.rotation.z = Math.sin(phase * 0.45) * 0.012;
    },
  };
}
