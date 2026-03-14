#!/usr/bin/env node
/**
 * Mogwser Browser - Lint Script
 *
 * Runs linting checks on all Mogwser source files.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");

let errors = 0;
let filesChecked = 0;

function lintFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const ext = path.extname(filePath);

  filesChecked++;

  lines.forEach((line, i) => {
    const lineNum = i + 1;

    // Check for trailing whitespace
    if (line.match(/\s+$/) && line.trim().length > 0) {
      console.error(`${filePath}:${lineNum}: trailing whitespace`);
      errors++;
    }

    // Check line length (relaxed for URLs)
    if (line.length > 120 && !line.includes("http://") && !line.includes("https://")) {
      console.error(`${filePath}:${lineNum}: line exceeds 120 characters`);
      errors++;
    }
  });

  // Check for console.log in production code (not tests)
  if (!filePath.includes("tests/") && ext === ".js") {
    lines.forEach((line, i) => {
      if (line.includes("console.log(") && !line.trim().startsWith("//")) {
        // Allow in scripts/ directory
        if (!filePath.includes("scripts/")) {
          console.error(`${filePath}:${i + 1}: unexpected console.log`);
          errors++;
        }
      }
    });
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full);
    } else if (entry.name.match(/\.(js|css|xhtml)$/)) {
      lintFile(full);
    }
  }
}

walkDir(SRC_DIR);
walkDir(path.join(ROOT, "tests"));

console.log(`\nLinted ${filesChecked} files, ${errors} error(s) found.`);
process.exit(errors > 0 ? 1 : 0);
