#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [ ! -f "$ROOT_DIR/personal-crm-platform/.env" ]; then
  cp "$ROOT_DIR/personal-crm-platform/.env.example" "$ROOT_DIR/personal-crm-platform/.env"
fi

(cd "$ROOT_DIR/personal-crm-api" && npm install && DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/personal_crm}" npm run prisma:generate)
(cd "$ROOT_DIR/personal-crm-agents" && npm install && DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/personal_crm}" npm run prisma:generate)
(cd "$ROOT_DIR/personal-crm-clients" && npm install)

echo "Bootstrap complete. Run: cd personal-crm-platform && ./scripts/dev-up.sh"

