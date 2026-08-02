#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Applying database migrations..."
  node ./node_modules/prisma/build/index.js migrate deploy
fi

echo "Starting Next.js server..."
exec "$@"
