/**
 * COMPETITION 9: GLASS BRIDGE
 * Suspended high-altitude bridge with pairs of tempered and fragile glass tiles.
 * Step on the fragile tile and it shatters! Remember the safe steps to survive.
 */

import * as THREE from '../libraries/three.module.js';
import { Competition } from '../js/competition-manager.js';
import { FlagCharacter } from '../js/flag-character.js';
import { AIController } from '../js/ai-controller.js';
import { BodyType, ShapeType } from '../js/physics-engine.js';
import { audio } from '../js/audio-manager.js';

export class GlassBridge extends Competition {
  constructor(engine, countries, options = {}) {
    super(engine, countries, options);
    this.modeId = 'glass-bridge';
    this.modeName = 'Glass Bridge';
    this.modeDescription = 'Pairs of glass tiles high in the sky! One tile holds, the other shatters. Choose wisely!';
    this.bridgeSteps = [];
    this.pairCount = 8;
    this.arenaMeshes = [];
    this.finishZ = 45;
    this.init();
  }

  init() {
    this.buildBridge();
    this.spawnCompetitors();
    this.startCountdown();
  }

  buildBridge() {
    // Start Platform
    const startGeom = new THREE.BoxGeometry(10, 1.0, 6);
    const startMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.6 });
    const startMesh = new THREE.Mesh(startGeom, startMat);
    startMesh.position.set(0, 0, -6);
    this.scene.add(startMesh);
    this.arenaMeshes.push(startMesh);

    const startBody = this.world.createRigidBody({ type: BodyType.STATIC, position: startMesh.position });
    this.world.createCollider({
      shapeType: ShapeType.BOX,
      halfExtents: new THREE.Vector3(5, 0.5, 3),
      friction: 0.8
    }, startBody);

    // End Goal Platform
    const endGeom = new THREE.BoxGeometry(10, 1.0, 6);
    const endMesh = new THREE.Mesh(endGeom, startMat);
    endMesh.position.set(0, 0, this.finishZ);
    this.scene.add(endMesh);
    this.arenaMeshes.push(endMesh);

    const endBody = this.world.createRigidBody({ type: BodyType.STATIC, position: endMesh.position });
    this.world.createCollider({
      shapeType: ShapeType.BOX,
      halfExtents: new THREE.Vector3(5, 0.5, 3),
      friction: 0.8
    }, endBody);

    // Glass Tile Pairs
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x67E8F9,
      transmission: 0.85,
      opacity: 0.7,
      transparent: true,
      roughness: 0.1,
      ior: 1.5
    });

    for (let i = 0; i < this.pairCount; i++) {
      const z = i * 5.5;
      const safeIndex = Math.random() < 0.5 ? 0 : 1; // 0 = left safe, 1 = right safe

      // Left tile (X = -2.2)
      const leftGeom = new THREE.BoxGeometry(2.4, 0.3, 3.2);
      const leftMesh = new THREE.Mesh(leftGeom, glassMat.clone());
      leftMesh.position.set(-2.2, 0, z);
      this.scene.add(leftMesh);
      this.arenaMeshes.push(leftMesh);

      const leftBody = this.world.createRigidBody({ type: BodyType.STATIC, position: leftMesh.position });
      const leftCol = this.world.createCollider({
        shapeType: ShapeType.BOX,
        halfExtents: new THREE.Vector3(1.2, 0.15, 1.6),
        restitution: 0.1,
        friction: 0.6
      }, leftBody);

      // Right tile (X = 2.2)
      const rightGeom = new THREE.BoxGeometry(2.4, 0.3, 3.2);
      const rightMesh = new THREE.Mesh(rightGeom, glassMat.clone());
      rightMesh.position.set(2.2, 0, z);
      this.scene.add(rightMesh);
      this.arenaMeshes.push(rightMesh);

      const rightBody = this.world.createRigidBody({ type: BodyType.STATIC, position: rightMesh.position });
      const rightCol = this.world.createCollider({
        shapeType: ShapeType.BOX,
        halfExtents: new THREE.Vector3(1.2, 0.15, 1.6),
        restitution: 0.1,
        friction: 0.6
      }, rightBody);

      this.bridgeSteps.push({
        index: i,
        z,
        safeIndex, // 0 or 1
        revealedSafe: undefined,
        left: { mesh: leftMesh, body: leftBody, collider: leftCol, broken: false },
        right: { mesh: rightMesh, body: rightBody, collider: rightCol, broken: false }
      });
    }
  }

  spawnCompetitors() {
    const count = this.countries.length;
    this.countries.forEach((country, idx) => {
      const char = new FlagCharacter(country, this.world, {
        position: new THREE.Vector3((Math.random() - 0.5) * 6, 1.2, -6 - idx * 1.5)
      });
      char.bridgeStep = 0;

      this.scene.add(char.group);
      this.characters.push(char);

      const ai = new AIController(char, this);
      this.aiControllers.push(ai);
    });
  }

  onMatchUpdate(dt) {
    const alive = this.characters.filter(c => c.isAlive);

    // 1. Check Tile Steps and Glass Breakage
    for (const char of alive) {
      const pos = char.body.position;

      // Abyss fall elimination
      if (pos.y < -3.0) {
        this.handleElimination(char, 'Fell through Glass!');
        continue;
      }

      // Check which tile pair character is currently on
      this.bridgeSteps.forEach(pair => {
        const inZ = Math.abs(pos.z - pair.z) < 1.6;
        if (inZ && pos.y >= -0.5 && pos.y <= 1.0) {
          const onLeft = Math.abs(pos.x - (-2.2)) < 1.3;
          const onRight = Math.abs(pos.x - 2.2) < 1.3;

          if (onLeft) {
            if (pair.safeIndex === 0) {
              pair.revealedSafe = 0;
              pair.left.mesh.material.color.setHex(0x10B981); // Green safe
            } else if (!pair.left.broken) {
              // Shatter left glass!
              pair.left.broken = true;
              pair.left.mesh.visible = false;
              this.world.removeCollider(pair.left.collider);
              pair.revealedSafe = 1; // Everyone learns right was safe!
              audio.playPinCrash();
              this.engine.spawnParticleBurst(pair.left.mesh.position, 20, 0x67E8F9);
            }
            char.bridgeStep = Math.max(char.bridgeStep, pair.index + 1);
          } else if (onRight) {
            if (pair.safeIndex === 1) {
              pair.revealedSafe = 1;
              pair.right.mesh.material.color.setHex(0x10B981);
            } else if (!pair.right.broken) {
              // Shatter right glass!
              pair.right.broken = true;
              pair.right.mesh.visible = false;
              this.world.removeCollider(pair.right.collider);
              pair.revealedSafe = 0;
              audio.playPinCrash();
              this.engine.spawnParticleBurst(pair.right.mesh.position, 20, 0x67E8F9);
            }
            char.bridgeStep = Math.max(char.bridgeStep, pair.index + 1);
          }
        }
      });

      // Goal reached
      if (pos.z >= this.finishZ - 1.5) {
        char.finish();
        this.finishMatch(char.country, [char.country]);
        return;
      }
    }

    // 2. Win condition on last survivor or timeout
    const remaining = this.characters.filter(c => c.isAlive);
    if (remaining.length === 1 && this.characters.length > 1) {
      this.finishMatch(remaining[0].country, [remaining[0].country]);
    } else if (remaining.length === 0 || this.matchTimer > 75) {
      const sorted = [...this.characters].sort((a, b) => b.body.position.z - a.body.position.z);
      const winner = sorted[0].country;
      this.finishMatch(winner, sorted.slice(0, 3).map(c => c.country));
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
    this.bridgeSteps = [];
  }
}
