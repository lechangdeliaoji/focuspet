#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
在 GitHub 上创建 Release 并把 APK 作为 asset 上传。

用法:
    set GH_TOKEN=github_pat_xxx
    python tools/gh_release.py [owner] [repo] [tag] [apk-path]
"""
import json
import os
import sys
import urllib.error
import urllib.request

API = "https://api.github.com"
UPLOADS = "https://uploads.github.com"
TOKEN = os.environ.get("GH_TOKEN", "").strip()
OWNER = (sys.argv[1] if len(sys.argv) > 1 else "lechangdeliaoji").strip()
REPO = (sys.argv[2] if len(sys.argv) > 2 else "focuspet").strip()
TAG = (sys.argv[3] if len(sys.argv) > 3 else "v1.0").strip()
APK = (sys.argv[4] if len(sys.argv) > 4 else "FocusPet-v1.0.apk").strip()

NAME = "番茄宠物 FocusPet v1.0"
BODY = """一个离线可用的番茄钟 + 积分激励 + 宠物养成 App。

- 计时：专注 25 / 短休 5 / 长休 15，可自定义，精确闹钟到点通知
- 积分：完成番茄、勾选任务、连续四轮、每日目标、每日签到
- 宠物：猫或狗，喂食 / 玩耍 / 抚摸 / 洗澡，饿着会掉心情
- 商店：7 种食物、5 种玩具、9 件服饰，积分兑换
- 数据：全部存在手机本地，支持导出 / 导入备份

安装：下载下方 `FocusPet-v1.0.apk` → 点击安装 → 允许「未知来源」→ 首次启动允许通知权限。
环境：Android 7.0+（minSdk 24），约 166 KB，无需联网。
"""


def req(method, url, body=None, raw=None, ctype=None):
    data = None
    if raw is not None:
        data = raw
    elif body is not None:
        data = json.dumps(body).encode("utf-8")
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Authorization", "Bearer " + TOKEN)
    r.add_header("Accept", "application/vnd.github+json")
    r.add_header("X-GitHub-Api-Version", "2022-11-28")
    r.add_header("User-Agent", "focuspet-release")
    if body is not None:
        r.add_header("Content-Type", "application/json")
    if ctype:
        r.add_header("Content-Type", ctype)
    try:
        with urllib.request.urlopen(r, timeout=300) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8") or "{}"
        try:
            return exc.code, json.loads(text)
        except Exception:
            return exc.code, {"message": text[:300]}
    except Exception as exc:
        return 0, {"message": repr(exc)}


def main():
    if not TOKEN:
        print("ERROR: GH_TOKEN 为空")
        return 2
    if not os.path.exists(APK):
        print("ERROR: 找不到 " + APK)
        return 2

    status, js = req("GET", f"{API}/repos/{OWNER}/{REPO}/releases/tags/{TAG}")
    if status == 200:
        rel = js
        print(f"[release] 已存在 {TAG} id={rel['id']}，清理旧 asset")
        for asset in rel.get("assets", []):
            code, _ = req("DELETE", f"{API}/repos/{OWNER}/{REPO}/releases/assets/{asset['id']}")
            print(f"  del {asset['name']} -> {code}")
    else:
        status, js = req("POST", f"{API}/repos/{OWNER}/{REPO}/releases", {
            "tag_name": TAG,
            "target_commitish": "main",
            "name": NAME,
            "body": BODY,
            "draft": False,
            "prerelease": False,
        })
        print(f"[release] create HTTP {status}")
        if status not in (200, 201):
            print("ERROR:", js.get("message"))
            return 3
        rel = js

    rel_id = rel["id"]
    with open(APK, "rb") as fh:
        blob = fh.read()
    name = os.path.basename(APK)
    status, js = req("POST",
                     f"{UPLOADS}/repos/{OWNER}/{REPO}/releases/{rel_id}/assets?name={name}",
                     raw=blob, ctype="application/vnd.android.package-archive")
    print(f"[asset] HTTP {status} size={len(blob)}")
    if status not in (200, 201):
        print("ERROR:", js.get("message"))
        return 4
    print("[asset] url =", js.get("browser_download_url"))
    print("DONE", rel.get("html_url"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
