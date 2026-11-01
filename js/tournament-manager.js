/**
 * FLAG BATTLE ARENA - Tournament Manager
 * Single elimination bracket generator for 4, 8, 16, 32, and 64 countries.
 * Handles matchups, rounds progression, bracket state, and crowning champions.
 */

import { storage } from './storage-manager.js';

export const ALL_MODES = [
  'sumo', 'obstacle-race', 'last-survivor', 'tug-of-war',
  'rising-lava', 'bowling', 'jump-challenge', 'downhill-race',
  'glass-bridge', 'spin-battle', 'tower-climb', 'football-battle'
];

export class TournamentManager {
  constructor() {
    this.tournamentSize = 8;
    this.rounds = [];
    this.currentRoundIdx = 0;
    this.currentMatchIdx = 0;
    this.champion = null;
    this.isFinished = false;
    this.selectedMode = 'random'; // 'random' or a specific modeId
  }

  createTournament(countries, options = {}) {
    const validSizes = [4, 8, 16, 32, 64];
    let size = countries.length;

    // Pick closest valid power of 2 bracket size
    let targetSize = validSizes.find(s => s >= size) || 64;
    targetSize = Math.min(targetSize, 64);

    let competitors = [...countries];
    if (competitors.length > targetSize) {
      competitors = competitors.slice(0, targetSize);
    }

    this.tournamentSize = targetSize;
    this.selectedMode = options.mode || 'random';
    this.currentRoundIdx = 0;
    this.currentMatchIdx = 0;
    this.champion = null;
    this.isFinished = false;

    // Build Round Structure
    this.rounds = [];
    let currentPool = [...competitors];

    // Total rounds = log2(targetSize)
    const numRounds = Math.log2(targetSize);
    const roundLabels = this.getRoundLabels(targetSize);

    for (let r = 0; r < numRounds; r++) {
      const matchCount = Math.pow(2, numRounds - r - 1);
      const matches = [];

      for (let m = 0; m < matchCount; m++) {
        let compA = null;
        let compB = null;

        if (r === 0) {
          compA = currentPool[m * 2] || null;
          compB = currentPool[m * 2 + 1] || null;
        }

        const modeId = this.selectedMode === 'random'
          ? ALL_MODES[Math.floor(Math.random() * ALL_MODES.length)]
          : this.selectedMode;

        matches.push({
          id: `r${r}_m${m}`,
          roundIndex: r,
          matchIndex: m,
          roundName: roundLabels[r],
          competitorA: compA,
          competitorB: compB,
          winner: null,
          modeId,
          status: (r === 0 && m === 0) ? 'ACTIVE' : 'PENDING'
        });
      }

      this.rounds.push({
        name: roundLabels[r],
        matches
      });
    }

    this.saveState();
    return this.rounds;
  }

  getRoundLabels(size) {
    if (size === 4) return ['Semi-Finals', 'Grand Final'];
    if (size === 8) return ['Quarter-Finals', 'Semi-Finals', 'Grand Final'];
    if (size === 16) return ['Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Grand Final'];
    if (size === 32) return ['Round of 32', 'Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Grand Final'];
    if (size === 64) return ['Round of 64', 'Round of 32', 'Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Grand Final'];
    return ['Round 1', 'Semi-Finals', 'Grand Final'];
  }

  getCurrentMatch() {
    if (this.isFinished) return null;
    const round = this.rounds[this.currentRoundIdx];
    if (!round) return null;
    return round.matches[this.currentMatchIdx] || null;
  }

  recordMatchWinner(winnerCountry) {
    const currentMatch = this.getCurrentMatch();
    if (!currentMatch) return null;

    currentMatch.winner = winnerCountry;
    currentMatch.status = 'COMPLETED';

    // Propagate winner to next round
    const nextRoundIdx = this.currentRoundIdx + 1;
    if (nextRoundIdx < this.rounds.length) {
      const nextMatchIdx = Math.floor(this.currentMatchIdx / 2);
      const isSlotA = this.currentMatchIdx % 2 === 0;
      const nextMatch = this.rounds[nextRoundIdx].matches[nextMatchIdx];

      if (isSlotA) {
        nextMatch.competitorA = winnerCountry;
      } else {
        nextMatch.competitorB = winnerCountry;
      }
    }

    // Advance match pointer
    this.currentMatchIdx++;
    const currentRound = this.rounds[this.currentRoundIdx];

    if (this.currentMatchIdx >= currentRound.matches.length) {
      // Round completed!
      this.currentRoundIdx++;
      this.currentMatchIdx = 0;

      if (this.currentRoundIdx >= this.rounds.length) {
        // Tournament completed!
        this.isFinished = true;
        this.champion = winnerCountry;
        storage.saveTournamentState(null); // Clear active tournament
        return { isFinished: true, champion: this.champion };
      }
    }

    const nextMatch = this.getCurrentMatch();
    if (nextMatch) nextMatch.status = 'ACTIVE';

    this.saveState();
    return { isFinished: false, nextMatch };
  }

  saveState() {
    storage.saveTournamentState({
      tournamentSize: this.tournamentSize,
      rounds: this.rounds,
      currentRoundIdx: this.currentRoundIdx,
      currentMatchIdx: this.currentMatchIdx,
      champion: this.champion,
      isFinished: this.isFinished,
      selectedMode: this.selectedMode
    });
  }

  loadState() {
    const state = storage.getTournamentState();
    if (state && state.rounds) {
      this.tournamentSize = state.tournamentSize;
      this.rounds = state.rounds;
      this.currentRoundIdx = state.currentRoundIdx;
      this.currentMatchIdx = state.currentMatchIdx;
      this.champion = state.champion;
      this.isFinished = state.isFinished;
      this.selectedMode = state.selectedMode || 'random';
      return true;
    }
    return false;
  }
}

export const tournament = new TournamentManager();
