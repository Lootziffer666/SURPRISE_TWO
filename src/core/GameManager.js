import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { SceneSetup } from './SceneSetup.js';
import { GameState } from './GameState.js';
import { AssetFactory } from '../entities/AssetFactory.js';
import { PlayerController } from '../controllers/PlayerController.js';
import { InventoryStack } from '../inventory/InventoryStack.js';
import { TriggerZone } from '../interaction/TriggerZone.js';
import { CampfireProcessor } from '../interaction/CampfireProcessor.js';
import { SellingZone } from '../interaction/SellingZone.js';
import { MapManager } from '../world/MapManager.js';
import { ResourceManager } from '../world/ResourceManager.js';
import { UIManager } from '../ui/UIManager.js';

export class GameManager {
  constructor(canvas) {
    this.setup = new SceneSetup(canvas);
    this.factory = new AssetFactory();
    this.state = new GameState();
    this.map = new MapManager(this.setup.scene, this.factory, this.state);
    this.player = this.factory.createPlayer();
    this.player.position.set(0, 0, 3);
    this.setup.scene.add(this.player);
    this.inventory = new InventoryStack(this.player, this.factory);
    this.controller = new PlayerController(this.player, this.setup.camera, canvas, () => this.map.getMovementBounds());
    this.resources = new ResourceManager(this.setup.scene, this.factory, this.inventory);
    this.resources.seed();
    this.processor = new CampfireProcessor(this.inventory);
    this.selling = new SellingZone(this.inventory, this.state);
    this.zones = [
      this.createInteractionZone(this.map.positions.campfire, this.processor),
      this.createInteractionZone(this.map.positions.market, this.selling),
    ];
    this.ui = new UIManager(this.state, this.inventory, this.map, this.setup.camera, canvas);
    this.lastTime = 0;
    this.frameId = 0;
    this.running = false;
    this.disposed = false;
    this.onVisibility = () => {
      this.lastTime = 0;
      this.controller.onBlur();
    };
    document.addEventListener('visibilitychange', this.onVisibility);
    this.onFrame = (time) => {
      if (!this.running) return;
      const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, CONFIG.maxDelta) : 0;
      this.lastTime = time;
      if (!document.hidden) this.update(dt);
      this.frameId = requestAnimationFrame(this.onFrame);
    };
    this.setup.updateCamera(this.player.position, 10);
  }

  createInteractionZone(position, system) {
    return new TriggerZone({
      center: position.clone().setY(1),
      size: new THREE.Vector3(2.8, 3, 2.8),
      onEnter: () => { system.inside = true; },
      onExit: () => { system.inside = false; },
      scene: this.setup.scene,
    });
  }

  update(dt) {
    this.controller.update(dt);
    this.resources.update(dt, this.player.position);
    for (const zone of this.zones) zone.update(this.controller.box, dt);
    this.processor.update(dt);
    this.selling.update(dt);
    this.map.updateTriggers(this.controller.box, dt);
    this.map.update(dt);
    this.setup.updateCamera(this.player.position, dt);
    this.ui.update(dt, this.processor, this.selling, this.player.position);
    this.setup.render();
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.lastTime = 0;
    this.frameId = requestAnimationFrame(this.onFrame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frameId);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.controller.dispose();
    this.ui.dispose();
    for (const zone of this.zones) zone.dispose();
    this.resources.dispose();
    this.inventory.clear();
    this.map.dispose();
    this.setup.scene.remove(this.player);
    this.factory.dispose();
    this.setup.dispose();
  }
}
