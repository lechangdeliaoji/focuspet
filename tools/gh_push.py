#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
用 GitHub Git Data API 把当前仓库快照推到远端（不需要 git push，
适用于 github.com:443 被网络阻断、但 api.github.com 可达的环境）。

用法:
    set GH_TOKEN=github_pat_xxx
    python tools/gh_push.py [owner] [repo] [branch]

行为: 读 `git ls-files -s` 的文件清单与权限位 -> 逐个上传 blob ->
建 tree -> 建 commit -> 更新/创建分支引用。只用一个 commit。
"""
import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

API = "https://api.github.com"
TOKEN = os.environ.get("GH_TOKEN", "").strip()
OWNER = (sys.argv[1] if len(sys.argv) > 1 else "lechangdeliaoji").strip()
REPO = (sys.argv[2] if len(sys.argv) > 2 else "focuspet").strip()
BRANCH = (sys.argv[3] if len(sys.argv) > 3 else "main").strip()
MESSAGE = "番茄宠物 v1.0：番茄钟 + 积分激励 + 宠物养成 + 商店兑换"


def call(method, path, body=None, timeout=180):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header("Authorization", "Bearer " + TOKEN)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("User-Agent", "focuspet-push")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8") or "{}"
            return resp.status, json.loads(raw)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8") or "{}"
        try:
            return exc.code, json.loads(raw)
        except Exception:
            return exc.code, {"message": raw[:400]}
    except Exception as exc:  # 网络层
        return 0, {"message": repr(exc)}


def list_files():
    out = subprocess.check_output(["git", "ls-files", "-s"], text=True)
    files = []
    for line in out.splitlines():
        if not line.strip():
            continue
        meta, path = line.split("\t", 1)
        mode = meta.split()[0]
        files.append((path, "100755" if mode == "100755" else "100644"))
    return files


def upload(item):
    path, mode = item
    with open(path, "rb") as fh:
        payload = base64.b64encode(fh.read()).decode("ascii")
    status, js = call("POST", f"/repos/{OWNER}/{REPO}/git/blobs",
                      {"content": payload, "encoding": "base64"})
    if status not in (200, 201) or "sha" not in js:
        return {"path": path, "error": f"HTTP {status} {js.get('message', '')}"}
    return {"path": path, "mode": mode, "sha": js["sha"]}


def bootstrap():
    """空仓库无法直接用 Git Data API（409 Git Repository is empty）：
    先用 Contents API 放一个 .gitignore，生成初始 commit 与分支引用。"""
    path = ".gitignore"
    content = b""
    if os.path.exists(path):
        with open(path, "rb") as fh:
            content = fh.read()
    status, js = call("PUT", f"/repos/{OWNER}/{REPO}/contents/{path}", {
        "message": "chore: 初始化仓库",
        "content": base64.b64encode(content).decode("ascii"),
        "branch": BRANCH,
    })
    if status in (200, 201):
        print(f"[bootstrap] 初始 commit {js.get('commit', {}).get('sha')}")
        return True
    print(f"[bootstrap] HTTP {status} {js.get('message', '')}")
    return False


def main():
    if not TOKEN:
        print("ERROR: 环境变量 GH_TOKEN 为空")
        return 2

    status, js = call("GET", f"/repos/{OWNER}/{REPO}")
    print(f"[repo] HTTP {status} {js.get('full_name') or js.get('message', '')}")
    if status != 200:
        return 3

    status, js = call("GET", f"/repos/{OWNER}/{REPO}/git/ref/heads/{BRANCH}")
    if status != 200:
        print(f"[bootstrap] 分支 {BRANCH} 尚不存在（HTTP {status}），先建初始提交")
        if not bootstrap():
            return 8

    files = list_files()
    total = sum(os.path.getsize(p) for p, _ in files)
    print(f"[files] {len(files)} 个文件, {total} 字节")

    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(upload, files))

    bad = [r for r in results if "error" in r]
    if bad:
        for r in bad[:10]:
            print(f"  FAIL {r['path']}: {r['error']}")
        return 4
    print(f"[blobs] {len(results)} 个 blob 上传完成")

    entries = [{"path": r["path"], "mode": r["mode"], "type": "blob", "sha": r["sha"]}
               for r in sorted(results, key=lambda x: x["path"])]
    status, js = call("POST", f"/repos/{OWNER}/{REPO}/git/trees", {"tree": entries})
    if status not in (200, 201) or "sha" not in js:
        print(f"ERROR tree: HTTP {status} {js.get('message', '')}")
        return 5
    tree_sha = js["sha"]
    print(f"[tree] {tree_sha}")

    status, js = call("GET", f"/repos/{OWNER}/{REPO}/git/ref/heads/{BRANCH}")
    if status == 200:
        parents = [js["object"]["sha"]]
        existed = True
    else:
        parents = []
        existed = False
    print(f"[branch] {BRANCH} 已存在={existed} parents={parents}")

    status, js = call("POST", f"/repos/{OWNER}/{REPO}/git/commits",
                      {"message": MESSAGE, "tree": tree_sha, "parents": parents})
    if status not in (200, 201) or "sha" not in js:
        print(f"ERROR commit: HTTP {status} {js.get('message', '')}")
        return 6
    commit_sha = js["sha"]
    print(f"[commit] {commit_sha}")

    if existed:
        status, js = call("PATCH", f"/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}",
                          {"sha": commit_sha, "force": True})
    else:
        status, js = call("POST", f"/repos/{OWNER}/{REPO}/git/refs",
                          {"ref": f"refs/heads/{BRANCH}", "sha": commit_sha})
    if status not in (200, 201):
        print(f"ERROR ref: HTTP {status} {js.get('message', '')}")
        return 7
    print(f"[ref] refs/heads/{BRANCH} -> {js.get('object', {}).get('sha', commit_sha)}")
    print("DONE https://github.com/%s/%s" % (OWNER, REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main())
