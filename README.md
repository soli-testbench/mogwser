# Mogwser

A privacy-focused Firefox fork.

## Prerequisites

### With Docker (recommended)

- [Docker](https://docs.docker.com/get-docker/)

### Without Docker

- Bash 3.2+
- GNU Make
- Python 3
- Git
- curl
- Rust (via [rustup](https://rustup.rs/))
- Build essentials (`build-essential`, `libdbus-glib-1-dev`, `libgtk-3-dev`, `pkg-config`, `nasm`)

## Building

### With Docker

```bash
docker build -t mogwser .
docker run mogwser
```

### From source

```bash
make setup    # Verify prerequisites
make fetch    # Download Firefox ESR source
make patch    # Apply Mogwser patches
make configure
make build
make package
```

Or run the full pipeline:

```bash
make all
```

## Running Tests

```bash
make test
```

This will automatically install [bats-core](https://github.com/bats-core/bats-core) (if not already present) and run the test suite. Tests validate repository structure, Makefile targets, and script syntax.

## Project Structure

```
mogwser/
├── Dockerfile              # Build environment (Ubuntu + Mozilla deps)
├── Makefile                # Orchestrates fetch, patch, configure, build
├── mozconfig               # Firefox build configuration
├── README.md               # This file
├── patches/                # Mogwser-specific patches (applied in sorted order)
├── scripts/
│   ├── fetch-source.sh     # Downloads Firefox ESR source tarball
│   ├── apply-patches.sh    # Applies patches from patches/ directory
│   └── build.sh            # Runs the mach build
├── tests/
│   ├── setup_suite.bash    # Shared test helpers
│   ├── structure.bats      # Tests: repo structure validation
│   ├── makefile.bats       # Tests: Makefile targets
│   └── scripts.bats        # Tests: build scripts validation
└── .github/                # CI workflows
```

## Configuration

The `mozconfig` file controls Firefox build options. Key settings:

- Unofficial branding (no Mozilla trademarks)
- Optimized release build
- Telemetry, crash reporter, and updater disabled

Firefox version is configured via `FIREFOX_VERSION` in the Makefile (default: `128.0` ESR).

## License

TBD
