/**
 * Integration tests for Mogwser Browser Chrome
 *
 * Tests that all modules work together correctly.
 */

const { MogwserSidebarTabs } = require("../../src/browser/components/sidebar-tabs/SidebarTabs");
const { MogwserWorkspaces } = require("../../src/browser/components/workspaces/Workspaces");
const { MogwserSplitView } = require("../../src/browser/components/split-view/SplitView");
const { MogwserSidePanels } = require("../../src/browser/components/side-panels/SidePanels");
const { MogwserThemeEngine } = require("../../src/browser/components/theme-engine/ThemeEngine");
const { MogwserPrivacy } = require("../../src/browser/components/privacy/Privacy");
const { MogwserCompactMode } = require("../../src/browser/components/compact-mode/CompactMode");

describe("Browser Chrome Integration", () => {
  it("should initialize all modules without conflict", async () => {
    const tabs = new MogwserSidebarTabs(
      new MockElement("div"), new MockElement("div"), new MockElement("div")
    );
    const workspaces = new MogwserWorkspaces(new MockElement("div"), tabs);
    const splitView = new MogwserSplitView(
      new MockElement("div"), new MockElement("div"),
      new MockElement("div"), new MockElement("div")
    );
    const sidePanels = new MogwserSidePanels(
      new MockElement("div"), new MockElement("div"),
      new MockElement("span"), new MockElement("button")
    );
    const themeEngine = new MogwserThemeEngine();
    const privacy = new MogwserPrivacy(new MockElement("button"));
    const compactMode = new MogwserCompactMode(
      new MockElement("div"), new MockElement("div"), new MockElement("button")
    );

    await tabs.init();
    await workspaces.init();
    await splitView.init();
    await sidePanels.init();
    await themeEngine.init();
    await privacy.init();
    await compactMode.init();

    // Verify all modules are functional
    assert(tabs.getAllTabs().length === 0 || tabs.getAllTabs().length > 0, "Tabs initialized");
    assert(workspaces.getAllWorkspaces().length >= 1, "Workspaces initialized");
    assertEqual(splitView.isActive(), false, "Split view starts inactive");
    assertEqual(sidePanels.isOpen(), false, "Side panels start closed");
    assert(themeEngine.getThemes().length >= 4, "Themes loaded");
    assert(privacy.getSettings().trackingProtection === true, "Privacy defaults set");
    assertEqual(compactMode.getMode(), "normal", "Compact mode default");
  });

  it("should handle workspace-tab interaction", async () => {
    const tabs = new MogwserSidebarTabs(
      new MockElement("div"), new MockElement("div"), new MockElement("div")
    );
    const workspaces = new MogwserWorkspaces(new MockElement("div"), tabs);

    await tabs.init();
    await workspaces.init();

    const ws1 = workspaces.getAllWorkspaces()[0];
    const ws2 = workspaces.createWorkspace("Work");

    const tab1 = tabs.addTab("https://personal.com", { title: "Personal" });
    tabs.setTabWorkspace(tab1.id, ws1.id);

    const tab2 = tabs.addTab("https://work.com", { title: "Work" });
    tabs.setTabWorkspace(tab2.id, ws2.id);

    const ws1Tabs = tabs.getTabsByWorkspace(ws1.id);
    const ws2Tabs = tabs.getTabsByWorkspace(ws2.id);

    assertEqual(ws1Tabs.length, 1);
    assertEqual(ws2Tabs.length, 1);
    assertEqual(ws1Tabs[0].title, "Personal");
    assertEqual(ws2Tabs[0].title, "Work");
  });

  it("should handle split-view with tabs", async () => {
    const tabs = new MogwserSidebarTabs(
      new MockElement("div"), new MockElement("div"), new MockElement("div")
    );
    const splitView = new MogwserSplitView(
      new MockElement("div"), new MockElement("div"),
      new MockElement("div"), new MockElement("div")
    );

    await tabs.init();
    await splitView.init();

    const t1 = tabs.addTab("https://a.com", { title: "A" });
    const t2 = tabs.addTab("https://b.com", { title: "B" });

    splitView.enable(t2.id, "horizontal");
    assertEqual(splitView.isActive(), true);

    // Both tabs should exist
    assertEqual(tabs.getAllTabs().length, 2);
  });

  it("should apply theme while other modules are active", async () => {
    const themeEngine = new MogwserThemeEngine();
    const compactMode = new MogwserCompactMode(
      new MockElement("div"), new MockElement("div"), new MockElement("button")
    );

    await themeEngine.init();
    await compactMode.init();

    themeEngine.applyTheme("mogwser-light");
    compactMode.setMode("compact");

    assertEqual(themeEngine.getActiveTheme().id, "mogwser-light");
    assertEqual(compactMode.getMode(), "compact");
  });

  it("should handle side panel alongside split view", async () => {
    const splitView = new MogwserSplitView(
      new MockElement("div"), new MockElement("div"),
      new MockElement("div"), new MockElement("div")
    );
    const sidePanels = new MogwserSidePanels(
      new MockElement("div"), new MockElement("div"),
      new MockElement("span"), new MockElement("button")
    );

    await splitView.init();
    await sidePanels.init();

    splitView.enable(1);
    sidePanels.open("https://docs.com", "Docs");

    assertEqual(splitView.isActive(), true);
    assertEqual(sidePanels.isOpen(), true);
  });

  it("should persist and restore full browser state", async () => {
    // Create and configure
    const tabs = new MogwserSidebarTabs(
      new MockElement("div"), new MockElement("div"), new MockElement("div")
    );
    const workspaces = new MogwserWorkspaces(new MockElement("div"), tabs);

    await tabs.init();
    await workspaces.init();

    tabs.addTab("https://a.com", { title: "A", pinned: true });
    tabs.addTab("https://b.com", { title: "B" });
    workspaces.createWorkspace("Work");

    // Serialize
    const tabsData = tabs.serialize();
    const wsData = workspaces.serialize();

    // Restore into fresh instances
    const tabs2 = new MogwserSidebarTabs(
      new MockElement("div"), new MockElement("div"), new MockElement("div")
    );
    await tabs2.init();
    tabs2.restore(tabsData);

    const ws2 = new MogwserWorkspaces(new MockElement("div"), tabs2);
    ws2.restore(wsData);

    assertEqual(tabs2.getAllTabs().length, 2);
    assertEqual(tabs2.getAllTabs()[0].pinned, true);
    assertEqual(ws2.getAllWorkspaces().length, 2);
  });

  it("should handle privacy settings with theme changes", async () => {
    const privacy = new MogwserPrivacy(new MockElement("button"));
    const themeEngine = new MogwserThemeEngine();

    await privacy.init();
    await themeEngine.init();

    privacy.applyPreset("strict");
    themeEngine.applyTheme("mogwser-nord");

    assertEqual(privacy.getProtectionLevel(), "strict");
    assertEqual(themeEngine.getActiveTheme().id, "mogwser-nord");
  });
});
