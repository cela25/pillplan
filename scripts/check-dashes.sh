#!/usr/bin/env bash
# Fails if an em dash or en dash appears in docs, UI text or data.
# LaTeX "---" (em dash) is also refused. TikZ paths use "--", which is fine.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
status=0
files=$(git ls-files --cached --others --exclude-standard \
  '*.md' '*.tex' '*.sty' '*.ts' '*.tsx' '*.css' '*.csv' '*.json' '*.py' '*.html' '*.toml' '*.sh' \
  | grep -v '^web/package-lock.json$' | while read -r f; do [ -f "$f" ] && echo "$f"; done || true)
if [ -n "$files" ]; then
  if grep -nP '\x{2014}|\x{2013}' $files; then status=1; fi
  if grep -nP '(?<!-)---(?!-)' $(echo "$files" | grep -E '\.(tex|sty)$' || true) /dev/null; then status=1; fi
fi
if [ "${1:-}" = "--pdf" ]; then
  command -v pdftotext >/dev/null || { echo "pdftotext is required for --pdf"; exit 2; }
  for pdf in docs/pdf/*.pdf; do
    if pdftotext "$pdf" - | grep -nP '\x{2014}|\x{2013}'; then
      echo "dash found in $pdf"; status=1
    fi
  done
fi
[ $status -eq 0 ] && echo "no em or en dashes found"
exit $status
