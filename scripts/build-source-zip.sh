#!/usr/bin/env bash
set -euo pipefail

# Only run when explicitly enabled
if [[ "${PUBLIC_SOURCE_ZIP:-}" != "true" ]]; then
  echo "PUBLIC_SOURCE_ZIP not enabled; skipping source zip."
  exit 0
fi

# Read version from public/version.js (source of truth)
VERSION=$(node -p "const fs=require('fs'); const content=fs.readFileSync('public/version.js','utf-8'); const match=content.match(/TEXTPILE_VERSION\s*=\s*[\"']([^\"']+)[\"']/); if(!match){console.error('Error: Could not parse version from public/version.js'); process.exit(1);} match[1]")
[[ -n "$VERSION" ]] || { echo "Error: Could not extract version"; exit 1; }

OUTDIR="public/assets"
OUTFILE="${OUTDIR}/textpile-${VERSION}-source.zip"

mkdir -p "$OUTDIR"

# Archive the repo at current commit into a zip
# Naturally excludes node_modules, .git, and other untracked files
git archive --format=zip --output "$OUTFILE" HEAD

echo "✓ Created $OUTFILE"
