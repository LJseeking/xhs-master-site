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
mkdir -p "${project_dir}/output/.next"

cd "$project_dir" || exit 1

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

npm run "build:${environment}"

# 复制编译产物和运行时所需的文件到 output
cp -r "${project_dir}/.next/standalone" "${project_dir}/output/.next/standalone"
cp -r "${project_dir}/.next/static" "${project_dir}/output/.next/static"
[ -d "${project_dir}/public" ] && cp -r "${project_dir}/public" "${project_dir}/output/public" || mkdir -p "${project_dir}/output/public"
cp -r "${project_dir}/prisma" "${project_dir}/output/prisma"
cp -r "${project_dir}/assets" "${project_dir}/output/assets"
cp -r "${project_dir}/profiles" "${project_dir}/output/profiles"
cp -r "${project_dir}/prompts" "${project_dir}/output/prompts"
cp -r "${project_dir}/local-data" "${project_dir}/output/local-data"
cp "${project_dir}/docker/entrypoint" "${project_dir}/output/entrypoint"
cp "${project_dir}/docker/Dockerfile" "${project_dir}/output/Dockerfile"
