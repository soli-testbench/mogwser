/**
 * Mogwser Browser - Vertical Sidebar Tab Manager
 *
 * Implements vertical tab bar with drag-to-reorder, pin, mute, and close.
 * Original implementation - not derived from Zen Browser source.
 */

"use strict";

class MogwserSidebarTabs {
  constructor(tabstrip, pinnedContainer, tabsListContainer) {
    this._tabstrip = tabstrip;
    this._pinnedContainer = pinnedContainer;
    this._tabsList = tabsListContainer;
    this._tabs = [];
    this._activeTabId = null;
    this._nextId = 1;
    this._dragState = null;
    this._onTabChange = null;
  }

  async init() {
    this._bindDragEvents();
  }

  /**
   * Add a new tab.
   * @param {string} url - URL to load
   * @param {object} [opts] - Options: { pinned, active, title }
   * @returns {object} The created tab descriptor
   */
  addTab(url, opts = {}) {
    const tab = {
      id: this._nextId++,
      url: url || "about:newtab",
      title: opts.title || "New Tab",
      pinned: !!opts.pinned,
      muted: false,
      favicon: null,
      browser: null,
      element: null,
    };

    this._tabs.push(tab);
    tab.element = this._renderTab(tab);

    if (tab.pinned) {
      this._pinnedContainer.appendChild(tab.element);
    } else {
      this._tabsList.appendChild(tab.element);
    }

    if (opts.active !== false || this._tabs.length === 1) {
      this.activateTab(tab.id);
    }

    this._emitChange("add", tab);
    return tab;
  }

  /**
   * Close a tab by ID.
   * @param {number} tabId
   */
  closeTab(tabId) {
    const idx = this._tabs.findIndex((t) => t.id === tabId);
    if (idx === -1) return;

    const tab = this._tabs[idx];
    if (tab.element && tab.element.parentNode) {
      tab.element.parentNode.removeChild(tab.element);
    }
    this._tabs.splice(idx, 1);

    if (this._activeTabId === tabId && this._tabs.length > 0) {
      const nextIdx = Math.min(idx, this._tabs.length - 1);
      this.activateTab(this._tabs[nextIdx].id);
    } else if (this._tabs.length === 0) {
      this._activeTabId = null;
    }

    this._emitChange("close", tab);
  }

  /**
   * Activate (switch to) a tab.
   * @param {number} tabId
   */
  activateTab(tabId) {
    const tab = this._tabs.find((t) => t.id === tabId);
    if (!tab) return;

    if (this._activeTabId !== null) {
      const prev = this._tabs.find((t) => t.id === this._activeTabId);
      if (prev && prev.element) {
        prev.element.classList.remove("mogwser-tab-active");
      }
    }

    this._activeTabId = tabId;
    if (tab.element) {
      tab.element.classList.add("mogwser-tab-active");
    }

    this._emitChange("activate", tab);
  }

  /**
   * Toggle pin state for a tab.
   * @param {number} tabId
   */
  pinTab(tabId) {
    const tab = this._tabs.find((t) => t.id === tabId);
    if (!tab) return;

    tab.pinned = !tab.pinned;

    if (tab.element && tab.element.parentNode) {
      tab.element.parentNode.removeChild(tab.element);
    }

    tab.element = this._renderTab(tab);

    if (tab.pinned) {
      this._pinnedContainer.appendChild(tab.element);
    } else {
      this._tabsList.appendChild(tab.element);
    }

    if (tab.id === this._activeTabId) {
      tab.element.classList.add("mogwser-tab-active");
    }

    this._emitChange("pin", tab);
  }

  /**
   * Toggle mute state for a tab.
   * @param {number} tabId
   */
  muteTab(tabId) {
    const tab = this._tabs.find((t) => t.id === tabId);
    if (!tab) return;

    tab.muted = !tab.muted;

    if (tab.element) {
      const indicator = tab.element.querySelector(
        ".mogwser-tab-muted-indicator"
      );
      if (indicator) {
        indicator.textContent = tab.muted ? "[M]" : "";
      }
    }

    this._emitChange("mute", tab);
  }

  /**
   * Move a tab to a new index in the list.
   * @param {number} tabId
   * @param {number} newIndex
   */
  moveTab(tabId, newIndex) {
    const oldIdx = this._tabs.findIndex((t) => t.id === tabId);
    if (oldIdx === -1) return;

    const [tab] = this._tabs.splice(oldIdx, 1);
    const clampedIdx = Math.max(0, Math.min(newIndex, this._tabs.length));
    this._tabs.splice(clampedIdx, 0, tab);

    this._rebuildTabListDOM();
    this._emitChange("move", tab);
  }

  /**
   * Get the currently active tab.
   * @returns {object|null}
   */
  getActiveTab() {
    return this._tabs.find((t) => t.id === this._activeTabId) || null;
  }

  /**
   * Get all tabs.
   * @returns {object[]}
   */
  getAllTabs() {
    return [...this._tabs];
  }

  /**
   * Get tabs filtered by workspace ID.
   * @param {string} workspaceId
   * @returns {object[]}
   */
  getTabsByWorkspace(workspaceId) {
    return this._tabs.filter((t) => t.workspaceId === workspaceId);
  }

  /**
   * Assign a tab to a workspace.
   * @param {number} tabId
   * @param {string} workspaceId
   */
  setTabWorkspace(tabId, workspaceId) {
    const tab = this._tabs.find((t) => t.id === tabId);
    if (tab) {
      tab.workspaceId = workspaceId;
    }
  }

