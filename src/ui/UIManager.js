import * as THREE from 'three';

export class UIManager {
  constructor(state, inventory, map, camera, canvas) {
    this.state = state;
    this.inventory = inventory;
    this.map = map;
    this.camera = camera;
    this.canvas = canvas;
    this.projected = new THREE.Vector3();
    this.cameraPoint = new THREE.Vector3();
    this.cash = document.getElementById('cash-amount');
    this.questFill = document.getElementById('quest-fill');
    this.questAmount = document.getElementById('quest-amount');
    this.questStatus = document.getElementById('quest-status');
    this.activity = document.getElementById('activity');
    this.activityText = document.getElementById('activity-text');
    this.activityFill = document.getElementById('activity-fill');
    this.toastLayer = document.getElementById('toast-layer');
    this.toastTime = 0;
    this.wasUnlocked = false;
    this.counts = ['wood', 'rawMeat', 'cookedMeat'].map((type) => ({ type, element: document.getElementById(`count-${type}`), previous: -1 }));
    this.labels = [];
    this.addLabel('CAMPFIRE', 'Raw meat → cooked meat', 'fire', map.positions.campfire.clone().add(new THREE.Vector3(0, 2.7, 0)));
    this.addLabel('TRADING POST', 'Wood $5 · Cooked meat $10', 'market', map.positions.market.clone().add(new THREE.Vector3(0, 3.8, 0)));
    this.buyLabel = this.addLabel('UNLOCK', '', 'buy', map.positions.buy.clone().add(new THREE.Vector3(0, 2, -0.7)));
    const price = document.createElement('strong');
    price.textContent = `$${map.expansion.cost}`;
    this.buyLabel.element.append(price);
    this.pondLabel = this.addLabel('FROSTWATER POND', 'A little more room to dream', 'pond', new THREE.Vector3(0, 2, -16));
    this.unsubscribe = state.subscribe(() => this.updateCash());
    this.updateCash();
    this.help = document.getElementById('help-panel');
    this.helpButton = document.getElementById('help-button');
    this.closeHelp = document.getElementById('close-help');
    this.onHelp = () => {
      this.help.hidden = !this.help.hidden;
      this.helpButton.setAttribute('aria-expanded', String(!this.help.hidden));
      if (!this.help.hidden) this.closeHelp.focus();
      else this.helpButton.focus();
    };
    this.helpButton.addEventListener('click', this.onHelp);
    this.closeHelp.addEventListener('click', this.onHelp);
  }

  addLabel(title, subtitle, style, position) {
    const element = document.createElement('div');
    element.className = `world-label ${style}`;
    element.textContent = title;
    if (subtitle) {
      const small = document.createElement('small');
      small.textContent = subtitle;
      element.append(small);
    }
    document.getElementById('world-labels').append(element);
    const label = { element, position };
    this.labels.push(label);
    return label;
  }

  updateCash() {
    this.cash.textContent = `$${this.state.cash}`;
    const cost = this.map.expansion.cost;
    this.questFill.style.width = `${Math.min(this.state.cash / cost, 1) * 100}%`;
    this.questAmount.textContent = `$${Math.min(this.state.cash, cost)} / $${cost}`;
    this.questStatus.textContent = this.state.canAfford(cost) ? 'Head to the north gate!' : 'Build your little fortune';
  }

  toast(message, duration = 3) {
    this.toastLayer.replaceChildren();
    const element = document.createElement('div');
    element.className = 'toast';
    element.textContent = message;
    this.toastLayer.append(element);
    this.toastTime = duration;
  }

  update(dt, processor, selling, playerPosition) {
    for (const count of this.counts) {
      const next = this.inventory.count(count.type);
      if (count.previous !== next) {
        count.element.textContent = String(next);
        count.previous = next;
      }
    }
    const unlocked = this.map.expansion.unlocked;
    if (unlocked && !this.wasUnlocked) {
      this.wasUnlocked = true;
      document.getElementById('quest-title').textContent = 'The frontier is yours';
      document.getElementById('quest-description').textContent = 'Frostwater Pond is open. Follow the path north and enjoy your new corner of the world.';
      this.toast('Frostwater Pond unlocked. Your adventure just got bigger.', 5);
    }
    if (unlocked) {
      this.questStatus.textContent = 'New territory unlocked';
      this.questAmount.textContent = 'COMPLETE';
      this.questFill.style.width = '100%';
    }
    document.getElementById('location-name').textContent = playerPosition.z < -10 ? 'Frostwater pond' : 'Pinewood outpost';
    this.activity.hidden = !(processor.inside || processor.processing || selling.inside || this.map.expansion.zone.inside);
    if (processor.processing || processor.inside) {
      this.activityText.textContent = processor.processing ? 'Cooking something good…' : 'Bring raw meat to cook';
      this.activityFill.style.width = `${processor.progress * 100}%`;
    } else if (selling.inside) {
      this.activityText.textContent = this.inventory.has('wood') || this.inventory.has('cookedMeat') ? 'A little trade, a little profit…' : 'Bring wood or cooked meat to sell';
      this.activityFill.style.width = '100%';
    } else {
      this.activityText.textContent = `Save $${Math.max(0, this.map.expansion.cost - this.state.cash)} more to unlock`;
      this.activityFill.style.width = `${Math.min(1, this.state.cash / this.map.expansion.cost) * 100}%`;
    }
    if (this.toastTime > 0) {
      this.toastTime -= dt;
      if (this.toastTime <= 0) this.toastLayer.replaceChildren();
    }
    const rect = this.canvas.getBoundingClientRect();
    for (const label of this.labels) {
      const enabled = label === this.buyLabel ? !unlocked : label === this.pondLabel ? unlocked : true;
      this.cameraPoint.copy(label.position).applyMatrix4(this.camera.matrixWorldInverse);
      this.projected.copy(label.position).project(this.camera);
      const visible = enabled && this.cameraPoint.z < 0 && Math.abs(this.projected.x) < 0.95 && Math.abs(this.projected.y) < 0.92 && Math.abs(this.projected.z) <= 1;
      label.element.hidden = !visible;
      if (visible) {
        label.element.style.left = `${rect.left + (this.projected.x * 0.5 + 0.5) * rect.width}px`;
        label.element.style.top = `${rect.top + (-this.projected.y * 0.5 + 0.5) * rect.height}px`;
      }
    }
  }

  dispose() {
    this.unsubscribe();
    this.helpButton.removeEventListener('click', this.onHelp);
    this.closeHelp.removeEventListener('click', this.onHelp);
    for (const label of this.labels) label.element.remove();
    this.toastLayer.replaceChildren();
  }
}
