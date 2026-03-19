#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${SOURCE_DIR:-mozilla-unified}"
MOZCONFIG_SRC="${MOZCONFIG_SRC:-mozconfig}"

if [ ! -d "${SOURCE_DIR}" ]; then
    echo "Error: Source directory '${SOURCE_DIR}' not found. Run 'make fetch' first."
    exit 1
fi

echo "Copying mozconfig to ${SOURCE_DIR}/mozconfig..."
cp "${MOZCONFIG_SRC}" "${SOURCE_DIR}/mozconfig"

echo "Starting Mogwser build..."
cd "${SOURCE_DIR}"
./mach build

echo "Build complete."
