/**
 * FLAG BATTLE ARENA - Base Competition Manager
 * Common lifecycle, match countdown, scoring, elimination tracking,
 * and leaderboard state management for all 12 game modes.
 */

import { PhysicsWorld } from './physics-engine.js';
import { audio } from './audio-manager.js';
import { storage } from './storage-manager.js';

export class Competition {
  constructor(engine, countries, options = {}) {
    this.engine = engine;
    this.scene = engine.scene;
    this.countries = countries;
    this.options = options;

    this.modeId = 'generic';
    this.modeName = 'Competition';
    this.modeDescription = '';

    // Physics World
    this.world = new PhysicsWorld();

    // Characters & AI
    this.characters = [];
    this.aiControllers = [];
    this.eliminatedCharacters = [];
    this.currentLeader = null;

    // Match State
    this.status = 'COUNTDOWN'; // 'COUNTDOWN', 'RUNNING', 'PAUSED', 'FINISHED'
    this.countdown = 3;
    this.countdownTimer = 3.0;
    this.matchTimer = 0;
    this.winner = null;
    this.podium = [];

    // UI Callbacks
    this.onUpdateUI = options.onUpdateUI || null;
    this.onFinish = options.onFinish || null;
    this.onElimination = options.onElimination || null;
  }

  init() {
    // Child classes implement arena creation & character spawning here
  }

  startCountdown() {
    this.status = 'COUNTDOWN';
    this.countdown = 3;
    this.countdownTimer = 3.0;
    audio.playCountdown(false);
  }

  update(dt) {
    if (this.status === 'COUNTDOWN') {
      this.countdownTimer -= dt;
      const currentInt = Math.ceil(this.countdownTimer);

      if (currentInt !== this.countdown && currentInt > 0) {
        this.countdown = currentInt;
        audio.playCountdown(false);
      }

      if (this.countdownTimer <= 0) {
        this.status = 'RUNNING';
        this.countdown = 0;
        audio.playCountdown(true);
        audio.playWhistle();
      }

      if (this.onUpdateUI) this.onUpdateUI(this.getHUDState());
      return;
    }

    if (this.status !== 'RUNNING') return;

    this.matchTimer += dt;

    // 1. Step Physics Simulation
    this.world.step(dt);

    // 2. Update AI Controllers
    for (const ai of this.aiControllers) {
      ai.update(dt);
    }

    // 3. Update Character Visuals & States
    for (const char of this.characters) {
      char.update(dt);
    }

    // 4. Mode-specific update logic (bounds checks, race progress, etc.)
    this.onMatchUpdate(dt);

    // 5. Update Leader & Leaderboard
    this.updateLeaderboard();

    // 6. Notify UI
    if (this.onUpdateUI) {
      this.onUpdateUI(this.getHUDState());
    }
  }

  onMatchUpdate(dt) {
    // Implemented in mode subclasses
  }

  // --- UNIVERSAL COMPETITION INTERFACE (Section 16) ---

  getObjective(character) {
    return {
      modeId: this.modeId,
      modeName: this.modeName,
      type: 'SURVIVE',
      combatPriority: 'HIGH',
      targetPosition: null,
      dangerRadius: this.ringRadius || 12,
      isSuddenDeath: this.matchTimer > 75,
      obstacles: this.obstacles || [],
      safeZones: []
    };
  }

  evaluateSituation(character, perception) {
    return {
      dangerLevel: perception ? perception.threatLevel : 0,
      hasAdvantage: perception && perception.target && perception.target.isRecovering
    };
  }

  chooseAction(character, perception) {
    return null; // Handled autonomously by Universal FlagAI Brain
  }

  executeAction(character, action) {
    // Optional hook for competition-specific action overrides
  }

  checkElimination(character) {
    if (!character || !character.isAlive) return false;
    return character.body.position.y < -3.0;
  }

  checkVictory() {
    const alive = this.characters.filter(c => c.isAlive);
    return alive.length <= 1;
  }

  updateLeaderboard() {
    // Default survival rank: alive characters first, then eliminated in reverse order
    const alive = this.characters.filter(c => c.isAlive);
    const dead = [...this.eliminatedCharacters].reverse();

    const sorted = [...alive, ...dead];
    sorted.forEach((char, idx) => {
      char.rank = idx + 1;
      char.setLeader(idx === 0 && char.isAlive);
    });

    this.currentLeader = alive[0] || null;
  }

  handleElimination(character, reason = 'Eliminated!') {
    if (!character.isAlive) return;

    character.eliminate();
    this.eliminatedCharacters.push(character);

    // Slow-motion effect on dramatic elimination
    this.engine.cameraController.triggerSlowMo(0.3, 0.9);
    this.engine.cameraController.triggerShake(0.5, 0.3);

    // Particle burst
    this.engine.spawnParticleBurst(character.body.position, 25, 0xEF4444);

    if (this.onElimination) {
      this.onElimination(character, reason);
    }
  }

  finishMatch(winnerCountry, podiumCountries = []) {
    if (this.status === 'FINISHED') return;
    this.status = 'FINISHED';
    this.winner = winnerCountry;
    this.podium = podiumCountries.length > 0 ? podiumCountries : [winnerCountry];

    audio.playWhistle();
    audio.playFanfare();

    // Record stats to storage
    const record = storage.recordMatchResult({
      mode: this.modeId,
      modeName: this.modeName,
      winner: this.winner,
      podium: this.podium,
      participants: this.countries,
      duration: this.matchTimer
    });

    // Slow-mo cinematic celebration
    this.engine.cameraController.triggerSlowMo(0.4, 2.0);

    if (this.onFinish) {
      this.onFinish({
        winner: this.winner,
        podium: this.podium,
        duration: this.matchTimer,
        record
      });
    }
  }

  getHUDState() {
    return {
      modeId: this.modeId,
      modeName: this.modeName,
      status: this.status,
      countdown: this.countdown,
      matchTimer: this.matchTimer,
      aliveCount: this.characters.filter(c => c.isAlive).length,
      totalCount: this.characters.length,
      leader: this.currentLeader ? this.currentLeader.country : null,
      leaderboard: this.characters.map(c => ({
        country: c.country,
        isAlive: c.isAlive,
        rank: c.rank,
        score: c.score,
        personality: c.personality
      }))
    };
  }

  destroy() {
    // Remove characters from 3D scene & physics
    for (const char of this.characters) {
      char.destroy();
    }
    this.characters = [];
    this.aiControllers = [];
    this.eliminatedCharacters = [];
    this.world.clear();
  }
}
