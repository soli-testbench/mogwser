/**
 * Tests for MogwserThemeEngine
 */

const { MogwserThemeEngine } = require("../../src/browser/components/theme-engine/ThemeEngine");

describe("MogwserThemeEngine", () => {
  it("should initialize with builtin themes", async () => {
    const te = new MogwserThemeEngine();
    await te.init();
    const themes = te.getThemes();
    assert(themes.length >= 4, "Should have at least 4 builtin themes");
  });

  it("should have mogwser-dark as default", async () => {
    const te = new MogwserThemeEngine();
    await te.init();
    const active = te.getActiveTheme();
    assert(active !== null, "Should have an active theme");
    assertEqual(active.id, "mogwser-dark");
  });

  it("should apply a theme", async () => {
    const te = new MogwserThemeEngine();
    await te.init();
    te.applyTheme("mogwser-light");
    assertEqual(te.getActiveTheme().id, "mogwser-light");
  });

  it("should install a custom theme", async () => {
    const te = new MogwserThemeEngine();
    await te.init();
    const countBefore = te.getThemes().length;
    te.installTheme({
      id: "custom-test",
      name: "Test Theme",
      type: "dark",
      colors: { "bg-primary": "#000000", "accent": "#ff0000" },
    });
    assertEqual(te.getThemes().length, countBefore + 1);
  });

  it("should reject theme without required fields", async () => {
    const te = new MogwserThemeEngine();
    await te.init();
    let threw = false;
    try {
      te.installTheme({ id: "bad" });
    } catch {
      threw = true;
    }
    assert(threw, "Should throw for missing fields");
  });

  it("should uninstall custom themes", async () => {
    const te = new MogwserThemeEngine();
    await te.init();
    te.installTheme({
      id: "to-remove",
      name: "Remove Me",
      colors: { "bg-primary": "#111" },
    });
    const countBefore = te.getThemes().length;
    te.uninstallTheme("to-remove");
    assertEqual(te.getThemes().length, countBefore - 1);
  });

  it("should not uninstall builtin themes", async () => {
    const te = new MogwserThemeEngine();
    await te.init();
    const countBefore = te.getThemes().length;
    te.uninstallTheme("mogwser-dark");
    assertEqual(te.getThemes().length, countBefore);
  });

  it("should fallback to dark when uninstalling active custom theme", async () => {
    const te = new MogwserThemeEngine();
    await te.init();
    te.installTheme({
      id: "active-custom",
      name: "Active Custom",
      colors: { "bg-primary": "#222" },
    });
    te.applyTheme("active-custom");
    te.uninstallTheme("active-custom");
    assertEqual(te.getActiveTheme().id, "mogwser-dark");
  });

  it("should serialize state", async () => {
    const te = new MogwserThemeEngine();
    await te.init();
    te.installTheme({
      id: "ser-test",
      name: "Ser Test",
      colors: { "bg-primary": "#333" },
    });
    const data = te.serialize();
    assertEqual(data.activeThemeId, "mogwser-dark");
    assert(data.customThemes.length >= 1, "Should include custom themes");
  });
});
