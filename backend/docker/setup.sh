#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

pnpm exec tsx docker/garage/iniciar.ts

if [ "${SETUP_MODO:-dev}" = "prod" ]; then
  pnpm exec prisma db migrate --format human --no-interactive
else
  pnpm exec prisma db update --format human --no-interactive
fi

pnpm exec tsx src/shared/infra/prisma/seed.ts
