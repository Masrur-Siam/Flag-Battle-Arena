/**
 * FLAG BATTLE ARENA - 3D Physics Engine
 * High-performance 3D rigid-body simulation system
 * Supports rigid bodies, colliders, gravity, friction, restitution,
 * continuous impulses, angular velocity, and sensor triggers.
 */

import * as THREE from '../libraries/three.module.js';

export const BodyType = {
  DYNAMIC: 'dynamic',
  KINEMATIC: 'kinematic',
  STATIC: 'static'
};

export const ShapeType = {
  SPHERE: 'sphere',
  BOX: 'box',
  CYLINDER: 'cylinder',
  PLANE: 'plane'
};

export class RigidBody {
  constructor(options = {}) {
    this.type = options.type || BodyType.DYNAMIC;
    this.position = new THREE.Vector3();
    if (options.position) this.position.copy(options.position);
    this.quaternion = new THREE.Quaternion();
    if (options.quaternion) this.quaternion.copy(options.quaternion);
    this.rotation = new THREE.Euler().setFromQuaternion(this.quaternion);

    this.linearVelocity = new THREE.Vector3();
    if (options.linearVelocity) this.linearVelocity.copy(options.linearVelocity);
    this.angularVelocity = new THREE.Vector3();
    if (options.angularVelocity) this.angularVelocity.copy(options.angularVelocity);

    this.force = new THREE.Vector3();
    this.torque = new THREE.Vector3();

    this.mass = this.type === BodyType.DYNAMIC ? (options.mass || 1.0) : 0;
    this.invMass = this.mass > 0 ? 1.0 / this.mass : 0;

    this.linearDamping = options.linearDamping !== undefined ? options.linearDamping : 0.15;
    this.angularDamping = options.angularDamping !== undefined ? options.angularDamping : 0.3;

    this.colliders = [];
    this.userData = options.userData || {};
    this.enabled = true;
    this.gravityScale = options.gravityScale !== undefined ? options.gravityScale : 1.0;
  }

  translation() {
    return this.position;
  }

  setTranslation(pos) {
    this.position.copy(pos);
  }

  linvel() {
    return this.linearVelocity;
  }

  setLinvel(vel) {
    this.linearVelocity.copy(vel);
  }

  angvel() {
    return this.angularVelocity;
  }

  setAngvel(vel) {
    this.angularVelocity.copy(vel);
  }

  applyImpulse(impulseVec) {
    if (this.type !== BodyType.DYNAMIC || !this.enabled) return;
    this.linearVelocity.addScaledVector(impulseVec, this.invMass);
  }

  applyTorque(torqueVec) {
    if (this.type !== BodyType.DYNAMIC || !this.enabled) return;
    this.angularVelocity.add(torqueVec);
  }

  applyForce(forceVec) {
    if (this.type !== BodyType.DYNAMIC || !this.enabled) return;
    this.force.add(forceVec);
  }
}

export class Collider {
  constructor(options = {}) {
    this.shapeType = options.shapeType || ShapeType.SPHERE;
    this.radius = options.radius || 0.5;
    this.halfExtents = options.halfExtents ? options.halfExtents.clone() : new THREE.Vector3(0.5, 0.5, 0.5);
    this.height = options.height || 1.0;
    this.offset = options.offset ? options.offset.clone() : new THREE.Vector3(0, 0, 0);

    this.restitution = options.restitution !== undefined ? options.restitution : 0.6; // Bounciness
    this.friction = options.friction !== undefined ? options.friction : 0.4;
    this.isSensor = !!options.isSensor; // Trigger only (no collision response)
    this.tag = options.tag || '';

    this.body = null;
    this.onCollision = options.onCollision || null;
    this.onSensorEnter = options.onSensorEnter || null;
  }

  getWorldPosition() {
    if (!this.body) return this.offset.clone();
    return this.body.position.clone().add(this.offset);
  }
}

export class PhysicsWorld {
  constructor(options = {}) {
    this.gravity = options.gravity ? options.gravity.clone() : new THREE.Vector3(0, -18.0, 0);
    this.bodies = [];
    this.colliders = [];
    this.substeps = 2; // Extra numerical stability for high-speed impacts
    this.damping = 0.999;
  }

  createRigidBody(options) {
    const body = new RigidBody(options);
    this.bodies.push(body);
    return body;
  }

  createCollider(options, body) {
    const collider = new Collider(options);
    collider.body = body;
    if (body) {
      body.colliders.push(collider);
    }
    this.colliders.push(collider);
    return collider;
  }

  removeRigidBody(body) {
    const idx = this.bodies.indexOf(body);
    if (idx !== -1) this.bodies.splice(idx, 1);

    // Remove associated colliders
    if (body.colliders) {
      body.colliders.forEach(col => {
        const cIdx = this.colliders.indexOf(col);
        if (cIdx !== -1) this.colliders.splice(cIdx, 1);
      });
      body.colliders = [];
    }
  }

