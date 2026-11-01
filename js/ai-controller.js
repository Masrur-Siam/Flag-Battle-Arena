/**
 * FLAG BATTLE ARENA - UNIVERSAL AUTONOMOUS FLAG AI SYSTEM
 * Advanced Combat Intelligence, Independent Decision Making & Competitive Physics
 * 
 * Every flag is an independent, intelligent computer-controlled competitor.
 * Modular Subsystems:
 * 1. AIState Enum (16 Distinct States)
 * 2. PerceptionSystem (Continuous environmental observation, threat & vulnerability detection)
 * 3. ThreatDetector (Incoming attacks, closing velocities, crowd cornering)
 * 4. TargetSelector (Intelligent multi-factor weighted scoring, anti-tunneling)
 * 5. CombatController (Charge, Side, Rear, Counter, Push, Pressure, Opportunistic, Escape)
 * 6. DefenseController (Emergency dodging, collision evasion, edge avoidance, crowd escape)
 * 7. MovementController (Physics forces, rotational steering, sprint dashes, controlled jumps)
 * 8. NavigationController (Obstacle avoidance, pathfinding, stuck resolution)
 * 9. SurvivalController (Boundary protection, collapsing tile evasion, lava ascension)
 * 10. PersonalitySystem (6 distinct personalities: AGGRESSIVE, BERSERKER, TACTICAL, DEFENSIVE, SURVIVOR, UNPREDICTABLE)
 * 11. MemorySystem (Attacker tracking, combo hits, target lock timer, cooldowns)
 * 12. CompetitionStrategy (Adapts universal brain across all 12 game modes)
 * 13. DecisionEngine (Decoupled 5-10Hz thinking tick + 60Hz physics movement)
 */

import * as THREE from '../libraries/three.module.js';
import { Personality } from './flag-character.js';

// Scratch vectors for high-performance physics calculations without GC allocations
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _v4 = new THREE.Vector3();
const _diff = new THREE.Vector3();

// --- 1. AI STATES ---
export const AIState = {
  IDLE: 'IDLE',
  OBSERVING: 'OBSERVING',
  SEARCHING_TARGET: 'SEARCHING_TARGET',
  APPROACHING: 'APPROACHING',
  ATTACKING: 'ATTACKING',
  CHARGING: 'CHARGING',
  PUSHING: 'PUSHING',
  DODGING: 'DODGING',
  BLOCKING: 'BLOCKING',
  RETREATING: 'RETREATING',
  RECOVERING: 'RECOVERING',
  SURVIVING: 'SURVIVING',
  RACING: 'RACING',
  CLIMBING: 'CLIMBING',
  CELEBRATING: 'CELEBRATING',
  ELIMINATED: 'ELIMINATED'
};

// --- 2. PERSONALITY TRAIT CONFIGURATIONS ---
export const PersonalityTraits = {
  AGGRESSIVE: {
    name: 'AGGRESSIVE',
    attackBias: 0.85,
    defenseBias: 0.20,
    chargeFrequency: 0.70,
    chargeDistance: 5.2,
    edgeThresholdRatio: 0.94,
    counterAttackChance: 0.45,
    dodgeChance: 0.30,
    targetWeights: { distance: 2.4, edgeKill: 3.5, vulnerable: 3.2, rearAttack: 2.0, threat: 2.6 }
  },
  BERSERKER: {
    name: 'BERSERKER',
    attackBias: 0.98,
    defenseBias: 0.05,
    chargeFrequency: 0.90,
    chargeDistance: 6.8,
    edgeThresholdRatio: 0.97, // Fights right on the rim fearlessly
    counterAttackChance: 0.65,
    dodgeChance: 0.12, // Rarely retreats, powers through attacks
    targetWeights: { distance: 3.2, edgeKill: 2.8, vulnerable: 2.2, rearAttack: 1.2, threat: 3.8 }
  },
  TACTICAL: {
    name: 'TACTICAL',
    attackBias: 0.65,
    defenseBias: 0.45,
    chargeFrequency: 0.50,
    chargeDistance: 4.0,
    edgeThresholdRatio: 0.88,
    counterAttackChance: 0.80, // Master of flanks and counter-attacks
    dodgeChance: 0.65,
    targetWeights: { distance: 1.4, edgeKill: 5.2, vulnerable: 5.6, rearAttack: 4.2, threat: 2.0 }
  },
  DEFENSIVE: {
    name: 'DEFENSIVE',
    attackBias: 0.35,
    defenseBias: 0.75,
    chargeFrequency: 0.28,
    chargeDistance: 3.4,
    edgeThresholdRatio: 0.78, // Guards safe territory
    counterAttackChance: 0.70,
    dodgeChance: 0.75,
    targetWeights: { distance: 1.6, edgeKill: 3.2, vulnerable: 4.2, rearAttack: 2.2, threat: 2.2 }
  },
  SURVIVOR: {
    name: 'SURVIVOR',
    attackBias: 0.25,
    defenseBias: 0.88,
    chargeFrequency: 0.22,
    chargeDistance: 3.0,
    edgeThresholdRatio: 0.72, // Stays far from dangerous drop-offs
    counterAttackChance: 0.55,
    dodgeChance: 0.88, // Highly agile and evasive
    targetWeights: { distance: 0.9, edgeKill: 4.8, vulnerable: 5.2, rearAttack: 3.2, threat: 0.6 }
  },
  UNPREDICTABLE: {
    name: 'UNPREDICTABLE',
    attackBias: 0.60,
    defenseBias: 0.50,
    chargeFrequency: 0.55,
    chargeDistance: 4.8,
    edgeThresholdRatio: 0.88,
    counterAttackChance: 0.55,
    dodgeChance: 0.55,
    targetWeights: { distance: 2.0, edgeKill: 3.2, vulnerable: 3.2, rearAttack: 3.0, threat: 2.2 }
  }
};

