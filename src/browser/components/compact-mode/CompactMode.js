/**
 * Mogwser Browser - Compact/Expanded Mode Manager
 *
 * Toggles between compact and expanded UI modes, adapting layout density.
 * Original implementation - not derived from Zen Browser source.
 */

"use strict";

class MogwserCompactMode {
  constructor(toolbar, sidebar, toggleBtn) {
    this._toolbar = toolbar;
    this._sidebar = sidebar;
    this._toggleBtn = toggleBtn;
    this._mode = "normal"; // 'compact', 'normal', 'expanded'
    this._storageKey = "mogwser-ui-mode";
  }

  async init() {
    this._loadMode();
    this._applyMode();

    if (this._toggleBtn) {
      this._toggleBtn.addEventListener("click", () => this.cycle());
    }
  }

  /**
   * Get the current UI mode.
   * @returns {string} 'compact', 'normal', or 'expanded'
   */
  getMode() {
    return this._mode;
  }

  /**
   * Set the UI mode directly.
   * @param {string} mode - 'compact', 'normal', or 'expanded'
   */
  setMode(mode) {
    if (!["compact", "normal", "expanded"].includes(mode)) return;
    this._mode = mode;
    this._applyMode();
    this._saveMode();
  }

  /**
   * Cycle through modes: normal -> compact -> expanded -> normal.
   * @returns {string} New mode
   */
  cycle() {
    const order = ["normal", "compact", "expanded"];
    const idx = order.indexOf(this._mode);
    this._mode = order[(idx + 1) % order.length];
    this._applyMode();
    this._saveMode();
    return this._mode;
  }

  /**
   * Check if currently in compact mode.
   * @returns {boolean}
   */
  isCompact() {
    return this._mode === "compact";
  }

  /**
   * Check if currently in expanded mode.
   * @returns {boolean}
   */
  isExpanded() {
    return this._mode === "expanded";
  }

  /**
   * Serialize mode state.
   * @returns {object}
   */
  serialize() {
    return { mode: this._mode };
  }

  // --- Private ---

  _applyMode() {
    const root = typeof document !== "undefined" ? document.body || document.documentElement : null;
    if (!root) return;

    root.classList.remove(
      "mogwser-mode-compact",
      "mogwser-mode-normal",
      "mogwser-mode-expanded"
    );
    root.classList.add(`mogwser-mode-${this._mode}`);

    if (this._sidebar) {
      if (this._mode === "compact") {
        this._sidebar.classList.add("mogwser-sidebar-collapsed");
        this._sidebar.classList.remove("mogwser-sidebar-expanded");
      } else {
        this._sidebar.classList.remove("mogwser-sidebar-collapsed");
        this._sidebar.classList.add("mogwser-sidebar-expanded");
      }
    }

    if (this._toolbar) {
      if (this._mode === "compact") {
        this._toolbar.classList.add("mogwser-compact");
      } else {
        this._toolbar.classList.remove("mogwser-compact");
      }
    }

    if (this._toggleBtn) {
      const labels = { compact: "[C]", normal: "[N]", expanded: "[E]" };
      this._toggleBtn.textContent = labels[this._mode] || "[N]";
      this._toggleBtn.title = `UI Mode: ${this._mode} (click to cycle)`;
    }
  }

  _saveMode() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(this._storageKey, this._mode);
      }
    } catch {
      // Storage unavailable
    }
  }

  _loadMode() {
    try {
      if (typeof localStorage !== "undefined") {
        const saved = localStorage.getItem(this._storageKey);
        if (saved && ["compact", "normal", "expanded"].includes(saved)) {
          this._mode = saved;
        }
      }
    } catch {
      // Storage unavailable
    }
  }

  destroy() {
    this._saveMode();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MogwserCompactMode };
}
