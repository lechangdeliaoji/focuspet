# -*- coding: utf-8 -*-
"""把 classes.dex 与 assets/www 打进 aapt2 链接出的 base.apk。

用法: python pack.py <base.apk> <classes.dex> <assetsDir> <out.apk>
"""
import os
import shutil
import sys
import zipfile


def main():
    if len(sys.argv) < 5:
        print("usage: pack.py base.apk classes.dex assetsDir out.apk")
        return 2
    base, dex, assets_dir, out = sys.argv[1:5]

    shutil.copyfile(base, out)

    added = 0
    with zipfile.ZipFile(out, "a", zipfile.ZIP_DEFLATED) as z:
        names = set(z.namelist())

        if "classes.dex" not in names:
            z.write(dex, "classes.dex")
            added += 1
        else:
            print("WARN: classes.dex already present")

        if os.path.isdir(assets_dir):
            for root, _dirs, files in os.walk(assets_dir):
                for fn in sorted(files):
                    full = os.path.join(root, fn)
                    rel = os.path.relpath(full, assets_dir).replace("\\", "/")
                    arc = "assets/" + rel
                    if arc in names:
                        print("WARN: skip duplicate", arc)
                        continue
                    z.write(full, arc)
                    added += 1
        else:
            print("WARN: assets dir not found:", assets_dir)

    print("packed %d entries -> %s (%d bytes)" % (added, out, os.path.getsize(out)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
