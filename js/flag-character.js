/**
 * FLAG BATTLE ARENA - Direct 3D Standing Flag Competitor
 * Fulfills "Direct Flag" requirement: direct upright rectangular flag card on a weighted base.
 * Pure flag visibility without round ball characters.
 */

import * as THREE from '../libraries/three.module.js';
import { getCountryFlagTexture } from './countries.js';
import { BodyType, ShapeType } from './physics-engine.js';
import { audio } from './audio-manager.js';

export const Personality = {
  AGGRESSIVE: 'AGGRESSIVE',
  BERSERKER: 'BERSERKER',
  TACTICAL: 'TACTICAL',
  DEFENSIVE: 'DEFENSIVE',
  SURVIVOR: 'SURVIVOR',
  UNPREDICTABLE: 'UNPREDICTABLE',
  BALANCED: 'TACTICAL' // Backwards compatibility alias
};

export class FlagCharacter {
  constructor(country, world, options = {}) {
    this.country = country;
    this.world = world;
    this.id = options.id || `${country.code}_${Math.random().toString(36).substr(2, 6)}`;
    this.personality = options.personality || this.pickRandomPersonality();

    this.isAlive = true;
    this.isEliminated = false;
    this.hasFinished = false;
    this.score = 0;
    this.rank = 0;
    this.isGrounded = false;
    this.isLeader = false;

    // Advanced Combat & Visual Feedback States
    this.squashScale = new THREE.Vector3(1, 1, 1);
    this.anticipationTilt = 0;
    this.stumbleTimer = 0;
    this.isStumbling = false;
    this.isRecovering = false;
    this.lastAttacker = null;
    this.recentHits = 0;
    this.dashCooldown = 0;

    // Movement & AI specs based on personality
    this.setupPersonalityStats();

    // 3D Visual Group
    this.group = new THREE.Group();
    this.flagBoardMesh = null;
    this.baseMesh = null;
    this.crownMesh = null;
    this.badgeSprite = null;

    // Movement wobble timers
    this.wobblePhase = Math.random() * Math.PI * 2;

    // Build Direct 3D Standing Flag Model
    this.build3DFlagModel();

    // Create Physics Body
    const initialPos = options.position || new THREE.Vector3(0, 1.2, 0);
    this.body = this.world.createRigidBody({
      type: BodyType.DYNAMIC,
      position: initialPos,
      mass: this.bodyMass || 2.2,
      linearDamping: 0.22,
      angularDamping: 0.75,
      userData: { character: this }
    });

    this.collider = this.world.createCollider({
      shapeType: ShapeType.SPHERE,
      radius: 0.7,
      restitution: 0.85, // Energetic bounce on collisions
      friction: 0.35,
      tag: 'character',
      onCollision: (otherCol, normal, impulse) => {
        this.handleCollision(otherCol, normal, impulse);
      }
    }, this.body);

    this.group.position.copy(this.body.position);
  }

