/**
 * Mogwser Browser - Theme Engine
 *
 * Supports custom color schemes and user-installable themes.
 * Themes are applied via CSS custom properties on the root element.
 * Original implementation - not derived from Zen Browser source.
 */

"use strict";

class MogwserThemeEngine {
  constructor() {
    this._themes = new Map();
    this._activeThemeId = null;
    this._storageKey = "mogwser-theme";
    this._customThemeKey = "mogwser-custom-themes";
  }

  async init() {
    this._registerBuiltinThemes();
    this._loadCustomThemes();
    this._loadActiveTheme();
  }

  /**
   * Get all available themes.
   * @returns {object[]}
   */
  getThemes() {
    return Array.from(this._themes.values());
  }

  /**
   * Get the currently active theme.
   * @returns {object|null}
   */
  getActiveTheme() {
    return this._themes.get(this._activeThemeId) || null;
  }

  /**
   * Apply a theme by ID.
   * @param {string} themeId
   */
  applyTheme(themeId) {
    const theme = this._themes.get(themeId);
    if (!theme) return;

    this._activeThemeId = themeId;

    // Apply CSS custom properties
    const root = typeof document !== "undefined" ? document.documentElement : null;
    if (root) {
      // Remove all theme classes
      root.classList.remove("mogwser-theme-light", "mogwser-theme-dark");

      // Apply theme variables
      for (const [prop, value] of Object.entries(theme.colors)) {
        root.style.setProperty(`--mogwser-${prop}`, value);
      }

      // Set theme class
      if (theme.type) {
        root.classList.add(`mogwser-theme-${theme.type}`);
      }
    }

    this._saveActiveTheme();
  }

  /**
   * Install a custom user theme.
   * @param {object} themeDef - Theme definition
   * @param {string} themeDef.id - Unique theme ID
   * @param {string} themeDef.name - Display name
   * @param {string} themeDef.type - 'light' or 'dark'
   * @param {object} themeDef.colors - Map of CSS property names to values
   * @returns {object} The installed theme
   */
  installTheme(themeDef) {
    if (!themeDef.id || !themeDef.name || !themeDef.colors) {
      throw new Error("Theme must have id, name, and colors");
    }

    const theme = {
      id: themeDef.id,
      name: themeDef.name,
      type: themeDef.type || "dark",
      builtin: false,
      colors: { ...themeDef.colors },
    };

    this._themes.set(theme.id, theme);
    this._saveCustomThemes();
    return theme;
  }

  /**
   * Uninstall a custom theme.
   * @param {string} themeId
   */
  uninstallTheme(themeId) {
    const theme = this._themes.get(themeId);
    if (!theme || theme.builtin) return;

    this._themes.delete(themeId);

    if (this._activeThemeId === themeId) {
      this.applyTheme("mogwser-dark");
    }

    this._saveCustomThemes();
  }

  /**
   * Create a theme from the current customized colors.
   * @param {string} name - Theme name
   * @returns {object} The created theme
   */
  createThemeFromCurrent(name) {
    const root = typeof document !== "undefined" ? document.documentElement : null;
    const colors = {};

    if (root) {
      const style = getComputedStyle(root);
      const props = [
        "bg-primary", "bg-secondary", "bg-tertiary",
        "text-primary", "text-secondary", "text-muted",
        "accent", "accent-hover", "border",
        "danger", "success", "warning",
      ];

      for (const prop of props) {
        const value = style.getPropertyValue(`--mogwser-${prop}`).trim();
        if (value) colors[prop] = value;
      }
    }

    const id = `custom-${Date.now()}`;
    return this.installTheme({ id, name, type: "dark", colors });
  }

