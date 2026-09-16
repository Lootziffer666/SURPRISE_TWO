export const Easing = Object.freeze({
  linear: (t) => t,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2,
});

export class Tween {
  constructor({ target, to, duration = 0.7, delay = 0, easing = Easing.easeInOutCubic, onUpdate = (progress) => { void progress; }, onComplete = () => {} }) {
    if (typeof onUpdate !== 'function' || typeof onComplete !== 'function') throw new TypeError('Tween callbacks must be functions');
    if (!Number.isFinite(duration) || duration < 0 || !Number.isFinite(delay) || delay < 0) {
      throw new RangeError('Tween duration and delay must be finite and nonnegative');
    }
    this.target = target;
    this.to = { ...to };
    this.keys = Object.keys(to);
    this.from = {};
    for (const key of this.keys) {
      if (!Number.isFinite(target[key]) || !Number.isFinite(to[key])) throw new TypeError('Tween values must be finite numbers');
      this.from[key] = target[key];
    }
    this.duration = duration;
    this.delay = delay;
    this.easing = easing;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.elapsed = 0;
    this.finished = false;
    this.cancelled = false;
  }

  update(dt) {
    if (this.finished || this.cancelled) return true;
    if (!Number.isFinite(dt) || dt < 0) return false;
    this.elapsed += dt;
    if (this.elapsed < this.delay) return false;
    const progress = this.duration === 0 ? 1 : Math.min(1, (this.elapsed - this.delay) / this.duration);
    const eased = this.easing(progress);
    for (const key of this.keys) {
      this.target[key] = progress === 1 ? this.to[key] : this.from[key] + (this.to[key] - this.from[key]) * eased;
    }
    this.finished = progress === 1;
    this.onUpdate(progress);
    if (this.finished && !this.cancelled) this.onComplete();
    return this.finished || this.cancelled;
  }

  cancel() {
    this.cancelled = true;
    this.onUpdate = () => {};
    this.onComplete = () => {};
  }

  dispose() {
    this.cancel();
  }
}
