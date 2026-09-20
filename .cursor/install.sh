#!/usr/bin/env bash
# Idempotent bootstrap for the jev-routing Cloud Agent environment.
#
# The committed repository is currently a placeholder; the real source is
# synced in separately. This script therefore detects whatever stack shows up
# in the workspace root and installs its dependencies. It is a no-op (exit 0)
# on an empty checkout, so it stays safe across boots and branches.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

log() { printf '[install] %s\n' "$*"; }

installed_something=0

# --- Node.js ---------------------------------------------------------------
if [[ -f package.json ]]; then
  installed_something=1
  if [[ -f pnpm-lock.yaml ]]; then
    log "pnpm-lock.yaml found -> pnpm install"
    corepack enable >/dev/null 2>&1 || true
    pnpm install --frozen-lockfile || pnpm install
  elif [[ -f yarn.lock ]]; then
    log "yarn.lock found -> yarn install"
    corepack enable >/dev/null 2>&1 || true
    yarn install --frozen-lockfile || yarn install
  elif [[ -f package-lock.json ]]; then
    log "package-lock.json found -> npm ci"
    npm ci || npm install
  else
    log "package.json found (no lockfile) -> npm install"
    npm install
  fi
fi

# --- Python ----------------------------------------------------------------
if [[ -f pyproject.toml ]]; then
  installed_something=1
  if [[ -f poetry.lock ]] || grep -q "\[tool.poetry\]" pyproject.toml 2>/dev/null; then
    log "poetry project found -> poetry install"
    pip3 install --quiet --user poetry >/dev/null 2>&1 || true
    poetry install --no-interaction || true
  else
    log "pyproject.toml found -> pip install ."
    python3 -m pip install --user -e . || python3 -m pip install --user .
  fi
elif [[ -f requirements.txt ]]; then
  installed_something=1
  log "requirements.txt found -> pip install -r"
  python3 -m pip install --user -r requirements.txt
fi

# --- Go --------------------------------------------------------------------
if [[ -f go.mod ]]; then
  installed_something=1
  log "go.mod found -> go mod download"
  go mod download
fi

# --- Rust ------------------------------------------------------------------
if [[ -f Cargo.toml ]]; then
  installed_something=1
  log "Cargo.toml found -> cargo fetch"
  cargo fetch
fi

if [[ "$installed_something" -eq 0 ]]; then
  log "No recognized manifest in workspace root; nothing to install (placeholder checkout)."
fi

log "done."
