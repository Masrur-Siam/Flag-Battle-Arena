/**
 * COMPETITION 1: SUMO BATTLE
 * Push competitors outside a circular arena ring.
 * Last flag remaining inside the circle wins!
 */

import * as THREE from '../libraries/three.module.js';
import { Competition } from '../js/competition-manager.js';
import { FlagCharacter } from '../js/flag-character.js';
import { AIController } from '../js/ai-controller.js';
import { BodyType, ShapeType } from '../js/physics-engine.js';

export class SumoBattle extends Competition {
  constructor(engine, countries, options = {}) {
    super(engine, countries, options);
    this.modeId = 'sumo';
    this.modeName = 'Circle Battle (সার্কেল ফাইট)';
    this.modeDescription = 'Random country flags battle in a circle! Fall out and you are eliminated. Last flag standing wins!';
    this.ringRadius = Math.max(9, Math.min(16, 6 + countries.length * 0.65));
    this.arenaMeshes = [];
    this.init();
  }

  init() {
    this.buildArena();
    this.spawnCompetitors();
    this.startCountdown();
  }

  buildArena() {
    // 1. Raised Circular Battle Platform
    const platformGeom = new THREE.CylinderGeometry(this.ringRadius, this.ringRadius + 0.5, 1.2, 64);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      roughness: 0.4,
      metalness: 0.2
    });
    const platformMesh = new THREE.Mesh(platformGeom, platformMat);
    platformMesh.position.y = -0.6;
    platformMesh.receiveShadow = true;
    this.scene.add(platformMesh);
    this.arenaMeshes.push(platformMesh);

    // 2. High-Contrast Outer Danger Ring
    const dangerRingGeom = new THREE.RingGeometry(this.ringRadius - 1.2, this.ringRadius, 64);
    const dangerRingMat = new THREE.MeshBasicMaterial({
      color: 0xEF4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35
    });
    const dangerRing = new THREE.Mesh(dangerRingGeom, dangerRingMat);
    dangerRing.rotation.x = -Math.PI * 0.5;
    dangerRing.position.y = 0.02;
    this.scene.add(dangerRing);
    this.arenaMeshes.push(dangerRing);

    // 3. Glowing Neon Circle Border (Ring boundary)
    const ringBorderGeom = new THREE.TorusGeometry(this.ringRadius, 0.3, 16, 64);
    const ringBorderMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      emissive: 0xD97706,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const ringMesh = new THREE.Mesh(ringBorderGeom, ringBorderMat);
    ringMesh.rotation.x = Math.PI * 0.5;
    ringMesh.position.y = 0.08;
    this.scene.add(ringMesh);
    this.arenaMeshes.push(ringMesh);

    // 4. Center Concentric Target Rings
    const centerRingGeom = new THREE.RingGeometry(0, 3.2, 48);
    const centerRingMat = new THREE.MeshBasicMaterial({
      color: 0x3B82F6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    const centerMesh = new THREE.Mesh(centerRingGeom, centerRingMat);
    centerMesh.rotation.x = -Math.PI * 0.5;
    centerMesh.position.y = 0.03;
    this.scene.add(centerMesh);
    this.arenaMeshes.push(centerMesh);

    const innerDotGeom = new THREE.CircleGeometry(1.0, 32);
    const innerDotMat = new THREE.MeshBasicMaterial({
      color: 0xFDE047,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const innerDot = new THREE.Mesh(innerDotGeom, innerDotMat);
    innerDot.rotation.x = -Math.PI * 0.5;
    innerDot.position.y = 0.04;
    this.scene.add(innerDot);
    this.arenaMeshes.push(innerDot);

    // 5. Physics Floor Collider
    const floorBody = this.world.createRigidBody({
      type: BodyType.STATIC,
      position: new THREE.Vector3(0, -0.6, 0)
    });
    this.world.createCollider({
      shapeType: ShapeType.BOX,
      halfExtents: new THREE.Vector3(this.ringRadius * 0.95, 0.6, this.ringRadius * 0.95),
      restitution: 0.35,
      friction: 0.65
    }, floorBody);
  }

  spawnCompetitors() {
    const count = this.countries.length;
    const spawnRadius = this.ringRadius * 0.65;

    this.countries.forEach((country, idx) => {
      const angle = (idx / count) * Math.PI * 2;
      const x = Math.cos(angle) * spawnRadius;
      const z = Math.sin(angle) * spawnRadius;

      const char = new FlagCharacter(country, this.world, {
        position: new THREE.Vector3(x, 1.2, z)
      });

      this.scene.add(char.group);
      this.characters.push(char);

      const ai = new AIController(char, this);
      this.aiControllers.push(ai);
    });
  }

  onMatchUpdate(dt) {
    const alive = this.characters.filter(c => c.isAlive);

    // Sudden-Death Fallback (Section 15: Maximum match duration)
    if (this.matchTimer > 65 && alive.length > 2) {
      // Sudden death speed boost & edge contraction
      this.ringRadius = Math.max(7.0, this.ringRadius - dt * 0.15);
      if (this.matchTimer > 95) {
        // Find competitor teetering furthest from the center and eliminate
        alive.sort((a, b) => {
          const da = a.body.position.x ** 2 + a.body.position.z ** 2;
          const db = b.body.position.x ** 2 + b.body.position.z ** 2;
          return db - da;
        });
        if (alive[0]) {
          this.handleElimination(alive[0], 'eliminated in Sudden Death!');
        }
      }
    }

    // Check Ring Outs
    for (const char of alive) {
      const pos = char.body.position;
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);

      if (dist > this.ringRadius + 0.5 || pos.y < -1.4) {
        this.handleElimination(char, 'fell out of the circle!');
      }
    }

    // Check Win Condition
    const remaining = this.characters.filter(c => c.isAlive);
    if (remaining.length === 1 && this.characters.length > 1) {
      const winner = remaining[0].country;
      const podium = [
        winner,
        this.eliminatedCharacters[this.eliminatedCharacters.length - 1]?.country || winner,
        this.eliminatedCharacters[this.eliminatedCharacters.length - 2]?.country || winner
      ];
      this.finishMatch(winner, podium);
    } else if (remaining.length === 0) {
      // Tie / last simultaneous fall
      const last = this.eliminatedCharacters[this.eliminatedCharacters.length - 1];
      const winner = last ? last.country : this.countries[0];
      this.finishMatch(winner, [winner]);
    }
  }

  destroy() {
    super.destroy();
    this.arenaMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    this.arenaMeshes = [];
  }
}
