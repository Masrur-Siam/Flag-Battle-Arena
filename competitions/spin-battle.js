/**
 * COMPETITION 10: SPIN BATTLE
 * High-velocity spinning bumper battle!
 * Collide with tremendous rotational momentum to knock opponents over the outer bowl rim.
 */

import * as THREE from '../libraries/three.module.js';
import { Competition } from '../js/competition-manager.js';
import { FlagCharacter } from '../js/flag-character.js';
import { AIController } from '../js/ai-controller.js';
import { BodyType, ShapeType } from '../js/physics-engine.js';

export class SpinBattle extends Competition {
  constructor(engine, countries, options = {}) {
    super(engine, countries, options);
    this.modeId = 'spin-battle';
    this.modeName = 'Spin Battle';
    this.modeDescription = 'High-speed spinning bumper flags! High restitution collisions knock rivals out of the bowl.';
    this.bowlRadius = 14;
    this.arenaMeshes = [];
    this.init();
  }

  init() {
    this.buildBowl();
    this.spawnCompetitors();
    this.startCountdown();
  }

  buildBowl() {
    // 1. Inverted Concave Bowl Floor
    const bowlGeom = new THREE.CylinderGeometry(this.bowlRadius, this.bowlRadius - 2.5, 2.0, 48);
    const bowlMat = new THREE.MeshStandardMaterial({
      color: 0x1E1B4B,
      roughness: 0.3,
      metalness: 0.4
    });
    const bowlMesh = new THREE.Mesh(bowlGeom, bowlMat);
    bowlMesh.position.y = -1.0;
    bowlMesh.receiveShadow = true;
    this.scene.add(bowlMesh);
    this.arenaMeshes.push(bowlMesh);

    const floorBody = this.world.createRigidBody({
      type: BodyType.STATIC,
      position: bowlMesh.position.clone()
    });
    this.world.createCollider({
      shapeType: ShapeType.BOX,
      halfExtents: new THREE.Vector3(this.bowlRadius * 0.9, 1.0, this.bowlRadius * 0.9),
      restitution: 0.8, // High-energy bouncy floor
      friction: 0.1
    }, floorBody);

    // 2. Neon Bumper Ring on Rim
    const rimGeom = new THREE.TorusGeometry(this.bowlRadius, 0.4, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xA855F7,
      emissive: 0x7E22CE,
      emissiveIntensity: 0.7
    });
    const rimMesh = new THREE.Mesh(rimGeom, rimMat);
    rimMesh.rotation.x = Math.PI * 0.5;
    rimMesh.position.y = 0.2;
    this.scene.add(rimMesh);
    this.arenaMeshes.push(rimMesh);
  }

  spawnCompetitors() {
    const count = this.countries.length;
    const spawnRadius = this.bowlRadius * 0.6;

    this.countries.forEach((country, idx) => {
      const angle = (idx / count) * Math.PI * 2;
      const x = Math.cos(angle) * spawnRadius;
      const z = Math.sin(angle) * spawnRadius;

      const char = new FlagCharacter(country, this.world, {
        position: new THREE.Vector3(x, 1.5, z)
      });

      // Hyper bouncy spin properties
      char.collider.restitution = 0.95;
      char.speed = 15.0;

      this.scene.add(char.group);
      this.characters.push(char);

      const ai = new AIController(char, this);
      this.aiControllers.push(ai);
    });
  }

  onMatchUpdate(dt) {
    const alive = this.characters.filter(c => c.isAlive);

    // Apply continuous high-speed spinning visual & physics torque
    alive.forEach(c => {
      c.bodyMesh.rotation.y += 18 * dt;
      // Inward bowl gravity centripetal pull
      const pos = c.body.position;
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
      if (dist > 3.0) {
        c.body.applyForce(new THREE.Vector3(-pos.x * 2.0, 0, -pos.z * 2.0));
      }
    });

    // Check Out-of-Bowl Eliminations
    for (const char of alive) {
      const pos = char.body.position;
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);

      if (dist > this.bowlRadius + 1.2 || pos.y < -2.0) {
        this.handleElimination(char, 'Knocked Out of Bowl!');
      }
    }

    // Win condition
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
