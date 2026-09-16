import { Box3, Group, Vector3 } from 'three';

export class InventoryStack {
  static sequence = 0;

  #items = [];
  #height = 0;
  #listeners = new Set();
  #bounds = new Box3();
  #size = new Vector3();

  constructor(player, factory, { gap = 0.04 } = {}) {
    if (!Number.isFinite(gap) || gap < 0) throw new RangeError('Gap must be finite and nonnegative');
    this.player = player;
    this.factory = factory;
    this.gap = gap;
    const mount = player.userData.stackMount;
    this.mount = mount instanceof Group ? mount : this.#createMount(player);
  }

  #createMount(player) {
    const mount = new Group();
    mount.name = 'InventoryStackMount';
    player.add(mount);
    return mount;
  }

  get items() {
    return [...this.#items];
  }

  get height() {
    return this.#height;
  }

  add(type) {
    const mesh = this.factory.createResource(type);
    const entry = { id: `${type}-${++InventoryStack.sequence}`, type, mesh, height: this.#measureHeight(mesh) };
    mesh.position.set(0, this.#height + entry.height / 2, 0);
    this.mount.add(mesh);
    this.#height += entry.height + this.gap;
    this.#items.push(entry);
    this.#emit();
    return entry;
  }

  #measureHeight(mesh) {
    this.#bounds.setFromObject(mesh);
    this.#bounds.getSize(this.#size);
    return Math.max(this.#size.y, 0.01);
  }

  remove(type) {
    for (let index = this.#items.length - 1; index >= 0; index--) {
      if (this.#items[index].type === type) return this.#removeAt(index);
    }
    return null;
  }

  removeTop() {
    return this.#items.length ? this.#removeAt(this.#items.length - 1) : null;
  }

  #removeAt(index) {
    const [entry] = this.#items.splice(index, 1);
    this.mount.remove(entry.mesh);
    this.#reflow();
    this.#emit();
    return entry;
  }

  #reflow() {
    let height = 0;
    for (const item of this.#items) {
      item.mesh.position.y = height + item.height / 2;
      height += item.height + this.gap;
    }
    this.#height = height;
  }

  has(type) {
    return this.#items.some((item) => item.type === type);
  }

  count(type) {
    return this.#items.reduce((total, item) => total + (item.type === type ? 1 : 0), 0);
  }

  getItems() {
    return this.#items.map(({ id, type, height }) => ({ id, type, height }));
  }

  clear() {
    if (!this.#items.length) return;
    for (const item of this.#items) this.mount.remove(item.mesh);
    this.#items = [];
    this.#height = 0;
    this.#emit();
  }

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #emit() {
    if (!this.#listeners.size) return;
    const snapshot = this.getItems();
    for (const listener of [...this.#listeners]) listener(snapshot);
  }
}
