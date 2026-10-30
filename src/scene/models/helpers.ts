import * as THREE from 'three';
import { M } from './materials';

export function box(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  parent?: THREE.Object3D,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  parent?.add(mesh);
  return mesh;
}

export function cyl(
  rTop: number,
  rBottom: number,
  height: number,
  segments: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  parent?: THREE.Object3D,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, height, segments), mat);
  mesh.position.set(x, y, z);
  parent?.add(mesh);
  return mesh;
}

export function sphere(
  radius: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  parent?: THREE.Object3D,
  widthSeg = 14,
  heightSeg = 10,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, widthSeg, heightSeg), mat);
  mesh.position.set(x, y, z);
  parent?.add(mesh);
  return mesh;
}

/** Barrel / tube laid along +Z. */
export function tube(
  radius: number,
  length: number,
  segments: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  parent?: THREE.Object3D,
): THREE.Mesh {
  const mesh = cyl(radius, radius, length, segments, mat, x, y, z, parent);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

/** Two continuous track belts with road wheels. */
export function trackPair(
  parent: THREE.Object3D,
  length: number,
  width: number,
  height: number,
  spread: number,
  y: number,
): void {
  const wheelR = height * 0.46;

  for (const side of [-1, 1]) {
    box(width, height, length, M.rubber, side * spread, y, 0, parent);
    box(width + 0.13, 0.055, length + 0.04, M.dark, side * spread, y + height / 2 + 0.02, 0, parent);

    const count = 5;
    for (let i = 0; i < count; i++) {
      const z = -length / 2 + wheelR + 0.16 + (i * (length - wheelR * 2 - 0.32)) / (count - 1);
      const wheel = cyl(wheelR, wheelR, width + 0.03, 10, M.metal, side * spread, y, z, parent);
      wheel.rotation.z = Math.PI / 2;
    }
  }
}

export function shadowify(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

/** Flat polygon in the XZ plane from [x, z] pairs. */
export function wingGeo(points: Array<[number, number]>, thickness = 0): THREE.BufferGeometry {
  if (thickness <= 0) {
    const positions: number[] = [];
    for (let i = 1; i < points.length - 1; i++) {
      const [x0, z0] = points[0];
      const [x1, z1] = points[i];
      const [x2, z2] = points[i + 1];
      positions.push(x0, 0, z0, x1, 0, z1, x2, 0, z2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }

  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, thickness / 2, 0);
  return geo;
}
