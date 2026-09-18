#!/usr/bin/env bash
# deck 分批截图（Chrome 无头）
#
# 用法：
#   bash shot_pages.sh <deck绝对路径> <输出目录> [起始页] [结束页] [宽] [高]
# 例：
#   bash shot_pages.sh "F:/proj/report_翻页版.html" "F:/proj/.workbuddy/scratch/shots" 1 20 1600 900
#
# 注意（mistaken_data M012/M013）：
#   - 单页约 6 秒，20 页会超前台超时 → 本脚本默认每批 6 页，可配合 run_in_background 使用
#   - 输出目录与源路径请用 ASCII 路径；所有路径已加引号
#   - 不用 rm（M004），同名直接覆盖；跑完自行 ls 核对数量与 mtime

set -u
DECK="${1:?需要 deck 路径}"
OUT="${2:?需要输出目录}"
FROM="${3:-1}"
TO="${4:-20}"
W="${5:-1600}"
H="${6:-900}"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
[ -x "$CHROME" ] || CHROME="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"

mkdir -p "$OUT"
n=0
for ((i=FROM; i<=TO; i++)); do
  printf -v f "%s/p%02d.png" "$OUT" "$i"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-sandbox \
    --window-size="${W},${H}" --virtual-time-budget=3000 \
    --screenshot="$f" "file:///${DECK}#${i}" >/dev/null 2>&1
  n=$((n+1))
  # 每 6 页输出一次进度，便于观察是否被中断
  (( n % 6 == 0 )) && echo "…已截 $n 页"
done
echo "完成：$OUT （共 $n 页）"
ls -1 "$OUT"/*.png 2>/dev/null | wc -l
