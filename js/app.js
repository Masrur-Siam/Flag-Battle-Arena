/**
 * FLAG BATTLE ARENA - Master Application Orchestrator
 * Pure Vanilla JavaScript ES6+ Entry Point
 * Orchestrates menus, competition factory, spectator HUD, PWA install, and storage.
 */

import confetti from 'canvas-confetti';
import { GameEngine } from './game-engine.js';
import { nav } from './navigation.js';
import { COUNTRIES, getRandomCountries } from './countries.js';
import { FlagSelector } from './flag-selector.js';
import { audio } from './audio-manager.js';
import { storage } from './storage-manager.js';
import { tournament, ALL_MODES } from './tournament-manager.js';

// Competition Mode Classes
import { SumoBattle } from '../competitions/sumo.js';
import { ObstacleRace } from '../competitions/obstacle-race.js';
import { LastFlagStanding } from '../competitions/last-survivor.js';
import { TugOfWar } from '../competitions/tug-of-war.js';
import { RisingLava } from '../competitions/rising-lava.js';
import { BowlingChallenge } from '../competitions/bowling.js';
import { JumpChallenge } from '../competitions/jump-challenge.js';
import { DownhillRace } from '../competitions/downhill-race.js';
import { GlassBridge } from '../competitions/glass-bridge.js';
import { SpinBattle } from '../competitions/spin-battle.js';
import { TowerClimb } from '../competitions/tower-climb.js';
import { FootballBattle } from '../competitions/football-battle.js';

class App {
  constructor() {
    this.engine = null;
    this.currentCompetition = null;
    this.customSelector = null;
    this.tournamentSelector = null;
    this.selectedCustomMode = 'sumo';
    this.activeTournamentMatch = null;

    // PWA Install Prompt
    this.deferredPrompt = null;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    this.init();
  }

  init() {
    // 1. Initialize 3D Engine
    const canvasContainer = document.getElementById('game-canvas-container');
    this.engine = new GameEngine(canvasContainer);

    // 2. Setup Country Pickers
    this.setupSelectors();

    // 3. Register Event Listeners & Buttons
    this.wireMainMenu();
    this.wireCustomBattle();
    this.wireTournament();
    this.wireModesCatalog();
    this.wireRecords();
    this.wireSettings();
    this.wireSpectatorHUD();
    this.wireVictoryModal();
    this.setupPWA();

    // 4. Initial Render of Settings & Records
    this.renderSettings();

    // 5. Check if active tournament exists to offer resume
    const savedTourney = storage.getTournamentState();
    if (savedTourney && !savedTourney.isFinished) {
      const resumeBanner = document.getElementById('tournament-resume-banner');
      if (resumeBanner) resumeBanner.classList.remove('hidden');
    }
  }

  setupSelectors() {
    // Custom Battle Selector (2 to 20 countries)
    this.customSelector = new FlagSelector({
      maxSelections: 20,
      minSelections: 2
    });
    const customContainer = document.getElementById('custom-flag-selector-wrap');
    if (customContainer) {
      this.customSelector.renderTo(customContainer);
    }

    // Tournament Selector (Up to 64 countries)
    this.tournamentSelector = new FlagSelector({
      maxSelections: 64,
      minSelections: 4
    });
    const tourneyContainer = document.getElementById('tourney-flag-selector-wrap');
    if (tourneyContainer) {
      this.tournamentSelector.renderTo(tourneyContainer);
    }
  }

  // --- COMPETITION FACTORY ---

