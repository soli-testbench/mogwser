#!/usr/bin/env node
/**
 * Mogwser Browser - Build Script
 *
 * Orchestrates the Firefox build with Mogwser customizations.
 * Supports Linux, macOS, and Windows.
 *
 * Usage: node scripts/build.js [--release|--debug] [--platform=PLATFORM]
 */

"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.resolve(__dirname, "..");
const FIREFOX_DIR = path.join(ROOT, "mozilla-unified");

function log(msg) {
  console.log(`[mogwser-build] ${msg}`);
}

function run(cmd, opts = {}) {
  log(`> ${cmd}`);
  return execSync(cmd, { stdio: "inherit", cwd: opts.cwd || ROOT, ...opts });
}

function detectPlatform() {
  const platform = os.platform();
  switch (platform) {
    case "linux":
      return "linux";
    case "darwin":
      return "macos";
    case "win32":
      return "windows";
    default:
      return platform;
  }
}

function parseArgs() {
  const args = { mode: "release", platform: detectPlatform() };
  process.argv.slice(2).forEach((arg) => {
    if (arg === "--debug") args.mode = "debug";
    if (arg === "--release") args.mode = "release";
    const match = arg.match(/^--platform=(.+)$/);
    if (match) args.platform = match[1];
  });
  return args;
}

function validateEnvironment() {
  if (!fs.existsSync(FIREFOX_DIR)) {
    console.error(
      "Error: Firefox source not found. Run 'npm run setup' first."
    );
    process.exit(1);
  }

  const mozconfigSrc = path.join(ROOT, "mozconfig");
  const mozconfigDest = path.join(FIREFOX_DIR, "mozconfig");
  fs.copyFileSync(mozconfigSrc, mozconfigDest);
  log("mozconfig copied to Firefox source tree.");
}

function buildFirefox(args) {
  const mozbuildEnv = {};

  if (args.mode === "debug") {
    mozbuildEnv.MOZ_DEBUG = "1";
  }

  log(`Building Mogwser (${args.mode} mode) for ${args.platform}...`);

  try {
    run("./mach build", {
      cwd: FIREFOX_DIR,
      env: { ...process.env, ...mozbuildEnv },
    });
  } catch (e) {
    console.error("Build failed. Check output above for errors.");
    process.exit(1);
  }

  log("Build completed successfully.");
}

function packageBrowser(args) {
  log("Packaging Mogwser...");
  try {
    run("./mach package", { cwd: FIREFOX_DIR });
  } catch (e) {
    log("Packaging step skipped (may require additional setup).");
  }
}

function main() {
  const args = parseArgs();
  log(`Mogwser Build System`);
  log(`Platform: ${args.platform} | Mode: ${args.mode}`);

  validateEnvironment();
  buildFirefox(args);
  packageBrowser(args);

  log("Mogwser build complete.");
}

main();
