/**
 * COMPETITION 11: TOWER CLIMB
 * Ascend a spiral obstacle tower with rotating sweeper arms!
 * Avoid being knocked off the spiral ramp to reach the summit crown.
 */

import * as THREE from '../libraries/three.module.js';
import { Competition } from '../js/competition-manager.js';
import { FlagCharacter } from '../js/flag-character.js';
import { AIController } from '../js/ai-controller.js';
import { BodyType, ShapeType } from '../js/physics-engine.js';

export class TowerClimb extends Competition {
  constructor(engine, countries, options = {}) {
    super(engine, countries, options);
    this.modeId = 'tower-climb';
    this.modeName = 'Tower Climb';
    this.modeDescription = 'Climb the spiral obstacle tower! Duck and jump past rotating sweeper arms to claim the crown.';
    this.towerHeight = 24;
    this.towerRadius = 7.5;
    this.sweepers = [];
    this.arenaMeshes = [];
    this.init();
  }

  init() {
    this.buildTower();
    this.spawnCompetitors();
    this.startCountdown();
  }

  buildTower() {
    // 1. Center Pillar
    const centerGeom = new THREE.CylinderGeometry(2.5, 2.5, this.towerHeight, 32);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.7 });
    const centerMesh = new THREE.Mesh(centerGeom, centerMat);
    centerMesh.position.y = this.towerHeight * 0.5;
    this.scene.add(centerMesh);
    this.arenaMeshes.push(centerMesh);

    // 2. Spiral Steps around pillar (32 steps ascending)
    const stepCount = 28;
    for (let i = 0; i < stepCount; i++) {
      const angle = i * 0.38;
      const y = i * 0.8;
      const x = Math.cos(angle) * (this.towerRadius * 0.8);
      const z = Math.sin(angle) * (this.towerRadius * 0.8);

      const stepGeom = new THREE.BoxGeometry(3.5, 0.4, 2.2);
      const stepMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x3B82F6 : 0x1D4ED8,
        roughness: 0.5
      });
      const stepMesh = new THREE.Mesh(stepGeom, stepMat);
      stepMesh.position.set(x, y, z);
      stepMesh.rotation.y = -angle + Math.PI * 0.5;
      stepMesh.receiveShadow = true;
      this.scene.add(stepMesh);
      this.arenaMeshes.push(stepMesh);

      const body = this.world.createRigidBody({
        type: BodyType.STATIC,
        position: stepMesh.position.clone()
      });
      this.world.createCollider({
        shapeType: ShapeType.BOX,
        halfExtents: new THREE.Vector3(1.75, 0.2, 1.1),
        friction: 0.8
      }, body);
    }

    // 3. Rotating Sweeper Arms at multiple heights
    const sweeperY = [4.5, 10.5, 16.5];
    sweeperY.forEach((y, idx) => {
      const armGeom = new THREE.BoxGeometry(this.towerRadius * 2.2, 0.5, 0.5);
      const armMat = new THREE.MeshStandardMaterial({ color: 0xEF4444, roughness: 0.3 });
      const armMesh = new THREE.Mesh(armGeom, armMat);
      armMesh.position.set(0, y, 0);
      this.scene.add(armMesh);
      this.arenaMeshes.push(armMesh);

      const armBody = this.world.createRigidBody({
        type: BodyType.KINEMATIC,
        position: armMesh.position.clone()
      });
      this.world.createCollider({
        shapeType: ShapeType.BOX,
        halfExtents: new THREE.Vector3(this.towerRadius * 1.1, 0.25, 0.25),
        restitution: 0.9
      }, armBody);

      this.sweepers.push({
        mesh: armMesh,
        body: armBody,
        speed: (idx % 2 === 0 ? 1 : -1) * 1.8
      });
    });

    // 4. Summit Crown Platform
    const summitGeom = new THREE.CylinderGeometry(4.5, 4.5, 1.0, 32);
    const summitMat = new THREE.MeshStandardMaterial({ color: 0xFBBF24, emissive: 0x78350F });
    const summitMesh = new THREE.Mesh(summitGeom, summitMat);
    summitMesh.position.set(0, this.towerHeight, 0);
    this.scene.add(summitMesh);
    this.arenaMeshes.push(summitMesh);

    const summitBody = this.world.createRigidBody({ type: BodyType.STATIC, position: summitMesh.position });
    this.world.createCollider({
      shapeType: ShapeType.BOX,
      halfExtents: new THREE.Vector3(4.5, 0.5, 4.5),
      friction: 0.8
    }, summitBody);
  }

  spawnCompetitors() {
    const count = this.countries.length;
    this.countries.forEach((country, idx) => {
      const angle = idx * 0.4;
      const x = Math.cos(angle) * (this.towerRadius * 0.8);
      const z = Math.sin(angle) * (this.towerRadius * 0.8);

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
    // 1. Rotate Sweepers
    this.sweepers.forEach(sw => {
      sw.mesh.rotation.y += sw.speed * dt;
      sw.body.quaternion.copy(sw.mesh.quaternion);
    });

    // 2. Check Height / Summit Reach
    for (const char of this.characters) {
      if (char.isAlive && !char.hasFinished) {
        if (char.body.position.y >= this.towerHeight - 0.5) {
          char.finish();
          this.engine.spawnParticleBurst(char.body.position, 40, 0xFBBF24);
          this.finishMatch(char.country, [char.country]);
          return;
        }

        if (char.body.position.y < -2.0) {
          this.handleElimination(char, 'Fell off Tower!');
        }
      }
    }

    // Timeout
    if (this.matchTimer > 75) {
      const sorted = [...this.characters].sort((a, b) => b.body.position.y - a.body.position.y);
      const winner = sorted[0].country;
      this.finishMatch(winner, sorted.slice(0, 3).map(c => c.country));
    }
  }

  updateLeaderboard() {
    const sorted = [...this.characters].sort((a, b) => {
      if (a.hasFinished !== b.hasFinished) return a.hasFinished ? -1 : 1;
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
    this.sweepers = [];
  }
}
