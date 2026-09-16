import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class SceneSetup {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#cadde5');
    this.scene.fog = new THREE.Fog('#cadde5', 65, 115);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.camera = new THREE.OrthographicCamera(-20, 20, 12.5, -12.5, 0.1, 150);
    this.offset = new THREE.Vector3(28, 32, 28);
    this.focus = new THREE.Vector3(0, 0, 0);
    this.target = new THREE.Vector3();
    this.camera.position.copy(this.offset);
    this.camera.lookAt(this.focus);
    this.scene.add(new THREE.HemisphereLight('#dcf4ff', '#749395', 2.4));
    this.sun = new THREE.DirectionalLight('#fff1d6', 3.1);
    this.sun.position.set(-15, 32, 12);
    this.sun.target.position.set(0, 0, -6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 85 });
    this.sun.shadow.normalBias = 0.035;
    this.sun.shadow.bias = -0.00015;
    this.scene.add(this.sun, this.sun.target);
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    this.resize();
  }

  resize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    const aspect = width / Math.max(height, 1);
    const halfHeight = CONFIG.viewHeight / 2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CONFIG.pixelRatioCap));
    this.renderer.setSize(width, height, false);
    Object.assign(this.camera, {
      left: -halfHeight * aspect, right: halfHeight * aspect,
      top: halfHeight, bottom: -halfHeight,
    });
    this.camera.updateProjectionMatrix();
  }

  updateCamera(position, dt) {
    this.target.copy(position);
    this.target.y = 0;
    this.focus.lerp(this.target, 1 - Math.exp(-CONFIG.cameraSmoothing * dt));
    this.camera.position.copy(this.focus).add(this.offset);
    this.camera.lookAt(this.focus);
    this.camera.updateMatrixWorld();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);
    this.sun.shadow.dispose();
    this.renderer.dispose();
  }
}
