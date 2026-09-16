export class GameState {
  #cash = 0;
  #listeners = new Set();

  get cash() {
    return this.#cash;
  }

  addCash(amount) {
    if (!Number.isFinite(amount) || amount < 0) return this.#cash;
    this.#cash += amount;
    this.#emit();
    return this.#cash;
  }

  spendCash(amount) {
    if (!this.canAfford(amount)) return false;
    this.#cash -= amount;
    this.#emit();
    return true;
  }

  canAfford(amount) {
    return Number.isFinite(amount) && amount >= 0 && this.#cash >= amount;
  }

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #emit() {
    for (const listener of [...this.#listeners]) listener(this.#cash);
  }
}
