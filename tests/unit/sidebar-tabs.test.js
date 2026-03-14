/**
 * Tests for MogwserSidebarTabs
 */

const { MogwserSidebarTabs } = require("../../src/browser/components/sidebar-tabs/SidebarTabs");

describe("MogwserSidebarTabs", () => {
  const tabstrip = new MockElement("div");
  const pinnedContainer = new MockElement("div");
  const tabsList = new MockElement("div");

  it("should initialize without errors", async () => {
    const tabs = new MogwserSidebarTabs(tabstrip, pinnedContainer, tabsList);
    await tabs.init();
    assert(tabs.getAllTabs().length === 0, "Should start with no tabs");
  });

  it("should add a tab", () => {
    const tabs = new MogwserSidebarTabs(tabstrip, pinnedContainer, tabsList);
    tabs.init();
    const tab = tabs.addTab("https://example.com", { title: "Example" });
    assert(tab.id > 0, "Tab should have an ID");
    assertEqual(tab.url, "https://example.com");
    assertEqual(tab.title, "Example");
    assertEqual(tabs.getAllTabs().length, 1);
  });

  it("should activate first tab automatically", () => {
    const tabs = new MogwserSidebarTabs(tabstrip, pinnedContainer, tabsList);
    tabs.init();
    const tab = tabs.addTab("https://example.com");
    assertEqual(tabs.getActiveTab().id, tab.id);
  });

  it("should close a tab", () => {
    const tabs = new MogwserSidebarTabs(tabstrip, pinnedContainer, tabsList);
    tabs.init();
    const tab = tabs.addTab("https://example.com");
    tabs.closeTab(tab.id);
    assertEqual(tabs.getAllTabs().length, 0);
  });

  it("should switch active tab when closing active", () => {
    const tabs = new MogwserSidebarTabs(tabstrip, pinnedContainer, tabsList);
    tabs.init();
    const t1 = tabs.addTab("https://a.com", { title: "A" });
    const t2 = tabs.addTab("https://b.com", { title: "B" });
    tabs.activateTab(t2.id);
    tabs.closeTab(t2.id);
    assertEqual(tabs.getActiveTab().id, t1.id);
  });

  it("should pin and unpin a tab", () => {
    const tabs = new MogwserSidebarTabs(tabstrip, pinnedContainer, tabsList);
    tabs.init();
    const tab = tabs.addTab("https://example.com");
    assertEqual(tab.pinned, false);
    tabs.pinTab(tab.id);
    const updated = tabs.getAllTabs().find((t) => t.id === tab.id);
    assertEqual(updated.pinned, true);
    tabs.pinTab(tab.id);
    const updated2 = tabs.getAllTabs().find((t) => t.id === tab.id);
    assertEqual(updated2.pinned, false);
  });

  it("should mute and unmute a tab", () => {
    const tabs = new MogwserSidebarTabs(tabstrip, pinnedContainer, tabsList);
    tabs.init();
    const tab = tabs.addTab("https://example.com");
    assertEqual(tab.muted, false);
    tabs.muteTab(tab.id);
    assertEqual(tabs.getAllTabs()[0].muted, true);
    tabs.muteTab(tab.id);
    assertEqual(tabs.getAllTabs()[0].muted, false);
  });

  it("should move a tab to a new position", () => {
    const tabs = new MogwserSidebarTabs(tabstrip, pinnedContainer, tabsList);
    tabs.init();
    const t1 = tabs.addTab("https://a.com", { title: "A" });
    const t2 = tabs.addTab("https://b.com", { title: "B" });
    const t3 = tabs.addTab("https://c.com", { title: "C" });
    tabs.moveTab(t3.id, 0);
    assertEqual(tabs.getAllTabs()[0].id, t3.id);
  });

  it("should serialize and restore tabs", () => {
    const tabs = new MogwserSidebarTabs(tabstrip, pinnedContainer, tabsList);
    tabs.init();
    tabs.addTab("https://a.com", { title: "A", pinned: true });
    tabs.addTab("https://b.com", { title: "B" });
    tabs.muteTab(tabs.getAllTabs()[1].id);

    const data = tabs.serialize();
    assertEqual(data.length, 2);
    assertEqual(data[0].pinned, true);
    assertEqual(data[1].muted, true);

    const tabs2 = new MogwserSidebarTabs(tabstrip, pinnedContainer, tabsList);
    tabs2.init();
    tabs2.restore(data);
    assertEqual(tabs2.getAllTabs().length, 2);
  });

  it("should fire onTabChange callback", () => {
    const tabs = new MogwserSidebarTabs(tabstrip, pinnedContainer, tabsList);
    tabs.init();
    let lastAction = null;
    tabs.onTabChange((action) => { lastAction = action; });
    tabs.addTab("https://example.com");
    // addTab fires 'add' then 'activate'
    assert(lastAction !== null, "Callback should have fired");
  });

  it("should assign tabs to workspaces", () => {
    const tabs = new MogwserSidebarTabs(tabstrip, pinnedContainer, tabsList);
    tabs.init();
    const tab = tabs.addTab("https://example.com");
    tabs.setTabWorkspace(tab.id, "ws-1");
    const wsTabs = tabs.getTabsByWorkspace("ws-1");
    assertEqual(wsTabs.length, 1);
    assertEqual(wsTabs[0].id, tab.id);
  });
});
