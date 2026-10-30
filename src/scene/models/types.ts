import type * as THREE from 'three';

export interface ModelBuild {
  object: THREE.Group;
  update?: (elapsed: number, delta: number) => void;
}

export interface ModelSpec {
  label: string;
  value: number;
}

export interface ModelDef {
  id: string;
  name: string;
  designation: string;
  role: string;
  specs: ModelSpec[];
  build: () => ModelBuild;
}