  startCompetition(modeId, countries, isTournament = false) {
    if (this.currentCompetition) {
      this.currentCompetition.destroy();
      this.currentCompetition = null;
    }

    // Unhide 3D screen
    nav.showScreen('screen-game');

    // Ensure spectator tools dock and sidebar are clean/hidden for fresh view
    document.getElementById('hud-tools-dock')?.classList.add('hidden');
    document.getElementById('game-leaderboard-sidebar')?.classList.add('collapsed');

    // Show subtle gesture hint then auto-fade after 4 seconds
    const hint = document.getElementById('fresh-gesture-hint');
    if (hint) {
      hint.style.opacity = '1';
      clearTimeout(this.hintTimeout);
      this.hintTimeout = setTimeout(() => {
        hint.style.opacity = '0';
      }, 4000);
    }

    // Create appropriate Mode Instance
    const options = {
      onUpdateUI: (state) => this.updateHUD(state),
      onFinish: (result) => this.handleMatchFinished(result, isTournament),
      onElimination: (char, reason) => this.showEliminationToast(char, reason)
    };

    switch (modeId) {
      case 'sumo':
        this.currentCompetition = new SumoBattle(this.engine, countries, options);
        break;
      case 'obstacle-race':
        this.currentCompetition = new ObstacleRace(this.engine, countries, options);
        break;
      case 'last-survivor':
        this.currentCompetition = new LastFlagStanding(this.engine, countries, options);
        break;
      case 'tug-of-war':
        this.currentCompetition = new TugOfWar(this.engine, countries, options);
        break;
      case 'rising-lava':
        this.currentCompetition = new RisingLava(this.engine, countries, options);
        break;
      case 'bowling':
        this.currentCompetition = new BowlingChallenge(this.engine, countries, options);
        break;
      case 'jump-challenge':
        this.currentCompetition = new JumpChallenge(this.engine, countries, options);
        break;
      case 'downhill-race':
        this.currentCompetition = new DownhillRace(this.engine, countries, options);
        break;
      case 'glass-bridge':
        this.currentCompetition = new GlassBridge(this.engine, countries, options);
        break;
      case 'spin-battle':
        this.currentCompetition = new SpinBattle(this.engine, countries, options);
        break;
      case 'tower-climb':
        this.currentCompetition = new TowerClimb(this.engine, countries, options);
        break;
      case 'football-battle':
        this.currentCompetition = new FootballBattle(this.engine, countries, options);
        break;
      default:
        this.currentCompetition = new SumoBattle(this.engine, countries, options);
    }

    this.engine.setCompetition(this.currentCompetition);
    this.engine.resume();
  }

  // --- MAIN MENU WIRING ---

