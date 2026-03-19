# Mogwser Firefox Fork - Build System
# ====================================

FIREFOX_VERSION ?= 128.0
SOURCE_DIR      ?= mozilla-unified
PATCHES_DIR     ?= patches
BATS            ?= ./tests/bats-core/bin/bats

.PHONY: all setup fetch patch configure build package clean test

all: fetch patch configure build package

setup:
	@echo "=== Mogwser Build Environment ==="
	@echo "Firefox version: $(FIREFOX_VERSION)"
	@echo "Source directory: $(SOURCE_DIR)"
	@echo ""
	@echo "Checking prerequisites..."
	@command -v python3 >/dev/null 2>&1 && echo "  python3: $$(python3 --version)" || echo "  python3: NOT FOUND"
	@command -v git     >/dev/null 2>&1 && echo "  git:     $$(git --version)"     || echo "  git:     NOT FOUND"
	@command -v curl    >/dev/null 2>&1 && echo "  curl:    $$(curl --version | head -1)" || echo "  curl:    NOT FOUND"
	@command -v make    >/dev/null 2>&1 && echo "  make:    $$(make --version | head -1)" || echo "  make:    NOT FOUND"
	@echo ""
	@echo "Environment OK."

fetch:
	FIREFOX_VERSION=$(FIREFOX_VERSION) SOURCE_DIR=$(SOURCE_DIR) ./scripts/fetch-source.sh

patch:
	PATCHES_DIR=$(PATCHES_DIR) SOURCE_DIR=$(SOURCE_DIR) ./scripts/apply-patches.sh

configure:
	cp mozconfig $(SOURCE_DIR)/mozconfig
	cd $(SOURCE_DIR) && ./mach configure

build:
	SOURCE_DIR=$(SOURCE_DIR) ./scripts/build.sh

package:
	cd $(SOURCE_DIR) && ./mach package

clean:
	rm -rf $(SOURCE_DIR) obj-mogwser *.tar.xz

test:
	@if [ ! -x "$(BATS)" ]; then \
		echo "Installing bats-core..."; \
		git clone --depth 1 https://github.com/bats-core/bats-core.git tests/bats-core; \
	fi
	$(BATS) tests/*.bats
