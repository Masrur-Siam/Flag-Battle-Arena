/**
 * COMPETITION 8: DOWNHILL RACE
 * High-speed physics slope race!
 * Roll and steer down an inclined ramp with jumps, banked turns, and boosters.
 */

import * as THREE from '../libraries/three.module.js';
import { Competition } from '../js/competition-manager.js';
import { FlagCharacter } from '../js/flag-character.js';
import { AIController } from '../js/ai-controller.js';
import { BodyType, ShapeType } from '../js/physics-engine.js';

export class DownhillRace extends Competition {
  constructor(engine, countries, options = {}) {
    super(engine, countries, options);
    this.modeId = 'downhill-race';
    this.modeName = 'Downhill Race';
    this.modeDescription = 'Physics gravity downhill race! First flag to reach the bottom finish line wins.';
    this.trackWidth = 14;
    this.slopeSegments = 8;
    this.finishZ = 75;
    this.arenaMeshes = [];
    this.finishers = [];
    this.init();
  }

  init() {
    this.buildDownhillTrack();
    this.spawnCompetitors();
    this.startCountdown();
  }

  buildDownhillTrack() {
    // Stepped descending slope segments
    const segmentLength = 12;
    for (let i = 0; i < this.slopeSegments; i++) {
      const z = i * segmentLength;
      const y = (this.slopeSegments - i) * 2.8;

      const segGeom = new THREE.BoxGeometry(this.trackWidth, 1.0, segmentLength + 1);
      const segMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x1E293B : 0x0F172A,
        roughness: 0.3
      });
      const mesh = new THREE.Mesh(segGeom, segMat);
      mesh.rotation.x = 0.22; // Incline angle
      mesh.position.set(0, y, z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.arenaMeshes.push(mesh);

      const body = this.world.createRigidBody({
        type: BodyType.STATIC,
        position: mesh.position.clone(),
        quaternion: mesh.quaternion.clone()
      });
      this.world.createCollider({
        shapeType: ShapeType.BOX,
        halfExtents: new THREE.Vector3(this.trackWidth * 0.5, 0.5, (segmentLength + 1) * 0.5),
        restitution: 0.3,
        friction: 0.2 // Slippery for fast downhill roll
      }, body);

      // Guard rails
      [-this.trackWidth * 0.5, this.trackWidth * 0.5].forEach(x => {
        const railGeom = new THREE.BoxGeometry(0.6, 1.6, segmentLength + 1);
        const railMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B });
        const rail = new THREE.Mesh(railGeom, railMat);
        rail.rotation.x = 0.22;
        rail.position.set(x, y + 0.8, z);
        this.scene.add(rail);
        this.arenaMeshes.push(rail);

        const railBody = this.world.createRigidBody({ type: BodyType.STATIC, position: rail.position, quaternion: rail.quaternion });
        this.world.createCollider({
          shapeType: ShapeType.BOX,
          halfExtents: new THREE.Vector3(0.3, 0.8, (segmentLength + 1) * 0.5),
          restitution: 0.8
        }, railBody);
      });
    }

    // Finish Gateway Arch at bottom
    const finishArchGeom = new THREE.BoxGeometry(this.trackWidth, 1.2, 1.2);
    const finishArchMat = new THREE.MeshStandardMaterial({ color: 0x10B981, emissive: 0x059669 });
    const finishArch = new THREE.Mesh(finishArchGeom, finishArchMat);
    finishArch.position.set(0, 3.5, this.finishZ);
    this.scene.add(finishArch);
    this.arenaMeshes.push(finishArch);
  }

  spawnCompetitors() {
    const count = this.countries.length;
    const spacing = (this.trackWidth * 0.8) / Math.max(1, count - 1);
    const startY = this.slopeSegments * 2.8 + 2.5;

    this.countries.forEach((country, idx) => {
      const x = -this.trackWidth * 0.4 + idx * spacing;
      const char = new FlagCharacter(country, this.world, {
        position: new THREE.Vector3(x, startY, -2.0)
      });

      this.scene.add(char.group);
      this.characters.push(char);

      const ai = new AIController(char, this);
      this.aiControllers.push(ai);
    });
  }

  onMatchUpdate(dt) {
    // Check finish line crossing
    for (const char of this.characters) {
      if (char.isAlive && !char.hasFinished) {
        if (char.body.position.z >= this.finishZ) {
          char.finish();
          this.finishers.push(char);
          this.engine.spawnParticleBurst(char.body.position, 35, 0x10B981);

          if (this.finishers.length >= Math.min(3, this.characters.length)) {
            const winner = this.finishers[0].country;
            this.finishMatch(winner, this.finishers.map(f => f.country));
            return;
          }
        }
      }
    }

    // Timeout
    if (this.matchTimer > 60) {
      const sorted = [...this.characters].sort((a, b) => b.body.position.z - a.body.position.z);
      const winner = sorted[0].country;
      this.finishMatch(winner, sorted.slice(0, 3).map(c => c.country));
    }
  }

  updateLeaderboard() {
    const sorted = [...this.characters].sort((a, b) => {
      if (a.hasFinished !== b.hasFinished) return a.hasFinished ? -1 : 1;
      return b.body.position.z - a.body.position.z;
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
    this.finishers = [];
  }
}
