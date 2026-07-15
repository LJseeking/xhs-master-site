#!/bin/bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
project_dir="/home/code/xhs-master-site"

cd "$script_dir" || exit 1

environment="${1:-}"

case "$environment" in
  local|test|prod)
    ;;
  *)
    echo "Unsupported environment: ${environment:-<empty>}"
    echo "Supported: local, test, prod"
    exit 1
    ;;
esac

rm -rf "${project_dir}/output"
mkdir -p "${project_dir}/output/.next/standalone"
mkdir -p "${project_dir}/output/.next/static"
mkdir -p "${project_dir}/output/public"
mkdir -p "${project_dir}/output/prisma"
mkdir -p "${project_dir}/output/assets"
mkdir -p "${project_dir}/output/profiles"
mkdir -p "${project_dir}/output/prompts"
mkdir -p "${project_dir}/output/local-data"
mkdir -p "${project_dir}/output/node_modules/.prisma"
mkdir -p "${project_dir}/output/node_modules/@prisma"

cd "$project_dir" || exit 1
node scripts/switch-env.js "$environment"

if [ -f package-lock.json ] && [ ! -d node_modules ]; then
  npm ci
else
  npm install
fi

npm run prisma:generate
npm run "build:${environment}"

# 复制编译产物和运行时所需的文件到 output
cp -r "${project_dir}/.next/standalone/." "${project_dir}/output/.next/standalone"
cp -r "${project_dir}/.next/static/." "${project_dir}/output/.next/static"
cp -r "${project_dir}/prisma/." "${project_dir}/output/prisma"
[ -d "${project_dir}/public" ] && cp -r "${project_dir}/public/." "${project_dir}/output/public"
[ -d "${project_dir}/assets" ] && cp -r "${project_dir}/assets/." "${project_dir}/output/assets"
[ -d "${project_dir}/profiles" ] && cp -r "${project_dir}/profiles/." "${project_dir}/output/profiles"
[ -d "${project_dir}/prompts" ] && cp -r "${project_dir}/prompts/." "${project_dir}/output/prompts"
[ -d "${project_dir}/local-data" ] && cp -r "${project_dir}/local-data/." "${project_dir}/output/local-data"
[ -d "${project_dir}/node_modules/.prisma" ] && cp -r "${project_dir}/node_modules/.prisma/." "${project_dir}/output/node_modules/.prisma"
[ -d "${project_dir}/node_modules/@prisma" ] && cp -r "${project_dir}/node_modules/@prisma/." "${project_dir}/output/node_modules/@prisma"
cp "${project_dir}/docker/entrypoint" "${project_dir}/output/entrypoint"
cp "${project_dir}/docker/Dockerfile" "${project_dir}/output/Dockerfile"
