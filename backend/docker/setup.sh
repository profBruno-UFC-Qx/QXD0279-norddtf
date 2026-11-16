#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

pnpm exec tsx docker/garage/iniciar.ts
pnpm exec prisma db update --format human --no-interactive
pnpm exec tsx src/shared/infra/prisma/seed.ts