// --- 3. MEMORY SYSTEM ---
export class MemorySystem {
  constructor() {
    this.recentAttacker = null;
    this.timeSinceHit = 999;
    this.consecutiveHitsLanded = 0;
    this.targetLockTimer = 0;
    this.lastTargetId = null;
    this.stuckTimer = 0;
    this.recentPositions = [];
    this.dashCooldown = 0;
    this.dodgeCooldown = 0;
    this.jumpCooldown = 0;
    this.anticipationTimer = 0;
  }

  update(deltaTime, currentPos) {
    this.timeSinceHit += deltaTime;
    this.targetLockTimer += deltaTime;
    if (this.dashCooldown > 0) this.dashCooldown -= deltaTime;
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= deltaTime;
    if (this.jumpCooldown > 0) this.jumpCooldown -= deltaTime;
    if (this.anticipationTimer > 0) this.anticipationTimer -= deltaTime;

    // Track position samples for stuck detection
    this.recentPositions.push(currentPos.clone());
    if (this.recentPositions.length > 8) {
      this.recentPositions.shift();
    }
  }

  recordHit(attacker) {
    this.recentAttacker = attacker;
    this.timeSinceHit = 0;
  }

  setTarget(target) {
    if (target && target.id !== this.lastTargetId) {
      this.lastTargetId = target.id;
      this.targetLockTimer = 0;
    }
  }

  isStuck() {
    if (this.recentPositions.length < 8) return false;
    const first = this.recentPositions[0];
    const last = this.recentPositions[this.recentPositions.length - 1];
    return first.distanceTo(last) < 0.15;
  }
}

// --- 4. PERCEPTION SYSTEM ---
export class PerceptionSystem {
  observe(ai) {
    const char = ai.char;
    const comp = ai.comp;
    const myPos = char.body.position;
    const myVel = char.body.linearVelocity;
    const mySpeed = Math.sqrt(myVel.x * myVel.x + myVel.z * myVel.z);

    const perception = {
      selfPos: myPos,
      selfVel: myVel,
      selfSpeed: mySpeed,
      isGrounded: char.isGrounded,
      isRecovering: char.isRecovering,
      opponents: [],
      nearestOpponent: null,
      nearestDistance: Infinity,
      weakestOpponent: null,
      incomingThreats: [],
      crowdCentroid: new THREE.Vector3(),
      surroundedCount: 0,
      distFromCenter: Math.sqrt(myPos.x * myPos.x + myPos.z * myPos.z),
      arenaRadius: comp.ringRadius || 12,
      objective: comp.getObjective ? comp.getObjective(char) : null
    };

    if (!comp || !comp.characters) return perception;

    let totalX = 0, totalZ = 0;
    const aliveOpponents = comp.characters.filter(c => c !== char && c.isAlive);

    for (const opp of aliveOpponents) {
      const oppPos = opp.body.position;
      const oppVel = opp.body.linearVelocity;
      const d = myPos.distanceTo(oppPos);

      // Relative approach vector
      const relPos = oppPos.clone().sub(myPos);
      relPos.y = 0;

      // Opponent heading
      const oppSpeed = Math.sqrt(oppVel.x * oppVel.x + oppVel.z * oppVel.z);
      const oppHeading = oppSpeed > 0.1 ? oppVel.clone().normalize() : new THREE.Vector3();

      // Is opponent charging towards me?
      const toMe = myPos.clone().sub(oppPos).normalize();
      const isFacingMe = oppHeading.dot(toMe) > 0.45;
      const closingVelocity = (oppVel.x - myVel.x) * -toMe.x + (oppVel.z - myVel.z) * -toMe.z;

      // Distance of opponent to fatal arena edge
      const oppDistFromCenter = Math.sqrt(oppPos.x * oppPos.x + oppPos.z * oppPos.z);
      const oppDistToEdge = Math.max(0, perception.arenaRadius - oppDistFromCenter);
      const isNearEdge = oppDistToEdge < 2.2;

      const oppData = {
        char: opp,
        id: opp.id,
        pos: oppPos,
        velocity: oppVel,
        speed: oppSpeed,
        distance: d,
        relPos,
        isFacingMe,
        closingVelocity,
        isNearEdge,
        oppDistToEdge,
        isRecovering: opp.isRecovering || opp.isStumbling,
        isUnstable: !opp.isGrounded || oppSpeed > 8.0,
        personality: opp.personality
      };

      perception.opponents.push(oppData);

      // Nearest
      if (d < perception.nearestDistance) {
        perception.nearestDistance = d;
        perception.nearestOpponent = oppData;
      }

      // Incoming high-speed collision threat
      if (d < 5.0 && isFacingMe && closingVelocity > 2.2) {
        perception.incomingThreats.push(oppData);
      }

      // Crowd / surrounded check (< 3.0m)
      if (d < 3.0) {
        perception.surroundedCount++;
        totalX += oppPos.x;
        totalZ += oppPos.z;
      }

      // Weakest (stumbling or teetering on edge)
      if (isNearEdge || oppData.isRecovering) {
        if (!perception.weakestOpponent || d < perception.weakestOpponent.distance) {
          perception.weakestOpponent = oppData;
        }
      }
    }

    if (perception.surroundedCount > 0) {
      perception.crowdCentroid.set(
        totalX / perception.surroundedCount,
        myPos.y,
        totalZ / perception.surroundedCount
      );
    }

    return perception;
  }
}