  removeCollider(collider) {
    const idx = this.colliders.indexOf(collider);
    if (idx !== -1) this.colliders.splice(idx, 1);
    if (collider.body) {
      const bIdx = collider.body.colliders.indexOf(collider);
      if (bIdx !== -1) collider.body.colliders.splice(bIdx, 1);
    }
  }

  clear() {
    this.bodies = [];
    this.colliders = [];
  }

  step(deltaTime) {
    const clampedDt = Math.min(deltaTime, 0.1);
    const dt = clampedDt / this.substeps;

    for (let s = 0; s < this.substeps; s++) {
      // 1. Integrate Forces and Velocities
      for (let i = 0; i < this.bodies.length; i++) {
        const body = this.bodies[i];
        if (!body.enabled || body.type !== BodyType.DYNAMIC) continue;

        // Apply Gravity
        body.linearVelocity.addScaledVector(this.gravity, dt * body.gravityScale);

        // Apply external forces
        if (body.force.lengthSq() > 0) {
          body.linearVelocity.addScaledVector(body.force, dt * body.invMass);
          body.force.set(0, 0, 0);
        }

        // Apply damping
        const linDamp = Math.max(0, 1.0 - body.linearDamping * dt);
        body.linearVelocity.multiplyScalar(linDamp);

        const angDamp = Math.max(0, 1.0 - body.angularDamping * dt);
        body.angularVelocity.multiplyScalar(angDamp);

        // Integrate Position
        body.position.addScaledVector(body.linearVelocity, dt);

        // Integrate Rotation from angular velocity
        if (body.angularVelocity.lengthSq() > 0.0001) {
          const angle = body.angularVelocity.length() * dt;
          const axis = body.angularVelocity.clone().normalize();
          const qDelta = new THREE.Quaternion().setFromAxisAngle(axis, angle);
          body.quaternion.multiplyQuaternions(qDelta, body.quaternion);
          body.quaternion.normalize();
          body.rotation.setFromQuaternion(body.quaternion);
        }
      }

      // 2. Collision Detection & Resolution
      this.resolveCollisions();
    }
  }

  resolveCollisions() {
    const numColliders = this.colliders.length;

    for (let i = 0; i < numColliders; i++) {
      const colA = this.colliders[i];
      const bodyA = colA.body;
      if (!bodyA || !bodyA.enabled) continue;

      for (let j = i + 1; j < numColliders; j++) {
        const colB = this.colliders[j];
        const bodyB = colB.body;
        if (!bodyB || !bodyB.enabled) continue;

        // Skip two static bodies
        if (bodyA.type === BodyType.STATIC && bodyB.type === BodyType.STATIC) continue;

        this.checkAndResolvePair(colA, colB);
      }
    }
  }

