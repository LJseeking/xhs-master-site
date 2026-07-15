#!/bin/bash
script_dir="$(cd "$(dirname "$0")" && pwd)"

cd "$script_dir" ||  exit 1

environment=$1

rm -rf /home/code/xhs-master-site/output
mkdir -p /home/code/xhs-master-site/output/
mkdir -p /home/code/xhs-master-site/output/.next
mkdir -p /home/code/xhs-master-site/output/public
mkdir -p /home/code/xhs-master-site/output/prisma
mkdir -p /home/code/xhs-master-site/output/assets
mkdir -p /home/code/xhs-master-site/output/profiles
mkdir -p /home/code/xhs-master-site/output/prompts
mkdir -p /home/code/xhs-master-site/output/local-data

cd /home/code/xhs-master-site || exit 1
node scripts/switch-env.js $environment
npm install
npm run build

# 复制编译产物和运行时所需的文件到 output
cp -r /home/code/xhs-master-site/.next/standalone /home/code/xhs-master-site/output/.next/standalone
cp -r /home/code/xhs-master-site/.next/static /home/code/xhs-master-site/output/.next/static
cp -r /home/code/xhs-master-site/prisma/. /home/code/xhs-master-site/output/prisma
[ -d /home/code/xhs-master-site/assets ] && cp -r /home/code/xhs-master-site/assets/. /home/code/xhs-master-site/output/assets
[ -d /home/code/xhs-master-site/profiles ] && cp -r /home/code/xhs-master-site/profiles/. /home/code/xhs-master-site/output/profiles
[ -d /home/code/xhs-master-site/prompts ] && cp -r /home/code/xhs-master-site/prompts/. /home/code/xhs-master-site/output/prompts
[ -d /home/code/xhs-master-site/local-data ] && cp -r /home/code/xhs-master-site/local-data/. /home/code/xhs-master-site/output/local-data
cp /home/code/xhs-master-site/docker/entrypoint /home/code/xhs-master-site/output/entrypoint
cp /home/code/xhs-master-site/docker/Dockerfile /home/code/xhs-master-site/output/Dockerfile
