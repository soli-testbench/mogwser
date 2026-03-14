/**
 * Mogwser Browser - Split-View Manager
 *
 * Enables viewing two or more tabs side-by-side within a single window.
 * Supports horizontal and vertical splitting with resizable dividers.
 * Original implementation - not derived from Zen Browser source.
 */

"use strict";

class MogwserSplitView {
  constructor(container, primaryPane, secondaryPane, divider) {
    this._container = container;
    this._primaryPane = primaryPane;
    this._secondaryPane = secondaryPane;
    this._divider = divider;
    this._active = false;
    this._orientation = "horizontal"; // horizontal = side-by-side
    this._splitRatio = 0.5;
    this._resizing = false;
    this._panes = [];
  }

  async init() {
    this._panes = [
      { element: this._primaryPane, tabId: null },
      { element: this._secondaryPane, tabId: null },
    ];
    this._bindResizeEvents();
  }

  /**
   * Check if split-view is currently active.
   * @returns {boolean}
   */
  isActive() {
    return this._active;
  }

  /**
   * Enable split-view with a tab in the secondary pane.
   * @param {number} tabId - Tab to display in secondary pane
   * @param {string} [orientation] - 'horizontal' or 'vertical'
   */
  enable(tabId, orientation) {
    if (orientation) {
      this._orientation = orientation;
    }

    this._active = true;
    this._panes[1].tabId = tabId;

    if (this._secondaryPane) {
      this._secondaryPane.hidden = false;
    }
    if (this._divider) {
      this._divider.hidden = false;
    }

    this._applyLayout();
  }

  /**
   * Disable split-view, returning to single-pane mode.
   */
  disable() {
    this._active = false;
    this._panes[1].tabId = null;

    if (this._secondaryPane) {
      this._secondaryPane.hidden = true;
    }
    if (this._divider) {
      this._divider.hidden = true;
    }

    // Reset primary pane to full size
    if (this._primaryPane) {
      this._primaryPane.style.flex = "1";
    }
  }

  /**
   * Toggle split-view on/off.
   * @param {number} [tabId] - Tab for secondary pane when enabling
   */
  toggle(tabId) {
    if (this._active) {
      this.disable();
    } else {
      this.enable(tabId);
    }
  }

  /**
   * Set the split orientation.
   * @param {string} orientation - 'horizontal' or 'vertical'
   */
  setOrientation(orientation) {
    if (orientation !== "horizontal" && orientation !== "vertical") return;
    this._orientation = orientation;
    if (this._active) {
      this._applyLayout();
    }
  }

  /**
   * Get the current orientation.
   * @returns {string}
   */
  getOrientation() {
    return this._orientation;
  }

  /**
   * Set the split ratio (0.0 to 1.0).
   * @param {number} ratio
   */
  setSplitRatio(ratio) {
    this._splitRatio = Math.max(0.1, Math.min(0.9, ratio));
    if (this._active) {
      this._applyLayout();
    }
  }

  /**
   * Get the current split ratio.
   * @returns {number}
   */
  getSplitRatio() {
    return this._splitRatio;
  }

  /**
   * Swap the content between primary and secondary panes.
   */
  swapPanes() {
    if (!this._active) return;
    const temp = this._panes[0].tabId;
    this._panes[0].tabId = this._panes[1].tabId;
    this._panes[1].tabId = temp;
  }

  /**
   * Add an additional split pane (for 3+ way splits).
   * @param {number} tabId
   * @returns {number} Pane index
   */
  addPane(tabId) {
    const pane = document.createElement("div");
    pane.className = "mogwser-content-pane";

    const paneData = { element: pane, tabId };
    this._panes.push(paneData);

    if (this._container) {
      const extraDivider = document.createElement("div");
      extraDivider.className = "mogwser-split-divider";
      this._container.appendChild(extraDivider);
      this._container.appendChild(pane);
    }

    this._applyLayout();
    return this._panes.length - 1;
  }

  /**
   * Serialize split-view state.
   * @returns {object}
   */
  serialize() {
    return {
      active: this._active,
      orientation: this._orientation,
      splitRatio: this._splitRatio,
      panes: this._panes.map((p) => ({ tabId: p.tabId })),
    };
  }

  // --- Private ---

  _applyLayout() {
    if (!this._container) return;

    this._container.style.flexDirection =
      this._orientation === "horizontal" ? "row" : "column";

    if (this._primaryPane) {
      this._primaryPane.style.flex = `${this._splitRatio}`;
    }
    if (this._secondaryPane) {
      this._secondaryPane.style.flex = `${1 - this._splitRatio}`;
    }

    if (this._divider) {
      this._divider.style.cursor =
        this._orientation === "horizontal" ? "col-resize" : "row-resize";
    }
  }

  _bindResizeEvents() {
    if (!this._divider) return;

    this._divider.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this._resizing = true;
      document.body.style.cursor =
        this._orientation === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!this._resizing || !this._container) return;

      const rect = this._container.getBoundingClientRect();
      let ratio;

      if (this._orientation === "horizontal") {
        ratio = (e.clientX - rect.left) / rect.width;
      } else {
        ratio = (e.clientY - rect.top) / rect.height;
      }

      this.setSplitRatio(ratio);
    });

    document.addEventListener("mouseup", () => {
      if (this._resizing) {
        this._resizing = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    });
  }

  destroy() {
    this.disable();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MogwserSplitView };
}
