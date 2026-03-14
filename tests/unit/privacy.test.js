/**
 * Tests for MogwserPrivacy
 */

const { MogwserPrivacy } = require("../../src/browser/components/privacy/Privacy");

describe("MogwserPrivacy", () => {
  it("should initialize with default settings", async () => {
    const btn = new MockElement("button");
    const priv = new MogwserPrivacy(btn);
    await priv.init();
    const settings = priv.getSettings();
    assertEqual(settings.trackingProtection, true);
    assertEqual(settings.cookieBlocking, "third-party");
    assertEqual(settings.fingerprintResistance, false);
    assertEqual(settings.httpsOnly, true);
  });

  it("should toggle boolean settings", async () => {
    const priv = new MogwserPrivacy(new MockElement("button"));
    await priv.init();
    const result = priv.toggleSetting("fingerprintResistance");
    assertEqual(result, true);
    assertEqual(priv.getSettings().fingerprintResistance, true);
    priv.toggleSetting("fingerprintResistance");
    assertEqual(priv.getSettings().fingerprintResistance, false);
  });

  it("should not toggle non-boolean settings", async () => {
    const priv = new MogwserPrivacy(new MockElement("button"));
    await priv.init();
    const result = priv.toggleSetting("cookieBlocking"); // string, not boolean
    assertEqual(result, false);
  });

  it("should set cookie blocking mode", async () => {
    const priv = new MogwserPrivacy(new MockElement("button"));
    await priv.init();
    priv.setCookieBlocking("all");
    assertEqual(priv.getSettings().cookieBlocking, "all");
    priv.setCookieBlocking("none");
    assertEqual(priv.getSettings().cookieBlocking, "none");
  });

  it("should reject invalid cookie blocking mode", async () => {
    const priv = new MogwserPrivacy(new MockElement("button"));
    await priv.init();
    priv.setCookieBlocking("invalid");
    assertEqual(priv.getSettings().cookieBlocking, "third-party"); // unchanged
  });

  it("should apply standard preset", async () => {
    const priv = new MogwserPrivacy(new MockElement("button"));
    await priv.init();
    priv.applyPreset("standard");
    assertEqual(priv.getProtectionLevel(), "standard");
  });

  it("should apply strict preset", async () => {
    const priv = new MogwserPrivacy(new MockElement("button"));
    await priv.init();
    priv.applyPreset("strict");
    assertEqual(priv.getProtectionLevel(), "strict");
  });

  it("should detect custom protection level", async () => {
    const priv = new MogwserPrivacy(new MockElement("button"));
    await priv.init();
    priv.updateSettings({ trackingProtection: true, cookieBlocking: "all", fingerprintResistance: false });
    assertEqual(priv.getProtectionLevel(), "custom");
  });

  it("should track blocked count", async () => {
    const priv = new MogwserPrivacy(new MockElement("button"));
    await priv.init();
    assertEqual(priv.getBlockedCount(), 0);
    priv.recordBlocked(5);
    assertEqual(priv.getBlockedCount(), 5);
    priv.recordBlocked();
    assertEqual(priv.getBlockedCount(), 6);
  });

  it("should update shield button indicator", async () => {
    const btn = new MockElement("button");
    const priv = new MogwserPrivacy(btn);
    await priv.init();
    assert(btn.classList.contains("mogwser-privacy-active"), "Shield should be active by default");
    priv.toggleSetting("trackingProtection");
    assert(!btn.classList.contains("mogwser-privacy-active"), "Shield should be inactive");
  });

  it("should serialize settings", async () => {
    const priv = new MogwserPrivacy(new MockElement("button"));
    await priv.init();
    const data = priv.serialize();
    assertEqual(data.trackingProtection, true);
    assertEqual(data.httpsOnly, true);
  });
});
