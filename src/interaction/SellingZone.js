/**
 * @typedef {Object} SellingZoneOptions
 * @property {number} [interval]
 * @property {Object<string, number>} [prices]
 * @property {((item: {type: string, price: number}, price: number) => void)|undefined} [onSale]
 */

export class SellingZone {
  #cooldown = 0;

  /**
   * @param {object} inventory
   * @param {object} state
   * @param {SellingZoneOptions} [options]
   */
  constructor(inventory, state, { interval = 0.18, prices = { wood: 5, cookedMeat: 10 }, onSale } = {}) {
    if (!Number.isFinite(interval) || interval <= 0) throw new RangeError('Interval must be finite and positive');
    if (typeof onSale !== 'function') throw new TypeError('onSale must be a function');
    this.inventory = inventory;
    this.state = state;
    this.interval = interval;
    this.prices = { ...prices };
    this.onSale = onSale;
    this.inside = false;
    this.sold = 0;
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt < 0) return;
    if (!this.inside) {
      this.#cooldown = 0;
      return;
    }
    this.#cooldown -= dt;
    if (this.#cooldown > 0) return;
    const item = this.#nextSellable();
    if (!item) return;
    this.inventory.remove(item.type);
    this.state.addCash(this.prices[item.type]);
    this.sold += 1;
    this.onSale(item, this.prices[item.type]);
    this.#cooldown = this.interval;
  }

  #nextSellable() {
    for (const type of ['cookedMeat', 'wood']) {
      if (this.inventory.has(type) && Number.isFinite(this.prices[type]) && this.prices[type] > 0) {
        return { type, price: this.prices[type] };
      }
    }
    return null;
  }
}
