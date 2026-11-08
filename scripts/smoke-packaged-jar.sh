#!/usr/bin/env bash
set -euo pipefail

jar_path="${1:-target/doc2faq-0.5.0.jar}"
port="${DOC2FAQ_SMOKE_PORT:-18080}"
base_url="http://127.0.0.1:${port}"

if [[ ! -f "$jar_path" ]]; then
  echo "Packaged JAR does not exist: $jar_path" >&2
  exit 1
fi

log_path="$(mktemp)"
success=false
app_pid=""

cleanup() {
  if [[ -n "$app_pid" ]]; then
    kill "$app_pid" 2>/dev/null || true
    wait "$app_pid" 2>/dev/null || true
  fi
  if [[ "$success" != true ]]; then
    echo "Packaged application log:" >&2
    sed -n '1,180p' "$log_path" >&2
  fi
  rm -f "$log_path"
}
trap cleanup EXIT

java -jar "$jar_path" "--server.port=$port" >"$log_path" 2>&1 &
app_pid=$!

ready=false
for ((attempt=1; attempt<=45; attempt++)); do
  if curl --max-time 2 --fail --silent "$base_url/api/health" >/dev/null; then
    ready=true
    break
  fi
  if ! kill -0 "$app_pid" 2>/dev/null; then
    echo "Packaged application exited before becoming ready" >&2
    exit 1
  fi
  sleep 1
done

if [[ "$ready" != true ]]; then
  echo "Packaged application did not become ready within 45 seconds" >&2
  exit 1
fi

health="$(curl --fail --silent --show-error "$base_url/api/health")"
printf '%s' "$health" | node -e '
  const fs = require("node:fs");
  const response = JSON.parse(fs.readFileSync(0, "utf8"));
  if (response.status !== "ok" || response.aiEnabled !== false) process.exit(1);
'

index_html="$(curl --fail --silent --show-error "$base_url/")"
if [[ "$index_html" != *Doc2FAQ* ]]; then
  echo "Packaged frontend did not contain the expected application title" >&2
  exit 1
fi

preview="$(curl --fail --silent --show-error \
  --header 'Content-Type: application/json' \
  --data-binary '{"content":"## What is Doc2FAQ?\nIt drafts FAQs from documents."}' \
  "$base_url/api/faqs/preview")"
printf '%s' "$preview" | node -e '
  const fs = require("node:fs");
  const response = JSON.parse(fs.readFileSync(0, "utf8"));
  if (response.count !== 1 || response.items?.[0]?.question !== "What is Doc2FAQ?") process.exit(1);
'

success=true
echo "Packaged JAR smoke test passed: health, frontend, and FAQ preview"
