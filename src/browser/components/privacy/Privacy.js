/**
 * Mogwser Browser - Privacy & Security Manager
 *
 * Provides tracking protection, cookie management, and fingerprint resistance
 * toggles accessible from the UI.
 * Original implementation - not derived from Zen Browser source.
 */

"use strict";

class MogwserPrivacy {
  constructor(shieldBtn) {
    this._shieldBtn = shieldBtn;
    this._storageKey = "mogwser-privacy";

    this._settings = {
      trackingProtection: true,
      cookieBlocking: "third-party", // 'none', 'third-party', 'all'
      fingerprintResistance: false,
      httpsOnly: true,
      doNotTrack: true,
      blockCryptominers: true,
      blockSocialTrackers: true,
    };

    this._blockedCount = 0;
  }

  async init() {
    this._loadSettings();
    this._applySettings();

    if (this._shieldBtn) {
      this._shieldBtn.addEventListener("click", () => this.showPanel());
      this._updateShieldIndicator();
    }
  }

  /**
   * Get current privacy settings.
   * @returns {object}
   */
  getSettings() {
    return { ...this._settings };
  }

  /**
   * Update one or more privacy settings.
   * @param {object} updates - Key-value pairs of settings to update
   */
  updateSettings(updates) {
    for (const [key, value] of Object.entries(updates)) {
      if (key in this._settings) {
        this._settings[key] = value;
      }
    }
    this._applySettings();
    this._saveSettings();
    this._updateShieldIndicator();
  }

  /**
   * Toggle a boolean privacy setting.
   * @param {string} settingKey
   * @returns {boolean} New value
   */
  toggleSetting(settingKey) {
    if (
      settingKey in this._settings &&
      typeof this._settings[settingKey] === "boolean"
    ) {
      this._settings[settingKey] = !this._settings[settingKey];
      this._applySettings();
      this._saveSettings();
      this._updateShieldIndicator();
      return this._settings[settingKey];
    }
    return false;
  }

  /**
   * Set cookie blocking mode.
   * @param {string} mode - 'none', 'third-party', or 'all'
   */
  setCookieBlocking(mode) {
    if (["none", "third-party", "all"].includes(mode)) {
      this._settings.cookieBlocking = mode;
      this._applySettings();
      this._saveSettings();
    }
  }

  /**
   * Get the count of blocked trackers in this session.
   * @returns {number}
   */
  getBlockedCount() {
    return this._blockedCount;
  }

  /**
   * Increment blocked tracker count.
   * @param {number} [count=1]
   */
  recordBlocked(count) {
    this._blockedCount += count || 1;
    this._updateShieldIndicator();
  }

  /**
   * Get a privacy protection level summary.
   * @returns {string} 'standard', 'strict', or 'custom'
   */
  getProtectionLevel() {
    const s = this._settings;
    if (
      s.trackingProtection &&
      s.cookieBlocking === "third-party" &&
      !s.fingerprintResistance
    ) {
      return "standard";
    }
    if (
      s.trackingProtection &&
      s.cookieBlocking === "all" &&
      s.fingerprintResistance &&
      s.httpsOnly &&
      s.blockCryptominers &&
      s.blockSocialTrackers
    ) {
      return "strict";
    }
    return "custom";
  }

  /**
   * Apply a preset protection level.
   * @param {string} level - 'standard' or 'strict'
   */
  applyPreset(level) {
    if (level === "standard") {
      this.updateSettings({
        trackingProtection: true,
        cookieBlocking: "third-party",
        fingerprintResistance: false,
        httpsOnly: true,
        doNotTrack: true,
        blockCryptominers: true,
        blockSocialTrackers: false,
      });
    } else if (level === "strict") {
      this.updateSettings({
        trackingProtection: true,
        cookieBlocking: "all",
        fingerprintResistance: true,
        httpsOnly: true,
        doNotTrack: true,
        blockCryptominers: true,
        blockSocialTrackers: true,
      });
    }
  }