// --- 5. THREAT DETECTOR ---
export class ThreatDetector {
  evaluate(ai, perception) {
    const traits = ai.traits;
    const threatReport = {
      threatLevel: 0, // 0.0 to 1.0
      primaryThreat: null,
      isIncomingCharge: false,
      isEdgeDanger: false,
      isSurrounded: perception.surroundedCount >= 2,
      escapeVector: new THREE.Vector3()
    };

    // 1. Edge Danger Assessment
    const edgeRatio = perception.distFromCenter / perception.arenaRadius;
    if (edgeRatio > traits.edgeThresholdRatio) {
      threatReport.isEdgeDanger = true;
      threatReport.threatLevel = Math.max(threatReport.threatLevel, 0.85);
      // Safe vector points directly toward arena center
      threatReport.escapeVector.set(-perception.selfPos.x, 0, -perception.selfPos.z).normalize();
    }

    // 2. Incoming Attack Assessment
    if (perception.incomingThreats.length > 0) {
      // Pick most urgent incoming attacker (closest)
      perception.incomingThreats.sort((a, b) => a.distance - b.distance);
      const threat = perception.incomingThreats[0];
      threatReport.primaryThreat = threat;
      threatReport.isIncomingCharge = true;
      threatReport.threatLevel = Math.max(threatReport.threatLevel, 0.75);

      // If already near edge and someone charges at us -> CRITICAL THREAT!
      if (threatReport.isEdgeDanger) {
        threatReport.threatLevel = 1.0;
      }

      // Calculate lateral sidestep / evasion vector
      const chargeDir = threat.velocity.clone().normalize();
      const perpA = new THREE.Vector3(-chargeDir.z, 0, chargeDir.x);
      const perpB = new THREE.Vector3(chargeDir.z, 0, -chargeDir.x);

      // Pick perpendicular direction that heads closer to arena center
      const centerPos = new THREE.Vector3(0, 0, 0);
      const candA = perception.selfPos.clone().add(perpA);
      const candB = perception.selfPos.clone().add(perpB);
      threatReport.escapeVector = candA.distanceTo(centerPos) < candB.distanceTo(centerPos) ? perpA : perpB;
    }

    // 3. Surrounded Assessment
    if (threatReport.isSurrounded && traits.defenseBias > 0.2) {
      threatReport.threatLevel = Math.max(threatReport.threatLevel, 0.65);
      // Vector pointing away from crowd centroid
      if (!threatReport.isEdgeDanger) {
        threatReport.escapeVector.copy(perception.selfPos).sub(perception.crowdCentroid).normalize();
      }
    }

    return threatReport;
  }
}

// --- 6. TARGET SELECTOR ---
export class TargetSelector {
  selectTarget(ai, perception, threat) {
    if (perception.opponents.length === 0) return null;

    const weights = ai.traits.targetWeights;
    let bestTarget = null;
    let highestScore = -Infinity;

    for (const opp of perception.opponents) {
      let score = 0;

      // 1. Proximity Score (Closer is favored, but weighted smartly)
      score += (1.0 / (opp.distance + 1.0)) * 10.0 * weights.distance;

      // 2. Near-Edge Vulnerability (Ring-out opportunity!)
      if (opp.isNearEdge) {
        score += 8.0 * weights.edgeKill;
      }

      // 3. Stumbling / Recovering Vulnerability (Punish recovering foes!)
      if (opp.isRecovering) {
        score += 7.0 * weights.vulnerable;
      }

      // 4. Rear Attack Opportunity (Opponent's back is turned)
      if (!opp.isFacingMe) {
        score += 4.0 * weights.rearAttack;
      }

      // 5. Threat Neutralization (Retaliate against aggressive threats)
      if (opp.char === ai.memory.recentAttacker && ai.memory.timeSinceHit < 2.5) {
        score += 5.0 * weights.threat;
      }

      // 6. Anti-Tunneling Penalty (Prevent locking on same opponent forever)
      if (opp.id === ai.memory.lastTargetId && ai.memory.targetLockTimer > 2.2) {
        score -= 4.0;
      }

      // 7. Small dynamic entropy for organic randomness
      score += (Math.random() - 0.5) * 1.5;

      if (score > highestScore) {
        highestScore = score;
        bestTarget = opp;
      }
    }

    return bestTarget;
  }
}

