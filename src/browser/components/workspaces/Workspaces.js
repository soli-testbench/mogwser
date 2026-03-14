/**
 * Mogwser Browser - Workspace / Tab-Group Manager
 *
 * Allows creating, switching, and managing multiple tab groups
 * with persistent state across restarts.
 * Original implementation - not derived from Zen Browser source.
 */

"use strict";

class MogwserWorkspaces {
  constructor(workspaceListEl, sidebarTabs) {
    this._container = workspaceListEl;
    this._sidebarTabs = sidebarTabs;
    this._workspaces = [];
    this._activeId = null;
    this._nextId = 1;
    this._storageKey = "mogwser-workspaces";
  }

  async init() {
    this._loadFromStorage();
    if (this._workspaces.length === 0) {
      this.createWorkspace("Default");
    }
  }

  /**
   * Create a new workspace.
   * @param {string} [name] - Workspace name
   * @returns {object} Created workspace descriptor
   */
  createWorkspace(name) {
    const ws = {
      id: `ws-${this._nextId++}`,
      name: name || `Workspace ${this._workspaces.length + 1}`,
      color: this._generateColor(),
      createdAt: Date.now(),
    };

    this._workspaces.push(ws);
    this._renderWorkspace(ws);

    if (this._workspaces.length === 1) {
      this.switchWorkspace(ws.id);
    }

    this._saveToStorage();
    return ws;
  }

  /**
   * Switch to a workspace, showing only its tabs.
   * @param {string} workspaceId
   */
  switchWorkspace(workspaceId) {
    const ws = this._workspaces.find((w) => w.id === workspaceId);
    if (!ws) return;

    this._activeId = workspaceId;

    // Update UI active state
    if (this._container) {
      const items = this._container.querySelectorAll(".mogwser-workspace-item");
      items.forEach((item) => {
        item.classList.toggle("active", item.dataset.wsId === workspaceId);
      });
    }

    // Show/hide tabs based on workspace
    if (this._sidebarTabs) {
      const allTabs = this._sidebarTabs.getAllTabs();
      for (const tab of allTabs) {
        if (tab.element) {
          const belongsHere =
            !tab.workspaceId || tab.workspaceId === workspaceId;
          tab.element.style.display = belongsHere ? "" : "none";
        }
      }
    }

    this._saveToStorage();
  }

  /**
   * Rename a workspace.
   * @param {string} workspaceId
   * @param {string} newName
   */
  renameWorkspace(workspaceId, newName) {
    const ws = this._workspaces.find((w) => w.id === workspaceId);
    if (!ws) return;

    ws.name = newName;

    if (this._container) {
      const item = this._container.querySelector(
        `[data-ws-id="${workspaceId}"]`
      );
      if (item) item.textContent = newName;
    }

    this._saveToStorage();
  }

  /**
   * Delete a workspace and optionally move its tabs.
   * @param {string} workspaceId
   * @param {string} [moveTabsTo] - Target workspace for orphaned tabs
   */
  deleteWorkspace(workspaceId, moveTabsTo) {
    if (this._workspaces.length <= 1) return; // Must keep at least one

    const idx = this._workspaces.findIndex((w) => w.id === workspaceId);
    if (idx === -1) return;

    // Reassign tabs
    if (this._sidebarTabs && moveTabsTo) {
      const tabs = this._sidebarTabs.getTabsByWorkspace(workspaceId);
      for (const tab of tabs) {
        this._sidebarTabs.setTabWorkspace(tab.id, moveTabsTo);
      }
    }

    this._workspaces.splice(idx, 1);

    if (this._container) {
      const item = this._container.querySelector(
        `[data-ws-id="${workspaceId}"]`
      );
      if (item) item.remove();
    }

    if (this._activeId === workspaceId) {
      this.switchWorkspace(this._workspaces[0].id);
    }

    this._saveToStorage();
  }

  /**
   * Get all workspaces.
   * @returns {object[]}
   */
  getAllWorkspaces() {
    return [...this._workspaces];
  }

  /**
   * Get the active workspace ID.
   * @returns {string|null}
   */
  getActiveWorkspaceId() {
    return this._activeId;
  }

  /**
   * Serialize workspace state for persistence.
   * @returns {object}
   */
  serialize() {
    return {
      workspaces: this._workspaces.map((ws) => ({
        id: ws.id,
        name: ws.name,
        color: ws.color,
        createdAt: ws.createdAt,
      })),
      activeId: this._activeId,
    };
  }

  /**
   * Restore workspace state from serialized data.
   * @param {object} data
   */
  restore(data) {
    if (!data || !data.workspaces) return;

    this._workspaces = [];
    if (this._container) {
      this._container.innerHTML = "";
    }

    for (const ws of data.workspaces) {
      this._workspaces.push(ws);
      this._renderWorkspace(ws);
      if (this._nextId <= parseInt(ws.id.replace("ws-", ""), 10)) {
        this._nextId = parseInt(ws.id.replace("ws-", ""), 10) + 1;
      }
    }

    if (data.activeId) {
      this.switchWorkspace(data.activeId);
    }
  }

  // --- Private ---

  _renderWorkspace(ws) {
    if (!this._container) return;

    const btn = document.createElement("button");
    btn.className = "mogwser-workspace-item";
    btn.dataset.wsId = ws.id;
    btn.textContent = ws.name;
    btn.style.borderBottom = `2px solid ${ws.color}`;

    btn.addEventListener("click", () => this.switchWorkspace(ws.id));

    btn.addEventListener("dblclick", () => {
      const newName = prompt("Rename workspace:", ws.name);
      if (newName) this.renameWorkspace(ws.id, newName);
    });

    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (this._workspaces.length > 1) {
        this.deleteWorkspace(ws.id, this._workspaces.find((w) => w.id !== ws.id)?.id);
      }
    });

    this._container.appendChild(btn);
  }

  _generateColor() {
    const colors = [
      "#7aa2f7", "#bb9af7", "#9ece6a", "#e0af68",
      "#f7768e", "#7dcfff", "#73daca", "#ff9e64",
    ];
    return colors[this._workspaces.length % colors.length];
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
      // Storage may not be available
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
      // Storage may not be available
    }
  }

  destroy() {
    this._saveToStorage();
    this._workspaces = [];
    this._activeId = null;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MogwserWorkspaces };
}