  /**
   * Show the privacy settings panel.
   */
  showPanel() {
    if (typeof document === "undefined") return;

    const existing = document.getElementById("mogwser-privacy-panel");
    if (existing) {
      existing.remove();
      return;
    }

    const panel = document.createElement("div");
    panel.id = "mogwser-privacy-panel";
    panel.style.cssText = `
      position: fixed; top: 40px; right: 48px; z-index: 10000;
      background: var(--mogwser-bg-secondary); border: 1px solid var(--mogwser-border);
      border-radius: 8px; padding: 16px; min-width: 280px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;

    const title = document.createElement("div");
    title.textContent = "Privacy & Security";
    title.style.cssText = "font-weight: 600; margin-bottom: 12px; font-size: 14px;";
    panel.appendChild(title);

    const level = this.getProtectionLevel();
    const levelLabel = document.createElement("div");
    levelLabel.textContent = `Protection Level: ${level.charAt(0).toUpperCase() + level.slice(1)}`;
    levelLabel.style.cssText = "font-size: 12px; color: var(--mogwser-accent); margin-bottom: 12px;";
    panel.appendChild(levelLabel);

    // Preset buttons
    const presetRow = document.createElement("div");
    presetRow.style.cssText = "display: flex; gap: 8px; margin-bottom: 12px;";
    for (const preset of ["standard", "strict"]) {
      const btn = document.createElement("button");
      btn.textContent = preset.charAt(0).toUpperCase() + preset.slice(1);
      btn.style.cssText = `
        flex: 1; padding: 6px; border: 1px solid var(--mogwser-border);
        border-radius: 4px; cursor: pointer; font-size: 12px;
        background: ${preset === level ? "var(--mogwser-accent)" : "transparent"};
        color: ${preset === level ? "var(--mogwser-bg-primary)" : "var(--mogwser-text-primary)"};
      `;
      btn.addEventListener("click", () => {
        this.applyPreset(preset);
        panel.remove();
        this.showPanel();
      });
      presetRow.appendChild(btn);
    }
    panel.appendChild(presetRow);

    // Individual toggles
    const toggles = [
      ["trackingProtection", "Tracking Protection"],
      ["fingerprintResistance", "Fingerprint Resistance"],
      ["httpsOnly", "HTTPS-Only Mode"],
      ["doNotTrack", "Do Not Track"],
      ["blockCryptominers", "Block Cryptominers"],
      ["blockSocialTrackers", "Block Social Trackers"],
    ];

    for (const [key, label] of toggles) {
      const row = document.createElement("div");
      row.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 0; border-bottom: 1px solid var(--mogwser-border);
      `;

      const lbl = document.createElement("span");
      lbl.textContent = label;
      lbl.style.fontSize = "12px";

      const toggle = document.createElement("button");
      toggle.textContent = this._settings[key] ? "ON" : "OFF";
      toggle.style.cssText = `
        padding: 2px 8px; border: 1px solid var(--mogwser-border);
        border-radius: 10px; cursor: pointer; font-size: 10px;
        background: ${this._settings[key] ? "var(--mogwser-success)" : "transparent"};
        color: ${this._settings[key] ? "var(--mogwser-bg-primary)" : "var(--mogwser-text-muted)"};
      `;
      toggle.addEventListener("click", () => {
        this.toggleSetting(key);
        panel.remove();
        this.showPanel();
      });

      row.appendChild(lbl);
      row.appendChild(toggle);
      panel.appendChild(row);
    }

    // Cookie blocking
    const cookieRow = document.createElement("div");
    cookieRow.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 0;
    `;
    const cookieLabel = document.createElement("span");
    cookieLabel.textContent = "Cookie Blocking";
    cookieLabel.style.fontSize = "12px";

    const cookieSelect = document.createElement("select");
    cookieSelect.style.cssText = `
      padding: 2px 4px; border: 1px solid var(--mogwser-border);
      border-radius: 4px; font-size: 10px;
      background: var(--mogwser-bg-tertiary); color: var(--mogwser-text-primary);
    `;

    for (const opt of ["none", "third-party", "all"]) {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1).replace("-", " ");
      option.selected = this._settings.cookieBlocking === opt;
      cookieSelect.appendChild(option);
    }

    cookieSelect.addEventListener("change", () => {
      this.setCookieBlocking(cookieSelect.value);
    });

    cookieRow.appendChild(cookieLabel);
    cookieRow.appendChild(cookieSelect);
    panel.appendChild(cookieRow);

    // Blocked count
    const countDiv = document.createElement("div");
    countDiv.textContent = `Trackers blocked this session: ${this._blockedCount}`;
    countDiv.style.cssText = "font-size: 11px; color: var(--mogwser-text-muted); margin-top: 12px;";
    panel.appendChild(countDiv);

    document.body.appendChild(panel);

    const dismiss = (e) => {
      if (!panel.contains(e.target) && e.target !== this._shieldBtn) {
        panel.remove();
        document.removeEventListener("mousedown", dismiss);
      }
    };
    setTimeout(() => document.addEventListener("mousedown", dismiss), 0);
  }

  /**
   * Serialize privacy settings.
   * @returns {object}
   */
  serialize() {
    return { ...this._settings };
  }

  // --- Private ---

  _applySettings() {
    // In a real Firefox fork, these would map to about:config preferences.
    // Here we prepare the preference mappings for the gecko engine.
    this._prefMappings = {
      "privacy.trackingprotection.enabled": this._settings.trackingProtection,
      "network.cookie.cookieBehavior": this._cookieBehaviorValue(),
      "privacy.resistFingerprinting": this._settings.fingerprintResistance,
      "dom.security.https_only_mode": this._settings.httpsOnly,
      "privacy.donottrackheader.enabled": this._settings.doNotTrack,
      "privacy.trackingprotection.cryptomining.enabled":
        this._settings.blockCryptominers,
      "privacy.trackingprotection.socialtracking.enabled":
        this._settings.blockSocialTrackers,
    };
  }

  _cookieBehaviorValue() {
    switch (this._settings.cookieBlocking) {
      case "none":
        return 0;
      case "third-party":
        return 4;
      case "all":
        return 2;
      default:
        return 4;
    }
  }

  _updateShieldIndicator() {
    if (!this._shieldBtn) return;
    if (this._settings.trackingProtection) {
      this._shieldBtn.classList.add("mogwser-privacy-active");
    } else {
      this._shieldBtn.classList.remove("mogwser-privacy-active");
    }
  }

  _saveSettings() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(
          this._storageKey,
          JSON.stringify(this._settings)
        );
      }
    } catch {
      // Storage unavailable
    }
  }

  _loadSettings() {
    try {
      if (typeof localStorage !== "undefined") {
        const data = localStorage.getItem(this._storageKey);
        if (data) {
          const saved = JSON.parse(data);
          Object.assign(this._settings, saved);
        }
      }
    } catch {
      // Storage unavailable
    }
  }

  destroy() {
    this._saveSettings();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MogwserPrivacy };
}