// --- 7. COMBAT CONTROLLER ---
export class CombatController {
  // A. Charge Attack: Builds speed, applies sprint, delivers explosive forward impulse
  chargeAttack(ai, target, dt) {
    const toTarget = target.pos.clone().sub(ai.char.body.position);
    toTarget.y = 0;
    const dist = toTarget.length();
    toTarget.normalize();

    ai.movement.currentMove.copy(toTarget);
    ai.movement.sprint = true;

    // Anticipation lean right before impact
    if (dist < 2.4 && dist > 1.2 && ai.memory.anticipationTimer <= 0) {
      ai.char.setAnticipation(0.28);
      ai.memory.anticipationTimer = 0.35;
    }

    // High-impact collision tackle burst
    if (dist < 1.8 && ai.memory.dashCooldown <= 0) {
      const tackleForce = 3.8 + Math.random() * 3.5;
      ai.char.dashImpulse(toTarget, tackleForce / 15.0);
      ai.memory.dashCooldown = 0.8;

      // Occasional leaping smash
      if (Math.random() < 0.28 && ai.char.isGrounded) {
        ai.char.jump();
      }
    }
  }

  // B. Side Attack: Approaches from flank (perpendicular) to catch opponent off-balance
  sideAttack(ai, target, dt) {
    const toTarget = target.pos.clone().sub(ai.char.body.position);
    toTarget.y = 0;
    toTarget.normalize();

    // Perpendicular flanking vector
    const perp = new THREE.Vector3(-toTarget.z, 0, toTarget.x);
    const flankVector = toTarget.clone().addScaledVector(perp, 0.7).normalize();

    ai.movement.currentMove.copy(flankVector);
    ai.movement.sprint = true;

    if (target.distance < 1.6 && ai.memory.dashCooldown <= 0) {
      ai.char.dashImpulse(toTarget, 1.2);
      ai.memory.dashCooldown = 0.7;
    }
  }

  // C. Rear Attack: Circles around behind target
  rearAttack(ai, target, dt) {
    const oppHeading = target.char.body.linearVelocity.clone().normalize();
    const behindPos = target.pos.clone().subScaledVector(oppHeading, 1.5);
    const toBehind = behindPos.sub(ai.char.body.position);
    toBehind.y = 0;
    toBehind.normalize();

    ai.movement.currentMove.copy(toBehind);
    ai.movement.sprint = true;

    if (target.distance < 1.8 && ai.memory.dashCooldown <= 0) {
      ai.char.dashImpulse(toBehind, 1.4);
      ai.memory.dashCooldown = 0.7;
    }
  }

  // D. Counter Attack: Sidesteps rushing threat and shoves them outward
  counterAttack(ai, threat, dt) {
    const chargeDir = threat.velocity.clone().normalize();
    const perp = new THREE.Vector3(-chargeDir.z, 0, chargeDir.x);

    // Sidestep then slam attacker from the side into the abyss
    ai.movement.currentMove.copy(perp);
    ai.movement.sprint = true;

    if (threat.distance < 2.0 && ai.memory.dashCooldown <= 0) {
      const shoveDir = chargeDir.clone().add(perp).normalize();
      ai.char.dashImpulse(shoveDir, 1.5);
      ai.memory.dashCooldown = 0.6;
    }
  }

  // E. Repeated Pressure: Stays on target, continuously pushing until eliminated
  repeatedPressure(ai, target, dt) {
    const toTarget = target.pos.clone().sub(ai.char.body.position);
    toTarget.y = 0;
    toTarget.normalize();

    ai.movement.currentMove.copy(toTarget);
    ai.movement.sprint = true;

    if (ai.memory.dashCooldown <= 0) {
      ai.char.dashImpulse(toTarget, 1.1);
      ai.memory.dashCooldown = 0.45;
    }
  }

  // F. Push Attack: Drives opponent towards the nearest arena edge
  pushAttack(ai, target, dt) {
    const oppPos = target.pos;
    // Edge direction: vector from center through opponent outwards
    const edgeDir = new THREE.Vector3(oppPos.x, 0, oppPos.z).normalize();

    // Position self behind opponent relative to the edge, then push towards edge!
    ai.movement.currentMove.copy(edgeDir);
    ai.movement.sprint = true;

    if (target.distance < 2.0 && ai.memory.dashCooldown <= 0) {
      ai.char.dashImpulse(edgeDir, 1.35);
      ai.memory.dashCooldown = 0.5;
    }
  }

  // G. Opportunistic Attack: Strikes a stumbling or teetering rival immediately
  opportunisticAttack(ai, target, dt) {
    const toTarget = target.pos.clone().sub(ai.char.body.position);
    toTarget.y = 0;
    toTarget.normalize();

    ai.movement.currentMove.copy(toTarget);
    ai.movement.sprint = true;
    ai.char.dashImpulse(toTarget, 1.6); // Maximum opportunistic burst
    ai.memory.dashCooldown = 0.75;
  }
}

// --- 8. DEFENSE CONTROLLER ---
export class DefenseController {
  emergencyDodge(ai, threat) {
    if (ai.memory.dodgeCooldown > 0) return;

    const chargeDir = threat.velocity.clone().normalize();
    const perp = new THREE.Vector3(-chargeDir.z, 0, chargeDir.x);
    if (Math.random() < 0.5) perp.negate();

    ai.char.dashImpulse(perp, 1.4);
    if (ai.char.isGrounded && Math.random() < 0.6) {
      ai.char.jump();
    }
    ai.memory.dodgeCooldown = 1.0;
  }

