# Implementation Plan: Scaffold Mogwser Firefox Fork

## Overview

Scaffold the **Mogwser** Firefox fork repository with a Docker-based build system (matching the existing CI expectation of `docker build .`) and a test suite using **bats-core** (Bash Automated Testing System).

## Research Summary

### How Firefox Forks Work

Major Firefox forks (LibreWolf, Waterfox, Mercury) follow a common pattern:

- **Overlay/patch model**: The fork repo does NOT contain the full Firefox source tree (~3GB+). Instead, it contains build scripts, patches, configuration overrides, and a Makefile/build system that fetches the upstream Firefox source at build time.
- **`mach` build system**: Mozilla's `./mach` command orchestrates the actual compilation. Forks configure it via a `mozconfig` file.
- **Docker-based builds**: LibreWolf's bsys6 and other forks use Docker containers to ensure reproducible builds.

Sources:
- [Firefox Build System Overview](https://firefox-source-docs.mozilla.org/build/buildsystem/build-overview.html)
- [LibreWolf Source Repository](https://codeberg.org/librewolf/source)
- [LibreWolf bsys6 Build System](https://codeberg.org/librewolf/bsys6)
- [Waterfox Repository](https://github.com/BrowserWorks/waterfox)
- [Mercury Firefox Fork](https://github.com/Alex313031/Mercury)
- [moz.build Files](https://firefox-source-docs.mozilla.org/build/buildsystem/mozbuild-files.html)

### Existing CI Constraints

The repo already has a CI workflow (`.github/workflows/ci.yml`) that:
1. Validates a `Dockerfile` exists
2. Runs `docker build .`

The deploy workflow pushes the Docker image to Fly.io. Therefore, the Dockerfile is the primary build entry point.

### Test Framework Choice: bats-core

**bats-core** (Bash Automated Testing System) is the right fit because:
- The build system is shell-script and Makefile based
- bats-core is lightweight, TAP-compliant, and well-maintained
- It can test Makefile targets, script behavior, and directory structure
- It can run inside Docker or natively
- No heavy runtime dependencies (just Bash 3.2+)

Sources:
- [bats-core on GitHub](https://github.com/bats-core/bats-core)
- [bats-core documentation](https://bats-core.readthedocs.io/en/stable/)

## Architecture

### Repository Structure

```
mogwser/
├── Dockerfile              # Build environment (Ubuntu + Mozilla deps)
├── Makefile                # Orchestrates fetch, patch, configure, build
├── mozconfig               # Firefox build configuration for Mogwser
├── README.md               # Project overview + how to run tests
├── patches/                # Directory for Mogwser-specific patches
│   └── .gitkeep
├── scripts/
│   ├── fetch-source.sh     # Downloads Firefox source tarball
│   ├── apply-patches.sh    # Applies patches from patches/ directory
│   └── build.sh            # Runs the mach build
├── tests/
│   ├── setup_suite.bash    # Shared test helpers
│   ├── structure.bats      # Tests: repo structure validation
│   ├── makefile.bats       # Tests: Makefile targets exist and work
│   └── scripts.bats        # Tests: build scripts are valid bash
├── .github/                # (existing) CI workflows
└── CLAUDE.md               # (existing) Task description
```

### Key Design Decisions

1. **Docker as the build entry point**: Matches existing CI. The Dockerfile installs Mozilla build prerequisites (Python 3, Mercurial, Rust, etc.) and runs the Makefile.

2. **Makefile with phony targets**: `fetch`, `patch`, `configure`, `build`, `package`, `clean`, `test`. This follows LibreWolf's pattern and provides clear entry points.

3. **mozconfig for fork configuration**: Standard Firefox fork practice. Sets the application name, disables telemetry, configures branding directory.

4. **Patch-based customization**: Empty `patches/` directory with `.gitkeep`. The `apply-patches.sh` script iterates over `*.patch` files and applies them. This is the standard fork workflow.

5. **bats-core tests run via `make test`**: Tests validate:
   - Repository structure (required files/dirs exist)
   - Makefile has expected targets
   - Shell scripts are syntactically valid (bash -n)
   - mozconfig is valid
   - Dockerfile builds successfully (already covered by CI)

6. **Firefox version pinning**: A `VERSION` file or variable in Makefile specifying which Firefox ESR release to build from (e.g., `128.0esr`). ESR is standard for forks.

### What This Does NOT Include

- Actual Firefox source code (fetched at build time)
- Feature implementations or browser modifications
- CI configuration changes (already exists)
- Custom branding assets (placeholder only)

## Scope Assessment

**Mode: `single`**

Rationale: All components are tightly coupled. The tests test the build scripts, the Makefile references the scripts, the Dockerfile runs the Makefile, and the README documents all of it. There is no meaningful boundary for parallelization — the entire scaffold is one cohesive deliverable that a single agent can implement in one session.

## Verification

- `make test` runs bats-core tests and all pass
- `docker build .` succeeds (Dockerfile is valid)
- README contains test-running instructions
- All expected files exist in the repository structure
