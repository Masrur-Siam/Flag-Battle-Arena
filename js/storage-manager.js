/**
 * FLAG BATTLE ARENA - Storage Manager
 * Offline persistence for records, stats, tournament progress, and settings
 * Uses LocalStorage with fallbacks
 */

class StorageManager {
  constructor() {
    this.STORAGE_KEYS = {
      STATS: 'fba_country_stats',
      HISTORY: 'fba_match_history',
      SETTINGS: 'fba_user_settings',
      TOURNAMENT: 'fba_active_tournament'
    };

    this.defaultSettings = {
      quality: 'high',     // 'low', 'medium', 'high'
      targetFps: 60,       // 30, 60
      soundVolume: 0.7,
      isMuted: false,
      cameraMode: 'auto'   // 'auto', 'wide', 'close', 'top', 'follow'
    };

    this.init();
  }

  init() {
    // Ensure initial structures exist
    if (!this.getStats()) {
      this.saveStats({});
    }
    if (!this.getHistory()) {
      this.saveHistory([]);
    }
  }

  getSettings() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      return data ? { ...this.defaultSettings, ...JSON.parse(data) } : { ...this.defaultSettings };
    } catch (_) {
      return { ...this.defaultSettings };
    }
  }

  saveSettings(settings) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (_) {
      return settings;
    }
  }

  getStats() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.STATS);
      return data ? JSON.parse(data) : {};
    } catch (_) {
      return {};
    }
  }

  saveStats(stats) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (_) {}
  }

  recordMatchResult(matchData) {
    // matchData: { mode, modeName, winner, podium: [1st, 2nd, 3rd], participants: [], duration: seconds }
    try {
      // 1. Update Match History (keep last 50 matches)
      const history = this.getHistory() || [];
      const entry = {
        id: 'm_' + Date.now(),
        timestamp: Date.now(),
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        mode: matchData.mode,
        modeName: matchData.modeName,
        winner: matchData.winner,
        podium: matchData.podium || [],
        participantCount: (matchData.participants || []).length,
        duration: Math.round(matchData.duration || 0)
      };
      history.unshift(entry);
      if (history.length > 50) history.pop();
      this.saveHistory(history);

      // 2. Update Aggregated Country Stats
      const stats = this.getStats();
      const winnerCode = matchData.winner ? matchData.winner.code : null;

      (matchData.participants || []).forEach(country => {
        if (!stats[country.code]) {
          stats[country.code] = {
            code: country.code,
            name: country.name,
            emoji: country.emoji,
            matches: 0,
            wins: 0,
            podiums: 0
          };
        }
        stats[country.code].matches++;
      });

      if (winnerCode && stats[winnerCode]) {
        stats[winnerCode].wins++;
      }

      if (matchData.podium) {
        matchData.podium.forEach(country => {
          if (country && stats[country.code]) {
            stats[country.code].podiums++;
          }
        });
      }

      this.saveStats(stats);
      return entry;
    } catch (e) {
      console.warn('Failed to record match result:', e);
      return null;
    }
  }

  getHistory() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  }

  saveHistory(history) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (_) {}
  }

  getLeaderboard() {
    const stats = this.getStats();
    return Object.values(stats).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.podiums !== a.podiums) return b.podiums - a.podiums;
      return b.matches - a.matches;
    });
  }

  saveTournamentState(state) {
    try {
      if (!state) {
        localStorage.removeItem(this.STORAGE_KEYS.TOURNAMENT);
      } else {
        localStorage.setItem(this.STORAGE_KEYS.TOURNAMENT, JSON.stringify(state));
      }
    } catch (_) {}
  }

  getTournamentState() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.TOURNAMENT);
      return data ? JSON.parse(data) : null;
    } catch (_) {
      return null;
    }
  }

  clearAllData() {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.STATS);
      localStorage.removeItem(this.STORAGE_KEYS.HISTORY);
      localStorage.removeItem(this.STORAGE_KEYS.TOURNAMENT);
      this.init();
    } catch (_) {}
  }
}

export const storage = new StorageManager();