  edgeAvoidance(ai, ringRadius) {
    const pos = ai.char.body.position;
    const toCenter = new THREE.Vector3(-pos.x, 0, -pos.z).normalize();

    ai.movement.currentMove.copy(toCenter);
    ai.movement.sprint = true;

    // Emergency reverse hop if on the outer brink
    const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    if (dist > ringRadius * 0.95 && ai.char.isGrounded && Math.random() < 0.5) {
      ai.char.jump();
      ai.char.dashImpulse(toCenter, 1.1);
    }
  }

  escapeSurrounded(ai, escapeVector) {
    ai.movement.currentMove.copy(escapeVector);
    ai.movement.sprint = true;
    if (ai.char.isGrounded && Math.random() < 0.4) {
      ai.char.jump();
    }
  }
}

// --- 9. MOVEMENT CONTROLLER ---
export class MovementController {
  constructor(char) {
    this.char = char;
    this.currentMove = new THREE.Vector3();
    this.sprint = false;
  }

  apply(deltaTime) {
    if (!this.char.isAlive || this.char.hasFinished) return;
    this.char.applyMove(this.currentMove, this.sprint);
  }
}

// --- 10. NAVIGATION CONTROLLER ---
export class NavigationController {
  avoidObstacles(ai, desiredMove, obstacles) {
    if (!obstacles || obstacles.length === 0) return desiredMove;

    const myPos = ai.char.body.position;
    const avoidance = desiredMove.clone();

    for (const obs of obstacles) {
      if (!obs.mesh) continue;
      const obsPos = obs.mesh.position;
      const d = myPos.distanceTo(obsPos);

      if (d < 3.2) {
        const away = myPos.clone().sub(obsPos);
        away.y = 0;
        away.normalize();
        avoidance.addScaledVector(away, 1.8);

        if (d < 1.8 && ai.char.isGrounded && Math.random() < 0.4) {
          ai.char.jump();
        }
      }
    }

    return avoidance.normalize();
  }
}

// --- 11. UNIVERSAL COMPETITION STRATEGY ADAPTER (12 Modes) ---
export class CompetitionStrategy {
  execute(ai, perception, threat, target, dt) {
    const mode = ai.comp ? ai.comp.modeId : 'sumo';

    switch (mode) {
      case 'sumo':
        this.strategySumo(ai, perception, threat, target, dt);
        break;
      case 'obstacle-race':
        this.strategyObstacleRace(ai, perception, threat, target, dt);
        break;
      case 'last-survivor':
        this.strategyLastSurvivor(ai, perception, threat, target, dt);
        break;
      case 'tug-of-war':
        this.strategyTugOfWar(ai, perception, threat, target, dt);
        break;
      case 'rising-lava':
        this.strategyRisingLava(ai, perception, threat, target, dt);
        break;
      case 'bowling':
        this.strategyBowling(ai, perception, threat, target, dt);
        break;
      case 'jump-challenge':
        this.strategyJumpChallenge(ai, perception, threat, target, dt);
        break;
      case 'downhill-race':
        this.strategyDownhillRace(ai, perception, threat, target, dt);
        break;
      case 'glass-bridge':
        this.strategyGlassBridge(ai, perception, threat, target, dt);
        break;
      case 'spin-battle':
        this.strategySpinBattle(ai, perception, threat, target, dt);
        break;
      case 'tower-climb':
        this.strategyTowerClimb(ai, perception, threat, target, dt);
        break;
      case 'football-battle':
        this.strategyFootballBattle(ai, perception, threat, target, dt);
        break;
      default:
        this.strategySumo(ai, perception, threat, target, dt);
    }
  }

  // 1. Sumo Battle: Circular arena, aggressive push-outs, edge awareness
  strategySumo(ai, perception, threat, target, dt) {
    // A. Critical Edge Evasion
    if (threat.isEdgeDanger && ai.traits.defenseBias > 0.1) {
      ai.state = AIState.SURVIVING;
      ai.defense.edgeAvoidance(ai, perception.arenaRadius);
      return;
    }

    // B. Counter-attack or Dodge incoming speeding threats
    if (threat.isIncomingCharge) {
      if (Math.random() < ai.traits.counterAttackChance) {
        ai.state = AIState.ATTACKING;
        ai.combat.counterAttack(ai, threat.primaryThreat, dt);
      } else {
        ai.state = AIState.DODGING;
        ai.defense.emergencyDodge(ai, threat.primaryThreat);
      }
      return;
    }

    // C. Escape being surrounded
    if (threat.isSurrounded && ai.traits.defenseBias > 0.3) {
      ai.state = AIState.RETREATING;
      ai.defense.escapeSurrounded(ai, threat.escapeVector);
      return;
    }

    // D. Target Attack
    if (!target) {
      ai.state = AIState.OBSERVING;
      ai.movement.currentMove.set(0, 0, 0);
      return;
    }

    ai.memory.setTarget(target.char);

    // Opportunistic Strike if target is stumbling/vulnerable
    if (target.isRecovering || target.isNearEdge) {
      ai.state = AIState.ATTACKING;
      ai.combat.opportunisticAttack(ai, target, dt);
      return;
    }

    // Tactical positioning: flank, rear, charge, or continuous push
    if (target.distance < 3.2) {
      if (ai.traits.name === 'TACTICAL' && Math.random() < 0.45) {
        ai.state = AIState.ATTACKING;
        ai.combat.sideAttack(ai, target, dt);
      } else if (target.isNearEdge) {
        ai.state = AIState.PUSHING;
        ai.combat.pushAttack(ai, target, dt);
      } else {
        ai.state = AIState.CHARGING;
        ai.combat.chargeAttack(ai, target, dt);
      }
    } else {
      ai.state = AIState.APPROACHING;
      ai.combat.chargeAttack(ai, target, dt);
    }
  }

