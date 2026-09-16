import { Group, Vector3 } from 'three';
import { TriggerZone } from '../interaction/TriggerZone.js';
import { Tween } from '../utils/Tween.js';

const WORLD = Object.freeze({
  width: 24, depth: 20, expansionDepth: 12, expansionCenterZ: -16,
  initialBounds: { minX: -11.3, maxX: 11.3, minZ: -9.3, maxZ: 9.3 },
  expandedBounds: { minX: -11.3, maxX: 11.3, minZ: -21.3, maxZ: 9.3 },
  expansionCost: 200, fenceDuration: 0.7, fenceStagger: 0.025, fenceSink: -1.8,
  fenceSpacing: 1.2, triggerSize: [2.8, 3, 2.2],
});

const TREES = [
  [-10.1, -7.8], [-8.4, -8.5], [-5.7, -8.2], [4.5, -8.4], [8.2, -8.1], [10.3, -6.7],
  [-10.3, -4.4], [-10.1, 0], [-9.8, 4.2], [-8.4, 7.7], [-5.9, 8.1],
  [10, -2.5], [10, 3], [8.3, 7.8], [5.9, 8], [-2.9, 8.5],
];

export class MapManager {
  constructor(scene, factory, state) {
    this.scene = scene;
    this.factory = factory;
    this.state = state;
    this.disposed = false;
    this.time = 0;
    this.tweens = [];
    this.bounds = { ...WORLD.initialBounds };
    this.positions = {
      campfire: new Vector3(-4, 0, 1),
      market: new Vector3(5, 0, 1),
      buy: new Vector3(0, 0, -8),
    };
    this.group = new Group();
    this.group.name = 'SnowboundWorld';
    this.scene.add(this.group);
    this.build();
  }

  build() {
    if (this.built || this.disposed) return;
    this.built = true;
    this.group.add(this.factory.createTerrain(WORLD.width, WORLD.depth));
    this.place(this.factory.createPath(2.25, 15.5), 0, -0.01, -0.7);
    this.place(this.factory.createPath(11, 2.4), 0, -0.008, 1.1);
    TREES.forEach(([x, z], index) => this.addTree(this.group, x, z, index));
    for (const [x, z] of [[-8.8, -6.1], [9, 5.4], [-7.8, 8], [7.8, -8.7]]) {
      this.place(this.factory.createRock(), x, 0, z);
    }
    const bear = this.factory.createBear();
    bear.rotation.y = -0.7;
    this.place(bear, 7.7, 0, -2.3);
    this.campfire = this.factory.createCampfire();
    this.campfire.position.copy(this.positions.campfire);
    this.market = this.factory.createMarket();
    this.market.position.copy(this.positions.market);
    this.group.add(this.campfire, this.market);
    for (const [name, color, radius] of [['campfire', 'orange', 1.7], ['market', 'cash', 1.8]]) {
      const marker = this.factory.createZoneMarker(color, radius);
      marker.position.copy(this.positions[name]);
      this.group.add(marker);
    }
    this.buyMarker = this.factory.createZoneMarker('gold', 1.35);
    this.buyMarker.position.copy(this.positions.buy);
    this.group.add(this.buyMarker);
    this.fences = new Map();
    this.fences.set('NorthFence', this.createFence(-12, -10, 24, false));
    this.fences.set('SouthFence', this.createFence(-12, 10, 24, false));
    this.fences.set('WestFence', this.createFence(-12, -10, 20, true));
    this.fences.set('EastFence', this.createFence(12, -10, 20, true));
    for (const fence of this.fences.values()) this.group.add(fence);
    const contentGroup = this.createExpansion();
    contentGroup.visible = false;
    this.group.add(contentGroup);
    const zone = new TriggerZone({
      center: this.positions.buy.clone().setY(1),
      size: new Vector3(...WORLD.triggerSize),
      onEnter: () => this.tryUnlock(),
      onStay: () => this.tryUnlock(),
    });
    this.expansion = {
      id: 'fishingArea', cost: WORLD.expansionCost, unlocked: false,
      opening: false, fenceGroup: this.fences.get('NorthFence'), zone, contentGroup,
    };
  }

