import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class PlayerController {
  constructor(player, camera, canvas, getBounds) {
    this.player = player;
    this.camera = camera;
    this.canvas = canvas;
    this.getBounds = getBounds;
    this.speed = CONFIG.playerSpeed;
    this.velocity = new THREE.Vector3();
    this.moveDirection = new THREE.Vector3();
    this.desiredVelocity = new THREE.Vector3();
    this.forward = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0);
    this.destination = new THREE.Vector3();
    this.hasDestination = false;
    this.isMoving = false;
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.ground = new THREE.Plane(this.up, 0);
    this.targetRotation = new THREE.Quaternion();
    this.box = new THREE.Box3();
    this.boxSize = new THREE.Vector3(0.7, 1.8, 0.7);
    this.boxCenter = new THREE.Vector3();
    this.previous = new THREE.Vector3();
    this.keys = new Set();
    this.walkTime = 0;
    this.onKeyDown = (event) => {
      if (this.isMovementKey(event.code)) {
        event.preventDefault();
        this.keys.add(event.code);
        this.hasDestination = false;
      }
    };
    this.onKeyUp = (event) => this.keys.delete(event.code);
    this.onBlur = () => { this.keys.clear(); this.hasDestination = false; this.velocity.set(0, 0, 0); };
    this.onPointer = (event) => {
      if (event.button !== 0 || !event.isPrimary) return;
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      camera.updateMatrixWorld();
      this.raycaster.setFromCamera(this.pointer, camera);
      if (this.raycaster.ray.intersectPlane(this.ground, this.destination)) {
        this.clampPosition(this.destination);
        this.hasDestination = true;
      }
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    canvas.addEventListener('pointerdown', this.onPointer);
  }

  isMovementKey(code) {
    return ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(code);
  }

  clampPosition(position) {
    const bounds = this.getBounds();
    position.x = THREE.MathUtils.clamp(position.x, bounds.minX, bounds.maxX);
    position.z = THREE.MathUtils.clamp(position.z, bounds.minZ, bounds.maxZ);
  }

  update(dt) {
    const horizontal = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
    const vertical = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
    this.moveDirection.set(0, 0, 0);
    let distance = Infinity;
    if (horizontal || vertical) {
      this.hasDestination = false;
      this.camera.getWorldDirection(this.forward);
      this.forward.y = 0;
      this.forward.normalize();
      this.right.crossVectors(this.forward, this.up).normalize();
      this.moveDirection.addScaledVector(this.forward, vertical).addScaledVector(this.right, horizontal).normalize();
    } else if (this.hasDestination) {
      this.clampPosition(this.destination);
      this.moveDirection.subVectors(this.destination, this.player.position);
      this.moveDirection.y = 0;
      distance = this.moveDirection.length();
      if (distance < 0.08) {
        this.hasDestination = false;
        this.moveDirection.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
      } else this.moveDirection.divideScalar(distance);
    }
    this.desiredVelocity.copy(this.moveDirection).multiplyScalar(Math.min(this.speed, distance * 7));
    this.velocity.lerp(this.desiredVelocity, 1 - Math.exp(-CONFIG.acceleration * dt));
    this.previous.copy(this.player.position);
    const step = this.velocity.length() * dt;
    if (this.hasDestination && step > distance) {
      this.player.position.copy(this.destination);
      this.hasDestination = false;
      this.velocity.set(0, 0, 0);
    } else this.player.position.addScaledVector(this.velocity, dt);
    this.clampPosition(this.player.position);
    this.isMoving = this.player.position.distanceToSquared(this.previous) > 0.000001;
    if (this.isMoving) {
      this.targetRotation.setFromAxisAngle(this.up, Math.atan2(this.velocity.x, this.velocity.z));
      this.player.quaternion.slerp(this.targetRotation, 1 - Math.exp(-CONFIG.turnSmoothing * dt));
      this.walkTime += dt * 12;
    }
    const limbs = this.player.userData.limbs || [];
    for (let index = 0; index < limbs.length; index++) {
      limbs[index].rotation.x = this.isMoving ? Math.sin(this.walkTime + index * Math.PI) * 0.3 : 0;
    }
    this.boxCenter.copy(this.player.position);
    this.boxCenter.y += this.boxSize.y / 2;
    this.box.setFromCenterAndSize(this.boxCenter, this.boxSize);
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.canvas.removeEventListener('pointerdown', this.onPointer);
  }
}
