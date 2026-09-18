#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
deck 版本号自动升级（对应 html-ppt-skill S5 / mistaken_data 版本管理）

用法:
    python bump_version.py <workspace> <YYYYMMDD> [变更说明] [目标文件名]

行为:
    读 <workspace>/.workbuddy/deck_version.json 中 reports[YYYYMMDD].minor
    → +1 → 写回 → 打印新版本号（形如 v1.7）
    若该日期不存在则创建（minor 从 0 起）

示例:
    python bump_version.py "<workspace>" 20260918 "双向居中 + 自动版本号"

注意：时间戳统一按 GMT+8 输出（环境本地时区可能不是东八区，直接用 datetime.now() 会偏早）。
"""
import json
import sys
import os
import datetime

def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    ws = sys.argv[1]
    day = sys.argv[2]
    note = sys.argv[3] if len(sys.argv) > 3 else "更新"
    fname = sys.argv[4] if len(sys.argv) > 4 else f"报告_{day}_翻页版.html"

    path = os.path.join(ws, ".workbuddy", "deck_version.json")
    data = {}
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    reports = data.setdefault("reports", {})
    rec = reports.get(day)
    if rec is None:
        # 首次生成：minor 从 0 起 → v1.0，history 只记本次变更说明（避免重复 v1.0）
        rec = {"major": 1, "minor": 0, "file": fname, "history": []}
        reports[day] = rec
    else:
        rec["minor"] = int(rec.get("minor", 0)) + 1
    rec["version"] = f"v{rec['major']}.{rec['minor']}"
    rec["file"] = fname
    rec["updated"] = datetime.datetime.now(
        datetime.timezone(datetime.timedelta(hours=8))
    ).strftime("%Y-%m-%d %H:%M +08:00")
    hist = rec.setdefault("history", [])
    line = f"{rec['version']} {note}"
    if line not in hist:
        hist.append(line)

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(rec["version"])

if __name__ == "__main__":
    main()
