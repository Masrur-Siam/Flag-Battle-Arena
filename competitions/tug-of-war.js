/**
 * COMPETITION 4: TUG OF WAR
 * Team-based physics rope struggle.
 * Pull the opposing team across the center mud pit to victory!
 */

import * as THREE from '../libraries/three.module.js';
import { Competition } from '../js/competition-manager.js';
import { FlagCharacter } from '../js/flag-character.js';
import { AIController } from '../js/ai-controller.js';
import { BodyType, ShapeType } from '../js/physics-engine.js';
import { audio } from '../js/audio-manager.js';

export class TugOfWar extends Competition {
  constructor(engine, countries, options = {}) {
    super(engine, countries, options);
    this.modeId = 'tug-of-war';
    this.modeName = 'Tug of War';
    this.modeDescription = 'Two teams pull on a physics rope! Pull the center flag across the pit line to win.';
    this.ropePositionX = 0;
    this.arenaMeshes = [];
    this.team0 = [];
    this.team1 = [];
    this.init();
  }

  init() {
    this.buildArena();
    this.spawnTeams();
    this.startCountdown();
  }

  buildArena() {
    // 1. Left Platform (Team Blue)
    const platGeom = new THREE.BoxGeometry(16, 1.0, 10);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x1E3A8A, roughness: 0.6 });
    const leftPlat = new THREE.Mesh(platGeom, platMat);
    leftPlat.position.set(-11, -0.5, 0);
    this.scene.add(leftPlat);
    this.arenaMeshes.push(leftPlat);

    const leftBody = this.world.createRigidBody({ type: BodyType.STATIC, position: leftPlat.position });
    this.world.createCollider({
      shapeType: ShapeType.BOX,
      halfExtents: new THREE.Vector3(8, 0.5, 5),
      friction: 0.8
    }, leftBody);

    // 2. Right Platform (Team Red)
    const platMatRed = new THREE.MeshStandardMaterial({ color: 0x991B1B, roughness: 0.6 });
    const rightPlat = new THREE.Mesh(platGeom, platMatRed);
    rightPlat.position.set(11, -0.5, 0);
    this.scene.add(rightPlat);
    this.arenaMeshes.push(rightPlat);

    const rightBody = this.world.createRigidBody({ type: BodyType.STATIC, position: rightPlat.position });
    this.world.createCollider({
      shapeType: ShapeType.BOX,
      halfExtents: new THREE.Vector3(8, 0.5, 5),
      friction: 0.8
    }, rightBody);

    // 3. Center Mud Pit / Trap
    const pitGeom = new THREE.BoxGeometry(6, 0.4, 10);
    const pitMat = new THREE.MeshStandardMaterial({ color: 0x451A03, roughness: 0.9 });
    const pitMesh = new THREE.Mesh(pitGeom, pitMat);
    pitMesh.position.set(0, -1.2, 0);
    this.scene.add(pitMesh);
    this.arenaMeshes.push(pitMesh);

    // 4. Center Line Markers
    [-3, 3].forEach(x => {
      const lineGeom = new THREE.BoxGeometry(0.2, 0.05, 10);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xFBBF24 });
      const line = new THREE.Mesh(lineGeom, lineMat);
      line.position.set(x, 0.03, 0);
      this.scene.add(line);
      this.arenaMeshes.push(line);
    });

    // 5. Visual 3D Tug of War Rope
    const ropeGeom = new THREE.CylinderGeometry(0.12, 0.12, 28, 12);
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.8 });
    this.ropeMesh = new THREE.Mesh(ropeGeom, ropeMat);
    this.ropeMesh.rotation.z = Math.PI * 0.5;
    this.ropeMesh.position.set(0, 0.8, 0);
    this.scene.add(this.ropeMesh);
    this.arenaMeshes.push(this.ropeMesh);

    // Center Ribbon Marker
    const ribbonGeom = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0x10B981, emissive: 0x059669 });
    this.ribbonMesh = new THREE.Mesh(ribbonGeom, ribbonMat);
    this.ribbonMesh.position.set(0, 0.8, 0);
    this.scene.add(this.ribbonMesh);
    this.arenaMeshes.push(this.ribbonMesh);
  }

  spawnTeams() {
    const half = Math.ceil(this.countries.length / 2);

    this.countries.forEach((country, idx) => {
      const isTeam0 = idx < half;
      const teamIdx = isTeam0 ? idx : (idx - half);
      const teamCount = isTeam0 ? half : (this.countries.length - half);

      // Line up behind rope
      const startX = isTeam0 ? (-4.5 - teamIdx * 2.2) : (4.5 + teamIdx * 2.2);
      const char = new FlagCharacter(country, this.world, {
        position: new THREE.Vector3(startX, 1.2, 0)
      });
      char.team = isTeam0 ? 0 : 1;

      this.scene.add(char.group);
      this.characters.push(char);

      if (isTeam0) this.team0.push(char);
      else this.team1.push(char);

      const ai = new AIController(char, this);
      this.aiControllers.push(ai);
    });
  }

  onMatchUpdate(dt) {
    // Calculate total net pull force from both teams
    let leftForce = 0;
    this.team0.forEach(c => {
      if (c.isAlive) {
        leftForce += Math.abs(c.body.linearVelocity.x) + (Math.random() * 2.0);
      }
    });

    let rightForce = 0;
    this.team1.forEach(c => {
      if (c.isAlive) {
        rightForce += Math.abs(c.body.linearVelocity.x) + (Math.random() * 2.0);
      }
    });

    const netForce = (rightForce - leftForce) * 0.12;
    this.ropePositionX += netForce * dt;

    // Constrain rope & sync characters along it
    this.ropeMesh.position.x = this.ropePositionX;
    this.ribbonMesh.position.x = this.ropePositionX;

    // Pull characters with rope displacement
    this.characters.forEach(c => {
      if (c.isAlive) {
        c.body.position.x += netForce * dt * 0.8;
      }
    });

    // Check if ribbon crosses winning mark (-4m or +4m)
    if (this.ropePositionX <= -4.2) {
      // Team 0 wins!
      this.finishMatch(this.team0[0].country, this.team0.map(c => c.country));
    } else if (this.ropePositionX >= 4.2) {
      // Team 1 wins!
      this.finishMatch(this.team1[0].country, this.team1.map(c => c.country));
    }

    // Match Timeout
    if (this.matchTimer > 60) {
      const winningTeam = this.ropePositionX < 0 ? this.team0 : this.team1;
      this.finishMatch(winningTeam[0].country, winningTeam.map(c => c.country));
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