  /**
   * Show the theme picker UI.
   */
  showPicker() {
    const existing = typeof document !== "undefined"
      ? document.getElementById("mogwser-theme-picker-panel")
      : null;
    if (existing) {
      existing.remove();
      return;
    }

    if (typeof document === "undefined") return;

    const panel = document.createElement("div");
    panel.id = "mogwser-theme-picker-panel";
    panel.style.cssText = `
      position: fixed; top: 40px; right: 8px; z-index: 10000;
      background: var(--mogwser-bg-secondary); border: 1px solid var(--mogwser-border);
      border-radius: 8px; padding: 12px; min-width: 200px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;

    const title = document.createElement("div");
    title.textContent = "Themes";
    title.style.cssText = "font-weight: 600; margin-bottom: 8px; font-size: 14px;";
    panel.appendChild(title);

    for (const theme of this.getThemes()) {
      const btn = document.createElement("button");
      btn.textContent = theme.name;
      const isActive = theme.id === this._activeThemeId;
      btn.style.cssText = `
        display: block; width: 100%; padding: 8px 12px; margin-bottom: 4px;
        border: 1px solid ${isActive ? "var(--mogwser-accent)" : "var(--mogwser-border)"};
        border-radius: 6px; cursor: pointer; text-align: left; font-size: 12px;
        background: ${isActive ? "var(--mogwser-bg-tertiary)" : "transparent"};
        color: var(--mogwser-text-primary);
      `;
      btn.addEventListener("click", () => {
        this.applyTheme(theme.id);
        panel.remove();
      });
      panel.appendChild(btn);
    }

    document.body.appendChild(panel);

    const dismiss = (e) => {
      if (!panel.contains(e.target)) {
        panel.remove();
        document.removeEventListener("mousedown", dismiss);
      }
    };
    setTimeout(() => document.addEventListener("mousedown", dismiss), 0);
  }

  /**
   * Serialize theme engine state.
   * @returns {object}
   */
  serialize() {
    const customThemes = [];
    for (const theme of this._themes.values()) {
      if (!theme.builtin) customThemes.push(theme);
    }
    return { activeThemeId: this._activeThemeId, customThemes };
  }

  // --- Private ---

  _registerBuiltinThemes() {
    this._themes.set("mogwser-dark", {
      id: "mogwser-dark",
      name: "Mogwser Dark",
      type: "dark",
      builtin: true,
      colors: {
        "bg-primary": "#1a1b26",
        "bg-secondary": "#24283b",
        "bg-tertiary": "#2f3348",
        "text-primary": "#c0caf5",
        "text-secondary": "#a9b1d6",
        "text-muted": "#565f89",
        "accent": "#7aa2f7",
        "accent-hover": "#89b4fa",
        "border": "#3b4261",
        "danger": "#f7768e",
        "success": "#9ece6a",
        "warning": "#e0af68",
      },
    });

    this._themes.set("mogwser-light", {
      id: "mogwser-light",
      name: "Mogwser Light",
      type: "light",
      builtin: true,
      colors: {
        "bg-primary": "#f5f5f5",
        "bg-secondary": "#ffffff",
        "bg-tertiary": "#e8e8e8",
        "text-primary": "#1a1a2e",
        "text-secondary": "#4a4a5a",
        "text-muted": "#8888aa",
        "accent": "#4a6cf7",
        "accent-hover": "#6080ff",
        "border": "#d0d0e0",
        "danger": "#e05070",
        "success": "#50a040",
        "warning": "#c09030",
      },
    });

    this._themes.set("mogwser-nord", {
      id: "mogwser-nord",
      name: "Nord",
      type: "dark",
      builtin: true,
      colors: {
        "bg-primary": "#2e3440",
        "bg-secondary": "#3b4252",
        "bg-tertiary": "#434c5e",
        "text-primary": "#eceff4",
        "text-secondary": "#d8dee9",
        "text-muted": "#4c566a",
        "accent": "#88c0d0",
        "accent-hover": "#8fbcbb",
        "border": "#4c566a",
        "danger": "#bf616a",
        "success": "#a3be8c",
        "warning": "#ebcb8b",
      },
    });

    this._themes.set("mogwser-solarized", {
      id: "mogwser-solarized",
      name: "Solarized Dark",
      type: "dark",
      builtin: true,
      colors: {
        "bg-primary": "#002b36",
        "bg-secondary": "#073642",
        "bg-tertiary": "#094959",
        "text-primary": "#fdf6e3",
        "text-secondary": "#eee8d5",
        "text-muted": "#586e75",
        "accent": "#268bd2",
        "accent-hover": "#2aa0e8",
        "border": "#586e75",
        "danger": "#dc322f",
        "success": "#859900",
        "warning": "#b58900",
      },
    });
  }

  _loadCustomThemes() {
    try {
      if (typeof localStorage !== "undefined") {
        const data = localStorage.getItem(this._customThemeKey);
        if (data) {
          const themes = JSON.parse(data);
          for (const theme of themes) {
            theme.builtin = false;
            this._themes.set(theme.id, theme);
          }
        }
      }
    } catch {
      // Storage unavailable
    }
  }

  _saveCustomThemes() {
    try {
      if (typeof localStorage !== "undefined") {
        const customThemes = [];
        for (const theme of this._themes.values()) {
          if (!theme.builtin) customThemes.push(theme);
        }
        localStorage.setItem(
          this._customThemeKey,
          JSON.stringify(customThemes)
        );
      }
    } catch {
      // Storage unavailable
    }
  }

  _loadActiveTheme() {
    try {
      if (typeof localStorage !== "undefined") {
        const id = localStorage.getItem(this._storageKey);
        if (id && this._themes.has(id)) {
          this.applyTheme(id);
          return;
        }
      }
    } catch {
      // Storage unavailable
    }
    // Default theme
    this._activeThemeId = "mogwser-dark";
  }

  _saveActiveTheme() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(this._storageKey, this._activeThemeId);
      }
    } catch {
      // Storage unavailable
    }
  }

  destroy() {
    this._saveActiveTheme();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MogwserThemeEngine };
}
