#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
docker compose exec api npm run seed
node ./scripts/reset-demo.mjs

