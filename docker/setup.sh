#!/bin/sh
set -e

cd "$(dirname "$0")/.."

echo "Subindo PostgreSQL..."
docker compose up -d db

echo "Aguardando Postgres ficar saudável..."
ready=0
for i in $(seq 1 30); do
  if docker compose exec -T db pg_isready -U "${POSTGRES_USER:-rec_user}" -d "${POSTGRES_DB:-rec_db}" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

if [ "$ready" -ne 1 ]; then
  echo ""
  echo "Postgres não iniciou. Logs:"
  docker compose logs db | tail -30
  echo ""
  echo "Se o volume foi criado com outra versão do Postgres, resete:"
  echo "  docker compose down -v && npm run docker:setup"
  exit 1
fi

echo "Rodando migrate + seed..."
docker compose --profile setup run --rm --no-deps setup
