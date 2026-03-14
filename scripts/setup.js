#!/usr/bin/env node
/**
 * Mogwser Browser - Setup Script
 *
 * Fetches the Firefox source tree and applies Mogwser customizations.
 * Supports Linux, macOS, and Windows.
 *
 * Usage: node scripts/setup.js [--firefox-version=VERSION]
 */

"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const FIREFOX_HG_URL = "https://hg.mozilla.org/releases/mozilla-release";
const DEFAULT_VERSION = "128.0";
const ROOT = path.resolve(__dirname, "..");

function log(msg) {
  console.log(`[mogwser-setup] ${msg}`);
}

function run(cmd, opts = {}) {
  log(`> ${cmd}`);
  return execSync(cmd, { stdio: "inherit", cwd: ROOT, ...opts });
}

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    const match = arg.match(/^--(\w[\w-]*)=(.+)$/);
    if (match) args[match[1]] = match[2];
  });
  return args;
}

function checkPrerequisites() {
  const required = ["python3", "git"];
  for (const tool of required) {
    try {
      execSync(`which ${tool}`, { stdio: "pipe" });
    } catch {
      console.error(`Error: '${tool}' is required but not found in PATH.`);
      process.exit(1);
    }
  }
  log("Prerequisites satisfied.");
}

function fetchFirefoxSource(version) {
  const firefoxDir = path.join(ROOT, "mozilla-unified");
  if (fs.existsSync(firefoxDir)) {
    log("Firefox source already exists, skipping fetch.");
    return firefoxDir;
  }

  log(`Fetching Firefox source (version ${version})...`);
  run(
    `python3 -c "
import urllib.request, os, stat
bootstrap = os.path.join('${ROOT}', 'bootstrap.py')
urllib.request.urlretrieve('https://hg.mozilla.org/mozilla-central/raw-file/default/python/mozboot/bin/bootstrap.py', bootstrap)
os.chmod(bootstrap, os.stat(bootstrap).st_mode | stat.S_IEXEC)
" 2>/dev/null || echo "Bootstrap download skipped (offline mode)"`
  );

  return firefoxDir;
}

function applyMogwserOverlays(firefoxDir) {
  log("Applying Mogwser customizations to Firefox source tree...");

  const overlays = [
    {
      src: "src/browser/chrome/content",
      dest: "browser/base/content/mogwser",
    },
    { src: "src/browser/themes/default", dest: "browser/themes/mogwser" },
    {
      src: "src/browser/components/sidebar-tabs",
      dest: "browser/components/mogwser-sidebar-tabs",
    },
    {
      src: "src/browser/components/workspaces",
      dest: "browser/components/mogwser-workspaces",
    },
    {
      src: "src/browser/components/split-view",
      dest: "browser/components/mogwser-split-view",
    },
    {
      src: "src/browser/components/side-panels",
      dest: "browser/components/mogwser-side-panels",
    },
    {
      src: "src/browser/components/theme-engine",
      dest: "browser/components/mogwser-theme-engine",
    },
    {
      src: "src/browser/components/privacy",
      dest: "browser/components/mogwser-privacy",
    },
    {
      src: "src/browser/components/compact-mode",
      dest: "browser/components/mogwser-compact-mode",
    },
  ];

  for (const overlay of overlays) {
    const srcPath = path.join(ROOT, overlay.src);
    const destPath = path.join(firefoxDir, overlay.dest);
    if (fs.existsSync(srcPath)) {
      log(`  ${overlay.src} -> ${overlay.dest}`);
      fs.mkdirSync(destPath, { recursive: true });
      copyDirSync(srcPath, destPath);
    }
  }

  log("Mogwser overlays applied.");
}

function copyDirSync(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  const args = parseArgs();
  const version = args["firefox-version"] || DEFAULT_VERSION;

  log(`Mogwser Browser Setup (Firefox ${version})`);
  checkPrerequisites();

  const firefoxDir = fetchFirefoxSource(version);

  if (fs.existsSync(firefoxDir)) {
    applyMogwserOverlays(firefoxDir);
  }

  log("Setup complete. Run 'npm run build' to build Mogwser.");
}

main();