  checkAndResolvePair(colA, colB) {
    const bodyA = colA.body;
    const bodyB = colB.body;

    const posA = colA.getWorldPosition();
    const posB = colB.getWorldPosition();

    // SPHERE vs SPHERE
    if (colA.shapeType === ShapeType.SPHERE && colB.shapeType === ShapeType.SPHERE) {
      const delta = posA.clone().sub(posB);
      const distSq = delta.lengthSq();
      const minDist = colA.radius + colB.radius;

      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq) || 0.001;
        const normal = delta.multiplyScalar(1 / dist); // From B to A
        const penetration = minDist - dist;

        this.applyContact(colA, colB, normal, penetration, posA, posB);
      }
    }
    // SPHERE vs BOX
    else if (colA.shapeType === ShapeType.SPHERE && colB.shapeType === ShapeType.BOX) {
      this.checkSphereBox(colA, colB, posA, posB);
    }
    else if (colA.shapeType === ShapeType.BOX && colB.shapeType === ShapeType.SPHERE) {
      this.checkSphereBox(colB, colA, posB, posA, true);
    }
    // SPHERE vs CYLINDER
    else if (colA.shapeType === ShapeType.SPHERE && colB.shapeType === ShapeType.CYLINDER) {
      this.checkSphereCylinder(colA, colB, posA, posB);
    }
    else if (colA.shapeType === ShapeType.CYLINDER && colB.shapeType === ShapeType.SPHERE) {
      this.checkSphereCylinder(colB, colA, posB, posA, true);
    }
    // BOX vs BOX
    else if (colA.shapeType === ShapeType.BOX && colB.shapeType === ShapeType.BOX) {
      this.checkBoxBox(colA, colB, posA, posB);
    }
  }

  checkSphereBox(colSphere, colBox, posSphere, posBox, inverted = false) {
    // Clamped point on AABB box
    const half = colBox.halfExtents;
    const closest = new THREE.Vector3(
      Math.max(posBox.x - half.x, Math.min(posSphere.x, posBox.x + half.x)),
      Math.max(posBox.y - half.y, Math.min(posSphere.y, posBox.y + half.y)),
      Math.max(posBox.z - half.z, Math.min(posSphere.z, posBox.z + half.z))
    );

    const delta = posSphere.clone().sub(closest);
    const distSq = delta.lengthSq();

    if (distSq < colSphere.radius * colSphere.radius) {
      const dist = Math.sqrt(distSq) || 0.001;
      let normal = delta.clone().multiplyScalar(1 / dist);
      let penetration = colSphere.radius - dist;

      // Inside box check
      if (dist < 0.002) {
        normal.set(0, 1, 0);
        penetration = colSphere.radius;
      }

      if (inverted) {
        this.applyContact(colBox, colSphere, normal.negate(), penetration, posBox, posSphere);
      } else {
        this.applyContact(colSphere, colBox, normal, penetration, posSphere, posBox);
      }
    }
  }

  checkSphereCylinder(colSphere, colCyl, posSphere, posCyl, inverted = false) {
    // Vertical cylinder along Y
    const halfH = colCyl.height * 0.5;
    const clampedY = Math.max(posCyl.y - halfH, Math.min(posSphere.y, posCyl.y + halfH));

    const dx = posSphere.x - posCyl.x;
    const dz = posSphere.z - posCyl.z;
    const horizDist = Math.sqrt(dx * dx + dz * dz) || 0.001;

    let closest = new THREE.Vector3(
      posCyl.x + (dx / horizDist) * Math.min(horizDist, colCyl.radius),
      clampedY,
      posCyl.z + (dz / horizDist) * Math.min(horizDist, colCyl.radius)
    );

    const delta = posSphere.clone().sub(closest);
    const distSq = delta.lengthSq();

    if (distSq < colSphere.radius * colSphere.radius) {
      const dist = Math.sqrt(distSq) || 0.001;
      const normal = delta.multiplyScalar(1 / dist);
      const penetration = colSphere.radius - dist;

      if (inverted) {
        this.applyContact(colCyl, colSphere, normal.negate(), penetration, posCyl, posSphere);
      } else {
        this.applyContact(colSphere, colCyl, normal, penetration, posSphere, posBox);
      }
    }
  }

  checkBoxBox(colA, colB, posA, posB) {
    const halfA = colA.halfExtents;
    const halfB = colB.halfExtents;

    const dx = Math.abs(posA.x - posB.x);
    const dy = Math.abs(posA.y - posB.y);
    const dz = Math.abs(posA.z - posB.z);

    const overlapX = (halfA.x + halfB.x) - dx;
    const overlapY = (halfA.y + halfB.y) - dy;
    const overlapZ = (halfA.z + halfB.z) - dz;

    if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {
      // Find axis of minimum penetration
      let normal = new THREE.Vector3();
      let penetration = overlapX;

      if (overlapX <= overlapY && overlapX <= overlapZ) {
        penetration = overlapX;
        normal.set(posA.x > posB.x ? 1 : -1, 0, 0);
      } else if (overlapY <= overlapX && overlapY <= overlapZ) {
        penetration = overlapY;
        normal.set(0, posA.y > posB.y ? 1 : -1, 0);
      } else {
        penetration = overlapZ;
        normal.set(0, 0, posA.z > posB.z ? 1 : -1);
      }

      this.applyContact(colA, colB, normal, penetration, posA, posB);
    }
  }

  applyContact(colA, colB, normal, penetration, posA, posB) {
    const bodyA = colA.body;
    const bodyB = colB.body;

    // Handle Sensor Triggers
    if (colA.isSensor || colB.isSensor) {
      if (colA.onSensorEnter) colA.onSensorEnter(colB);
      if (colB.onSensorEnter) colB.onSensorEnter(colA);
      return; // Do not apply physical repulsion
    }

    // Positional separation to prevent sinking
    const totalInvMass = bodyA.invMass + bodyB.invMass;
    if (totalInvMass <= 0) return;

    const percent = 0.85; // Baumgarte stabilization
    const slop = 0.005;
    const correctionMagnitude = Math.max(penetration - slop, 0) / totalInvMass * percent;
    const correction = normal.clone().multiplyScalar(correctionMagnitude);

    if (bodyA.type === BodyType.DYNAMIC) {
      bodyA.position.addScaledVector(correction, bodyA.invMass);
    }
    if (bodyB.type === BodyType.DYNAMIC) {
      bodyB.position.addScaledVector(correction, -bodyB.invMass);
    }

    // Relative Velocity
    const rv = bodyA.linearVelocity.clone().sub(bodyB.linearVelocity);
    const velAlongNormal = rv.dot(normal);

    // Only resolve if velocities are separating
    if (velAlongNormal > 0) return;

    // Restitution (elastic bounce)
    const e = Math.max(colA.restitution, colB.restitution);
    let j = -(1 + e) * velAlongNormal;
    j /= totalInvMass;

    // Apply normal impulse
    const impulse = normal.clone().multiplyScalar(j);
    if (bodyA.type === BodyType.DYNAMIC) {
      bodyA.linearVelocity.addScaledVector(impulse, bodyA.invMass);
    }
    if (bodyB.type === BodyType.DYNAMIC) {
      bodyB.linearVelocity.addScaledVector(impulse, -bodyB.invMass);
    }

    // Friction impulse
    const tangent = rv.clone().sub(normal.clone().multiplyScalar(velAlongNormal));
    if (tangent.lengthSq() > 0.0001) {
      tangent.normalize();
      const jt = -rv.dot(tangent) / totalInvMass;
      const mu = Math.sqrt(colA.friction * colB.friction);
      const frictionImpulseMag = Math.max(-j * mu, Math.min(j * mu, jt));
      const frictionImpulse = tangent.multiplyScalar(frictionImpulseMag);

      if (bodyA.type === BodyType.DYNAMIC) {
        bodyA.linearVelocity.addScaledVector(frictionImpulse, bodyA.invMass);
      }
      if (bodyB.type === BodyType.DYNAMIC) {
        bodyB.linearVelocity.addScaledVector(frictionImpulse, -bodyB.invMass);
      }
    }

    // Dynamic character vs character combat clash impulse boost
    if (bodyA.type === BodyType.DYNAMIC && bodyB.type === BodyType.DYNAMIC) {
      const charA = bodyA.userData?.character;
      const charB = bodyB.userData?.character;
      if (charA && charB) {
        // High-energy combat push: flags violently knock and recoil away from each other!
        const clashPower = 3.6 + Math.random() * 3.8;
        const combatImpulse = normal.clone().multiplyScalar(clashPower);
        bodyA.linearVelocity.addScaledVector(combatImpulse, bodyA.invMass);
        bodyB.linearVelocity.addScaledVector(combatImpulse, -bodyB.invMass);

        // Dynamic impact rotation torque
        bodyA.applyTorque(new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 4));
        bodyB.applyTorque(new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 4));

        // Notify character combat memory & trigger visual squash
        if (charA.onCombatHit) charA.onCombatHit(charB, normal, clashPower);
        if (charB.onCombatHit) charB.onCombatHit(charA, normal.clone().negate(), clashPower);
      }
    }

    // Collision callbacks
    if (colA.onCollision) colA.onCollision(colB, normal, j);
    if (colB.onCollision) colB.onCollision(colA, normal.clone().negate(), j);
  }

  castRay(origin, direction, maxDistance = 20) {
    const dir = direction.clone().normalize();
    let closestHit = null;
    let minDistance = maxDistance;

    for (const collider of this.colliders) {
      if (!collider.body || collider.isSensor) continue;
      const colPos = collider.getWorldPosition();

      if (collider.shapeType === ShapeType.SPHERE) {
        const m = origin.clone().sub(colPos);
        const b = m.dot(dir);
        const c = m.dot(m) - collider.radius * collider.radius;
        if (c > 0 && b > 0) continue;
        const discr = b * b - c;
        if (discr < 0) continue;
        const t = -b - Math.sqrt(discr);
        if (t > 0 && t < minDistance) {
          minDistance = t;
          closestHit = {
            distance: t,
            point: origin.clone().addScaledVector(dir, t),
            collider,
            body: collider.body
          };
        }
      } else if (collider.shapeType === ShapeType.BOX) {
        // Fast ray vs AABB
        const half = collider.halfExtents;
        const min = colPos.clone().sub(half);
        const max = colPos.clone().add(half);

        let tmin = (min.x - origin.x) / (dir.x || 0.0001);
        let tmax = (max.x - origin.x) / (dir.x || 0.0001);
        if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

        let tymin = (min.y - origin.y) / (dir.y || 0.0001);
        let tymax = (max.y - origin.y) / (dir.y || 0.0001);
        if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

        if ((tmin > tymax) || (tymin > tmax)) continue;
        if (tymin > tmin) tmin = tymin;
        if (tymax < tmax) tmax = tymax;

        let tzmin = (min.z - origin.z) / (dir.z || 0.0001);
        let tzmax = (max.z - origin.z) / (dir.z || 0.0001);
        if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

        if ((tmin > tzmax) || (tzmin > tmax)) continue;
        if (tzmin > tmin) tmin = tzmin;
        if (tzmax < tmax) tmax = tzmax;

        if (tmin > 0 && tmin < minDistance) {
          minDistance = tmin;
          closestHit = {
            distance: tmin,
            point: origin.clone().addScaledVector(dir, tmin),
            collider,
            body: collider.body
          };
        }
      }
    }

    return closestHit;
  }
}
