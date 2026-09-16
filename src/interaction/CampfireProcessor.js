export class CampfireProcessor {
  constructor(inventory, { duration = 1 } = {}) {
    if (!Number.isFinite(duration) || duration <= 0) throw new RangeError('Duration must be finite and positive');
    this.inventory = inventory;
    this.duration = duration;
    this.inside = false;
    this.processing = false;
    this.elapsed = 0;
  }

  get progress() {
    return this.processing ? Math.min(1, this.elapsed / this.duration) : 0;
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt < 0) return;
    let remaining = dt;
    do {
      if (!this.processing) {
        if (!this.inside || !this.inventory.has('rawMeat')) return;
        this.processing = true;
        this.elapsed = 0;
        this.inventory.remove('rawMeat');
      }
      const step = Math.min(remaining, this.duration - this.elapsed);
      this.elapsed += step;
      remaining -= step;
      if (this.elapsed < this.duration) return;
      this.processing = false;
      this.elapsed = 0;
      this.inventory.add('cookedMeat');
    } while (remaining > 0 && this.inside);
  }
}
