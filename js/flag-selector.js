/**
 * FLAG BATTLE ARENA - Country Flag Selector UI
 * Searchable, filterable country picker with presets (4, 8, 12, 16, 20, 32, 64),
 * A-Z alphabetical letterwise filters, and real-time selection tags.
 */

import { COUNTRIES, searchCountries, getRandomCountries } from './countries.js';
import { audio } from './audio-manager.js';

export const ALPHABETS = [
  'ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'Y', 'Z'
];

export class FlagSelector {
  constructor(options = {}) {
    this.maxSelections = options.maxSelections || 20;
    this.minSelections = options.minSelections || 2;
    this.selectedCountries = new Map(); // code -> country
    this.currentRegion = 'ALL';
    this.currentLetter = 'ALL';
    this.searchQuery = '';
    this.onSelectionChange = options.onSelectionChange || null;

    // Default selection: 8 random countries
    const initial = getRandomCountries(8);
    initial.forEach(c => this.selectedCountries.set(c.code, c));
  }

  setMaxSelections(max) {
    this.maxSelections = max;
    if (this.selectedCountries.size > max) {
      const trimmed = Array.from(this.selectedCountries.values()).slice(0, max);
      this.selectedCountries.clear();
      trimmed.forEach(c => this.selectedCountries.set(c.code, c));
      this.notifyChange();
    }
  }

  toggleCountry(code) {
    audio.playClick();
    if (this.selectedCountries.has(code)) {
      if (this.selectedCountries.size <= this.minSelections) {
        return false;
      }
      this.selectedCountries.delete(code);
    } else {
      if (this.selectedCountries.size >= this.maxSelections) {
        return false;
      }
      const country = COUNTRIES.find(c => c.code === code);
      if (country) {
        this.selectedCountries.set(code, country);
      }
    }
    this.notifyChange();
    return true;
  }

  selectRandom(count) {
    audio.playClick();
    const clamped = Math.min(count, this.maxSelections);
    const randoms = getRandomCountries(clamped);
    this.selectedCountries.clear();
    randoms.forEach(c => this.selectedCountries.set(c.code, c));
    this.notifyChange();
  }

  selectAllInCurrentFilter() {
    audio.playClick();
    const filtered = searchCountries(this.searchQuery, this.currentRegion, this.currentLetter);
    const availableSlots = this.maxSelections - this.selectedCountries.size;
    if (availableSlots <= 0) return;

    filtered.slice(0, availableSlots).forEach(c => {
      this.selectedCountries.set(c.code, c);
    });
    this.notifyChange();
  }

  selectAll() {
    audio.playClick();
    const limit = Math.min(this.maxSelections, COUNTRIES.length);
    this.selectedCountries.clear();
    COUNTRIES.slice(0, limit).forEach(c => this.selectedCountries.set(c.code, c));
    this.notifyChange();
  }

  clearAll() {
    audio.playClick();
    this.selectedCountries.clear();
    getRandomCountries(this.minSelections).forEach(c => this.selectedCountries.set(c.code, c));
    this.notifyChange();
  }

  getSelectedList() {
    return Array.from(this.selectedCountries.values());
  }

  notifyChange() {
    if (this.onSelectionChange) {
      this.onSelectionChange(this.getSelectedList());
    }
  }

