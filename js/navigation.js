/**
 * FLAG BATTLE ARENA - Navigation & Screen Manager
 * Manages view switching between Main Menu, Custom Battle, Tournament,
 * Modes Catalog, Records, Settings, and Live Arena.
 */

import { audio } from './audio-manager.js';

export class NavigationManager {
  constructor() {
    this.screens = new Map();
    this.currentScreen = 'screen-menu';
    this.history = ['screen-menu'];
    this.init();
  }

  init() {
    // Find all screens in DOM
    document.querySelectorAll('.app-screen').forEach(el => {
      this.screens.set(el.id, el);
    });

    // Wire universal back buttons
    document.querySelectorAll('.btn-back').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.goBack();
      });
    });
  }

  showScreen(screenId, addToHistory = true) {
    if (!this.screens.has(screenId)) {
      console.warn('Unknown screen:', screenId);
      return;
    }

    audio.playClick();

    // Hide all screens
    this.screens.forEach((el, id) => {
      if (id === screenId) {
        el.classList.remove('hidden');
        el.classList.add('active');
      } else {
        el.classList.remove('active');
        el.classList.add('hidden');
      }
    });

    this.currentScreen = screenId;
    if (addToHistory && (this.history[this.history.length - 1] !== screenId)) {
      this.history.push(screenId);
    }
  }

  goBack() {
    if (this.history.length > 1) {
      this.history.pop();
      const prev = this.history[this.history.length - 1];
      this.showScreen(prev, false);
    } else {
      this.showScreen('screen-menu', false);
    }
  }
}

export const nav = new NavigationManager();
