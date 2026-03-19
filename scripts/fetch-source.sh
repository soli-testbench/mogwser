#!/usr/bin/env bash
set -euo pipefail

VERSION="${FIREFOX_VERSION:-${1:-128.0}}"
SOURCE_DIR="${SOURCE_DIR:-mozilla-unified}"
ARCHIVE="firefox-${VERSION}esr.source.tar.xz"
URL="https://archive.mozilla.org/pub/firefox/releases/${VERSION}esr/source/${ARCHIVE}"

echo "Fetching Firefox ${VERSION} ESR source..."

if [ -d "${SOURCE_DIR}" ]; then
    echo "Source directory '${SOURCE_DIR}' already exists, skipping download."
    exit 0
fi

curl -L -o "${ARCHIVE}" "${URL}"
echo "Extracting ${ARCHIVE}..."
tar xf "${ARCHIVE}"
mv "firefox-${VERSION}" "${SOURCE_DIR}" 2>/dev/null || true
rm -f "${ARCHIVE}"

echo "Firefox ${VERSION} ESR source ready in ${SOURCE_DIR}/"
