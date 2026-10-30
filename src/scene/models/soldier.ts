import * as THREE from 'three';
import { M } from './materials';
import { box, cyl, shadowify, sphere, tube } from './helpers';
import type { ModelBuild } from './types';

export function buildSoldier(): ModelBuild {
  const g = new THREE.Group();
  const figure = new THREE.Group();
  g.add(figure);

  // legs
  for (const side of [-1, 1]) {
    box(0.155, 0.62, 0.18, M.hull, side * 0.115, 0.78, 0, figure);
    box(0.16, 0.14, 0.2, M.hullDark, side * 0.115, 0.42, 0.02, figure);
    box(0.18, 0.12, 0.3, M.dark, side * 0.115, 0.28, 0.06, figure);
    // knee pad
    box(0.145, 0.12, 0.06, M.hullDark, side * 0.115, 0.72, 0.1, figure);
  }

  // hips + torso
  box(0.38, 0.16, 0.22, M.hullDark, 0, 1.02, 0, figure);
  box(0.44, 0.52, 0.24, M.hull, 0, 1.34, 0, figure);

  // vest + pouches
  box(0.5, 0.4, 0.3, M.hullDark, 0, 1.34, 0.01, figure);
  for (let i = 0; i < 3; i++) {
    box(0.12, 0.11, 0.05, M.hull, -0.15 + i * 0.15, 1.28, 0.17, figure);
  }
  box(0.09, 0.02, 0.02, M.gold, -0.14, 1.47, 0.17, figure);

  // backpack
  box(0.34, 0.36, 0.16, M.hullDark, 0, 1.36, -0.19, figure);
  box(0.1, 0.14, 0.05, M.dark, -0.08, 1.3, -0.28, figure);
  box(0.1, 0.14, 0.05, M.dark, 0.08, 1.3, -0.28, figure);

  // shoulders + arms
  for (const side of [-1, 1]) {
    const upper = box(0.13, 0.32, 0.15, M.hull, side * 0.29, 1.4, 0, figure);
    upper.rotation.z = side * -0.12;
    const fore = box(0.115, 0.3, 0.14, M.hull, side * 0.32, 1.13, 0.13, figure);
    fore.rotation.x = -0.55;
    fore.rotation.z = side * -0.1;
    box(0.12, 0.1, 0.12, M.hullDark, side * 0.32, 1.0, 0.25, figure);
  }

  // head + helmet
  sphere(0.13, M.hullDark, 0, 1.7, 0.01, figure, 10, 8).scale.set(0.92, 1, 0.92);
  const helmet = sphere(0.165, M.hull, 0, 1.76, 0, figure, 14, 10);
  helmet.scale.set(1, 0.82, 1.08);
  box(0.26, 0.05, 0.06, M.hullDark, 0, 1.67, 0.12, figure); // brim
  const goggles = box(0.24, 0.06, 0.03, M.glass, 0, 1.71, 0.14, figure);
  goggles.rotation.x = -0.15;

  // rifle
  const rifle = new THREE.Group();
  rifle.position.set(0.26, 1.19, 0.34);
  rifle.rotation.set(-0.12, 0.28, 0.1);
  figure.add(rifle);
  box(0.06, 0.09, 0.72, M.dark, 0, 0, 0.05, rifle);
  tube(0.022, 0.34, 6, M.metal, 0, 0.01, 0.52, rifle);
  box(0.05, 0.14, 0.09, M.dark, 0, -0.09, 0.06, rifle);
  box(0.04, 0.1, 0.22, M.hullDark, 0, -0.02, -0.36, rifle);
  box(0.05, 0.05, 0.16, M.hullDark, 0, 0.07, 0.05, rifle);

  // antenna / radio
  const antenna = cyl(0.008, 0.008, 0.55, 4, M.dark, -0.16, 1.72, -0.24, figure);
  antenna.rotation.z = 0.12;

  figure.scale.setScalar(1);

  shadowify(g);
  return { object: g };
}
