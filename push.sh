#!/usr/bin/env bash
# 一键把本项目推到你自己的 GitHub 仓库（在你的终端里跑，凭据只经过你的机器）
#
# 用法：
#   REPO=https://github.com/<你的用户名>/<仓库名>.git bash push.sh
#
# 首次推送时 Git 会要求认证：
#   用户名 = 你的 GitHub 用户名
#   密码   = Personal Access Token（不是登录密码！）
# 生成地址：https://github.com/settings/tokens → Generate new token (classic) → 勾选 repo
set -e

REPO="${REPO:-}"
if [ -z "$REPO" ]; then
  echo "用法: REPO=https://github.com/你的用户名/仓库名.git bash push.sh"
  exit 1
fi

cd "$(dirname "$0")"

if [ ! -d .git ]; then
  git init -b main
fi

git remote remove origin 2>/dev/null || true
git remote add origin "$REPO"
git branch -M main

echo "→ 推送到 $REPO"
git push -u origin main
echo "✅ 完成：$REPO"
