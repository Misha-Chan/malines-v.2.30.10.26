import * as THREE from 'three';
import { models } from './models';
import type { ModelBuild } from './models/types';

const STEP = (Math.PI * 2) / models.length;
const RADIUS = 7.4;
const PEDESTAL_Y = 0.22;
const RING_COLOR = 0x8a6a2c;

interface Instance {
  model: THREE.Object3D;
  build: ModelBuild;
  spin: number;
}

/**
 * A quiet turntable: every prototype sits on its own pedestal and the whole
 * ring rotates slowly. No interaction — this is a waiting-page backdrop.
 */
export class Showroom {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly carousel = new THREE.Group();
  private readonly timer = new THREE.Timer();
  private readonly basePos = new THREE.Vector3(0, 4.8, 17.2);
  private readonly lookAt = new THREE.Vector3(0, 1, 7);

  private readonly instances: Instance[] = [];
  private readonly pedestalGeo: THREE.CylinderGeometry;
  private readonly topGeo: THREE.CylinderGeometry;
  private readonly ringGeo: THREE.RingGeometry;

  private reducedMotion = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
    this.camera.position.copy(this.basePos);
    this.camera.lookAt(this.lookAt);
    this.timer.connect(document);

    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.FogExp2(0x050505, 0.036);
    this.scene.add(this.carousel);

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.pedestalGeo = new THREE.CylinderGeometry(2.3, 2.5, 0.18, 48);
    this.topGeo = new THREE.CylinderGeometry(2.28, 2.28, 0.04, 48);
    this.ringGeo = new THREE.RingGeometry(2.18, 2.34, 64);

    this.buildEnvironment();
    this.buildModels();
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  start(): void {
    this.resize();
    this.renderer.setAnimationLoop(this.tick);
  }

  private buildEnvironment(): void {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(60, 64),
      new THREE.MeshStandardMaterial({ color: 0x070709, roughness: 0.96, metalness: 0.04 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(90, 90, 0x1b1b20, 0x0d0d10);
    grid.position.y = 0.01;
    const gridMat = grid.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.45;
    this.scene.add(grid);

    for (const [inner, outer, opacity] of [
      [6.2, 6.21, 0.32],
      [9.5, 9.52, 0.14],
      [14, 14.03, 0.07],
    ]) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(inner, outer, 128),
        new THREE.MeshBasicMaterial({
          color: 0x8a7450,
          transparent: true,
          opacity,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.012;
      this.scene.add(ring);
    }

    this.scene.add(new THREE.HemisphereLight(0x8ea0bd, 0x0a0a0c, 1.5));

    const key = new THREE.DirectionalLight(0xfff4e6, 2.9);
    key.position.set(7, 13, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 45;
    key.shadow.camera.left = -14;
    key.shadow.camera.right = 14;
    key.shadow.camera.top = 14;
    key.shadow.camera.bottom = -14;
    key.shadow.bias = -0.0006;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0xd8442f, 4.6);
    rim.position.set(-10, 4.5, -7);
    this.scene.add(rim);

    const goldRim = new THREE.DirectionalLight(0xd4af37, 2.4);
    goldRim.position.set(10, 5.5, -5);
    this.scene.add(goldRim);

    const fill = new THREE.DirectionalLight(0x4f6f96, 1.7);
    fill.position.set(3, 3, -11);
    this.scene.add(fill);

    const stage = new THREE.SpotLight(0xffe6bd, 110, 26, 0.52, 0.55, 1.4);
    stage.position.set(0, 9.5, 11);
    stage.target.position.set(0, 0, RADIUS);
    this.scene.add(stage);
    this.scene.add(stage.target);
  }

  private buildModels(): void {
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x101013,
      roughness: 0.58,
      metalness: 0.42,
    });
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0c,
      roughness: 0.7,
      metalness: 0.3,
    });
    const ringMat = new THREE.MeshBasicMaterial({
      color: RING_COLOR,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    });

    models.forEach((def, index) => {
      const root = new THREE.Group();
      const angle = index * STEP;
      root.position.set(Math.sin(angle) * RADIUS, 0, Math.cos(angle) * RADIUS);
      root.rotation.y = angle;

      const pedestal = new THREE.Mesh(this.pedestalGeo, pedestalMat);
      pedestal.position.y = 0.09;
      pedestal.receiveShadow = true;
      pedestal.castShadow = true;
      root.add(pedestal);

      const top = new THREE.Mesh(this.topGeo, topMat);
      top.position.y = PEDESTAL_Y - 0.02;
      top.receiveShadow = true;
      root.add(top);

      const ring = new THREE.Mesh(this.ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = PEDESTAL_Y;
      root.add(ring);

      const build = def.build();
      build.object.position.y = PEDESTAL_Y;
      build.object.rotation.y = ((index * 137) % 360) * (Math.PI / 180);
      root.add(build.object);

      this.carousel.add(root);
      this.instances.push({
        model: build.object,
        build,
        spin: 0.05 + (index % 3) * 0.02,
      });
    });
  }

  private resize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;

    if (this.camera.aspect < 0.85) {
      this.camera.fov = 44;
      this.basePos.set(0, 6.2, 22);
      this.lookAt.set(0, 1.2, 7.8);
    } else if (this.camera.aspect < 1.25) {
      this.camera.fov = 36;
      this.basePos.set(0, 5.4, 19.6);
      this.lookAt.set(0, 1.1, 7.4);
    } else {
      this.camera.fov = 32;
      this.basePos.set(0, 4.8, 17.2);
      this.lookAt.set(0, 1, 7);
    }

    // keep the turntable out of the hero's column on wide screens
    this.carousel.position.x = this.camera.aspect > 1.25 ? -1.5 : 0;

    this.camera.position.copy(this.basePos);
    this.camera.lookAt(this.lookAt);
    this.camera.updateProjectionMatrix();
  };

  private tick = (): void => {
    this.timer.update();
    const delta = Math.min(this.timer.getDelta(), 0.05);
    const elapsed = this.timer.getElapsed();

    this.camera.position.x = Math.sin(elapsed * 0.12) * 0.25;
    this.camera.lookAt(this.lookAt);

    for (const instance of this.instances) {
      if (!this.reducedMotion) {
        instance.model.rotation.y += delta * instance.spin;
      }
      instance.build.update?.(elapsed, delta);
    }

    this.renderer.render(this.scene, this.camera);
  };
}