  // 2. Obstacle Race: High speed track navigation, obstacle dodging, finish line focus
  strategyObstacleRace(ai, perception, threat, target, dt) {
    const myPos = ai.char.body.position;
    const finishZ = ai.comp.finishZ || 55;
    const targetZ = new THREE.Vector3(0, myPos.y, finishZ);

    let moveDir = targetZ.clone().sub(myPos);
    moveDir.y = 0;
    moveDir.normalize();

    // Avoid moving sweepers/hammers
    moveDir = ai.navigation.avoidObstacles(ai, moveDir, ai.comp.obstacles);

    ai.state = AIState.RACING;
    ai.movement.currentMove.copy(moveDir);
    ai.movement.sprint = (ai.traits.attackBias > 0.4 || Math.random() < 0.7);

    // Strategic bump against adjacent competitors on track
    if (target && target.distance < 1.8 && Math.random() < 0.25) {
      ai.combat.chargeAttack(ai, target, dt);
    }
  }

  // 3. Last Flag Standing: Tile stability detection, survival leaping, shoving rivals off shaky tiles
  strategyLastSurvivor(ai, perception, threat, target, dt) {
    const myPos = ai.char.body.position;
    const tiles = ai.comp.tiles || [];

    // Find current tile
    let currentTile = null;
    let minD = Infinity;
    for (const t of tiles) {
      const d = Math.sqrt((t.x - myPos.x) ** 2 + (t.z - myPos.z) ** 2);
      if (d < minD) {
        minD = d;
        currentTile = t;
      }
    }

    // If current tile is dropping or about to collapse -> EMERGENCY LEAP to safe tile!
    if (currentTile && (currentTile.isDropping || currentTile.isWarning || currentTile.isFalling || currentTile.hasFallen || currentTile.shakeTimer > 0)) {
      ai.state = AIState.SURVIVING;
      // Find nearest stable solid tile
      const safeTiles = tiles.filter(t => !t.isDropping && !t.isWarning && !t.isFalling && !t.hasFallen && (!t.shakeTimer || t.shakeTimer <= 0));
      if (safeTiles.length > 0) {
        safeTiles.sort((a, b) => {
          const da = (a.x - myPos.x) ** 2 + (a.z - myPos.z) ** 2;
          const db = (b.x - myPos.x) ** 2 + (b.z - myPos.z) ** 2;
          return da - db;
        });

        const safe = safeTiles[0];
        const leapDir = new THREE.Vector3(safe.x - myPos.x, 0, safe.z - myPos.z).normalize();
        ai.movement.currentMove.copy(leapDir);
        ai.movement.sprint = true;
        if (ai.char.isGrounded) ai.char.jump();
        return;
      }
    }

    // Otherwise, push rivals off their tiles!
    if (target && target.distance < 3.0) {
      ai.state = AIState.ATTACKING;
      ai.combat.pushAttack(ai, target, dt);
    } else {
      ai.state = AIState.OBSERVING;
      ai.movement.currentMove.set(0, 0, 0);
    }
  }

  // 4. Tug of War: Synchronized team pull bursts and balance coordination
  strategyTugOfWar(ai, perception, threat, target, dt) {
    const isTeam0 = ai.comp.team0 && ai.comp.team0.includes(ai.char);
    const pullDir = isTeam0 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 0, 1);

    // Rhythm burst pulling
    const pullPulse = Math.sin(Date.now() * 0.007) > 0.2;
    ai.movement.currentMove.copy(pullDir);
    ai.movement.sprint = pullPulse;

