/**
 * FLAG BATTLE ARENA - 3D Game Engine
 * Sets up Three.js rendering, lighting, shadows, particle systems,
 * quality presets, frame-rate control, and game loop orchestration.
 */

import * as THREE from '../libraries/three.module.js';
import { CameraController } from './camera-controller.js';
import { storage } from './storage-manager.js';

export class GameEngine {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = canvasContainer.clientWidth || window.innerWidth;
    this.height = canvasContainer.clientHeight || window.innerHeight;

    // Simulation & Timing
    this.isPaused = false;
    this.speedMultiplier = 1.0;
    this.targetFps = 60;
    this.lastTime = performance.now();
    this.fpsInterval = 1000 / 60;

    // Active Competition Reference
    this.activeCompetition = null;

    // Quality Settings
    const userSettings = storage.getSettings();
    this.quality = userSettings.quality || 'high';
    this.targetFps = userSettings.targetFps || 60;
    this.fpsInterval = 1000 / this.targetFps;

    // Particle pool
    this.particles = [];

    // Initialize Three.js
    this.initThree();

    // Setup Spectator Camera
    this.cameraController = new CameraController(this.camera, this.renderer.domElement);
    if (userSettings.cameraMode) {
      this.cameraController.setMode(userSettings.cameraMode);
    }

    // Handle Window Resize
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // Start Simulation Loop
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A0F1D);
    this.scene.fog = new THREE.FogExp2(0x0A0F1D, 0.012);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 300);
    this.camera.position.set(0, 18, 26);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.quality !== 'low',
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.setupLighting();

    // 5. Apply Quality Presets
    this.applyQuality(this.quality);
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.85);
    this.scene.add(this.ambientLight);

    // Main Sunlight
    this.sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.3);
    this.sunLight.position.set(25, 45, 20);
    this.sunLight.castShadow = true;

    // Shadow Map configuration
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 120;
    const shadowD = 35;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.bias = -0.0005;

    this.scene.add(this.sunLight);

    // Dynamic Stadium Fill Lights
    this.spotLight1 = new THREE.PointLight(0x3B82F6, 1.2, 70);
    this.spotLight1.position.set(-25, 15, -20);
    this.scene.add(this.spotLight1);

    this.spotLight2 = new THREE.PointLight(0xEC4899, 1.2, 70);
    this.spotLight2.position.set(25, 15, -20);
    this.scene.add(this.spotLight2);
  }

  applyQuality(preset) {
    this.quality = preset;
    const dpr = window.devicePixelRatio || 1;

    switch (preset) {
      case 'low':
        this.renderer.setPixelRatio(1);
        this.renderer.shadowMap.enabled = false;
        this.sunLight.castShadow = false;
        this.spotLight1.visible = false;
        this.spotLight2.visible = false;
        break;

      case 'medium':
        this.renderer.setPixelRatio(Math.min(1.5, dpr));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.sunLight.castShadow = true;
        this.spotLight1.visible = true;
        this.spotLight2.visible = true;
        break;

      case 'high':
      default:
        this.renderer.setPixelRatio(Math.min(2, dpr));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.sunLight.castShadow = true;
        this.spotLight1.visible = true;
        this.spotLight2.visible = true;
        break;
    }
  }

  setTargetFps(fps) {
    this.targetFps = fps === 30 ? 30 : 60;
    this.fpsInterval = 1000 / this.targetFps;
  }

  setSpeed(multiplier) {
    this.speedMultiplier = multiplier;
    this.cameraController.setBaseTimeScale(multiplier);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  togglePause() {
    if (this.isPaused) this.resume();
    else this.pause();
    return this.isPaused;
  }

  setCompetition(comp) {
    this.activeCompetition = comp;
  }

  spawnParticleBurst(position, count = 20, color = 0xF59E0B) {
    const geom = new THREE.SphereGeometry(0.12, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(position);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 8 + 3,
        (Math.random() - 0.5) * 10
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 1.0,
        maxLife: 1.0 + Math.random() * 0.5
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= 16 * dt; // Gravity
      p.mesh.position.addScaledVector(p.velocity, dt);
      const scale = p.life / p.maxLife;
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  animate(now) {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const elapsed = now - this.lastTime;
    if (elapsed < this.fpsInterval) return; // Cap at target FPS

    this.lastTime = now - (elapsed % this.fpsInterval);

    // Delta time clamped to prevent massive jumps
    let rawDelta = Math.min(elapsed / 1000, 0.08);

    if (!this.isPaused) {
      // Effective delta considering speed and slow-mo
      const effectiveDelta = rawDelta * this.cameraController.timeScale;

      // 1. Update Competition & Physics
      if (this.activeCompetition) {
        this.activeCompetition.update(effectiveDelta);
      }

      // 2. Update Particles
      this.updateParticles(effectiveDelta);
    }

    // 3. Update Camera (continues smoothing even when paused)
    this.cameraController.update(rawDelta, this.activeCompetition);

    // 4. Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  destroy() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }
  }
}