  /**
   * Set a callback for tab changes.
   * @param {Function} fn - Callback(action, tab)
   */
  onTabChange(fn) {
    this._onTabChange = fn;
  }

  /**
   * Serialize tab state for persistence.
   * @returns {object[]}
   */
  serialize() {
    return this._tabs.map((t) => ({
      id: t.id,
      url: t.url,
      title: t.title,
      pinned: t.pinned,
      muted: t.muted,
      workspaceId: t.workspaceId || null,
    }));
  }

  /**
   * Restore tabs from serialized state.
   * @param {object[]} data
   */
  restore(data) {
    for (const entry of data) {
      this.addTab(entry.url, {
        pinned: entry.pinned,
        title: entry.title,
        active: false,
      });
      const tab = this._tabs[this._tabs.length - 1];
      tab.muted = entry.muted;
      tab.workspaceId = entry.workspaceId;
      if (tab.muted && tab.element) {
        const indicator = tab.element.querySelector(
          ".mogwser-tab-muted-indicator"
        );
        if (indicator) indicator.textContent = "[M]";
      }
    }
    if (this._tabs.length > 0) {
      this.activateTab(this._tabs[0].id);
    }
  }

  // --- Private ---

  _renderTab(tab) {
    const el = document.createElement("div");
    el.className = tab.pinned ? "mogwser-tab mogwser-tab-pinned" : "mogwser-tab";
    el.dataset.tabId = tab.id;
    el.setAttribute("draggable", "true");

    const favicon = document.createElement("img");
    favicon.className = "mogwser-tab-favicon";
    favicon.src = tab.favicon || "chrome://mogwser/content/default-favicon.svg";
    el.appendChild(favicon);

    const title = document.createElement("span");
    title.className = "mogwser-tab-title";
    title.textContent = tab.title;
    el.appendChild(title);

    const muteIndicator = document.createElement("span");
    muteIndicator.className = "mogwser-tab-muted-indicator";
    muteIndicator.textContent = tab.muted ? "[M]" : "";
    el.appendChild(muteIndicator);

    const closeBtn = document.createElement("button");
    closeBtn.className = "mogwser-tab-close";
    closeBtn.textContent = "x";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.closeTab(tab.id);
    });
    el.appendChild(closeBtn);

    el.addEventListener("click", () => this.activateTab(tab.id));

    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this._showContextMenu(tab, e);
    });

    return el;
  }

  _showContextMenu(tab, event) {
    // Remove any existing context menu
    const existing = document.getElementById("mogwser-tab-ctx-menu");
    if (existing) existing.remove();

    const menu = document.createElement("div");
    menu.id = "mogwser-tab-ctx-menu";
    menu.style.cssText = `
      position: fixed; left: ${event.clientX}px; top: ${event.clientY}px;
      background: var(--mogwser-bg-tertiary); border: 1px solid var(--mogwser-border);
      border-radius: 6px; padding: 4px 0; z-index: 9999; min-width: 140px;
    `;

    const items = [
      {
        label: tab.pinned ? "Unpin Tab" : "Pin Tab",
        action: () => this.pinTab(tab.id),
      },
      {
        label: tab.muted ? "Unmute Tab" : "Mute Tab",
        action: () => this.muteTab(tab.id),
      },
      { label: "Close Tab", action: () => this.closeTab(tab.id) },
    ];

    for (const item of items) {
      const btn = document.createElement("button");
      btn.textContent = item.label;
      btn.style.cssText = `
        display: block; width: 100%; padding: 6px 12px; border: none;
        background: transparent; color: var(--mogwser-text-primary);
        text-align: left; cursor: pointer; font-size: 12px;
      `;
      btn.addEventListener("click", () => {
        item.action();
        menu.remove();
      });
      menu.appendChild(btn);
    }

    document.body.appendChild(menu);

    const dismiss = () => {
      menu.remove();
      document.removeEventListener("click", dismiss);
    };
    setTimeout(() => document.addEventListener("click", dismiss), 0);
  }

  _bindDragEvents() {
    if (!this._tabsList) return;

    this._tabsList.addEventListener("dragstart", (e) => {
      const tabEl = e.target.closest(".mogwser-tab");
      if (!tabEl) return;
      this._dragState = { tabId: parseInt(tabEl.dataset.tabId, 10) };
      tabEl.classList.add("mogwser-tab-dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    this._tabsList.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    this._tabsList.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!this._dragState) return;

      const targetEl = e.target.closest(".mogwser-tab");
      if (targetEl) {
        const targetId = parseInt(targetEl.dataset.tabId, 10);
        const targetIdx = this._tabs.findIndex((t) => t.id === targetId);
        this.moveTab(this._dragState.tabId, targetIdx);
      }
      this._dragState = null;
    });

    this._tabsList.addEventListener("dragend", (e) => {
      const tabEl = e.target.closest(".mogwser-tab");
      if (tabEl) tabEl.classList.remove("mogwser-tab-dragging");
      this._dragState = null;
    });
  }

  _rebuildTabListDOM() {
    const unpinned = this._tabs.filter((t) => !t.pinned);
    while (this._tabsList.firstChild) {
      this._tabsList.removeChild(this._tabsList.firstChild);
    }
    for (const tab of unpinned) {
      if (tab.element) {
        this._tabsList.appendChild(tab.element);
      }
    }
  }

  _emitChange(action, tab) {
    if (typeof this._onTabChange === "function") {
      this._onTabChange(action, tab);
    }
  }

  destroy() {
    this._tabs = [];
    this._activeTabId = null;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MogwserSidebarTabs };
}