  place(object, x, y, z, parent = this.group) {
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  }

  addTree(parent, x, z, index) {
    const tree = this.factory.createTree();
    tree.scale.setScalar(0.82 + ((index * 7) % 11) * 0.035);
    tree.rotation.y = index * 2.39996;
    this.place(tree, x, 0, z, parent);
  }

  createFence(x, z, length, alongZ) {
    const fence = new Group();
    fence.name = 'Fence';
    const posts = [];
    for (let offset = 0; offset <= length; offset += WORLD.fenceSpacing) {
      const post = this.factory.createFencePost();
      if (alongZ) post.position.set(x, 0, z + offset);
      else post.position.set(x + offset, 0, z);
      fence.add(post);
      posts.push(post);
    }
    fence.userData.posts = posts;
    return fence;
  }

  tryUnlock() {
    if (this.disposed || this.expansion.unlocked || this.expansion.opening) return false;
    if (!this.state.spendCash(this.expansion.cost)) return false;
    this.expansion.opening = true;
    this.expansion.zone.setActive(false);
    this.buyMarker.visible = false;
    this.openFence(this.expansion.fenceGroup);
    return true;
  }

  openFence(fenceGroup) {
    fenceGroup.userData.posts.forEach((post, index) => {
      this.tweens.push(new Tween({
        target: post.position,
        to: { y: WORLD.fenceSink },
        duration: WORLD.fenceDuration,
        delay: index * WORLD.fenceStagger,
        onComplete: () => { post.visible = false; },
      }));
    });
  }

  getMovementBounds() {
    return this.bounds;
  }

  updateTriggers(playerBox, dt) {
    if (this.disposed) return;
    this.expansion.zone.update(playerBox, dt);
  }

  update(dt) {
    if (this.disposed) return;
    this.time += dt;
    this.tweens = this.tweens.filter((tween) => !tween.update(dt));
    if (this.expansion.opening && !this.expansion.unlocked && !this.tweens.length) {
      this.expansion.opening = false;
      this.expansion.unlocked = true;
      this.expansion.contentGroup.visible = true;
      this.expansion.fenceGroup.visible = false;
      this.bounds = { ...WORLD.expandedBounds };
    }
    const pulse = 1 + Math.sin(this.time * 9) * 0.12;
    const flameA = this.campfire.getObjectByName('flameA');
    const flameB = this.campfire.getObjectByName('flameB');
    flameA.scale.set(0.6 * pulse, 1 * (2 - pulse), 0.6 * pulse);
    flameB.scale.set(0.35 * pulse, 0.7 * (2 - pulse), 0.35 * pulse);
    flameA.rotation.y += dt * 2.2;
    flameB.rotation.y -= dt * 3.1;
  }

  createExpansion() {
    const content = new Group();
    content.name = 'FishingArea';
    const terrain = this.factory.createTerrain(WORLD.width, WORLD.expansionDepth);
    terrain.position.set(0, -0.02, WORLD.expansionCenterZ);
    content.add(terrain);
    const pond = this.factory.mesh('lowCylinder', 'water', [8.5, 0.08, 6.5], [0, 0.06, WORLD.expansionCenterZ + 1]);
    pond.castShadow = false;
    content.add(pond);
    [[-9, -13], [9.5, -12.5], [-10, -19], [10, -19.5], [0, -21]].forEach(([x, z], index) => {
      this.addTree(content, x, z, index + 3);
    });
    content.add(this.place(this.factory.createRock(), -5.5, 0, -12.4, content));
    return content;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const tween of this.tweens) tween.dispose();
    this.tweens = [];
    this.expansion.zone.dispose();
    this.group.removeFromParent();
  }
}
