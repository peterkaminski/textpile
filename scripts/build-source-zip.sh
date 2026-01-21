#!/usr/bin/env bash
set -euo pipefail

# Only run when explicitly enabled
if [[ "${PUBLIC_SOURCE_ZIP:-}" != "true" ]]; then
  echo "PUBLIC_SOURCE_ZIP not enabled; skipping source zip."
  exit 0
fi


# Read version from public/version.js (source of truth)
[[ ! -f public/version.js ]] && {
    echo "Error: public/version.js not found" >&2
    exit 1
}

VERSION=$(node -p "
const fs = require('fs');
const content = fs.readFileSync('public/version.js', 'utf-8');
const match = content.match(/TEXTPILE_VERSION\s*=\s*[\"']([^\"']+)[\"']/);
if (!match) process.exit(1);
match[1]
") || {
    echo "Error: Could not parse TEXTPILE_VERSION from public/version.js" >&2
    exit 1
}

[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-].+)?$ ]] || {
    echo "Error: Invalid version format: '$VERSION'" >&2
    exit 1
}

OUTDIR="public/assets"
OUTFILE="${OUTDIR}/textpile-${VERSION}-source.zip"

mkdir -p "$OUTDIR"

# Archive the repo at current commit into a zip
# Naturally excludes node_modules, .git, and other untracked files
git archive --format=zip --output "$OUTFILE" HEAD

echo "✓ Created $OUTFILE"
