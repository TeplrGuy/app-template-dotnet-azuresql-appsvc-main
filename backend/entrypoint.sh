#!/bin/sh
set -e

# Run Prisma schema push on startup (runs inside VNet, can reach SQL via private endpoint)
if [ -n "$SQLSERVER_CONNECTION_STRING" ]; then
  echo "Running prisma db push to sync schema..."
  # For AAD auth, acquire token first and build a connection string with it
  if echo "$SQLSERVER_CONNECTION_STRING" | grep -qi "ActiveDirectoryManagedIdentity"; then
    echo "Using AAD managed identity for schema push..."
    # Use node to acquire token and run prisma with it
    node -e "
      const { DefaultAzureCredential } = require('@azure/identity');
      (async () => {
        try {
          const cred = new DefaultAzureCredential();
          const token = await cred.getToken('https://database.windows.net/.default');
          const clean = process.env.SQLSERVER_CONNECTION_STRING.replace(/;?authentication=[^;]*/i, '').replace(/;?\$/, '');
          process.env.SQLSERVER_CONNECTION_STRING = clean + ';user=token;password=' + token.token;
          const { execSync } = require('child_process');
          execSync('npx prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit', env: process.env });
        } catch (e) { console.error('Schema push failed:', e.message); }
      })();
    " 2>&1 || echo "⚠️ prisma db push with AAD failed"
  else
    npx prisma db push --skip-generate --accept-data-loss 2>&1 || echo "⚠️ prisma db push failed"
  fi
fi

# Start the NestJS application
exec node dist/main
