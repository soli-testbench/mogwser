/**
 * Tests for MogwserSidePanels
 */

const { MogwserSidePanels } = require("../../src/browser/components/side-panels/SidePanels");

describe("MogwserSidePanels", () => {
  function makePanelElements() {
    return {
      container: new MockElement("div"),
      browser: new MockElement("div"),
      title: new MockElement("span"),
      closeBtn: new MockElement("button"),
    };
  }

  it("should initialize as closed", async () => {
    const els = makePanelElements();
    const sp = new MogwserSidePanels(els.container, els.browser, els.title, els.closeBtn);
    await sp.init();
    assertEqual(sp.isOpen(), false);
  });

  it("should open a URL in the side panel", async () => {
    const els = makePanelElements();
    const sp = new MogwserSidePanels(els.container, els.browser, els.title, els.closeBtn);
    await sp.init();
    const panel = sp.open("https://docs.example.com", "Docs");
    assertEqual(sp.isOpen(), true);
    assertEqual(panel.url, "https://docs.example.com");
    assertEqual(panel.title, "Docs");
    assertEqual(els.container.hidden, false);
  });

  it("should close the side panel", async () => {
    const els = makePanelElements();
    const sp = new MogwserSidePanels(els.container, els.browser, els.title, els.closeBtn);
    await sp.init();
    sp.open("https://docs.example.com");
    sp.close();
    assertEqual(sp.isOpen(), false);
    assertEqual(els.container.hidden, true);
  });

  it("should toggle the side panel", async () => {
    const els = makePanelElements();
    const sp = new MogwserSidePanels(els.container, els.browser, els.title, els.closeBtn);
    await sp.init();
    sp.toggle("https://docs.example.com", "Docs");
    assertEqual(sp.isOpen(), true);
    sp.toggle("https://docs.example.com", "Docs");
    assertEqual(sp.isOpen(), false);
  });

  it("should reuse existing panel for same URL", async () => {
    const els = makePanelElements();
    const sp = new MogwserSidePanels(els.container, els.browser, els.title, els.closeBtn);
    await sp.init();
    sp.open("https://docs.example.com", "Docs");
    sp.open("https://docs.example.com", "Docs");
    assertEqual(sp.getAllPanels().length, 1);
  });

  it("should track panel history", async () => {
    const els = makePanelElements();
    const sp = new MogwserSidePanels(els.container, els.browser, els.title, els.closeBtn);
    await sp.init();
    sp.open("https://a.com", "A");
    sp.open("https://b.com", "B");
    assertEqual(sp.getAllPanels().length, 2);
  });

  it("should remove a panel from history", async () => {
    const els = makePanelElements();
    const sp = new MogwserSidePanels(els.container, els.browser, els.title, els.closeBtn);
    await sp.init();
    const panel = sp.open("https://a.com", "A");
    sp.removePanel(panel.id);
    assertEqual(sp.getAllPanels().length, 0);
    assertEqual(sp.isOpen(), false);
  });

  it("should set panel width with bounds", async () => {
    const els = makePanelElements();
    const sp = new MogwserSidePanels(els.container, els.browser, els.title, els.closeBtn);
    await sp.init();
    sp.setWidth(400);
    assertEqual(els.container.style.width, "400px");
    sp.setWidth(100); // below minimum
    assertEqual(els.container.style.width, "200px");
    sp.setWidth(1000); // above maximum
    assertEqual(els.container.style.width, "800px");
  });

  it("should serialize and restore state", async () => {
    const els = makePanelElements();
    const sp = new MogwserSidePanels(els.container, els.browser, els.title, els.closeBtn);
    await sp.init();
    sp.open("https://a.com", "A");
    sp.open("https://b.com", "B");

    const data = sp.serialize();
    assertEqual(data.panels.length, 2);
    assert(data.activePanelId !== null, "Should have active panel");

    const sp2 = new MogwserSidePanels(
      new MockElement("div"), new MockElement("div"),
      new MockElement("span"), new MockElement("button")
    );
    sp2.restore(data);
    assertEqual(sp2.getAllPanels().length, 2);
    assertEqual(sp2.isOpen(), true);
  });
});
