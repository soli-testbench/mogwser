/**
 * Tests for MogwserCompactMode
 */

const { MogwserCompactMode } = require("../../src/browser/components/compact-mode/CompactMode");

describe("MogwserCompactMode", () => {
  it("should initialize in normal mode", async () => {
    const cm = new MogwserCompactMode(
      new MockElement("div"), new MockElement("div"), new MockElement("button")
    );
    await cm.init();
    assertEqual(cm.getMode(), "normal");
  });

  it("should set compact mode", async () => {
    const toolbar = new MockElement("div");
    const sidebar = new MockElement("div");
    const cm = new MogwserCompactMode(toolbar, sidebar, new MockElement("button"));
    await cm.init();
    cm.setMode("compact");
    assertEqual(cm.getMode(), "compact");
    assertEqual(cm.isCompact(), true);
    assertEqual(cm.isExpanded(), false);
    assert(sidebar.classList.contains("mogwser-sidebar-collapsed"));
    assert(toolbar.classList.contains("mogwser-compact"));
  });

  it("should set expanded mode", async () => {
    const toolbar = new MockElement("div");
    const sidebar = new MockElement("div");
    const cm = new MogwserCompactMode(toolbar, sidebar, new MockElement("button"));
    await cm.init();
    cm.setMode("expanded");
    assertEqual(cm.getMode(), "expanded");
    assertEqual(cm.isExpanded(), true);
    assertEqual(cm.isCompact(), false);
    assert(sidebar.classList.contains("mogwser-sidebar-expanded"));
  });

  it("should reject invalid modes", async () => {
    const cm = new MogwserCompactMode(
      new MockElement("div"), new MockElement("div"), new MockElement("button")
    );
    await cm.init();
    cm.setMode("invalid");
    assertEqual(cm.getMode(), "normal"); // unchanged
  });

  it("should cycle through modes", async () => {
    const cm = new MogwserCompactMode(
      new MockElement("div"), new MockElement("div"), new MockElement("button")
    );
    await cm.init();
    assertEqual(cm.getMode(), "normal");
    cm.cycle();
    assertEqual(cm.getMode(), "compact");
    cm.cycle();
    assertEqual(cm.getMode(), "expanded");
    cm.cycle();
    assertEqual(cm.getMode(), "normal");
  });

  it("should update toggle button text", async () => {
    const btn = new MockElement("button");
    const cm = new MogwserCompactMode(
      new MockElement("div"), new MockElement("div"), btn
    );
    await cm.init();
    assertEqual(btn.textContent, "[N]");
    cm.setMode("compact");
    assertEqual(btn.textContent, "[C]");
    cm.setMode("expanded");
    assertEqual(btn.textContent, "[E]");
  });

  it("should serialize mode state", async () => {
    const cm = new MogwserCompactMode(
      new MockElement("div"), new MockElement("div"), new MockElement("button")
    );
    await cm.init();
    cm.setMode("compact");
    const data = cm.serialize();
    assertEqual(data.mode, "compact");
  });
});
