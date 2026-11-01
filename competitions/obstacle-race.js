/**
 * COMPETITION 2: OBSTACLE RACE
 * Autonomous obstacle navigation through moving hammers, hurdles, and sweepers.
 * First flag to cross the finish line wins!
 */

import * as THREE from '../libraries/three.module.js';
import { Competition } from '../js/competition-manager.js';
import { FlagCharacter } from '../js/flag-character.js';
import { AIController } from '../js/ai-controller.js';
import { BodyType, ShapeType } from '../js/physics-engine.js';

export class ObstacleRace extends Competition {
  constructor(engine, countries, options = {}) {
    super(engine, countries, options);
    this.modeId = 'obstacle-race';
    this.modeName = 'Obstacle Race';
    this.modeDescription = 'Navigate through rotating sweepers, hurdles, and traps to reach the finish line!';
    this.trackLength = 75;
    this.trackWidth = 14;
    this.startZ = -15;
    this.finishZ = 55;
    this.obstacles = [];
    this.arenaMeshes = [];
    this.finishers = [];
    this.init();
  }

  init() {
    this.buildTrack();
    this.buildObstacles();
    this.spawnCompetitors();
    this.startCountdown();
  }

  buildTrack() {
    // 1. Race Track Floor
    const trackGeom = new THREE.BoxGeometry(this.trackWidth, 1.0, this.trackLength);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      roughness: 0.5,
      metalness: 0.1
    });
    const trackMesh = new THREE.Mesh(trackGeom, trackMat);
    trackMesh.position.set(0, -0.5, (this.startZ + this.finishZ) * 0.5);
    trackMesh.receiveShadow = true;
    this.scene.add(trackMesh);
    this.arenaMeshes.push(trackMesh);

    // Physics floor
    const floorBody = this.world.createRigidBody({
      type: BodyType.STATIC,
      position: trackMesh.position.clone()
    });
    this.world.createCollider({
      shapeType: ShapeType.BOX,
      halfExtents: new THREE.Vector3(this.trackWidth * 0.5, 0.5, this.trackLength * 0.5),
      restitution: 0.2,
      friction: 0.7
    }, floorBody);

    // 2. Side Guard Rails
    [-this.trackWidth * 0.5, this.trackWidth * 0.5].forEach(x => {
      const railGeom = new THREE.BoxGeometry(0.8, 1.4, this.trackLength);
      const railMat = new THREE.MeshStandardMaterial({ color: 0x3B82F6 });
      const railMesh = new THREE.Mesh(railGeom, railMat);
      railMesh.position.set(x, 0.7, (this.startZ + this.finishZ) * 0.5);
      this.scene.add(railMesh);
      this.arenaMeshes.push(railMesh);

      const railBody = this.world.createRigidBody({
        type: BodyType.STATIC,
        position: railMesh.position.clone()
      });
      this.world.createCollider({
        shapeType: ShapeType.BOX,
        halfExtents: new THREE.Vector3(0.4, 0.7, this.trackLength * 0.5),
        restitution: 0.8,
        friction: 0.2
      }, railBody);
    });

    // 3. Finish Line Arch
    const archGeom = new THREE.BoxGeometry(this.trackWidth, 0.8, 1.0);
    const archMat = new THREE.MeshStandardMaterial({ color: 0xFBBF24, emissive: 0x78350F });
    const archMesh = new THREE.Mesh(archGeom, archMat);
    archMesh.position.set(0, 4.5, this.finishZ);
    this.scene.add(archMesh);
    this.arenaMeshes.push(archMesh);
  }

  buildObstacles() {
    // Rotating Sweeper Arms at multiple intervals
    const sweeperPositions = [5, 20, 35];
    sweeperPositions.forEach((z, idx) => {
      const armGeom = new THREE.BoxGeometry(this.trackWidth * 0.85, 0.8, 0.8);
      const armMat = new THREE.MeshStandardMaterial({
        color: idx % 2 === 0 ? 0xEF4444 : 0x8B5CF6,
        roughness: 0.3
      });
      const armMesh = new THREE.Mesh(armGeom, armMat);
      armMesh.position.set(0, 0.6, z);
      armMesh.castShadow = true;
      this.scene.add(armMesh);
      this.arenaMeshes.push(armMesh);

      const armBody = this.world.createRigidBody({
        type: BodyType.KINEMATIC,
        position: armMesh.position.clone()
      });
      this.world.createCollider({
        shapeType: ShapeType.BOX,
        halfExtents: new THREE.Vector3(this.trackWidth * 0.42, 0.4, 0.4),
        restitution: 0.9,
        friction: 0.1
      }, armBody);

      this.obstacles.push({
        mesh: armMesh,
        body: armBody,
        type: 'sweeper',
        speed: (idx % 2 === 0 ? 1 : -1) * 2.2
      });
    });

    // Lateral Sliding Bumpers
    const bumperZ = [12, 28, 44];
    bumperZ.forEach((z, idx) => {
      const blockGeom = new THREE.BoxGeometry(4.0, 1.2, 1.5);
      const blockMat = new THREE.MeshStandardMaterial({ color: 0x10B981, roughness: 0.3 });
      const blockMesh = new THREE.Mesh(blockGeom, blockMat);
      blockMesh.position.set(0, 0.6, z);
      this.scene.add(blockMesh);
      this.arenaMeshes.push(blockMesh);

      const blockBody = this.world.createRigidBody({
        type: BodyType.KINEMATIC,
        position: blockMesh.position.clone()
      });
      this.world.createCollider({
        shapeType: ShapeType.BOX,
        halfExtents: new THREE.Vector3(2.0, 0.6, 0.75),
        restitution: 0.9
      }, blockBody);

      this.obstacles.push({
        mesh: blockMesh,
        body: blockBody,
        type: 'slider',
        phase: idx * 1.5,
        speed: 2.8,
        z
      });
    });
  }

  spawnCompetitors() {
    const count = this.countries.length;
    const spacing = (this.trackWidth * 0.8) / Math.max(1, count - 1);

    this.countries.forEach((country, idx) => {
      const x = -this.trackWidth * 0.4 + idx * spacing;
      const char = new FlagCharacter(country, this.world, {
        position: new THREE.Vector3(x, 1.2, this.startZ)
      });

      this.scene.add(char.group);
      this.characters.push(char);

      const ai = new AIController(char, this);
      this.aiControllers.push(ai);
    });
  }

  onMatchUpdate(dt) {
    // 1. Animate Kinematic Obstacles
    this.obstacles.forEach(obs => {
      if (obs.type === 'sweeper') {
        obs.mesh.rotation.y += obs.speed * dt;
        obs.body.quaternion.copy(obs.mesh.quaternion);
      } else if (obs.type === 'slider') {
        const x = Math.sin(Date.now() * 0.003 * obs.speed + obs.phase) * (this.trackWidth * 0.3);
        obs.mesh.position.x = x;
        obs.body.position.x = x;
      }
    });

    // 2. Check Finish Line Crossings
    for (const char of this.characters) {
      if (char.isAlive && !char.hasFinished) {
        if (char.body.position.z >= this.finishZ) {
          char.finish();
          this.finishers.push(char);
          this.engine.spawnParticleBurst(char.body.position, 35, 0xFBBF24);

          // Check if we have 1st, 2nd, 3rd or all finished
          if (this.finishers.length >= Math.min(3, this.characters.length)) {
            const winner = this.finishers[0].country;
            const podium = this.finishers.map(f => f.country);
            this.finishMatch(winner, podium);
            return;
          }
        }
      }
    }

    // Match Timeout
    if (this.matchTimer > 90) {
      // Rank by closest Z distance to finish line
      const sorted = [...this.characters].sort((a, b) => b.body.position.z - a.body.position.z);
      const winner = sorted[0].country;
      this.finishMatch(winner, sorted.slice(0, 3).map(c => c.country));
    }
  }

  updateLeaderboard() {
    // Rank by Z progression along track
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
    this.obstacles = [];
  }
}
