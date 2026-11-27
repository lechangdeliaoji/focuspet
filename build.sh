#!/usr/bin/env bash
# 番茄宠物 —— 手工构建 APK（aapt2 + javac + d8 + zipalign + apksigner）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV="/d/Agentworkspace/DeepSeekHarness/_env"
JDK="$ENV/sdk/jdk"
BT="$ENV/sdk/build-tools/android-14"
PLATFORM="$ENV/sdk/platforms/android-35/android.jar"
SRC="$ROOT/android"
OUT="$ROOT/build"
ASSETS="$SRC/assets"
PY="/d/Program Files/Python314/python"
APK_NAME="FocusPet-v1.0.apk"
KS="$SRC/debug.keystore"

export JAVA_HOME="$JDK"
export PATH="$JDK/bin:$PATH"

step() { printf '\n\033[1;36m== %s ==\033[0m\n' "$1"; }

step "0. 环境检查"
for f in "$BT/aapt2.exe" "$BT/zipalign.exe" "$BT/lib/d8.jar" "$BT/lib/apksigner.jar" "$PLATFORM" "$JDK/bin/javac.exe"; do
  [ -f "$f" ] || { echo "缺少: $f"; exit 1; }
done
echo "JDK: $("$JDK/bin/java.exe" -version 2>&1 | head -1)"
echo "平台: $PLATFORM"

step "1. 同步 H5 资源 -> assets/www"
rm -rf "$ASSETS/www"
mkdir -p "$ASSETS/www/icons"
cp "$ROOT/index.html" "$ROOT/styles.css" "$ROOT/app.js" "$ROOT/pet.js" "$ROOT/manifest.webmanifest" "$ASSETS/www/"
cp "$ROOT/icons/"*.png "$ASSETS/www/icons/"
echo "assets: $(find "$ASSETS" -type f | wc -l) 个文件"

step "2. 清理输出"
rm -rf "$OUT"
mkdir -p "$OUT/res" "$OUT/classes" "$OUT/dex" "$OUT/gen"

step "3. aapt2 compile（资源编译）"
"$BT/aapt2.exe" compile --dir "$SRC/res" -o "$OUT/res/res.zip"

step "4. aapt2 link（资源链接 + R.java）"
"$BT/aapt2.exe" link \
  -o "$OUT/base.apk" \
  -I "$PLATFORM" \
  --manifest "$SRC/AndroidManifest.xml" \
  -R "$OUT/res/res.zip" \
  --java "$OUT/gen" \
  --auto-add-overlay
echo "base.apk: $(stat -c%s "$OUT/base.apk") bytes"

step "5. javac 编译 Java 源码"
# javac 是原生 Windows 程序，argfile 内的路径必须是 Windows 形式
find "$SRC/java" "$OUT/gen" -name '*.java' | sed 's|^/\([a-zA-Z]\)/|\U\1:/|' > "$OUT/sources.txt"
echo "源文件: $(wc -l < "$OUT/sources.txt") 个"
set +e
"$JDK/bin/javac.exe" -encoding UTF-8 -nowarn \
  -source 8 -target 8 \
  -bootclasspath "$PLATFORM" -classpath "$PLATFORM" \
  -d "$OUT/classes" @"$OUT/sources.txt" > "$OUT/javac.log" 2>&1
JC=$?
set -e
grep -v "bootstrap class path" "$OUT/javac.log" || true
if [ $JC -ne 0 ]; then echo "❌ javac 失败"; exit 1; fi
find "$OUT/classes" -name '*.class' | wc -l | xargs echo "class 文件:"

step "6. d8 转 dex"
"$JDK/bin/java.exe" -cp "$BT/lib/d8.jar" com.android.tools.r8.D8 \
  --release --min-api 24 --lib "$PLATFORM" \
  --output "$OUT/dex" \
  $(find "$OUT/classes" -name '*.class' | tr '\n' ' ')
ls -la "$OUT/dex/"

step "7. 打包 dex + assets"
"$PY" "$ROOT/tools/pack.py" "$OUT/base.apk" "$OUT/dex/classes.dex" "$ASSETS" "$OUT/unsigned.apk"

step "8. zipalign 4 字节对齐"
"$BT/zipalign.exe" -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"

step "9. 生成签名证书（仅首次）"
if [ ! -f "$KS" ]; then
  "$JDK/bin/keytool.exe" -genkeypair -v \
    -keystore "$KS" -storepass focuspet -keypass focuspet \
    -alias focuspet -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=FocusPet, OU=Dev, O=FocusPet, L=Shanghai, ST=Shanghai, C=CN" 2>&1 | tail -3
else
  echo "已存在: $KS"
fi

step "10. apksigner 签名"
"$JDK/bin/java.exe" -jar "$BT/lib/apksigner.jar" sign \
  --ks "$KS" --ks-pass pass:focuspet --key-pass pass:focuspet \
  --ks-key-alias focuspet \
  --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true \
  --out "$ROOT/$APK_NAME" "$OUT/aligned.apk"

step "11. 校验"
"$JDK/bin/java.exe" -jar "$BT/lib/apksigner.jar" verify --verbose "$ROOT/$APK_NAME" | head -12
echo
echo "✅ 构建完成: $ROOT/$APK_NAME"
ls -la "$ROOT/$APK_NAME"
