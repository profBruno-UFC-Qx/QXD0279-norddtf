#!/bin/sh
set -eu

cd "$(dirname "$0")/../.."

set -a
. ./.env
set +a

garage() {
  docker compose exec -T garage /garage "$@"
}

tentativas=0
until garage status >/dev/null 2>&1; do
  tentativas=$((tentativas + 1))
  if [ "$tentativas" -ge 30 ]; then
    echo "O Garage não respondeu. Suba com: docker compose up -d garage" >&2
    exit 1
  fi
  sleep 1
done

if garage status 2>/dev/null | grep -q "NO ROLE ASSIGNED"; then
  no=$(garage node id -q 2>/dev/null | cut -d@ -f1)
  garage layout assign -z dc1 -c 1G "$no" >/dev/null
  garage layout apply --version 1 >/dev/null
fi

if ! garage key info "$S3_ACCESS_KEY_ID" >/dev/null 2>&1; then
  garage key import --yes -n nordtf "$S3_ACCESS_KEY_ID" "$S3_SECRET_ACCESS_KEY" >/dev/null
elif [ "$(garage key info --secret-key "$S3_ACCESS_KEY_ID" 2>/dev/null)" != "$S3_SECRET_ACCESS_KEY" ]; then
  echo "A chave S3_ACCESS_KEY_ID já existe no Garage com outro segredo. Volte o S3_SECRET_ACCESS_KEY antigo no .env, ou apague a chave com docker compose exec garage /garage key delete --yes <S3_ACCESS_KEY_ID> e rode o script de novo." >&2
  exit 1
fi

for bucket in "$S3_BUCKET" "$S3_BUCKET_TEST"; do
  if ! garage bucket info "$bucket" >/dev/null 2>&1; then
    garage bucket create "$bucket" >/dev/null
  fi
  garage bucket allow --read --write --owner "$bucket" --key "$S3_ACCESS_KEY_ID" >/dev/null
done

echo "Garage pronto: buckets $S3_BUCKET e $S3_BUCKET_TEST com a chave nordtf."
