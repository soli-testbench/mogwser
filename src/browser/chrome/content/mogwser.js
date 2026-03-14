/**
 * Mogwser Browser - Main Chrome Controller
 *
 * Initializes all Mogwser subsystems and wires up the custom browser shell.
 * Original implementation - not derived from Zen Browser source.
 */

"use strict";

/* global MogwserSidebarTabs, MogwserWorkspaces, MogwserSplitView,
          MogwserSidePanels, MogwserThemeEngine, MogwserPrivacy,
          MogwserCompactMode */

var Mogwser = {
  _initialized: false,

  modules: {},

  async init() {
    if (this._initialized) return;

    this.modules.sidebarTabs = new MogwserSidebarTabs(
      document.getElementById("mogwser-tabstrip"),
      document.getElementById("mogwser-pinned-tabs"),
      document.getElementById("mogwser-tabs-list")
    );

    this.modules.workspaces = new MogwserWorkspaces(
      document.getElementById("mogwser-workspace-list"),
      this.modules.sidebarTabs
    );

    this.modules.splitView = new MogwserSplitView(
      document.getElementById("mogwser-split-container"),
      document.getElementById("mogwser-content-primary"),
      document.getElementById("mogwser-content-secondary"),
      document.getElementById("mogwser-split-divider")
    );

    this.modules.sidePanels = new MogwserSidePanels(
      document.getElementById("mogwser-side-panel"),
      document.getElementById("mogwser-side-panel-browser"),
      document.getElementById("mogwser-side-panel-title"),
      document.getElementById("mogwser-side-panel-close")
    );

    this.modules.themeEngine = new MogwserThemeEngine();

    this.modules.privacy = new MogwserPrivacy(
      document.getElementById("mogwser-privacy-shield")
    );

    this.modules.compactMode = new MogwserCompactMode(
      document.getElementById("mogwser-toolbar"),
      document.getElementById("mogwser-sidebar"),
      document.getElementById("mogwser-compact-toggle")
    );

    await this._initModules();
    this._bindGlobalEvents();
    this._initialized = true;
  },

  async _initModules() {
    for (const [name, mod] of Object.entries(this.modules)) {
      try {
        await mod.init();
      } catch (e) {
        console.error(`[Mogwser] Failed to initialize ${name}:`, e);
      }
    }
  },

  _bindGlobalEvents() {
    const urlbar = document.getElementById("mogwser-urlbar");
    if (urlbar) {
      urlbar.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this.navigate(urlbar.value);
        }
      });
    }

    const backBtn = document.getElementById("mogwser-back");
    const fwdBtn = document.getElementById("mogwser-forward");
    const reloadBtn = document.getElementById("mogwser-reload");
    const newTabBtn = document.getElementById("mogwser-new-tab");
    const wsAddBtn = document.getElementById("mogwser-workspace-add");
    const themeBtn = document.getElementById("mogwser-theme-picker");

    if (backBtn) backBtn.addEventListener("click", () => this.goBack());
    if (fwdBtn) fwdBtn.addEventListener("click", () => this.goForward());
    if (reloadBtn) reloadBtn.addEventListener("click", () => this.reload());
    if (newTabBtn) {
      newTabBtn.addEventListener("click", () =>
        this.modules.sidebarTabs.addTab("about:newtab")
      );
    }
    if (wsAddBtn) {
      wsAddBtn.addEventListener("click", () =>
        this.modules.workspaces.createWorkspace()
      );
    }
    if (themeBtn) {
      themeBtn.addEventListener("click", () =>
        this.modules.themeEngine.showPicker()
      );
    }
  },

  navigate(url) {
    let normalizedUrl = url;
    if (!/^[a-zA-Z]+:\/\//.test(url) && !url.startsWith("about:")) {
      if (url.includes(".") && !url.includes(" ")) {
        normalizedUrl = "https://" + url;
      } else {
        normalizedUrl =
          "https://search.mogwser.com/search?q=" + encodeURIComponent(url);
      }
    }
    const activeTab = this.modules.sidebarTabs.getActiveTab();
    if (activeTab && activeTab.browser) {
      activeTab.browser.setAttribute("src", normalizedUrl);
    }
  },

  goBack() {
    const activeTab = this.modules.sidebarTabs.getActiveTab();
    if (activeTab && activeTab.browser && activeTab.browser.canGoBack) {
      activeTab.browser.goBack();
    }
  },

  goForward() {
    const activeTab = this.modules.sidebarTabs.getActiveTab();
    if (activeTab && activeTab.browser && activeTab.browser.canGoForward) {
      activeTab.browser.goForward();
    }
  },

  reload() {
    const activeTab = this.modules.sidebarTabs.getActiveTab();
    if (activeTab && activeTab.browser) {
      activeTab.browser.reload();
    }
  },

  destroy() {
    for (const mod of Object.values(this.modules)) {
      if (typeof mod.destroy === "function") {
        mod.destroy();
      }
    }
    this._initialized = false;
  },
};

// Auto-init when DOM is ready
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => Mogwser.init());
}

// Export for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Mogwser };
}
