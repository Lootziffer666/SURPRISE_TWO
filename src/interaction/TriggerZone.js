import { Box3, Box3Helper, Color, Vector3 } from 'three';

export class TriggerZone {
  constructor({ center = new Vector3(), size = new Vector3(1, 1, 1), onEnter = () => {}, onStay = () => {}, onExit = () => {}, debug = false, scene = null } = {}) {
    if (typeof onEnter !== 'function' || typeof onStay !== 'function' || typeof onExit !== 'function') {
      throw new TypeError('Trigger callbacks must be functions');
    }
    this.onEnter = onEnter;
    this.onStay = onStay;
    this.onExit = onExit;
    this.box = new Box3().setFromCenterAndSize(center.clone(), size.clone());
    this.active = true;
    this.inside = false;
    this.helper = null;
    if (debug && scene) {
      this.helper = new Box3Helper(this.box, new Color('#39d353'));
      scene.add(this.helper);
    }
  }

  update(playerBox, dt) {
    if (!this.active) return this.#leave(dt);
    if (this.box.intersectsBox(playerBox)) {
      if (this.inside) this.onStay(dt, this);
      else {
        this.inside = true;
        this.onEnter(dt, this);
      }
    } else this.#leave(dt);
  }

  #leave(dt) {
    if (!this.inside) return;
    this.inside = false;
    this.onExit(dt, this);
  }

  setActive(active) {
    if (active === this.active) return;
    this.active = active;
    if (!active) this.#leave(0);
  }

  dispose() {
    if (this.helper) this.helper.removeFromParent();
    this.helper = null;
    this.onEnter = () => {};
    this.onStay = () => {};
    this.onExit = () => {};
  }
}
