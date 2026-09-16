import {
  BoxGeometry, CapsuleGeometry, ConeGeometry, CylinderGeometry, Group,
  Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry,
} from 'three';

const COLORS = Object.freeze({
  snow: '#f4f9fc', snowShade: '#dbe8f0', path: '#cfdbe2', trunk: '#7d5a3c', pine: '#3f7d5a',
  pineLight: '#5b9a6e', player: '#3d7fd9', playerDark: '#2f66b3', skin: '#f2c9a0',
  bear: '#f5f7f9', bearDark: '#dfe4ea', nose: '#3a3f46', wood: '#9f6442',
  raw: '#e8786f', cooked: '#b47335', cash: '#54c06b', stone: '#aab6bd', water: '#78c2d3',
  orange: '#f08c3a', flame: '#ffb14e', gold: '#d9a24f', timber: '#a5763f',
  roof: '#c05b4d', post: '#8a6540',
});

const GEOMETRIES = {
  box: new BoxGeometry(1, 1, 1),
  sphere: new SphereGeometry(0.5, 16, 12),
  lowSphere: new SphereGeometry(0.5, 8, 6),
  cylinder: new CylinderGeometry(0.5, 0.5, 1, 14),
  lowCylinder: new CylinderGeometry(0.5, 0.5, 1, 7),
  cone: new ConeGeometry(0.5, 1, 12),
  lowCone: new ConeGeometry(0.5, 1, 8),
  capsule: new CapsuleGeometry(0.32, 0.55, 4, 10),
  ring: new TorusGeometry(0.5, 0.07, 8, 28),
};

export class AssetFactory {
  constructor() {
    this.disposed = false;
    this.materials = new Map();
  }

  geometry(kind) {
    if (this.disposed) throw new Error('AssetFactory is disposed');
    if (!(kind in GEOMETRIES)) throw new RangeError(`Unknown geometry: ${kind}`);
    return GEOMETRIES[kind];
  }

  material(color) {
    if (this.disposed) throw new Error('AssetFactory is disposed');
    if (!(color in COLORS)) throw new RangeError(`Unknown palette color: ${color}`);
    if (!this.materials.has(color)) {
      const glowing = color === 'orange' || color === 'flame';
      this.materials.set(color, new MeshStandardMaterial({
        color: COLORS[color], roughness: color === 'water' ? 0.35 : 0.86,
        flatShading: true, emissive: glowing ? COLORS[color] : 0x000000,
        emissiveIntensity: glowing ? 0.75 : 0,
      }));
    }
    return this.materials.get(color);
  }

