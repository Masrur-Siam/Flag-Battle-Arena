/**
 * COMPETITION 6: BOWLING CHALLENGE
 * High-speed physical bowling roll towards a 10-pin triangle!
 * Flags charge down the lane to knock down as many pins as possible.
 */

import * as THREE from '../libraries/three.module.js';
import { Competition } from '../js/competition-manager.js';
import { FlagCharacter } from '../js/flag-character.js';
import { AIController } from '../js/ai-controller.js';
import { BodyType, ShapeType } from '../js/physics-engine.js';
import { audio } from '../js/audio-manager.js';

export class BowlingChallenge extends Competition {
  constructor(engine, countries, options = {}) {
    super(engine, countries, options);
    this.modeId = 'bowling';
    this.modeName = 'Bowling Challenge';
    this.modeDescription = 'Charge down the lane and crash into the pins! Flag with the most pin knockdowns wins.';
    this.laneLength = 36;
    this.laneWidth = 10;
    this.pins = [];
    this.arenaMeshes = [];
    this.currentTurnIndex = 0;
    this.init();
  }

  init() {
    this.buildLane();
    this.setupPins();
    this.spawnCompetitors();
    this.startCountdown();
  }

  buildLane() {
    // 1. Polished Bowling Alley Floor
    const floorGeom = new THREE.BoxGeometry(this.laneWidth, 0.8, this.laneLength);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x92400E, // Warm bowling wood
      roughness: 0.15,
      metalness: 0.1
    });
    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.position.set(0, -0.4, 0);
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);
    this.arenaMeshes.push(floorMesh);

    const floorBody = this.world.createRigidBody({
      type: BodyType.STATIC,
      position: floorMesh.position.clone()
    });
    this.world.createCollider({
      shapeType: ShapeType.BOX,
      halfExtents: new THREE.Vector3(this.laneWidth * 0.5, 0.4, this.laneLength * 0.5),
      restitution: 0.15,
      friction: 0.2 // Slippery polished wood
    }, floorBody);

    // 2. Gutters / Side Bumpers
    [-this.laneWidth * 0.5, this.laneWidth * 0.5].forEach(x => {
      const wallGeom = new THREE.BoxGeometry(0.6, 1.2, this.laneLength);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x1E293B });
      const wall = new THREE.Mesh(wallGeom, wallMat);
      wall.position.set(x, 0.6, 0);
      this.scene.add(wall);
      this.arenaMeshes.push(wall);

      const wallBody = this.world.createRigidBody({ type: BodyType.STATIC, position: wall.position });
      this.world.createCollider({
        shapeType: ShapeType.BOX,
        halfExtents: new THREE.Vector3(0.3, 0.6, this.laneLength * 0.5),
        restitution: 0.8
      }, wallBody);
    });

    // 3. Backstop Cushion
    const backstopGeom = new THREE.BoxGeometry(this.laneWidth, 3.0, 1.0);
    const backstopMat = new THREE.MeshStandardMaterial({ color: 0x0F172A });
    const backstop = new THREE.Mesh(backstopGeom, backstopMat);
    backstop.position.set(0, 1.5, this.laneLength * 0.5 + 0.5);
    this.scene.add(backstop);
    this.arenaMeshes.push(backstop);
  }

  setupPins() {
    // Standard 10-pin triangle setup at Z = 12
    const baseZ = 10;
    const pinRows = [
      [0],                   // Pin 1
      [-0.7, 0.7],           // Pins 2, 3
      [-1.4, 0, 1.4],        // Pins 4, 5, 6
      [-2.1, -0.7, 0.7, 2.1] // Pins 7, 8, 9, 10
    ];

    pinRows.forEach((row, rowIdx) => {
      const z = baseZ + rowIdx * 1.2;
      row.forEach(x => {
        // Bowling pin mesh (white cylinder with red stripes)
        const pinGeom = new THREE.CylinderGeometry(0.2, 0.32, 1.4, 16);
        const pinMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
        const pinMesh = new THREE.Mesh(pinGeom, pinMat);
        pinMesh.position.set(x, 0.7, z);
        pinMesh.castShadow = true;
        this.scene.add(pinMesh);
        this.arenaMeshes.push(pinMesh);

        // Physics body for pin
        const body = this.world.createRigidBody({
          type: BodyType.DYNAMIC,
          position: pinMesh.position.clone(),
          mass: 0.6,
          linearDamping: 0.15,
          angularDamping: 0.2
        });

        const collider = this.world.createCollider({
          shapeType: ShapeType.BOX,
          halfExtents: new THREE.Vector3(0.3, 0.7, 0.3),
          restitution: 0.6,
          friction: 0.3,
          onCollision: (other, normal, impulse) => {
            if (impulse > 1.5) {
              audio.playPinCrash();
            }
          }
        }, body);

        this.pins.push({
          mesh: pinMesh,
          body,
          knocked: false,
          originalY: pinMesh.position.y
        });
      });
    });
  }

  spawnCompetitors() {
    const count = this.countries.length;
    const spacing = (this.laneWidth * 0.7) / Math.max(1, count - 1);

    this.countries.forEach((country, idx) => {
      const x = -this.laneWidth * 0.35 + idx * spacing;
      const char = new FlagCharacter(country, this.world, {
        position: new THREE.Vector3(x, 1.2, -this.laneLength * 0.42)
      });

      this.scene.add(char.group);
      this.characters.push(char);

      const ai = new AIController(char, this);
      this.aiControllers.push(ai);
    });
  }

  onMatchUpdate(dt) {
    // Sync Pins Visuals to Physics & Check Knocks
    let newKnocks = 0;
    this.pins.forEach(pin => {
      pin.mesh.position.copy(pin.body.position);
      pin.mesh.quaternion.copy(pin.body.quaternion);

      // Pin is knocked if tilted significantly or dropped below threshold
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(pin.body.quaternion);
      if (!pin.knocked && (up.y < 0.65 || pin.body.position.y < 0.2)) {
        pin.knocked = true;
        newKnocks++;
      }
    });

    if (newKnocks > 0) {
      audio.playPinCrash();
    }

    // Award scores based on closest proximity to pins & knocks
    this.characters.forEach(char => {
      const knockedCount = this.pins.filter(p => p.knocked).length;
      char.score = knockedCount;
    });

    // Check match completion
    const allKnocked = this.pins.every(p => p.knocked);
    if (allKnocked || this.matchTimer > 40) {
      const sorted = [...this.characters].sort((a, b) => b.score - a.score || b.body.position.z - a.body.position.z);
      const winner = sorted[0].country;
      this.finishMatch(winner, sorted.slice(0, 3).map(c => c.country));
    }
  }

  updateLeaderboard() {
    const sorted = [...this.characters].sort((a, b) => b.score - a.score || b.body.position.z - a.body.position.z);
    sorted.forEach((char, idx) => {
      char.rank = idx + 1;
      char.setLeader(idx === 0);
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
    this.pins = [];
  }
}
