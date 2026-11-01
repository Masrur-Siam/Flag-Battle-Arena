/**
 * COMPETITION 5: RISING LAVA
 * Vertical climbing survival on stepped platforms while lava rises from below!
 * Jump to higher ground. Touch the lava and you are eliminated!
 */

import * as THREE from '../libraries/three.module.js';
import { Competition } from '../js/competition-manager.js';
import { FlagCharacter } from '../js/flag-character.js';
import { AIController } from '../js/ai-controller.js';
import { BodyType, ShapeType } from '../js/physics-engine.js';

export class RisingLava extends Competition {
  constructor(engine, countries, options = {}) {
    super(engine, countries, options);
    this.modeId = 'rising-lava';
    this.modeName = 'Rising Lava';
    this.modeDescription = 'Molten lava is rising from below! Jump to higher platforms to stay alive.';
    this.lavaY = -4.0;
    this.lavaRiseSpeed = 0.55;
    this.platforms = [];
    this.arenaMeshes = [];
    this.init();
  }

  init() {
    this.buildPlatforms();
    this.buildLava();
    this.spawnCompetitors();
    this.startCountdown();
  }

  buildPlatforms() {
    // Tiered stepped spiral platforms ascending to Y = 28
    const tierCount = 14;
    for (let i = 0; i < tierCount; i++) {
      const angle = (i * 1.1);
      const radius = 7.0 - (i * 0.2);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = i * 2.1;

      const size = Math.max(3.2, 5.5 - i * 0.15);
      const platGeom = new THREE.CylinderGeometry(size * 0.5, size * 0.5, 0.8, 16);
      const platMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x334155 : 0x475569,
        roughness: 0.6
      });
      const mesh = new THREE.Mesh(platGeom, platMat);
      mesh.position.set(x, y, z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.arenaMeshes.push(mesh);

      const body = this.world.createRigidBody({
        type: BodyType.STATIC,
        position: mesh.position.clone()
      });
      this.world.createCollider({
        shapeType: ShapeType.BOX,
        halfExtents: new THREE.Vector3(size * 0.45, 0.4, size * 0.45),
        friction: 0.7
      }, body);

      this.platforms.push({
        position: mesh.position,
        size,
        mesh
      });
    }

    // Base ground platform
    const baseGeom = new THREE.CylinderGeometry(14, 14, 1.0, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1E293B });
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.position.set(0, -0.5, 0);
    this.scene.add(baseMesh);
    this.arenaMeshes.push(baseMesh);

    const baseBody = this.world.createRigidBody({ type: BodyType.STATIC, position: baseMesh.position });
    this.world.createCollider({
      shapeType: ShapeType.BOX,
      halfExtents: new THREE.Vector3(14, 0.5, 14),
      friction: 0.7
    }, baseBody);
  }

  buildLava() {
    const lavaGeom = new THREE.PlaneGeometry(80, 80, 24, 24);
    const lavaMat = new THREE.MeshStandardMaterial({
      color: 0xEF4444,
      emissive: 0xDC2626,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    this.lavaMesh = new THREE.Mesh(lavaGeom, lavaMat);
    this.lavaMesh.rotation.x = -Math.PI * 0.5;
    this.lavaMesh.position.set(0, this.lavaY, 0);
    this.scene.add(this.lavaMesh);
    this.arenaMeshes.push(this.lavaMesh);
  }

  spawnCompetitors() {
    const count = this.countries.length;
    this.countries.forEach((country, idx) => {
      const angle = (idx / count) * Math.PI * 2;
      const x = Math.cos(angle) * 6.5;
      const z = Math.sin(angle) * 6.5;

      const char = new FlagCharacter(country, this.world, {
        position: new THREE.Vector3(x, 1.5, z)
      });

      this.scene.add(char.group);
      this.characters.push(char);

      const ai = new AIController(char, this);
      this.aiControllers.push(ai);
    });
  }

  onMatchUpdate(dt) {
    // 1. Rise Lava
    this.lavaY += this.lavaRiseSpeed * dt;
    this.lavaMesh.position.y = this.lavaY;

    // Subtle lava wave ripple
    this.lavaMesh.position.y += Math.sin(Date.now() * 0.005) * 0.04;

    // 2. Check Lava Eliminations
    const alive = this.characters.filter(c => c.isAlive);
    for (const char of alive) {
      if (char.body.position.y <= this.lavaY + 0.3) {
        this.handleElimination(char, 'Engulfed in Lava!');
      }
    }

    // 3. Win Condition
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
      const last = this.eliminatedCharacters[this.eliminatedCharacters.length - 1];
      const winner = last ? last.country : this.countries[0];
      this.finishMatch(winner, [winner]);
    }
  }

  updateLeaderboard() {
    // Rank by current Y height
    const sorted = [...this.characters].sort((a, b) => {
      if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1;
      return b.body.position.y - a.body.position.y;
    });

    sorted.forEach((char, idx) => {
      char.rank = idx + 1;
      char.setLeader(idx === 0 && char.isAlive);
    });
    this.currentLeader = sorted[0] || null;
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
