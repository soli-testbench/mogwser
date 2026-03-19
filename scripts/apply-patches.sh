#!/usr/bin/env bash
set -euo pipefail

PATCHES_DIR="${PATCHES_DIR:-patches}"
SOURCE_DIR="${SOURCE_DIR:-mozilla-unified}"

if [ ! -d "${PATCHES_DIR}" ]; then
    echo "Patches directory '${PATCHES_DIR}' not found."
    exit 1
fi

shopt -s nullglob
patches=("${PATCHES_DIR}"/*.patch)
shopt -u nullglob

if [ ${#patches[@]} -eq 0 ]; then
    echo "No patches to apply."
    exit 0
fi

echo "Applying ${#patches[@]} patch(es)..."
for patch in "${patches[@]}"; do
    echo "Applying $(basename "${patch}")..."
    patch -d "${SOURCE_DIR}" -p1 < "${patch}"
done

echo "All patches applied."