    if (pullPulse && Math.random() < 0.08 && ai.char.isGrounded) {
      ai.char.jump();
    }
  }

  // 5. Rising Lava: Upward ascent, step jumping, contesting higher platforms
  strategyRisingLava(ai, perception, threat, target, dt) {
    const myPos = ai.char.body.position;
    const lavaY = ai.comp.lavaHeight || (ai.comp.lavaMesh ? ai.comp.lavaMesh.position.y : -2);
    const steps = ai.comp.steps || [];

    // Find next higher platform
    let nextStep = null;
    let minStepD = Infinity;

    for (const step of steps) {
      if (step.mesh && step.mesh.position.y > myPos.y - 0.2) {
        const d = myPos.distanceTo(step.mesh.position);
        if (d < minStepD) {
          minStepD = d;
          nextStep = step;
        }
      }
    }

    if (nextStep && nextStep.mesh) {
      const stepPos = nextStep.mesh.position;
      const toStep = stepPos.clone().sub(myPos);
      toStep.y = 0;
      toStep.normalize();

      ai.state = AIState.CLIMBING;
      ai.movement.currentMove.copy(toStep);
      ai.movement.sprint = true;

      // Jump when close to step or if lava is catching up
      if (myPos.distanceTo(stepPos) < 2.5 && ai.char.isGrounded) {
        ai.char.jump();
      }
    }

    // Displace rivals sharing the same step
    if (target && target.distance < 1.8 && Math.random() < 0.3) {
      ai.combat.pushAttack(ai, target, dt);
    }
  }

  // 6. Bowling Challenge: Lane sprint, pin cluster targeting
  strategyBowling(ai, perception, threat, target, dt) {
    const myPos = ai.char.body.position;
    const pinTarget = new THREE.Vector3(0, myPos.y, 45); // Headpin position

    const toPins = pinTarget.clone().sub(myPos);
    toPins.y = 0;
    toPins.normalize();

    ai.movement.currentMove.copy(toPins);
    ai.movement.sprint = true;
  }

  // 7. Jump Challenge: Run-up acceleration, ramp lip launch timing
  strategyJumpChallenge(ai, perception, threat, target, dt) {
    const myPos = ai.char.body.position;
    const rampLipZ = 18;

    ai.movement.currentMove.set(0, 0, 1);
    ai.movement.sprint = true;

    // Launch at the lip of the ramp for maximum trajectory
    if (myPos.z > rampLipZ - 1.5 && myPos.z < rampLipZ + 1.0 && ai.char.isGrounded) {
      ai.char.jump();
    }
  }

  // 8. Downhill Race: Velocity maximization, curve banking, racer bumping
  strategyDownhillRace(ai, perception, threat, target, dt) {
    const myPos = ai.char.body.position;
    const finishZ = ai.comp.finishZ || 65;

    let moveDir = new THREE.Vector3(0, 0, 1);
    moveDir = ai.navigation.avoidObstacles(ai, moveDir, ai.comp.obstacles);

    ai.state = AIState.RACING;
    ai.movement.currentMove.copy(moveDir);
    ai.movement.sprint = true;

    // Jostle adjacent competitor
    if (target && target.distance < 1.6 && Math.random() < 0.25) {
      ai.combat.chargeAttack(ai, target, dt);
    }
  }

  // 9. Glass Bridge: Platform stepping, safe glass tracking, shoving hesitant rivals
  strategyGlassBridge(ai, perception, threat, target, dt) {
    const myPos = ai.char.body.position;
    const pairs = ai.comp.pairs || [];

    // Find current step index
    let nextPair = null;
    for (const p of pairs) {
      if (p.z > myPos.z + 0.5) {
        nextPair = p;
        break;
      }
    }

    if (nextPair) {
      // Pick known safe panel or test forward
      const targetX = nextPair.safeIndex === 0 ? -2.2 : 2.2;
      const stepTarget = new THREE.Vector3(targetX, myPos.y, nextPair.z);
      const toStep = stepTarget.sub(myPos);
      toStep.y = 0;
      toStep.normalize();

      ai.movement.currentMove.copy(toStep);
      ai.movement.sprint = (Math.random() < 0.6);

      if (ai.char.isGrounded && toStep.length() < 2.5) {
        ai.char.jump();
      }
    } else {
      // Sprint across finish
      ai.movement.currentMove.set(0, 0, 1);
      ai.movement.sprint = true;
    }
  }

  // 10. Spin Battle: Centrifugal momentum collisions in high-speed spinning arena
  strategySpinBattle(ai, perception, threat, target, dt) {
    // Sumo mechanics with extra angular momentum charges
    this.strategySumo(ai, perception, threat, target, dt);
  }

  // 11. Tower Climb: Spiral ascent, obstacle leaping, peak dash
  strategyTowerClimb(ai, perception, threat, target, dt) {
    const myPos = ai.char.body.position;
    const topY = ai.comp.topY || 24;

    if (myPos.y < topY - 1.0) {
      // Spiral upward along platform radius
      const angle = Math.atan2(myPos.z, myPos.x) + 0.25;
      const radius = 6.5;
      const targetPos = new THREE.Vector3(Math.cos(angle) * radius, myPos.y, Math.sin(angle) * radius);
      const toTarget = targetPos.sub(myPos).normalize();

      ai.state = AIState.CLIMBING;
      ai.movement.currentMove.copy(toTarget);
      ai.movement.sprint = true;

      if (ai.char.isGrounded && Math.random() < 0.15) {
        ai.char.jump();
      }
    } else {
      // Hold top platform and push competitors down!
      if (target && target.distance < 2.5) {
        ai.combat.pushAttack(ai, target, dt);
      }
    }
  }

  // 12. Football Battle: Role-based play (striker, defender, goalkeeper)
  strategyFootballBattle(ai, perception, threat, target, dt) {
    const ball = ai.comp.ball;
    if (!ball) return;

    const myPos = ai.char.body.position;
    const ballPos = ball.position;
    const isTeam0 = ai.comp.team0 && ai.comp.team0.includes(ai.char);
    const enemyGoalZ = isTeam0 ? 13 : -13;
    const ownGoalZ = isTeam0 ? -13 : 13;

    // Role assignment based on character index
    const myTeam = isTeam0 ? ai.comp.team0 : ai.comp.team1;
    const roleIdx = myTeam ? myTeam.indexOf(ai.char) : 0;
    const isGoalkeeper = (roleIdx === 0);

    if (isGoalkeeper) {
      // Guard goal line: match ball's X coordinate, stay near ownGoalZ
      const guardX = Math.max(-3.5, Math.min(3.5, ballPos.x));
      const guardPos = new THREE.Vector3(guardX, myPos.y, ownGoalZ * 0.88);
      const toGuard = guardPos.sub(myPos);
      toGuard.y = 0;

      if (toGuard.length() > 0.4) {
        ai.movement.currentMove.copy(toGuard.normalize());
        ai.movement.sprint = toGuard.length() > 1.5;
      } else {
        ai.movement.currentMove.set(0, 0, 0);
      }

      // If ball enters goal box, clear it with high-power kick!
      if (myPos.distanceTo(ballPos) < 3.2) {
        const kickDir = new THREE.Vector3(0, 0.4, enemyGoalZ > 0 ? 1 : -1).normalize();
        ai.movement.currentMove.copy(kickDir);
        ai.movement.sprint = true;
        ai.char.dashImpulse(kickDir, 1.8);
      }
    } else {
      // Field Player / Striker: Chase ball and shoot towards enemy goal!
      const toBall = ballPos.clone().sub(myPos);
      toBall.y = 0;
      const distToBall = toBall.length();
      toBall.normalize();

      if (distToBall > 1.2) {
        ai.movement.currentMove.copy(toBall);
        ai.movement.sprint = true;
      } else {
        // Strike ball toward enemy goal net
        const shootDir = new THREE.Vector3((Math.random() - 0.5) * 2, 0.2, enemyGoalZ > 0 ? 1 : -1).normalize();
        ai.movement.currentMove.copy(shootDir);
        ai.movement.sprint = true;
        ai.char.dashImpulse(shootDir, 1.8);

        if (ai.char.isGrounded && Math.random() < 0.3) {
          ai.char.jump();
        }
      }
    }
  }
}