  mesh(kind, color, scale = [1, 1, 1], position = [0, 0, 0]) {
    const mesh = new Mesh(this.geometry(kind), this.material(color));
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  group(name) {
    if (this.disposed) throw new Error('AssetFactory is disposed');
    const group = new Group();
    group.name = name;
    return group;
  }

  createPlayer() {
    const player = this.group('Player');
    const body = this.mesh('capsule', 'player', [1, 1, 1], [0, 0.78, 0]);
    const head = this.mesh('sphere', 'skin', [0.44, 0.4, 0.44], [0, 1.38, 0.02]);
    const backpack = this.mesh('box', 'playerDark', [0.5, 0.6, 0.28], [0, 0.9, -0.38]);
    const leftArm = this.mesh('capsule', 'player', [0.3, 0.3, 0.3], [-0.42, 0.82, 0]);
    const rightArm = this.mesh('capsule', 'player', [0.32, 0.32, 0.32], [0.42, 0.82, 0]);
    const leftLeg = this.mesh('capsule', 'playerDark', [0.36, 0.36, 0.36], [-0.18, 0.24, 0]);
    const rightLeg = this.mesh('capsule', 'playerDark', [0.36, 0.36, 0.36], [0.18, 0.24, 0]);
    player.add(body, head, backpack, leftArm, rightArm, leftLeg, rightLeg);
    player.userData.limbs = [leftArm, rightArm, leftLeg, rightLeg];
    const stackMount = new Group();
    stackMount.name = 'InventoryStackMount';
    stackMount.position.set(0, 1.2, -0.4);
    player.add(stackMount);
    player.userData.stackMount = stackMount;
    return player;
  }

  createTree() {
    const tree = this.group('Tree');
    const trunk = this.mesh('lowCylinder', 'trunk', [0.28, 0.9, 0.28], [0, 0.45, 0]);
    const lower = this.mesh('lowCone', 'pine', [1.7, 1.9, 1.7], [0, 1.55, 0]);
    const middle = this.mesh('lowCone', 'pineLight', [1.35, 1.6, 1.35], [0, 2.45, 0]);
    const crown = this.mesh('lowCone', 'pine', [1, 1.3, 1], [0, 3.3, 0]);
    const snowCap = this.mesh('lowCone', 'snow', [0.62, 0.5, 0.62], [0, 3.85, 0]);
    tree.add(trunk, lower, middle, crown, snowCap);
    return tree;
  }

  createBear() {
    const bear = this.group('Bear');
    const body = this.mesh('box', 'bear', [1.5, 0.85, 2.3], [0, 0.65, 0]);
    const head = this.mesh('box', 'bear', [0.85, 0.8, 0.9], [0, 1.05, 1.35]);
    const snout = this.mesh('box', 'bearDark', [0.4, 0.3, 0.3], [0, 0.95, 1.85]);
    const nose = this.mesh('sphere', 'nose', [0.14, 0.14, 0.14], [0, 1, 2]);
    const earLeft = this.mesh('sphere', 'bearDark', [0.2, 0.2, 0.12], [-0.3, 1.5, 1.3]);
    const earRight = this.mesh('sphere', 'bearDark', [0.2, 0.2, 0.12], [0.3, 1.5, 1.3]);
    bear.add(body, head, snout, nose, earLeft, earRight);
    for (const [x, z] of [[-0.5, -0.85], [0.5, -0.85], [-0.5, 0.85], [0.5, 0.85]]) {
      bear.add(this.mesh('box', 'bear', [0.32, 0.5, 0.32], [x, 0.25, z]));
    }
    return bear;
  }

  createWood() {
    return this.#singleResource('lowCylinder', 'wood', [0.5, 0.24, 0.5]);
  }

  createRawMeat() {
    return this.#singleResource('box', 'raw', [0.46, 0.16, 0.34]);
  }

  createCookedMeat() {
    return this.#singleResource('box', 'cooked', [0.46, 0.18, 0.34]);
  }

  createCash() {
    const bundle = this.group('Cash');
    bundle.add(this.mesh('box', 'cash', [0.42, 0.14, 0.3], [0, 0.07, 0]));
    bundle.add(this.mesh('box', 'snow', [0.12, 0.16, 0.32], [0, 0.08, 0]));
    return bundle;
  }

  createFencePost() {
    const post = this.group('FencePost');
    post.add(this.mesh('box', 'post', [0.18, 1.05, 0.18], [0, 0.52, 0]));
    post.add(this.mesh('box', 'post', [0.3, 0.16, 0.3], [0, 1.1, 0]));
    post.add(this.mesh('box', 'snow', [0.34, 0.08, 0.34], [0, 1.2, 0]));
    return post;
  }

  createCampfire() {
    const fire = this.group('Campfire');
    for (let index = 0; index < 5; index++) {
      const log = this.mesh('lowCylinder', 'trunk', [0.22, 0.9, 0.22], [0, 0.12, 0]);
      log.rotation.set(Math.PI / 2.3, index * Math.PI * 2 / 5, 0);
      fire.add(log);
    }
    const flameA = this.mesh('lowCone', 'orange', [0.6, 1, 0.6], [0, 0.7, 0]);
    const flameB = this.mesh('lowCone', 'flame', [0.35, 0.7, 0.35], [0.08, 0.6, 0.05]);
    flameA.name = 'flameA';
    flameB.name = 'flameB';
    fire.add(flameA, flameB);
    for (let index = 0; index < 6; index++) {
      fire.add(this.mesh('lowSphere', 'stone', [0.3, 0.22, 0.3], [Math.sin(index * Math.PI / 3) * 1.05, 0.1, Math.cos(index * Math.PI / 3) * 1.05]));
    }
    return fire;
  }

  createTerrain(width, depth) {
    const terrain = this.group('Terrain');
    const base = this.mesh('box', 'snow', [width, 0.5, depth], [0, -0.25, 0]);
    base.castShadow = false;
    terrain.add(base);
    return terrain;
  }

  createPath(width, depth) {
    const path = this.mesh('box', 'path', [width, 0.06, depth], [0, 0.01, 0]);
    path.castShadow = false;
    return path;
  }

  createRock() {
    const rock = this.group('Rock');
    rock.add(this.mesh('lowSphere', 'stone', [0.9, 0.6, 0.8], [0, 0.25, 0]));
    rock.add(this.mesh('lowSphere', 'snow', [0.72, 0.4, 0.64], [0, 0.5, 0]));
    return rock;
  }

  createZoneMarker(color, radius = 1.6) {
    const marker = this.group('ZoneMarker');
    const ring = new Mesh(this.geometry('ring'), this.material(color));
    ring.rotation.x = -Math.PI / 2;
    ring.scale.setScalar(radius * 2);
    ring.position.y = 0.05;
    const disc = this.mesh('lowCylinder', color, [radius * 1.9, 0.04, radius * 1.9], [0, 0.02, 0]);
    disc.castShadow = false;
    marker.add(ring, disc);
    return marker;
  }

  createMarket() {
    const market = this.group('Market');
    const roof = this.mesh('box', 'roof', [3, 0.16, 1.7], [0, 2.3, -0.15]);
    const roofSnow = this.mesh('box', 'snow', [3.1, 0.1, 1.8], [0, 2.42, -0.15]);
    roof.rotation.x = 0.12;
    roofSnow.rotation.x = 0.12;
    market.add(
      this.mesh('box', 'timber', [2.6, 1, 1], [0, 0.5, 0]),
      this.mesh('box', 'snow', [2.8, 0.12, 1.2], [0, 1.06, 0]),
      this.mesh('box', 'timber', [0.16, 2.2, 0.16], [-1.15, 1.1, -0.3]),
      this.mesh('box', 'timber', [0.16, 2.2, 0.16], [1.15, 1.1, -0.3]),
      roof, roofSnow,
      this.mesh('box', 'wood', [0.5, 0.5, 0.5], [-1.9, 0.25, 0.3]),
      this.mesh('box', 'wood', [0.4, 0.4, 0.4], [-1.75, 0.2, -0.35]),
    );
    return market;
  }

  createResource(type) {
    const builders = {
      wood: () => this.createWood(), rawMeat: () => this.createRawMeat(),
      cookedMeat: () => this.createCookedMeat(), cash: () => this.createCash(),
    };
    if (!(type in builders)) throw new RangeError(`Unknown resource type: ${type}`);
    return builders[type]();
  }

  #singleResource(kind, color, scale) {
    const item = this.group('Resource');
    item.add(this.mesh(kind, color, scale, [0, scale[1] / 2, 0]));
    return item;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const material of this.materials.values()) material.dispose();
    this.materials.clear();
  }
}
