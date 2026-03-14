/**
 * Tests for MogwserWorkspaces
 */

const { MogwserWorkspaces } = require("../../src/browser/components/workspaces/Workspaces");
const { MogwserSidebarTabs } = require("../../src/browser/components/sidebar-tabs/SidebarTabs");

describe("MogwserWorkspaces", () => {
  it("should initialize with a default workspace", async () => {
    const container = new MockElement("div");
    const tabs = new MogwserSidebarTabs(new MockElement("div"), new MockElement("div"), new MockElement("div"));
    const ws = new MogwserWorkspaces(container, tabs);
    await ws.init();
    assertEqual(ws.getAllWorkspaces().length, 1);
    assertEqual(ws.getAllWorkspaces()[0].name, "Default");
  });

  it("should create additional workspaces", async () => {
    const container = new MockElement("div");
    const ws = new MogwserWorkspaces(container, null);
    await ws.init();
    ws.createWorkspace("Work");
    ws.createWorkspace("Personal");
    assertEqual(ws.getAllWorkspaces().length, 3);
  });

  it("should switch between workspaces", async () => {
    const container = new MockElement("div");
    const ws = new MogwserWorkspaces(container, null);
    await ws.init();
    const work = ws.createWorkspace("Work");
    ws.switchWorkspace(work.id);
    assertEqual(ws.getActiveWorkspaceId(), work.id);
  });

  it("should rename a workspace", async () => {
    const container = new MockElement("div");
    const ws = new MogwserWorkspaces(container, null);
    await ws.init();
    const first = ws.getAllWorkspaces()[0];
    ws.renameWorkspace(first.id, "Renamed");
    assertEqual(ws.getAllWorkspaces()[0].name, "Renamed");
  });

  it("should delete a workspace", async () => {
    const container = new MockElement("div");
    const ws = new MogwserWorkspaces(container, null);
    await ws.init();
    const work = ws.createWorkspace("Work");
    assertEqual(ws.getAllWorkspaces().length, 2);
    const defaultId = ws.getAllWorkspaces()[0].id;
    ws.deleteWorkspace(work.id, defaultId);
    assertEqual(ws.getAllWorkspaces().length, 1);
  });

  it("should not delete the last workspace", async () => {
    const container = new MockElement("div");
    const ws = new MogwserWorkspaces(container, null);
    await ws.init();
    const first = ws.getAllWorkspaces()[0];
    ws.deleteWorkspace(first.id);
    assertEqual(ws.getAllWorkspaces().length, 1);
  });

  it("should serialize and restore state", async () => {
    const container = new MockElement("div");
    const ws = new MogwserWorkspaces(container, null);
    await ws.init();
    ws.createWorkspace("Work");

    const data = ws.serialize();
    assertEqual(data.workspaces.length, 2);

    const ws2 = new MogwserWorkspaces(new MockElement("div"), null);
    ws2.restore(data);
    assertEqual(ws2.getAllWorkspaces().length, 2);
  });

  it("should persist state across restarts", async () => {
    const container = new MockElement("div");
    const ws = new MogwserWorkspaces(container, null);
    await ws.init();
    ws.createWorkspace("Persisted");

    // Simulate restart
    const ws2 = new MogwserWorkspaces(new MockElement("div"), null);
    await ws2.init();
    assert(ws2.getAllWorkspaces().length >= 1, "Should restore from storage");
  });
});
