/**
 * COMPETITION 7: JUMP CHALLENGE
 * Ascending stepping stones and pillars across a canyon!
 * Leap from pillar to pillar. Miss a jump and you fall into the canyon!
 */

import * as THREE from '../libraries/three.module.js';
import { Competition } from '../js/competition-manager.js';
import { FlagCharacter } from '../js/flag-character.js';
import { AIController } from '../js/ai-controller.js';
import { BodyType, ShapeType } from '../js/physics-engine.js';

export class JumpChallenge extends Competition {
  constructor(engine, countries, options = {}) {
    super(engine, countries, options);
    this.modeId = 'jump-challenge';
    this.modeName = 'Jump Challenge';
    this.modeDescription = 'Leap across floating pillars of increasing height and distance! Highest jump climber wins.';
    this.pillars = [];
    this.arenaMeshes = [];
    this.init();
  }

  init() {
    this.buildPillars();
    this.spawnCompetitors();
    this.startCountdown();
  }

  buildPillars() {
    // 12 sequential ascending pillars
    const count = 12;
    for (let i = 0; i < count; i++) {
      const z = -12 + i * 5.2;
      const y = i * 1.5;
      const radius = Math.max(1.4, 3.2 - i * 0.14);

      const pillarGeom = new THREE.CylinderGeometry(radius, radius + 0.3, y + 6, 24);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: i === count - 1 ? 0xFBBF24 : (i % 2 === 0 ? 0x3B82F6 : 0x8B5CF6),
        roughness: 0.4
      });
      const mesh = new THREE.Mesh(pillarGeom, pillarMat);
      mesh.position.set(0, y * 0.5 - 1.5, z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.arenaMeshes.push(mesh);

      const body = this.world.createRigidBody({
        type: BodyType.STATIC,
        position: new THREE.Vector3(0, y, z)
      });
      this.world.createCollider({
        shapeType: ShapeType.BOX,
        halfExtents: new THREE.Vector3(radius, 0.4, radius),
        restitution: 0.2,
        friction: 0.8
      }, body);

      this.pillars.push({
        mesh,
        body,
        index: i,
        topY: y
      });
    }

    // Starting platform
    const startGeom = new THREE.BoxGeometry(12, 1.0, 8);
    const startMat = new THREE.MeshStandardMaterial({ color: 0x1E293B });
    const startMesh = new THREE.Mesh(startGeom, startMat);
    startMesh.position.set(0, -0.5, -16);
    this.scene.add(startMesh);
    this.arenaMeshes.push(startMesh);

    const startBody = this.world.createRigidBody({ type: BodyType.STATIC, position: startMesh.position });
    this.world.createCollider({
      shapeType: ShapeType.BOX,
      halfExtents: new THREE.Vector3(6, 0.5, 4),
      friction: 0.8
    }, startBody);
  }

  spawnCompetitors() {
    const count = this.countries.length;
    const spacing = 10 / Math.max(1, count - 1);

    this.countries.forEach((country, idx) => {
      const x = -5 + idx * spacing;
      const char = new FlagCharacter(country, this.world, {
        position: new THREE.Vector3(x, 1.2, -16)
      });
      char.pillarIdx = 0;

      this.scene.add(char.group);
      this.characters.push(char);

      const ai = new AIController(char, this);
      this.aiControllers.push(ai);
    });
  }

  onMatchUpdate(dt) {
    // 1. Check pillar progress & canyon falls
    const alive = this.characters.filter(c => c.isAlive);
    for (const char of alive) {
      if (char.body.position.y < -3.0) {
        this.handleElimination(char, 'Missed Jump!');
        continue;
      }

      // Track which pillar the character is standing on or near
      this.pillars.forEach((p, idx) => {
        const d = char.body.position.distanceTo(p.mesh.position);
        if (d < 3.2 && char.body.position.y >= p.topY - 0.5) {
          if (idx >= char.pillarIdx) {
            char.pillarIdx = idx + 1;
            char.score = char.pillarIdx * 10;
          }
        }
      });

      // If reached summit pillar!
      if (char.pillarIdx >= this.pillars.length) {
        char.finish();
        this.engine.spawnParticleBurst(char.body.position, 40, 0xFBBF24);
        this.finishMatch(char.country, [char.country]);
        return;
      }
    }

    // 2. Win condition on last survivor or timeout
    const remaining = this.characters.filter(c => c.isAlive);
    if (remaining.length === 1 && this.characters.length > 1) {
      this.finishMatch(remaining[0].country, [remaining[0].country]);
    } else if (remaining.length === 0 || this.matchTimer > 60) {
      const sorted = [...this.characters].sort((a, b) => b.score - a.score || b.body.position.y - a.body.position.y);
      const winner = sorted[0].country;
      this.finishMatch(winner, sorted.slice(0, 3).map(c => c.country));
    }
  }

  updateLeaderboard() {
    const sorted = [...this.characters].sort((a, b) => b.score - a.score || b.body.position.z - a.body.position.z);
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
    this.pillars = [];
  }
}