  pickRandomPersonality() {
    const list = [
      Personality.AGGRESSIVE,
      Personality.BERSERKER,
      Personality.TACTICAL,
      Personality.DEFENSIVE,
      Personality.SURVIVOR,
      Personality.UNPREDICTABLE
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  setupPersonalityStats() {
    switch (this.personality) {
      case Personality.AGGRESSIVE:
        this.speed = 14.8;
        this.turnSpeed = 10.5;
        this.jumpPower = 9.8;
        this.pushForce = 23.0;
        this.bodyMass = 2.3;
        break;
      case Personality.BERSERKER:
        this.speed = 15.6;
        this.turnSpeed = 11.5;
        this.jumpPower = 10.2;
        this.pushForce = 26.0;
        this.bodyMass = 2.4;
        break;
      case Personality.TACTICAL:
        this.speed = 13.8;
        this.turnSpeed = 12.5;
        this.jumpPower = 9.5;
        this.pushForce = 20.5;
        this.bodyMass = 2.2;
        break;
      case Personality.DEFENSIVE:
        this.speed = 12.2;
        this.turnSpeed = 9.0;
        this.jumpPower = 8.8;
        this.pushForce = 19.0;
        this.bodyMass = 2.6; // Heavier base to resist pushes
        break;
      case Personality.SURVIVOR:
        this.speed = 14.2;
        this.turnSpeed = 11.0;
        this.jumpPower = 10.8;
        this.pushForce = 17.5;
        this.bodyMass = 2.0; // Lighter & agile to leap out of danger
        break;
      case Personality.UNPREDICTABLE:
      default:
        this.speed = 13.8;
        this.turnSpeed = 12.0;
        this.jumpPower = 10.5;
        this.pushForce = 21.0;
        this.bodyMass = 2.2;
        break;
    }
    // Dynamic match variance: guarantees every country has a fair, unpredictable chance to win
    this.speed *= (0.92 + Math.random() * 0.22);
    this.pushForce *= (0.90 + Math.random() * 0.28);
  }

  build3DFlagModel() {
    // 1. Direct Upright Rectangular Flag Board (Aspect ratio 3:2)
    const flagWidth = 1.6;
    const flagHeight = 1.15;
    const flagDepth = 0.08;

    const flagGeom = new THREE.BoxGeometry(flagWidth, flagHeight, flagDepth);
    const flagTexture = getCountryFlagTexture(this.country);

    const flagFrontBackMat = new THREE.MeshStandardMaterial({
      map: flagTexture,
      roughness: 0.25,
      metalness: 0.1
    });

    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.3,
      metalness: 0.3
    });

    // Box faces: [right, left, top, bottom, front, back]
    const materials = [
      edgeMat,
      edgeMat,
      edgeMat,
      edgeMat,
      flagFrontBackMat, // Front face
      flagFrontBackMat  // Back face
    ];

    this.flagBoardMesh = new THREE.Mesh(flagGeom, materials);
    this.flagBoardMesh.position.y = 0.65;
    this.flagBoardMesh.castShadow = true;
    this.flagBoardMesh.receiveShadow = true;
    this.group.add(this.flagBoardMesh);

    // 2. Weighted Circular Base Stand
    const baseGeom = new THREE.CylinderGeometry(0.5, 0.58, 0.22, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.country.colors[0] || '#2563EB'),
      roughness: 0.3,
      metalness: 0.4
    });
    this.baseMesh = new THREE.Mesh(baseGeom, baseMat);
    this.baseMesh.position.y = 0.05;
    this.baseMesh.castShadow = true;
    this.group.add(this.baseMesh);

    // Glowing base ring
    const ringGeom = new THREE.TorusGeometry(0.54, 0.04, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xFDE047 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI * 0.5;
    ring.position.y = 0.1;
    this.baseMesh.add(ring);

    // 3. Gold Crown for Leader
    const crownGeom = new THREE.ConeGeometry(0.32, 0.28, 5);
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0xFBBF24,
      metalness: 0.8,
      roughness: 0.2
    });
    this.crownMesh = new THREE.Mesh(crownGeom, crownMat);
    this.crownMesh.rotation.x = Math.PI;
    this.crownMesh.position.set(0, 1.45, 0);
    this.crownMesh.visible = false;
    this.group.add(this.crownMesh);

    // 4. Overhead Country Billboard Badge
    this.buildBadge();
  }

  buildBadge() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    // High-contrast dark badge backing
    ctx.fillStyle = 'rgba(11, 15, 25, 0.94)';
    const primaryColor = this.country.colors[0] || '#3B82F6';
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 8;

    const x = 6, y = 6, w = 500, h = 148, r = 36;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Huge Flag Emoji on the left
    ctx.font = '84px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.country.emoji, 90, 80);

    // Separator line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(170, 20);
    ctx.lineTo(170, 140);
    ctx.stroke();

    // Bold Country Code
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 64px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.country.code, 195, 68);

    // Country Name
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 28px system-ui, sans-serif';
    const cleanName = this.country.name.length > 15 ? this.country.name.substring(0, 14) + '…' : this.country.name;
    ctx.fillText(cleanName, 196, 118);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      transparent: true
    });

    this.badgeSprite = new THREE.Sprite(spriteMat);
    this.badgeSprite.scale.set(2.4, 0.85, 1);
    this.badgeSprite.position.set(0, 1.8, 0);
    this.group.add(this.badgeSprite);
  }

  setLeader(isLeader) {
    this.isLeader = isLeader;
    if (this.crownMesh) {
      this.crownMesh.visible = isLeader;
    }
  }

  handleCollision(otherCollider, normal, impulse) {
    if (!this.isAlive) return;

    if (impulse > 2.0) {
      audio.playBounce(impulse);
    }

    if (normal.y > 0.6) {
      this.isGrounded = true;
    }
  }

  onCombatHit(otherCharacter, normal, impulse) {
    if (!this.isAlive) return;

    this.lastAttacker = otherCharacter;
    this.recentHits++;
    this.stumbleTimer = 0.45;
    this.isStumbling = true;
    this.isRecovering = true;

    // Visual Squash on impact
    this.squashScale.set(1.25, 0.75, 1.25);

    if (impulse > 1.5) {
      audio.playBounce(impulse);
    }
  }

  setAnticipation(amount = 0.25) {
    this.anticipationTilt = amount;
    this.squashScale.set(0.9, 1.15, 0.9);
  }

  dashImpulse(direction, forceMultiplier = 1.0) {
    if (!this.isAlive) return;
    const impulse = direction.clone().normalize().multiplyScalar(this.pushForce * forceMultiplier);
    this.body.applyImpulse(impulse);
    this.squashScale.set(0.85, 0.9, 1.25);
  }

  applyMove(direction, sprint = false) {
    if (!this.isAlive || this.hasFinished) return;

    const spd = this.speed * (sprint ? 1.4 : 1.0);
    const force = direction.clone().multiplyScalar(spd);

    this.body.applyForce(new THREE.Vector3(force.x, 0, force.z));

    // Turn standing flag board to face movement direction
    if (direction.lengthSq() > 0.01) {
      const targetAngle = Math.atan2(direction.x, direction.z);
      const currentAngle = this.flagBoardMesh.rotation.y;
      this.flagBoardMesh.rotation.y = THREE.MathUtils.lerp(currentAngle, targetAngle, 0.18);
    }
  }

  jump() {
    if (!this.isAlive || !this.isGrounded) return;
    this.body.applyImpulse(new THREE.Vector3(0, this.jumpPower * this.body.mass, 0));
    this.isGrounded = false;
    audio.playBoing();
  }

  bump(direction, strength = 1.0) {
    if (!this.isAlive) return;
    const impulse = direction.clone().normalize().multiplyScalar(this.pushForce * strength);
    this.body.applyImpulse(impulse);
    audio.playBounce(this.pushForce * strength);
  }

  eliminate() {
    if (!this.isAlive) return;
    this.isAlive = false;
    this.isEliminated = true;

    audio.playElimination();
    this.collider.isSensor = true;

    // Tumble down into the void
    this.body.applyImpulse(new THREE.Vector3(
      (Math.random() - 0.5) * 8,
      8,
      (Math.random() - 0.5) * 8
    ));
    this.body.applyTorque(new THREE.Vector3(
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 25
    ));
  }

  finish() {
    if (this.hasFinished) return;
    this.hasFinished = true;
  }

  update(deltaTime) {
    this.group.position.copy(this.body.position);

    // Upright stabilization
    if (this.isAlive) {
      const euler = this.body.rotation;
      euler.x *= 0.85;
      euler.z *= 0.85;
      this.body.quaternion.setFromEuler(euler);
    }

    if (this.body.linearVelocity.y < -0.1) {
      this.isGrounded = false;
    }

    // Squash & Stretch Spring Recovery
    this.squashScale.x = THREE.MathUtils.lerp(this.squashScale.x, 1.0, 0.15);
    this.squashScale.y = THREE.MathUtils.lerp(this.squashScale.y, 1.0, 0.15);
    this.squashScale.z = THREE.MathUtils.lerp(this.squashScale.z, 1.0, 0.15);
    if (this.flagBoardMesh) {
      this.flagBoardMesh.scale.copy(this.squashScale);
    }

    // Stumble / Recovery Visuals
    if (this.stumbleTimer > 0) {
      this.stumbleTimer -= deltaTime;
      this.isStumbling = true;
      this.isRecovering = true;
      if (this.flagBoardMesh) {
        this.flagBoardMesh.rotation.x = Math.sin(this.stumbleTimer * 24) * 0.16;
      }
    } else {
      this.isStumbling = false;
      this.isRecovering = false;
      if (this.flagBoardMesh) {
        this.flagBoardMesh.rotation.x = THREE.MathUtils.lerp(this.flagBoardMesh.rotation.x, -this.anticipationTilt, 0.18);
      }
    }
    this.anticipationTilt = THREE.MathUtils.lerp(this.anticipationTilt, 0, 0.12);

    // Natural wobble when sliding/moving
    const horizSpeed = Math.sqrt(this.body.linearVelocity.x ** 2 + this.body.linearVelocity.z ** 2);
    if (horizSpeed > 0.2 && this.isAlive) {
      this.wobblePhase += horizSpeed * deltaTime * 4.0;
      this.flagBoardMesh.rotation.z = Math.sin(this.wobblePhase) * 0.08;
    } else {
      this.flagBoardMesh.rotation.z = THREE.MathUtils.lerp(this.flagBoardMesh.rotation.z, 0, 0.1);
    }

    // Leader Crown Animation
    if (this.isLeader && this.crownMesh) {
      this.crownMesh.rotation.y += deltaTime * 2.5;
      this.crownMesh.position.y = 1.45 + Math.sin(Date.now() * 0.005) * 0.08;
    }

    // Death fade & shrink
    if (this.isEliminated) {
      this.group.scale.multiplyScalar(0.975);
      if (this.group.scale.x < 0.05) {
        this.group.visible = false;
      }
    }
  }

  destroy() {
    this.world.removeRigidBody(this.body);
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
