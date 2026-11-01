/**
 * COMPETITION 12: FOOTBALL BATTLE
 * Autonomous team-based football / soccer match!
 * Two teams, physics ball, goalkeepers, strikers, and dynamic goal scoring.
 */

import * as THREE from '../libraries/three.module.js';
import { Competition } from '../js/competition-manager.js';
import { FlagCharacter } from '../js/flag-character.js';
import { AIController } from '../js/ai-controller.js';
import { BodyType, ShapeType } from '../js/physics-engine.js';
import { audio } from '../js/audio-manager.js';

export class FootballBattle extends Competition {
  constructor(engine, countries, options = {}) {
    super(engine, countries, options);
    this.modeId = 'football-battle';
    this.modeName = 'Football Battle';
    this.modeDescription = 'Autonomous team soccer! Kick the physics ball into the opposing net to score goals.';
    this.pitchWidth = 18;
    this.pitchLength = 28;
    this.ball = null;
    this.ballMesh = null;
    this.team0Score = 0;
    this.team1Score = 0;
    this.arenaMeshes = [];
    this.team0 = [];
    this.team1 = [];
    this.init();
  }

  init() {
    this.buildPitch();
    this.spawnBall();
    this.spawnTeams();
    this.startCountdown();
  }

  buildPitch() {
    // 1. Vibrant Grass Pitch
    const pitchGeom = new THREE.BoxGeometry(this.pitchWidth, 0.8, this.pitchLength);
    const pitchMat = new THREE.MeshStandardMaterial({
      color: 0x15803D, // Rich green turf
      roughness: 0.6
    });
    const pitchMesh = new THREE.Mesh(pitchGeom, pitchMat);
    pitchMesh.position.set(0, -0.4, 0);
    pitchMesh.receiveShadow = true;
    this.scene.add(pitchMesh);
    this.arenaMeshes.push(pitchMesh);

    const pitchBody = this.world.createRigidBody({ type: BodyType.STATIC, position: pitchMesh.position });
    this.world.createCollider({
      shapeType: ShapeType.BOX,
      halfExtents: new THREE.Vector3(this.pitchWidth * 0.5, 0.4, this.pitchLength * 0.5),
      friction: 0.5,
      restitution: 0.2
    }, pitchBody);

    // 2. White Pitch Markings (Center circle, center line)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const centerLineGeom = new THREE.BoxGeometry(this.pitchWidth * 0.9, 0.05, 0.2);
    const centerLine = new THREE.Mesh(centerLineGeom, lineMat);
    centerLine.position.set(0, 0.03, 0);
    this.scene.add(centerLine);
    this.arenaMeshes.push(centerLine);

    const circleGeom = new THREE.RingGeometry(2.8, 3.0, 32);
    const circle = new THREE.Mesh(circleGeom, lineMat);
    circle.rotation.x = -Math.PI * 0.5;
    circle.position.set(0, 0.03, 0);
    this.scene.add(circle);
    this.arenaMeshes.push(circle);

    // 3. Perimeter Pitch Walls
    [-this.pitchWidth * 0.5, this.pitchWidth * 0.5].forEach(x => {
      const wallGeom = new THREE.BoxGeometry(0.6, 1.6, this.pitchLength);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x1E293B });
      const wall = new THREE.Mesh(wallGeom, wallMat);
      wall.position.set(x, 0.8, 0);
      this.scene.add(wall);
      this.arenaMeshes.push(wall);

      const wallBody = this.world.createRigidBody({ type: BodyType.STATIC, position: wall.position });
      this.world.createCollider({
        shapeType: ShapeType.BOX,
        halfExtents: new THREE.Vector3(0.3, 0.8, this.pitchLength * 0.5),
        restitution: 0.8
      }, wallBody);
    });

    // 4. Goalposts at -Z and +Z
    [-this.pitchLength * 0.5, this.pitchLength * 0.5].forEach((z, idx) => {
      const goalWidth = 7.0;
      const goalGeom = new THREE.BoxGeometry(goalWidth, 2.5, 2.0);
      const goalMat = new THREE.MeshStandardMaterial({
        color: idx === 0 ? 0x3B82F6 : 0xEF4444,
        wireframe: true
      });
      const goalMesh = new THREE.Mesh(goalGeom, goalMat);
      goalMesh.position.set(0, 1.25, z + (idx === 0 ? -1.0 : 1.0));
      this.scene.add(goalMesh);
      this.arenaMeshes.push(goalMesh);
    });
  }

  spawnBall() {
    // 3D Soccer Ball
    const ballGeom = new THREE.SphereGeometry(0.55, 18, 18);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xFEF08A,
      roughness: 0.2,
      metalness: 0.1
    });
    this.ballMesh = new THREE.Mesh(ballGeom, ballMat);
    this.ballMesh.position.set(0, 1.0, 0);
    this.ballMesh.castShadow = true;
    this.scene.add(this.ballMesh);
    this.arenaMeshes.push(this.ballMesh);

    this.ball = this.world.createRigidBody({
      type: BodyType.DYNAMIC,
      position: new THREE.Vector3(0, 1.0, 0),
      mass: 0.5,
      linearDamping: 0.1,
      angularDamping: 0.2
    });

    this.world.createCollider({
      shapeType: ShapeType.SPHERE,
      radius: 0.55,
      restitution: 0.85, // Very bouncy football!
      friction: 0.3
    }, this.ball);
  }

  spawnTeams() {
    const half = Math.ceil(this.countries.length / 2);

    this.countries.forEach((country, idx) => {
      const isTeam0 = idx < half;
      const teamIdx = isTeam0 ? idx : (idx - half);

      // Z coordinates: Goalkeeper near goal, strikers near midfield
      let startZ = isTeam0 ? (-10 + teamIdx * 2.8) : (10 - teamIdx * 2.8);
      let startX = (teamIdx % 2 === 0 ? 1 : -1) * (2.0 + teamIdx * 1.5);
      if (teamIdx === 0) {
        startX = 0;
        startZ = isTeam0 ? -11.5 : 11.5; // Goalkeeper position
      }

      const char = new FlagCharacter(country, this.world, {
        position: new THREE.Vector3(startX, 1.2, startZ)
      });
      char.team = isTeam0 ? 0 : 1;
      char.role = (teamIdx === 0) ? 'goalkeeper' : 'striker';

      this.scene.add(char.group);
      this.characters.push(char);

      if (isTeam0) this.team0.push(char);
      else this.team1.push(char);

      const ai = new AIController(char, this);
      this.aiControllers.push(ai);
    });
  }

  onMatchUpdate(dt) {
    // 1. Sync Ball Mesh to Physics
    if (this.ball && this.ballMesh) {
      this.ballMesh.position.copy(this.ball.position);
      this.ballMesh.quaternion.copy(this.ball.quaternion);

      // 2. Goal Check
      const bPos = this.ball.position;
      const goalThresholdZ = this.pitchLength * 0.5;

      if (bPos.z <= -goalThresholdZ && Math.abs(bPos.x) < 3.8) {
        // Team 1 (Red) scored in Team 0's goal!
        this.handleGoal(1);
      } else if (bPos.z >= goalThresholdZ && Math.abs(bPos.x) < 3.8) {
        // Team 0 (Blue) scored in Team 1's goal!
        this.handleGoal(0);
      }

      // Ball out of bounds reset
      if (bPos.y < -1.0 || Math.abs(bPos.x) > this.pitchWidth * 0.6 || Math.abs(bPos.z) > this.pitchLength * 0.65) {
        this.resetBall();
      }
    }

    // 3. Match Completion (60 seconds)
    if (this.matchTimer >= 60) {
      let winningTeam = this.team0;
      if (this.team1Score > this.team0Score) winningTeam = this.team1;
      else if (this.team0Score === this.team1Score) winningTeam = Math.random() < 0.5 ? this.team0 : this.team1;

      const winner = winningTeam[0].country;
      this.finishMatch(winner, winningTeam.map(c => c.country));
    }
  }

  handleGoal(scoringTeam) {
    audio.playGoal();
    this.engine.spawnParticleBurst(this.ball.position, 40, scoringTeam === 0 ? 0x3B82F6 : 0xEF4444);
    this.engine.cameraController.triggerSlowMo(0.3, 1.5);
    this.engine.cameraController.triggerShake(0.6, 0.4);

    if (scoringTeam === 0) this.team0Score++;
    else this.team1Score++;

    this.characters.forEach(c => {
      c.score = (c.team === 0 ? this.team0Score : this.team1Score);
    });

    this.resetBall();
  }

  resetBall() {
    this.ball.setTranslation(new THREE.Vector3(0, 1.5, 0));
    this.ball.setLinvel(new THREE.Vector3(0, 0, 0));
    this.ball.setAngvel(new THREE.Vector3(0, 0, 0));
  }

  getHUDState() {
    const base = super.getHUDState();
    base.scoreInfo = `${this.team0[0]?.country.emoji || '🔵'} ${this.team0Score} - ${this.team1Score} ${this.team1[0]?.country.emoji || '🔴'}`;
    return base;
  }

  destroy() {
    super.destroy();
    this.arenaMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    this.arenaMeshes = [];
    if (this.ball) this.world.removeRigidBody(this.ball);
    this.ball = null;
  }
}
