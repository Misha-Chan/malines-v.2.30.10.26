import * as THREE from 'three';

const std = (color: number, roughness = 0.85, metalness = 0.15) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });

/** Shared matte/metal palette — low-poly, alt-history military. */
export const M = {
  hull: std(0x3d423a, 0.9, 0.12),
  hullDark: std(0x272b26, 0.95, 0.08),
  hullLight: std(0x4b5147, 0.85, 0.16),
  metal: std(0x70756c, 0.45, 0.72),
  steel: std(0x8c9188, 0.35, 0.85),
  dark: std(0x16171a, 0.9, 0.2),
  rubber: std(0x0d0d0f, 1, 0.04),
  accent: std(0x9c2f25, 0.7, 0.2),
  gold: std(0xd4af37, 0.32, 0.82),
  white: std(0xd8d4cb, 0.7, 0.1),
  glass: new THREE.MeshStandardMaterial({
    color: 0x0a1a20,
    roughness: 0.1,
    metalness: 0.92,
    flatShading: true,
  }),
  glowRed: new THREE.MeshStandardMaterial({
    color: 0x2a0b07,
    emissive: 0xc0392b,
    emissiveIntensity: 2.1,
    roughness: 0.6,
  }),
  glowGold: new THREE.MeshStandardMaterial({
    color: 0x2a2208,
    emissive: 0xd4af37,
    emissiveIntensity: 1.6,
    roughness: 0.6,
  }),
};

/** Double-sided hull material for flat wing / fin geometry. */
export const hullDouble = new THREE.MeshStandardMaterial({
  color: 0x3d423a,
  roughness: 0.9,
  metalness: 0.12,
  flatShading: true,
  side: THREE.DoubleSide,
});