  wireMainMenu() {
    // Featured Random Circle Battle: Pick count and start circle fight!
    this.circleBattleCount = 8;
    document.querySelectorAll('.circle-count-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        audio.playClick();
        document.querySelectorAll('.circle-count-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.circleBattleCount = parseInt(chip.dataset.count, 10);
      });
    });

    document.getElementById('btn-start-circle-battle')?.addEventListener('click', () => {
      audio.playClick();
      const count = this.circleBattleCount || 8;
      const randomCountries = getRandomCountries(count);
      this.startCompetition('sumo', randomCountries, false);
    });

    document.getElementById('btn-open-custom-circle')?.addEventListener('click', () => {
      audio.playClick();
      this.selectedCustomMode = 'sumo';
      document.querySelectorAll('.custom-mode-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.mode === 'sumo');
      });
      nav.showScreen('screen-custom-battle');
    });

    // Quick Battle: 8 random countries, 1 random mode
    document.getElementById('btn-quick-battle')?.addEventListener('click', () => {
      audio.playClick();
      const randomCountries = getRandomCountries(8);
      const randomMode = ALL_MODES[Math.floor(Math.random() * ALL_MODES.length)];
      this.startCompetition(randomMode, randomCountries, false);
    });

    // Custom Battle
    document.getElementById('btn-menu-custom')?.addEventListener('click', () => {
      nav.showScreen('screen-custom-battle');
    });

    // Tournament
    document.getElementById('btn-menu-tournament')?.addEventListener('click', () => {
      nav.showScreen('screen-tournament');
      this.renderTournamentSetup();
    });

    // Competition Modes Catalog
    document.getElementById('btn-menu-modes')?.addEventListener('click', () => {
      nav.showScreen('screen-modes');
    });

    // Records
    document.getElementById('btn-menu-records')?.addEventListener('click', () => {
      nav.showScreen('screen-records');
      this.renderRecords();
    });

    // Settings
    document.getElementById('btn-menu-settings')?.addEventListener('click', () => {
      nav.showScreen('screen-settings');
    });
  }

  // --- CUSTOM BATTLE WIRING ---

  wireCustomBattle() {
    // Mode selection chips
    document.querySelectorAll('.custom-mode-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        audio.playClick();
        document.querySelectorAll('.custom-mode-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectedCustomMode = chip.dataset.mode;
      });
    });

    // Launch Custom Battle
    document.getElementById('btn-start-custom-battle')?.addEventListener('click', () => {
      const selected = this.customSelector.getSelectedList();
      if (selected.length < 2) {
        alert('Please select at least 2 countries for battle!');
        return;
      }
      this.startCompetition(this.selectedCustomMode, selected, false);
    });
  }

  // --- TOURNAMENT WIRING ---

  renderTournamentSetup() {
    const sizeSelect = document.getElementById('tourney-size-select');
    if (sizeSelect) {
      sizeSelect.addEventListener('change', () => {
        const size = parseInt(sizeSelect.value, 10);
        this.tournamentSelector.setMaxSelections(size);
        this.tournamentSelector.selectRandom(size);
        const container = document.getElementById('tourney-flag-selector-wrap');
        if (container) this.tournamentSelector.renderTo(container);
      });
    }

    document.getElementById('btn-generate-tournament')?.addEventListener('click', () => {
      const size = parseInt(document.getElementById('tourney-size-select')?.value || '8', 10);
      const mode = document.getElementById('tourney-mode-select')?.value || 'random';
      let selected = this.tournamentSelector.getSelectedList();

      if (selected.length < size) {
        selected = getRandomCountries(size);
      }

      tournament.createTournament(selected, { mode });
      this.renderTournamentBracket();
    });

    document.getElementById('btn-resume-tournament')?.addEventListener('click', () => {
      if (tournament.loadState()) {
        this.renderTournamentBracket();
      }
    });
  }

  wireTournament() {
    document.getElementById('btn-play-tourney-match')?.addEventListener('click', () => {
      const match = tournament.getCurrentMatch();
      if (!match) return;

      this.activeTournamentMatch = match;
      const competitors = [match.competitorA, match.competitorB].filter(Boolean);

      if (competitors.length < 2) {
        alert('Match competitors not ready!');
        return;
      }

      this.startCompetition(match.modeId, competitors, true);
    });
  }

  renderTournamentBracket() {
    const bracketView = document.getElementById('tournament-bracket-view');
    const setupView = document.getElementById('tournament-setup-view');

    if (setupView) setupView.classList.add('hidden');
    if (bracketView) bracketView.classList.remove('hidden');

    const container = document.getElementById('bracket-tree-container');
    if (!container) return;

    let html = '<div class="bracket-columns">';

    tournament.rounds.forEach((round, rIdx) => {
      html += `
        <div class="bracket-column">
          <div class="bracket-round-title">${round.name}</div>
          <div class="bracket-matches">
            ${round.matches.map((m, mIdx) => {
              const isCurrent = (rIdx === tournament.currentRoundIdx && mIdx === tournament.currentMatchIdx);
              const compA = m.competitorA;
              const compB = m.competitorB;
              const winCode = m.winner ? m.winner.code : null;

              return `
                <div class="bracket-match-card ${isCurrent ? 'active-match' : ''} ${m.status === 'COMPLETED' ? 'completed-match' : ''}">
                  <div class="bracket-match-mode">${m.modeId.replace('-', ' ').toUpperCase()}</div>
                  <div class="bracket-team ${winCode && compA && winCode === compA.code ? 'winner' : ''}">
                    <span>${compA ? `${compA.emoji} ${compA.code}` : 'TBD'}</span>
                  </div>
                  <div class="bracket-team ${winCode && compB && winCode === compB.code ? 'winner' : ''}">
                    <span>${compB ? `${compB.emoji} ${compB.code}` : 'TBD'}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Update Next Match Button
    const nextMatchBtn = document.getElementById('btn-play-tourney-match');
    const nextMatch = tournament.getCurrentMatch();

    if (tournament.isFinished) {
      if (nextMatchBtn) {
        nextMatchBtn.textContent = `🏆 Champion: ${tournament.champion.emoji} ${tournament.champion.name}`;
        nextMatchBtn.disabled = true;
      }
    } else if (nextMatch) {
      if (nextMatchBtn) {
        nextMatchBtn.disabled = false;
        nextMatchBtn.textContent = `▶ Play Next: ${nextMatch.competitorA?.code || 'TBD'} vs ${nextMatch.competitorB?.code || 'TBD'} (${nextMatch.modeId})`;
      }
    }
  }

  // --- MODES CATALOG WIRING ---

  wireModesCatalog() {
    document.querySelectorAll('.mode-catalog-card').forEach(card => {
      card.querySelector('.btn-play-mode')?.addEventListener('click', () => {
        const mode = card.dataset.mode;
        const randomCountries = getRandomCountries(8);
        this.startCompetition(mode, randomCountries, false);
      });
    });
  }

  // --- RECORDS & STATS WIRING ---

  wireRecords() {
    document.getElementById('btn-clear-records')?.addEventListener('click', () => {
      if (confirm('Reset all country match history and records?')) {
        storage.clearAllData();
        this.renderRecords();
      }
    });
  }

  renderRecords() {
    const leaderboard = storage.getLeaderboard();
    const history = storage.getHistory();

    // Render Country Leaderboard Table
    const tableBody = document.getElementById('records-leaderboard-body');
    if (tableBody) {
      if (leaderboard.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="empty-cell">No matches recorded yet. Play a battle to build records!</td></tr>`;
      } else {
        tableBody.innerHTML = leaderboard.slice(0, 25).map((item, idx) => {
          const winRate = item.matches > 0 ? Math.round((item.wins / item.matches) * 100) : 0;
          return `
            <tr>
              <td><strong>#${idx + 1}</strong></td>
              <td>${item.emoji} <strong>${item.name}</strong> (${item.code})</td>
              <td>${item.matches}</td>
              <td class="text-gold font-bold">${item.wins}</td>
              <td>${winRate}%</td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render Recent Match History
    const historyList = document.getElementById('records-history-list');
    if (historyList) {
      if (history.length === 0) {
        historyList.innerHTML = `<div class="empty-cell">No recent match history.</div>`;
      } else {
        historyList.innerHTML = history.slice(0, 15).map(h => `
          <div class="history-item">
            <div class="history-left">
              <span class="history-mode">${h.modeName || h.mode}</span>
              <span class="history-date">${h.date}</span>
            </div>
            <div class="history-winner">
              🏆 ${h.winner ? `${h.winner.emoji} ${h.winner.name}` : 'Draw'}
            </div>
          </div>
        `).join('');
      }
    }
  }

  // --- SETTINGS WIRING ---

  wireSettings() {
    // Quality Preset
    document.querySelectorAll('.setting-quality-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        document.querySelectorAll('.setting-quality-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const quality = btn.dataset.quality;
        this.engine.applyQuality(quality);
        storage.saveSettings({ quality });
      });
    });

    // Target FPS (30 vs 60)
    document.querySelectorAll('.setting-fps-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        document.querySelectorAll('.setting-fps-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const fps = parseInt(btn.dataset.fps, 10);
        this.engine.setTargetFps(fps);
        storage.saveSettings({ targetFps: fps });
      });
    });

    // Volume Slider
    const volSlider = document.getElementById('setting-volume-slider');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        audio.setVolume(val);
        storage.saveSettings({ soundVolume: val });
      });
    }

    // Mute Toggle
    const muteToggle = document.getElementById('setting-mute-toggle');
    if (muteToggle) {
      muteToggle.addEventListener('change', (e) => {
        audio.setMuted(e.target.checked);
        storage.saveSettings({ isMuted: e.target.checked });
      });
    }
  }

  renderSettings() {
    const s = storage.getSettings();

    // Quality button
    document.querySelectorAll('.setting-quality-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.quality === s.quality);
    });

    // FPS button
    document.querySelectorAll('.setting-fps-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.fps, 10) === s.targetFps);
    });

    // Volume
    const volSlider = document.getElementById('setting-volume-slider');
    if (volSlider) volSlider.value = s.soundVolume;

    // Mute
    const muteToggle = document.getElementById('setting-mute-toggle');
    if (muteToggle) muteToggle.checked = s.isMuted;
  }

  // --- SPECTATOR HUD WIRING ---

  wireSpectatorHUD() {
    // Pause / Resume
    const pauseBtn = document.getElementById('hud-btn-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        audio.playClick();
        const paused = this.engine.togglePause();
        pauseBtn.innerHTML = paused ? '▶ Resume' : '⏸ Pause';
      });
    }

    // Restart Match
    document.getElementById('hud-btn-restart')?.addEventListener('click', () => {
      audio.playClick();
      if (this.currentCompetition) {
        const mode = this.currentCompetition.modeId;
        const countries = [...this.currentCompetition.countries];
        this.startCompetition(mode, countries, false);
      }
    });

    // Exit to Menu
    document.getElementById('hud-btn-exit')?.addEventListener('click', () => {
      audio.playClick();
      if (this.currentCompetition) {
        this.currentCompetition.destroy();
        this.currentCompetition = null;
      }
      nav.showScreen('screen-menu');
    });

    // Simulation Speed Multipliers (0.5x, 1x, 2x, 4x)
    document.querySelectorAll('.hud-speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        document.querySelectorAll('.hud-speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const speed = parseFloat(btn.dataset.speed);
        this.engine.setSpeed(speed);
      });
    });

    // Camera Mode Selectors
    document.querySelectorAll('.hud-camera-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        document.querySelectorAll('.hud-camera-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.cam;
        this.engine.cameraController.setMode(mode);
        storage.saveSettings({ cameraMode: mode });
      });
    });

    // Fullscreen Toggle
    document.getElementById('hud-btn-fullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Clean View Toggle (Clear screen during match)
    const cleanBtn = document.getElementById('hud-btn-clean-toggle');
    if (cleanBtn) {
      cleanBtn.addEventListener('click', () => {
        audio.playClick();
        const isActive = document.body.classList.toggle('clean-screen-active');
        cleanBtn.innerHTML = isActive ? '👁️ Full UI' : '👁️ Clean View';
      });
    }

    // Tools Dock Toggle (Camera, Speed, Controls)
    const toolsBtn = document.getElementById('hud-btn-tools-toggle');
    const toolsCloseBtn = document.getElementById('hud-btn-tools-close');
    const toolsDock = document.getElementById('hud-tools-dock');

    if (toolsBtn && toolsDock) {
      toolsBtn.addEventListener('click', () => {
        audio.playClick();
        toolsDock.classList.toggle('hidden');
      });
    }

    if (toolsCloseBtn && toolsDock) {
      toolsCloseBtn.addEventListener('click', () => {
        audio.playClick();
        toolsDock.classList.add('hidden');
      });
    }

    // Toggle Leaderboard Drawer
    const lbSidebar = document.getElementById('game-leaderboard-sidebar');
    const toggleLbBtn = document.getElementById('btn-toggle-leaderboard');
    const closeLbBtn = document.getElementById('btn-close-leaderboard');

    if (toggleLbBtn && lbSidebar) {
      toggleLbBtn.addEventListener('click', () => {
        audio.playClick();
        lbSidebar.classList.toggle('collapsed');
      });
    }

    if (closeLbBtn && lbSidebar) {
      closeLbBtn.addEventListener('click', () => {
        audio.playClick();
        lbSidebar.classList.add('collapsed');
      });
    }

    // New Random Fight Button directly from HUD
    document.getElementById('hud-btn-new-random')?.addEventListener('click', () => {
      audio.playClick();
      const count = this.circleBattleCount || 8;
      const randomCountries = getRandomCountries(count);
      this.startCompetition('sumo', randomCountries, false);
    });

    // Audio Mute Quick Toggle in HUD
    const hudAudioBtn = document.getElementById('hud-btn-audio');
    if (hudAudioBtn) {
      hudAudioBtn.addEventListener('click', () => {
        const isMuted = audio.toggleMute();
        hudAudioBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }
  }

  updateHUD(state) {
    // Mode Title & Timer
    const titleEl = document.getElementById('hud-mode-title');
    if (titleEl) titleEl.textContent = state.modeName;

    const timerEl = document.getElementById('hud-timer');
    if (timerEl) {
      const mins = Math.floor(state.matchTimer / 60);
      const secs = Math.floor(state.matchTimer % 60);
      timerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    const aliveCountEl = document.getElementById('hud-alive-count');
    if (aliveCountEl) aliveCountEl.textContent = `${state.aliveCount} Alive`;

    const toggleCountEl = document.getElementById('hud-lb-toggle-count');
    if (toggleCountEl) toggleCountEl.textContent = state.aliveCount;

    // Score Info (Football)
    const scoreInfoEl = document.getElementById('hud-score-info');
    if (scoreInfoEl) {
      scoreInfoEl.textContent = state.scoreInfo || '';
      scoreInfoEl.classList.toggle('hidden', !state.scoreInfo);
    }

    // Countdown Overlay
    const cdOverlay = document.getElementById('hud-countdown-overlay');
    const cdText = document.getElementById('hud-countdown-text');
    if (cdOverlay && cdText) {
      if (state.status === 'COUNTDOWN') {
        cdOverlay.classList.remove('hidden');
        cdText.textContent = state.countdown > 0 ? state.countdown : 'GO!';
      } else {
        cdOverlay.classList.add('hidden');
      }
    }

    // Live Dynamic Leaderboard Sidebar
    const lbContainer = document.getElementById('hud-leaderboard-list');
    if (lbContainer && state.leaderboard) {
      lbContainer.innerHTML = state.leaderboard.slice(0, 10).map((item, idx) => `
        <div class="hud-leaderboard-item ${item.isAlive ? 'alive' : 'eliminated'}">
          <span class="hud-lb-rank">#${item.rank}</span>
          <span class="hud-lb-flag">${item.country.emoji}</span>
          <span class="hud-lb-code">${item.country.code}</span>
          <span class="hud-lb-status">${item.isAlive ? (item.score > 0 ? item.score : 'ALIVE') : 'OUT'}</span>
        </div>
      `).join('');
    }
  }

  showEliminationToast(character, reason) {
    const toast = document.createElement('div');
    toast.className = 'elimination-toast';
    toast.innerHTML = `<span>${character.country.emoji} <strong>${character.country.code}</strong> ${reason}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // --- VICTORY CELEBRATION MODAL ---

  handleMatchFinished(result, isTournament = false) {
    const modal = document.getElementById('modal-victory');
    if (!modal) return;

    modal.classList.remove('hidden');

    // Confetti Cannon!
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 }
    });

    // Populate Winner & Podium
    const winnerEl = document.getElementById('victory-winner-card');
    if (winnerEl && result.winner) {
      winnerEl.innerHTML = `
        <div class="victory-crown">👑</div>
        <div class="victory-flag-emoji">${result.winner.emoji}</div>
        <div class="victory-country-name">${result.winner.name}</div>
        <div class="victory-country-code">${result.winner.code}</div>
        <div class="victory-title-badge">${result.winner.title || 'Arena Champion'}</div>
      `;
    }

    // Podium ranks
    const podiumEl = document.getElementById('victory-podium-list');
    if (podiumEl && result.podium) {
      podiumEl.innerHTML = result.podium.slice(0, 3).map((country, idx) => `
        <div class="podium-step step-${idx + 1}">
          <div class="podium-rank">${idx === 0 ? '🥇 1st' : (idx === 1 ? '🥈 2nd' : '🥉 3rd')}</div>
          <div class="podium-flag">${country.emoji}</div>
          <div class="podium-code">${country.code}</div>
        </div>
      `).join('');
    }

    // Tournament Button visibility
    const tourneyBtn = document.getElementById('btn-victory-next-match');
    if (tourneyBtn) {
      tourneyBtn.classList.toggle('hidden', !isTournament);
    }
  }

  wireVictoryModal() {
    // Rematch
    document.getElementById('btn-victory-rematch')?.addEventListener('click', () => {
      audio.playClick();
      document.getElementById('modal-victory')?.classList.add('hidden');
      if (this.currentCompetition) {
        const mode = this.currentCompetition.modeId;
        const countries = [...this.currentCompetition.countries];
        this.startCompetition(mode, countries, false);
      }
    });

    // Tournament Next Match
    document.getElementById('btn-victory-next-match')?.addEventListener('click', () => {
      audio.playClick();
      document.getElementById('modal-victory')?.classList.add('hidden');

      if (this.activeTournamentMatch && this.currentCompetition) {
        tournament.recordMatchWinner(this.currentCompetition.winner);
        nav.showScreen('screen-tournament');
        this.renderTournamentBracket();
      }
    });

    // Exit to Menu
    document.getElementById('btn-victory-menu')?.addEventListener('click', () => {
      audio.playClick();
      document.getElementById('modal-victory')?.classList.add('hidden');
      if (this.currentCompetition) {
        this.currentCompetition.destroy();
        this.currentCompetition = null;
      }
      nav.showScreen('screen-menu');
    });
  }

  // --- PWA INSTALL & SERVICE WORKER ---

  setupPWA() {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('Service Worker registered successfully:', reg.scope))
        .catch(err => console.warn('Service Worker registration failed:', err));
    }

    // 2. In-App Install Prompt Handling
    const installBtn = document.getElementById('btn-pwa-install');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      if (installBtn) installBtn.classList.remove('hidden');
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      if (installBtn) installBtn.classList.add('hidden');
    });

    if (installBtn) {
      // If iOS, show guide
      if (this.isIOS) {
        installBtn.classList.remove('hidden');
      }

      installBtn.addEventListener('click', async () => {
        audio.playClick();
        if (this.deferredPrompt) {
          this.deferredPrompt.prompt();
          const { outcome } = await this.deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            this.deferredPrompt = null;
            installBtn.classList.add('hidden');
          }
        } else if (this.isIOS) {
          document.getElementById('modal-ios-install')?.classList.remove('hidden');
        }
      });
    }

    document.getElementById('btn-close-ios-modal')?.addEventListener('click', () => {
      document.getElementById('modal-ios-install')?.classList.add('hidden');
    });
  }
}

// Bootstrap Application on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
