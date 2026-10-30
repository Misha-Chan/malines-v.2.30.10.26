import * as THREE from 'three';
import { M, hullDouble } from './materials';
import { box, cyl, shadowify, tube, wingGeo } from './helpers';
import type { ModelBuild } from './types';

const HULL: Array<[number, number]> = [
  [0, 2.75],
  [0.6, 1.75],
  [0.68, -1.2],
  [0.52, -2.3],
  [-0.52, -2.3],
  [-0.68, -1.2],
  [-0.6, 1.75],
];

export function buildShip(): ModelBuild {
  const g = new THREE.Group();
  const deckY = 0.78;
  const hullY = 0.5;

  // hull
  const hull = new THREE.Mesh(wingGeo(HULL, 0.5), hullDouble);
  hull.position.y = hullY;
  g.add(hull);

  // red waterline band
  const band = new THREE.Mesh(wingGeo(HULL, 0.1), M.accent);
  band.position.y = 0.32;
  band.scale.set(1.035, 1, 1.005);
  g.add(band);

  // deck
  const deck = new THREE.Mesh(wingGeo(HULL, 0.07), M.hullLight);
  deck.position.y = deckY;
  deck.scale.set(0.93, 1, 0.97);
  g.add(deck);

  // superstructure
  box(0.74, 0.46, 1.3, M.hull, 0, 1.06, 0.05, g);
  box(0.8, 0.3, 0.62, M.hullLight, 0, 1.42, 0.3, g);
  const bridgeGlass = box(0.72, 0.18, 0.04, M.glass, 0, 1.46, 0.63, g);
  bridgeGlass.rotation.x = -0.12;

  // funnel
  box(0.34, 0.42, 0.46, M.hullDark, 0, 1.5, -0.55, g);
  box(0.36, 0.06, 0.48, M.dark, 0, 1.72, -0.55, g);

  // mast
  cyl(0.035, 0.05, 1.0, 6, M.steel, 0, 2.05, 0.05, g);
  box(0.9, 0.03, 0.03, M.steel, 0, 2.18, 0.05, g);
  const dish = cyl(0.24, 0.24, 0.05, 14, M.hullLight, 0, 2.42, 0.05, g);
  dish.rotation.z = 0.5;
  box(0.03, 0.5, 0.03, M.dark, 0, 2.55, 0.05, g);

  // main gun
  const turret = new THREE.Group();
  turret.position.set(0, 1.02, 1.65);
  g.add(turret);
  box(0.56, 0.32, 0.6, M.hull, 0, 0, 0, turret);
  const mantlet = box(0.4, 0.2, 0.18, M.hullDark, 0, 0, 0.38, turret);
  mantlet.rotation.x = -0.12;
  tube(0.045, 1.25, 8, M.metal, 0, 0.02, 1.02, turret);

  // VLS cells
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      box(0.14, 0.05, 0.14, M.dark, -0.2 + j * 0.16, 0.9, 0.95 + i * 0.17, g);
    }
  }

  // CIWS
  cyl(0.16, 0.16, 0.2, 10, M.hullLight, 0, 1.2, -1.25, g);
  tube(0.03, 0.5, 6, M.dark, 0, 1.22, -0.95, g);

  // life rafts / deck details
  for (const side of [-1, 1]) {
    box(0.12, 0.1, 0.5, M.white, side * 0.44, 0.9, -1.55, g);
    box(0.02, 0.1, 1.4, M.accent, side * 0.7, 0.66, 0.4, g);
  }

  // bow stripe + nameplate
  box(0.5, 0.025, 0.025, M.gold, 0, 0.86, 2.42, g);
  box(0.22, 0.1, 0.03, M.gold, 0, 1.1, -1.95, g);

  shadowify(g);
  return { object: g };
}
