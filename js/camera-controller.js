/**
 * FLAG BATTLE ARENA - Interactive Touch & Mouse Spectator Camera
 * Supports full 360-degree orbit rotation, mouse wheel & pinch-to-zoom,
 * and cinematic automatic event framing.
 */

import * as THREE from '../libraries/three.module.js';

export const CameraMode = {
  AUTO: 'auto',
  MANUAL: 'manual',
  WIDE: 'wide',
  CLOSE: 'close',
  TOP: 'top',
  FOLLOW: 'follow'
};

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement || window;
    this.mode = CameraMode.AUTO;

    // Spherical Orbit Coordinates for Interactive Mouse/Touch
    this.orbitDistance = 24.0;
    this.orbitTheta = 0.0;           // Horizontal rotation angle
    this.orbitPhi = Math.PI * 0.32;  // Vertical elevation angle
    this.focusPoint = new THREE.Vector3(0, 0.5, 0);

    this.currentPosition = new THREE.Vector3(0, 16, 24);
    this.targetPosition = new THREE.Vector3(0, 16, 24);
    this.currentLookAt = new THREE.Vector3(0, 0.5, 0);
    this.targetLookAt = new THREE.Vector3(0, 0.5, 0);

    // Interactive Drag State
    this.isDragging = false;
    this.previousPointerPos = { x: 0, y: 0 };
    this.initialPinchDistance = null;

    // Slow Motion & Shake
    this.timeScale = 1.0;
    this.baseTimeScale = 1.0;
    this.slowMoTimer = 0;
    this.slowMoDuration = 0;
    this.slowMoFactor = 1.0;

    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;

    this.setupInteractions();
  }

  setupInteractions() {
    // 1. Mouse Drag & Touch Orbit
    window.addEventListener('pointerdown', (e) => {
      // Don't capture clicks on buttons or interactive UI elements
      if (e.target.closest('button, input, select, .hud-btn, .country-card, .btn')) return;

      this.isDragging = true;
      this.previousPointerPos = { x: e.clientX, y: e.clientY };
    }, { passive: true });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousPointerPos.x;
      const deltaY = e.clientY - this.previousPointerPos.y;
      this.previousPointerPos = { x: e.clientX, y: e.clientY };

      // Switch to manual orbit on drag
      this.mode = CameraMode.MANUAL;

      // Rotate camera angle
      this.orbitTheta -= deltaX * 0.007;
      this.orbitPhi = Math.max(0.08, Math.min(1.48, this.orbitPhi - deltaY * 0.006));
    }, { passive: true });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
      this.initialPinchDistance = null;
    }, { passive: true });

    // 2. Mouse Wheel Zoom
    window.addEventListener('wheel', (e) => {
      // Check if scrolling inside a scrollable menu list
      if (e.target.closest('.countries-grid, .game-leaderboard-sidebar, .setup-container')) return;

      this.mode = CameraMode.MANUAL;
      this.orbitDistance = Math.max(6.0, Math.min(65.0, this.orbitDistance + e.deltaY * 0.025));
    }, { passive: true });

    // 3. Two-Finger Touch Pinch-to-Zoom on Mobile
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.initialPinchDistance = Math.hypot(dx, dy);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && this.initialPinchDistance) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const diff = this.initialPinchDistance - currentDist;

        this.mode = CameraMode.MANUAL;
        this.orbitDistance = Math.max(6.0, Math.min(65.0, this.orbitDistance + diff * 0.05));
        this.initialPinchDistance = currentDist;
      }
    }, { passive: true });
  }

  setMode(mode) {
    if (Object.values(CameraMode).includes(mode)) {
      this.mode = mode;
      if (mode === CameraMode.AUTO) {
        this.orbitDistance = 24.0;
        this.orbitTheta = 0.0;
        this.orbitPhi = Math.PI * 0.32;
      }
    }
  }

  setBaseTimeScale(scale) {
    this.baseTimeScale = scale;
    if (this.slowMoTimer <= 0) {
      this.timeScale = scale;
    }
  }

  triggerSlowMo(factor = 0.25, duration = 1.0) {
    this.slowMoFactor = factor;
    this.slowMoDuration = duration;
    this.slowMoTimer = duration;
  }

  triggerShake(intensity = 0.4, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  update(deltaTime, competition) {
    // 1. Slow-Motion update
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= deltaTime;
      const progress = 1 - (this.slowMoTimer / this.slowMoDuration);
      if (progress < 0.2) {
        this.timeScale = THREE.MathUtils.lerp(this.baseTimeScale, this.baseTimeScale * this.slowMoFactor, progress / 0.2);
      } else if (progress > 0.8) {
        this.timeScale = THREE.MathUtils.lerp(this.baseTimeScale * this.slowMoFactor, this.baseTimeScale, (progress - 0.8) / 0.2);
      } else {
        this.timeScale = this.baseTimeScale * this.slowMoFactor;
      }
      if (this.slowMoTimer <= 0) this.timeScale = this.baseTimeScale;
    } else {
      this.timeScale = this.baseTimeScale;
    }

    // 2. Compute Camera Targets based on mode
    if (competition) {
      this.calculateCameraTargets(competition);
    }

    // 3. Smooth Camera Position & LookAt Lerp
    const lerpSpeed = this.mode === CameraMode.MANUAL ? 0.15 : 0.08;
    this.currentPosition.lerp(this.targetPosition, lerpSpeed);
    this.currentLookAt.lerp(this.targetLookAt, lerpSpeed);

    // 4. Apply Screen Shake
    const finalPos = this.currentPosition.clone();
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
      const decay = this.shakeTimer / this.shakeDuration;
      const currentInt = this.shakeIntensity * decay;
      finalPos.x += (Math.random() - 0.5) * currentInt;
      finalPos.y += (Math.random() - 0.5) * currentInt;
      finalPos.z += (Math.random() - 0.5) * currentInt;
    }

    this.camera.position.copy(finalPos);
    this.camera.lookAt(this.currentLookAt);
  }

  calculateCameraTargets(comp) {
    const aliveChars = (comp.characters || []).filter(c => c.isAlive);
    const leader = comp.currentLeader || (aliveChars[0] || null);

    // Calculate centroid of remaining alive contenders
    let center = new THREE.Vector3(0, 0.5, 0);
    let spread = 10;

    if (comp.ball) {
      center.copy(comp.ball.position);
    } else if (aliveChars.length > 0) {
      center.set(0, 0, 0);
      aliveChars.forEach(c => center.add(c.body.position));
      center.divideScalar(aliveChars.length);

      let maxDistSq = 0;
      aliveChars.forEach(c => {
        const d = c.body.position.distanceTo(center);
        if (d > maxDistSq) maxDistSq = d;
      });
      spread = Math.max(6, maxDistSq);
    }

    this.focusPoint.copy(center);

    // If User is in Interactive Manual Orbit Mode
    if (this.mode === CameraMode.MANUAL) {
      const x = this.focusPoint.x + this.orbitDistance * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta);
      const y = this.focusPoint.y + this.orbitDistance * Math.cos(this.orbitPhi);
      const z = this.focusPoint.z + this.orbitDistance * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta);

      this.targetPosition.set(x, Math.max(1.0, y), z);
      this.targetLookAt.copy(this.focusPoint);
      return;
    }

    switch (this.mode) {
      case CameraMode.WIDE:
        this.targetPosition.set(0, 26, 32);
        this.targetLookAt.set(0, 0, 0);
        break;

      case CameraMode.TOP:
        this.targetPosition.set(center.x, 34 + spread * 0.6, center.z + 0.1);
        this.targetLookAt.set(center.x, 0, center.z);
        break;

      case CameraMode.CLOSE:
        if (leader) {
          const lPos = leader.body.position;
          this.targetPosition.set(lPos.x, lPos.y + 4.0, lPos.z + 6.5);
          this.targetLookAt.set(lPos.x, lPos.y + 0.6, lPos.z);
        } else {
          this.targetPosition.set(center.x, center.y + 4.5, center.z + 7.5);
          this.targetLookAt.copy(center);
        }
        break;

      case CameraMode.FOLLOW:
        if (leader) {
          const lPos = leader.body.position;
          this.targetPosition.set(lPos.x, lPos.y + 6.5, lPos.z + 10.0);
          this.targetLookAt.set(lPos.x, lPos.y + 0.6, lPos.z);
        } else {
          this.targetPosition.set(center.x, center.y + 7.0, center.z + 11.0);
          this.targetLookAt.copy(center);
        }
        break;

      case CameraMode.AUTO:
      default:
        // Dynamic cinematic framing
        const camDistance = Math.min(34, Math.max(12, spread * 1.4 + 4));
        const camHeight = Math.min(22, Math.max(8, spread * 0.8 + 4));

        this.targetPosition.set(center.x, center.y + camHeight, center.z + camDistance);
        this.targetLookAt.set(center.x, center.y + 0.5, center.z);
        break;
    }
  }
}
