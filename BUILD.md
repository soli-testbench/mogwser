# Mogwser Browser - Build Instructions

## Prerequisites

- Python 3.8+
- Node.js 20+
- Git
- Mercurial (hg)
- Platform-specific build tools (see below)

### Linux

```bash
sudo apt-get install build-essential python3 python3-pip mercurial \
  libgtk-3-dev libdbus-glib-1-dev libpulse-dev nasm yasm
```

### macOS

```bash
brew install mercurial python@3 nasm
xcode-select --install
```

### Windows

1. Install [MozillaBuild](https://ftp.mozilla.org/pub/mozilla/libraries/win32/MozillaBuildSetup-Latest.exe)
2. Install Visual Studio 2022 with C++ workload
3. Open MozillaBuild shell for all commands below

## Setup

```bash
# Clone the Mogwser repository
git clone https://github.com/mogwser/mogwser.git
cd mogwser

# Fetch Firefox source and apply Mogwser customizations
npm run setup
```

## Build

```bash
# Release build (default)
npm run build

# Debug build
npm run build -- --debug

# Platform-specific
npm run build -- --platform=linux
npm run build -- --platform=macos
npm run build -- --platform=windows
```

## Test

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Lint
npm run lint
```

## Project Structure

```
mogwser/
  mozconfig                         # Firefox build configuration
  moz.build                         # Build system integration
  package.json                      # Project manifest
  scripts/
    setup.js                        # Firefox source fetcher
    build.js                        # Build orchestrator
    lint.js                         # Code linter
  ci/
    build.yml                       # CI pipeline (GitHub Actions)
  src/browser/
    chrome/content/
      mogwser-overlay.xhtml         # Custom browser shell (replaces Firefox chrome)
      mogwser.js                    # Main chrome controller
    themes/default/
      mogwser.css                   # Default theme stylesheet
    components/
      sidebar-tabs/SidebarTabs.js   # Vertical tab bar with drag, pin, mute, close
      workspaces/Workspaces.js      # Tab-group/workspace manager
      split-view/SplitView.js       # Side-by-side tab viewing
      side-panels/SidePanels.js     # Web URL sidebar panels
      theme-engine/ThemeEngine.js   # Custom theme support
      privacy/Privacy.js            # Tracking/cookie/fingerprint controls
      compact-mode/CompactMode.js   # Compact/expanded UI density
  tests/
    runner.js                       # Test runner with DOM mocking
    unit/                           # Per-component unit tests
    integration/                    # Cross-component integration tests
```
