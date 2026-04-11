#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [ ! -f ".env" ]; then
  cp .env.example .env
fi

docker compose up --build

