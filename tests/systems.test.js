import assert from 'node:assert/strict';
import test from 'node:test';
import { Box3, Vector3 } from 'three';
import { GameState } from '../src/core/GameState.js';
import { CampfireProcessor } from '../src/interaction/CampfireProcessor.js';
import { SellingZone } from '../src/interaction/SellingZone.js';
import { TriggerZone } from '../src/interaction/TriggerZone.js';

class StubInventory {
  constructor() { this.buckets = new Map(); this.subscribers = new Set(); }
  has(type) { return this.count(type) > 0; }
  count(type) { return this.stored().filter((entry) => entry.type === type).length; }
  stored() { return this.#items; }
  #items = [];
  add(type) { const entry = { id: `${type}-${this.#items.length}`, type }; this.#items.push(entry); this.#emit(); return entry; }
  remove(type) {
    for (let index = this.#items.length - 1; index >= 0; index--) {
      if (this.#items[index].type === type) return this.#items.splice(index, 1)[0];
    }
    return null;
  }
  subscribe(listener) { this.subscribers.add(listener); return () => this.subscribers.delete(listener); }
  #emit() { for (const listener of this.subscribers) listener(this.getItems()); }
  getItems() { return this.#items.map((item) => ({ ...item })); }
}

test('state transactions notify only changes and unsubscribe', () => {
  const state = new GameState();
  const events = [];
  const unsubscribe = state.subscribe((cash) => events.push(cash));
  assert.equal(state.addCash(50), 50);
  assert.equal(state.spendCash(20), true);
  assert.equal(state.spendCash(999), false);
  assert.equal(state.canAfford(30), true);
  unsubscribe();
  state.addCash(1);
  assert.deepEqual(events, [50, 30]);
});

test('state invalid amounts cannot corrupt balance', () => {
  const state = new GameState();
  state.addCash(10);
  assert.equal(state.addCash(-5), 10);
  assert.equal(state.addCash(Number.NaN), 10);
  assert.equal(state.spendCash(Number.NaN), false);
  assert.equal(state.spendCash(-1), false);
  assert.equal(state.cash, 10);
});

test('processor leaving finishes one without starting another', () => {
  const inventory = new StubInventory();
  inventory.add('rawMeat');
  inventory.add('rawMeat');
  const processor = new CampfireProcessor(inventory, { duration: 1 });
  processor.inside = true;
  processor.update(0.4);
  assert.equal(processor.processing, true);
  assert.equal(inventory.count('rawMeat'), 1);
  processor.inside = false;
  processor.update(0.6);
  assert.equal(processor.processing, false);
  assert.equal(inventory.count('cookedMeat'), 1);
  assert.equal(inventory.count('rawMeat'), 1);
  processor.update(5);
  assert.equal(inventory.count('cookedMeat'), 1);
});

test('selling cadence prices unsellables and exit reset', () => {
  const inventory = new StubInventory();
  const state = new GameState();
  const sales = [];
  const zone = new SellingZone(inventory, state, { onSale: (item, price) => sales.push([item.type, price]) });
  inventory.add('wood');
  inventory.add('cookedMeat');
  zone.inside = true;
  zone.update(0.1);
  assert.deepEqual(sales, [['cookedMeat', 10]]);
  assert.equal(state.cash, 10);
  zone.update(0.17);
  assert.equal(sales.length, 1);
  zone.update(0.01);
  assert.deepEqual(sales[1], ['wood', 5]);
  assert.equal(state.cash, 15);
  zone.inside = false;
  zone.update(1);
  assert.equal(sales.length, 2);
});

test('trigger enter stay exit disable and debug disposal', () => {
  const events = [];
  const zone = new TriggerZone({ onEnter: () => events.push('enter'), onStay: () => events.push('stay'), onExit: () => events.push('exit') });
  const insideBox = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
  const outsideBox = new Box3(new Vector3(50, 50, 50), new Vector3(51, 51, 51));
  zone.update(insideBox, 0.016);
  zone.update(insideBox, 0.016);
  zone.update(outsideBox, 0.016);
  assert.deepEqual(events, ['enter', 'stay', 'exit']);
  zone.update(insideBox, 0.016);
  zone.setActive(false);
  assert.deepEqual(events, ['enter', 'stay', 'exit', 'enter', 'exit']);
});
