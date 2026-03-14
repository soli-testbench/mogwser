/**
 * Mogwser Browser - Web Side-Panels
 *
 * Loads arbitrary URLs in a persistent sidebar alongside the main content area.
 * Supports multiple panels with history and persistence.
 * Original implementation - not derived from Zen Browser source.
 */

"use strict";

class MogwserSidePanels {
  constructor(panelContainer, browserEl, titleEl, closeBtn) {
    this._container = panelContainer;
    this._browser = browserEl;
    this._titleEl = titleEl;
    this._closeBtn = closeBtn;
    this._panels = [];
    this._activePanelId = null;
    this._nextId = 1;
    this._storageKey = "mogwser-side-panels";
  }

  async init() {
    if (this._closeBtn) {
      this._closeBtn.addEventListener("click", () => this.close());
    }
    this._loadFromStorage();
  }

  /**
   * Open a URL in the side panel.
   * @param {string} url - URL to load
   * @param {string} [title] - Panel title
   * @returns {object} Panel descriptor
   */
  open(url, title) {
    let panel = this._panels.find((p) => p.url === url);

    if (!panel) {
      panel = {
        id: `sp-${this._nextId++}`,
        url,
        title: title || url,
        openedAt: Date.now(),
      };
      this._panels.push(panel);
    }

    this._activePanelId = panel.id;
    this._show(panel);
    this._saveToStorage();
    return panel;
  }

  /**
   * Close the side panel.
   */
  close() {
    this._activePanelId = null;
    if (this._container) {
      this._container.hidden = true;
    }
    if (this._browser) {
      this._browser.setAttribute("src", "about:blank");
    }
    this._saveToStorage();
  }

  /**
   * Toggle the side panel with a given URL.
   * @param {string} url
   * @param {string} [title]
   */
  toggle(url, title) {
    if (this._activePanelId) {
      const active = this._panels.find((p) => p.id === this._activePanelId);
      if (active && active.url === url) {
        this.close();
        return;
      }
    }
    this.open(url, title);
  }

  /**
   * Check if a side panel is currently open.
   * @returns {boolean}
   */
  isOpen() {
    return this._activePanelId !== null;
  }

  /**
   * Get the active panel descriptor.
   * @returns {object|null}
   */
  getActivePanel() {
    return this._panels.find((p) => p.id === this._activePanelId) || null;
  }

  /**
   * Get all panel history.
   * @returns {object[]}
   */
  getAllPanels() {
    return [...this._panels];
  }

  /**
   * Remove a panel from history.
   * @param {string} panelId
   */
  removePanel(panelId) {
    this._panels = this._panels.filter((p) => p.id !== panelId);
    if (this._activePanelId === panelId) {
      this.close();
    }
    this._saveToStorage();
  }

  /**
   * Set the panel width.
   * @param {number} width - Width in pixels
   */
  setWidth(width) {
    if (this._container) {
      this._container.style.width = `${Math.max(200, Math.min(800, width))}px`;
    }
  }

  /**
   * Serialize panel state.
   * @returns {object}
   */
  serialize() {
    return {
      panels: this._panels,
      activePanelId: this._activePanelId,
    };
  }

  /**
   * Restore panel state.
   * @param {object} data
   */
  restore(data) {
    if (!data) return;
    this._panels = data.panels || [];
    if (data.activePanelId) {
      const panel = this._panels.find((p) => p.id === data.activePanelId);
      if (panel) {
        this._activePanelId = panel.id;
        this._show(panel);
      }
    }
  }

  // --- Private ---

  _show(panel) {
    if (this._container) {
      this._container.hidden = false;
    }
    if (this._browser) {
      this._browser.setAttribute("src", panel.url);
    }
    if (this._titleEl) {
      this._titleEl.textContent = panel.title;
    }
  }

  _saveToStorage() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(
          this._storageKey,
          JSON.stringify(this.serialize())
        );
      }
    } catch {
      // Storage unavailable
    }
  }

  _loadFromStorage() {
    try {
      if (typeof localStorage !== "undefined") {
        const data = localStorage.getItem(this._storageKey);
        if (data) {
          this.restore(JSON.parse(data));
        }
      }
    } catch {
      // Storage unavailable
    }
  }

  destroy() {
    this._saveToStorage();
    this.close();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MogwserSidePanels };
}
