#!/bin/sh
set -e

# Run Prisma schema push on startup (runs inside VNet, can reach SQL via private endpoint)
if [ -n "$SQLSERVER_CONNECTION_STRING" ]; then
  echo "Running prisma db push to sync schema..."
  npx prisma db push --skip-generate --accept-data-loss 2>&1 || echo "⚠️ prisma db push failed (will retry on next restart)"
fi

# Start the NestJS application
exec node dist/main
