#!/bin/bash
script_dir="$(cd "$(dirname "$0")" && pwd)"

cd "$script_dir" ||  exit 1

environment=$1

rm -rf /home/code/xhs-master-site/output
mkdir -p /home/code/xhs-master-site/output/
mkdir -p /home/code/xhs-master-site/output/public

cd /home/code/xhs-master-site || exit 1
node scripts/switch-env.js $environment
npm install
npm run build

# 复制编译产物和运行时所需的文件到 output
cp -r /home/code/xhs-master-site/.next /home/code/xhs-master-site/output/.next
cp -r /home/code/xhs-master-site/prisma /home/code/xhs-master-site/output/prisma
cp -r /home/code/xhs-master-site/assets /home/code/xhs-master-site/output/assets
cp -r /home/code/xhs-master-site/profiles /home/code/xhs-master-site/output/profiles
cp -r /home/code/xhs-master-site/prompts /home/code/xhs-master-site/output/prompts
cp -r /home/code/xhs-master-site/local-data /home/code/xhs-master-site/output/local-data
cp /home/code/xhs-master-site/docker/entrypoint /home/code/xhs-master-site/output/entrypoint
cp /home/code/xhs-master-site/docker/Dockerfile /home/code/xhs-master-site/output/Dockerfile
