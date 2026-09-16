const COLLECTION_RADIUS = 1.05;

export class ResourceManager {
  constructor(scene, factory, inventory) {
    this.scene = scene;
    this.factory = factory;
    this.inventory = inventory;
    this.records = [];
    this.disposed = false;
  }

  spawn(type, position, { respawnDelay = 12, enabled = () => true } = {}) {
    if (this.disposed) throw new Error('ResourceManager is disposed');
    const mesh = this.factory.createResource(type);
    mesh.position.set(position.x, 0, position.z);
    this.scene.add(mesh);
    this.records.push({ type, mesh, active: true, timer: 0, respawnDelay, enabled });
    return mesh;
  }

  seed() {
    if (this.records.length) return;
    const spots = [
      [-6, -3], [-4.5, -4.5], [-7.5, -1.5], [-5, -6], [-2.5, -5.5], [-8.5, -3], [-6.5, 4.5], [-8, 1.5],
      [1, 4], [2.5, 5.5], [-0.5, 5.5], [3, 3], [0.5, 6.5], [4.5, 5], [1.5, 7], [-2, 6.5],
      [6, -5], [7.5, -6.5], [4.5, -4], [8, -3.5], [5.5, -7.5], [3, -6],
      [-9, 6], [9, 1], [-3, -7.5], [8, 7], [6, 6.5], [-1, -2], [-6, 6.5], [8.5, -0.5],
      [2, -2.5], [-2.5, 2], [2.5, -6.5], [-6, -6.5], [9.5, 3.5], [-9.5, -5.5],
    ];
    spots.forEach(([x, z], index) => {
      this.spawn(index % 5 === 4 ? 'rawMeat' : 'wood', { x, z });
    });
  }

  update(dt, playerPosition) {
    if (this.disposed) return;
    for (const record of this.records) {
      if (!record.active) {
        record.timer -= dt;
        if (record.timer <= 0 && record.enabled()) {
          record.active = true;
          record.mesh.visible = true;
        }
        continue;
      }
      if (!record.enabled() || !this.#withinRadius(record, playerPosition)) continue;
      if (!this.inventory.add(record.type)) continue;
      record.active = false;
      record.mesh.visible = false;
      record.timer = record.respawnDelay;
    }
  }

  #withinRadius(record, playerPosition) {
    const dx = record.mesh.position.x - playerPosition.x;
    const dz = record.mesh.position.z - playerPosition.z;
    return dx * dx + dz * dz <= COLLECTION_RADIUS * COLLECTION_RADIUS;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const record of this.records) record.mesh.removeFromParent();
    this.records = [];
  }
}