  renderTo(containerEl) {
    const list = searchCountries(this.searchQuery, this.currentRegion, this.currentLetter);

    let html = `
      <div class="selector-header">
        <div class="search-bar-wrap">
          <input type="text" id="flag-search-input" class="search-input" placeholder="🔍 Search any country by name or code (e.g. Bangladesh, BRA, Japan)..." value="${this.searchQuery}">
        </div>

        <!-- A-Z Alphabetical Letterwise Filter -->
        <div class="alphabet-tabs-wrap">
          <span class="alphabet-label">A-Z:</span>
          <div class="alphabet-tabs">
            ${ALPHABETS.map(letter => `
              <button class="alphabet-tab ${this.currentLetter === letter ? 'active' : ''}" data-letter="${letter}">
                ${letter}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Region Filter Tabs -->
        <div class="region-tabs">
          ${['ALL', 'Asia', 'Europe', 'Americas', 'Africa', 'Oceania'].map(reg => `
            <button class="region-tab ${this.currentRegion === reg ? 'active' : ''}" data-region="${reg}">
              ${reg}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="preset-buttons">
        <button class="preset-btn" data-preset="4">Random 4</button>
        <button class="preset-btn" data-preset="8">Random 8</button>
        <button class="preset-btn" data-preset="12">Random 12</button>
        <button class="preset-btn" data-preset="16">Random 16</button>
        <button class="preset-btn" data-preset="20">Random 20</button>
        ${this.maxSelections >= 32 ? '<button class="preset-btn" data-preset="32">Random 32</button>' : ''}
        ${this.maxSelections >= 64 ? '<button class="preset-btn" data-preset="64">Random 64</button>' : ''}
        <button class="preset-btn" id="btn-select-filtered">+ Select Letter</button>
        <button class="preset-btn" id="btn-select-all">Select Max</button>
        <button class="preset-btn" id="btn-clear-all">Reset</button>
      </div>

      <div class="selection-status-bar">
        <span>Selected: <strong id="selected-count" style="color: var(--accent-gold);">${this.selectedCountries.size}</strong> / ${this.maxSelections} Countries</span>
        <span class="selection-hint">Showing: ${list.length} flags ${this.currentLetter !== 'ALL' ? `(Letter "${this.currentLetter}")` : ''}</span>
      </div>

      <!-- Selected Countries Pill Drawer -->
      <div class="selected-pills-bar">
        ${Array.from(this.selectedCountries.values()).map(c => `
          <span class="selected-pill" data-code="${c.code}" title="Click to remove">
            ${c.emoji} ${c.code} <small>✕</small>
          </span>
        `).join('')}
      </div>

      <div class="countries-grid">
        ${list.map(c => {
          const isSelected = this.selectedCountries.has(c.code);
          return `
            <div class="country-card ${isSelected ? 'selected' : ''}" data-code="${c.code}">
              <div class="country-card-emoji">${c.emoji}</div>
              <div class="country-card-info">
                <div class="country-card-code">${c.code}</div>
                <div class="country-card-name">${c.name}</div>
              </div>
              <div class="country-card-check">${isSelected ? '✓' : '+'}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    containerEl.innerHTML = html;

    // Attach Event Listeners
    const searchInput = containerEl.querySelector('#flag-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderTo(containerEl);
        const newInput = containerEl.querySelector('#flag-search-input');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(this.searchQuery.length, this.searchQuery.length);
        }
      });
    }

    containerEl.querySelectorAll('.alphabet-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.currentLetter = btn.dataset.letter;
        this.renderTo(containerEl);
      });
    });

    containerEl.querySelectorAll('.region-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.currentRegion = btn.dataset.region;
        this.renderTo(containerEl);
      });
    });

    containerEl.querySelectorAll('.preset-btn[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectRandom(parseInt(btn.dataset.preset, 10));
        this.renderTo(containerEl);
      });
    });

    containerEl.querySelector('#btn-select-filtered')?.addEventListener('click', () => {
      this.selectAllInCurrentFilter();
      this.renderTo(containerEl);
    });

    containerEl.querySelector('#btn-select-all')?.addEventListener('click', () => {
      this.selectAll();
      this.renderTo(containerEl);
    });

    containerEl.querySelector('#btn-clear-all')?.addEventListener('click', () => {
      this.clearAll();
      this.renderTo(containerEl);
    });

    containerEl.querySelectorAll('.selected-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.toggleCountry(pill.dataset.code);
        this.renderTo(containerEl);
      });
    });

    containerEl.querySelectorAll('.country-card').forEach(card => {
      card.addEventListener('click', () => {
        const code = card.dataset.code;
        this.toggleCountry(code);
        this.renderTo(containerEl);
      });
    });
  }
}
