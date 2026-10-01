#!/bin/sh
# Bundles src/ into a single self-contained index.html (no dependencies, no bundler).
set -e
cd "$(dirname "$0")"
OUT=index.html
{
cat <<'HEAD'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Wits' End</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Instrument+Sans:wght@400..700&display=swap" rel="stylesheet">
<style>
HEAD
cat src/style.css
echo '</style></head><body><main id="app"></main><script>'
cd src && cat logic.js logic2.js logic3.js game.js alibi.js bridge.js dogs.js lineup.js untangle.js paint.js hues.js registry.js store.js play.js match.js && cd ..
echo '</script></body></html>'
} > "$OUT"
echo "built $OUT ($(wc -c < "$OUT") bytes)"