// --- 12. UNIVERSAL AI BRAIN & DECISION ENGINE ---
export class FlagAI {
  constructor(character, competition) {
    this.char = character;
    this.comp = competition;
    this.state = AIState.IDLE;

    // Load personality profile
    this.personality = character.personality || Personality.BALANCED;
    this.traits = PersonalityTraits[this.personality] || PersonalityTraits.AGGRESSIVE;

    // Subsystems
    this.memory = new MemorySystem();
    this.perception = new PerceptionSystem();
    this.threatDetector = new ThreatDetector();
    this.targetSelector = new TargetSelector();
    this.combat = new CombatController();
    this.defense = new DefenseController();
    this.movement = new MovementController(character);
    this.navigation = new NavigationController();
    this.strategy = new CompetitionStrategy();

    // Decoupled AI thinking timer (~6-8 Hz updates for realistic reaction time)
    this.decisionInterval = 0.14 + (Math.random() - 0.5) * 0.04;
    this.decisionTimer = Math.random() * this.decisionInterval;

    // Target tracking
    this.currentTarget = null;
    this.lastPerception = null;
    this.lastThreat = null;
  }

  update(deltaTime) {
    if (!this.char.isAlive || this.char.hasFinished) {
      this.state = AIState.ELIMINATED;
      return;
    }

    // 1. Update Memory System
    this.memory.update(deltaTime, this.char.body.position);

    // 2. Decoupled AI Decision Tick (5-8 times per second)
    this.decisionTimer -= deltaTime;
    if (this.decisionTimer <= 0) {
      this.decisionTimer = this.decisionInterval + (Math.random() - 0.5) * 0.03;
      this.think(deltaTime);
    }

    // 3. 60 FPS Physics Movement Application
    this.movement.apply(deltaTime);

    // 4. Stuck Resolution (if AI intends to move but position is locked)
    if (this.movement.currentMove.lengthSq() > 0.1 && this.memory.isStuck()) {
      this.memory.stuckTimer += deltaTime;
      if (this.memory.stuckTimer > 0.45 && this.char.isGrounded) {
        this.char.jump();
        // Reverse direction burst
        this.movement.currentMove.negate();
        this.memory.stuckTimer = 0;
      }
    } else {
      this.memory.stuckTimer = 0;
    }
  }

  think(deltaTime) {
    // A. Perception: Gather environmental awareness
    const perception = this.perception.observe(this);
    this.lastPerception = perception;

    // B. Threat Detection: Analyze incoming attacks and danger
    const threat = this.threatDetector.evaluate(this, perception);
    this.lastThreat = threat;

    // C. Dynamic Personality Modulation (Unpredictable persona cycles behavior)
    if (this.personality === Personality.UNPREDICTABLE && Math.random() < 0.15) {
      const keys = Object.keys(PersonalityTraits);
      this.traits = PersonalityTraits[keys[Math.floor(Math.random() * keys.length)]];
    }

    // D. Target Selection
    const target = this.targetSelector.selectTarget(this, perception, threat);
    this.currentTarget = target;

    // E. Execute Universal Strategy for current competition mode
    this.strategy.execute(this, perception, threat, target, deltaTime);
  }
}

// Backward-compatible alias for existing competition modules
export const AIController = FlagAI;
