#!/usr/bin/env node
/**
 * Mogwser Browser - Test Runner
 *
 * Runs unit and integration tests for all Mogwser components.
 * Provides a minimal DOM mock for testing browser chrome components.
 */

"use strict";

const fs = require("fs");
const path = require("path");

// --- Minimal DOM Mock ---
class MockElement {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.childNodes = [];
    this.classList = new MockClassList();
    this.style = {};
    this.dataset = {};
    this.hidden = false;
    this.textContent = "";
    this._attrs = {};
    this._listeners = {};
    this.parentNode = null;
  }

  setAttribute(k, v) { this._attrs[k] = v; }
  getAttribute(k) { return this._attrs[k] || null; }
  removeAttribute(k) { delete this._attrs[k]; }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    this.childNodes.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      this.childNodes.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }

  get firstChild() { return this.children[0] || null; }

  querySelector(sel) {
    // Simple selector support for testing
    for (const child of this.children) {
      if (this._matchesSelector(child, sel)) return child;
      const deep = child.querySelector(sel);
      if (deep) return deep;
    }
    return null;
  }

  querySelectorAll(sel) {
    const result = [];
    for (const child of this.children) {
      if (this._matchesSelector(child, sel)) result.push(child);
      result.push(...child.querySelectorAll(sel));
    }
    return result;
  }

  _matchesSelector(el, sel) {
    if (sel.startsWith(".")) {
      return el.classList.contains(sel.slice(1));
    }
    if (sel.startsWith("#")) {
      return el._attrs.id === sel.slice(1);
    }
    if (sel.startsWith("[data-")) {
      const match = sel.match(/\[data-(\w[\w-]*)="([^"]+)"\]/);
      if (match) return el.dataset[this._camelCase(match[1])] === match[2];
      const match2 = sel.match(/\[data-(\w[\w-]*)\]/);
      if (match2) return this._camelCase(match2[1]) in el.dataset;
    }
    return el.tagName === sel.toUpperCase();
  }

  _camelCase(str) {
    return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }

  addEventListener(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }

  removeEventListener(event, fn) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter((f) => f !== fn);
    }
  }

  dispatchEvent(event) {
    const handlers = this._listeners[event.type] || [];
    handlers.forEach((fn) => fn(event));
  }

  closest(sel) {
    let el = this;
    while (el) {
      if (el._matchesSimple && el._matchesSimple(sel)) return el;
      if (sel.startsWith(".") && el.classList.contains(sel.slice(1))) return el;
      el = el.parentNode;
    }
    return null;
  }

  get innerHTML() { return ""; }
  set innerHTML(_) { this.children = []; this.childNodes = []; }
}

class MockClassList {
  constructor() { this._classes = new Set(); }
  add(...cls) { cls.forEach((c) => this._classes.add(c)); }
  remove(...cls) { cls.forEach((c) => this._classes.delete(c)); }
  contains(cls) { return this._classes.has(cls); }
  toggle(cls, force) {
    if (force === undefined) force = !this._classes.has(cls);
    if (force) this._classes.add(cls);
    else this._classes.delete(cls);
    return force;
  }
}

// Set up global mocks
global.document = {
  createElement: (tag) => new MockElement(tag),
  getElementById: () => new MockElement("div"),
  body: new MockElement("body"),
  documentElement: new MockElement("html"),
  addEventListener: () => {},
  removeEventListener: () => {},
};

global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; },
};

global.getComputedStyle = () => ({
  getPropertyValue: () => "",
});

global.prompt = (msg, def) => def || "test";

// --- Test Framework ---
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function describe(name, fn) {
  console.log(`\n  ${name}`);
  fn();
}

function it(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`    PASS: ${name}`);
  } catch (e) {
    failedTests++;
    failures.push({ suite: name, error: e.message });
    console.log(`    FAIL: ${name}`);
    console.log(`          ${e.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(
      msg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertNotEqual(actual, expected, msg) {
  if (actual === expected) {
    throw new Error(msg || `Expected values to differ, both are ${JSON.stringify(actual)}`);
  }
}

// --- Load and Run Tests ---
const args = process.argv.slice(2);
const runUnit = args.length === 0 || args.includes("--unit");
const runIntegration = args.length === 0 || args.includes("--integration");

const testDirs = [];
if (runUnit) testDirs.push(path.join(__dirname, "unit"));
if (runIntegration) testDirs.push(path.join(__dirname, "integration"));

// Make test helpers global
global.describe = describe;
global.it = it;
global.assert = assert;
global.assertEqual = assertEqual;
global.assertNotEqual = assertNotEqual;
global.MockElement = MockElement;

for (const dir of testDirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".test.js")).sort();
  for (const file of files) {
    console.log(`\nRunning: ${file}`);
    require(path.join(dir, file));
    // Reset localStorage between test files
    global.localStorage.clear();
  }
}

// --- Report ---
console.log("\n" + "=".repeat(50));
console.log(`Tests: ${totalTests} total, ${passedTests} passed, ${failedTests} failed`);

if (failures.length > 0) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  - ${f.suite}: ${f.error}`));
}

console.log("=".repeat(50));
process.exit(failedTests > 0 ? 1 : 0);
