/**
 * Tests for MogwserSplitView
 */

const { MogwserSplitView } = require("../../src/browser/components/split-view/SplitView");

describe("MogwserSplitView", () => {
  function makePanes() {
    return {
      container: new MockElement("div"),
      primary: new MockElement("div"),
      secondary: new MockElement("div"),
      divider: new MockElement("div"),
    };
  }

  it("should initialize as inactive", async () => {
    const p = makePanes();
    const sv = new MogwserSplitView(p.container, p.primary, p.secondary, p.divider);
    await sv.init();
    assertEqual(sv.isActive(), false);
  });

  it("should enable split-view", async () => {
    const p = makePanes();
    const sv = new MogwserSplitView(p.container, p.primary, p.secondary, p.divider);
    await sv.init();
    sv.enable(42);
    assertEqual(sv.isActive(), true);
    assertEqual(p.secondary.hidden, false);
    assertEqual(p.divider.hidden, false);
  });

  it("should disable split-view", async () => {
    const p = makePanes();
    const sv = new MogwserSplitView(p.container, p.primary, p.secondary, p.divider);
    await sv.init();
    sv.enable(42);
    sv.disable();
    assertEqual(sv.isActive(), false);
    assertEqual(p.secondary.hidden, true);
    assertEqual(p.divider.hidden, true);
  });

  it("should toggle split-view", async () => {
    const p = makePanes();
    const sv = new MogwserSplitView(p.container, p.primary, p.secondary, p.divider);
    await sv.init();
    sv.toggle(1);
    assertEqual(sv.isActive(), true);
    sv.toggle(1);
    assertEqual(sv.isActive(), false);
  });

  it("should set orientation", async () => {
    const p = makePanes();
    const sv = new MogwserSplitView(p.container, p.primary, p.secondary, p.divider);
    await sv.init();
    sv.setOrientation("vertical");
    assertEqual(sv.getOrientation(), "vertical");
    sv.setOrientation("horizontal");
    assertEqual(sv.getOrientation(), "horizontal");
  });

  it("should reject invalid orientation", async () => {
    const p = makePanes();
    const sv = new MogwserSplitView(p.container, p.primary, p.secondary, p.divider);
    await sv.init();
    sv.setOrientation("diagonal");
    assertEqual(sv.getOrientation(), "horizontal"); // unchanged
  });

  it("should set split ratio with clamping", async () => {
    const p = makePanes();
    const sv = new MogwserSplitView(p.container, p.primary, p.secondary, p.divider);
    await sv.init();
    sv.setSplitRatio(0.7);
    assertEqual(sv.getSplitRatio(), 0.7);
    sv.setSplitRatio(0.05); // below minimum
    assertEqual(sv.getSplitRatio(), 0.1);
    sv.setSplitRatio(0.95); // above maximum
    assertEqual(sv.getSplitRatio(), 0.9);
  });

  it("should swap panes", async () => {
    const p = makePanes();
    const sv = new MogwserSplitView(p.container, p.primary, p.secondary, p.divider);
    await sv.init();
    sv.enable(42);
    sv.swapPanes();
    // Swap should work without error
    assertEqual(sv.isActive(), true);
  });

  it("should serialize state", async () => {
    const p = makePanes();
    const sv = new MogwserSplitView(p.container, p.primary, p.secondary, p.divider);
    await sv.init();
    sv.enable(42, "vertical");
    sv.setSplitRatio(0.6);
    const data = sv.serialize();
    assertEqual(data.active, true);
    assertEqual(data.orientation, "vertical");
    assertEqual(data.splitRatio, 0.6);
  });
});
