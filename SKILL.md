---
name: html-ppt-skill
description: 生成「可翻页的 HTML PPT deck」（全屏 16:9 幻灯片，非长文档）。当用户要 PPT 式 HTML、翻页演示、幻灯片网页、图文并茂的报告 deck，或需要把 Markdown 报告转成可翻页演示时使用。内置递归改进闭环：调用前必读 mistaken_data.json 错误库，交付后必回写新踩的坑。
agent_created: true
---

# HTML PPT Deck 生成技能（递归式改进）

产出一个**单文件、无外部依赖、可翻页的全屏 16:9 幻灯片 HTML**，并做到**上下 + 左右双向居中**、**每页至少一图**、**自动版本号**。

## 🔁 递归改进闭环（本 skill 的核心，不可跳过）

```
Step 0  读错误库   → mistaken_data.json（preflight + 全部 mistakes）
Step 1-5 生成 deck  → 逐条规避 mistakes
Step 6  验证       → 几何校验 + 目检
Step 7  回写       → 新踩的坑追加进 mistaken_data.json（count/last_seen）
```

**Step 0（强制）**：开工前先读 `mistaken_data.json`，逐条比对 `preflight` 清单。
**Step 7（强制）**：任务结束前，把本次**新踩的坑 / 更优方案**写回该文件——新坑追加 `mistakes` 条目（id 递增）；旧坑再犯则 `count+1` 并更新 `last_seen`；有更优解时更新 `fix` 并把旧方案移入 `superseded`（**不要删历史**）。同时更新 `last_updated`。
→ 这样每跑一次，下一次就更稳。

## 工作流

### S1 内容与数据（先把数据做对，再谈排版）
- 涉及时区/市场类内容：**先做时区换算表**，逐市场标注「已收盘 / 盘中 / 未开盘 / 未开盘」，切勿把多市场当同一天（M011）。
- 跨源数值冲突：优先多数一致源（一手交易所 > 财经媒体）。
- 数据自洽校验：反推「最新价 − 涨跌额 = 前收」或「涨跌额 ÷ 前收 = 涨跌幅」；不吻合即为盘中实时价，须标"盘中/尾盘"而非"收盘"（M010）。
- **数据缺口标"未确认"，绝不填推算值**；补齐后回头复核由该缺口推导的结论（M009）。

### S2 底稿
- 先出 `xxx_YYYYMMDD.md` 结构化底稿，再提炼改写成 deck（PPT ≠ 长文档分页）。

### S3 生成 deck
- **从 `assets/deck_skeleton.html` 起手**（已含全部 CSS + 自适应 JS，经 3 视口校验通过），只改内容区。
- **必须脚本化组装，禁止手工复制 CSS/JS**（M021）：
  1. 把内容写成一个片段文件（仅 `<section class="slide">…</section>` 序列，不含 html/head/style/script/#nav）；
  2. `node scripts/assemble_deck.js --slides 片段.html --out 成品.html --ver v1.0 --title "标题"`；
  3. 脚本自动注入骨架、替换 `__VER__`/`__TIME__`、修正页码，并做自检（页数 / 无图页 / 蓝色系）。
- 页数 15–20；每页容量：表格 ≤7 行 / 4–6 要点 / 2–4 卡片。

### S4 图表化（每页 ≥1 图，纯 SVG + CSS，禁止外部库）
| 组件 | 类名 | 用途 | 换算 |
|------|------|------|------|
| 双向条形图 | `.bars .bar .lb/.tr/.mid/.fl.u/.fl.d/.vl` | 涨跌对比（零轴居中，涨右红跌左绿） | `width = |值| / max × 50%` |
| 单向条形图 | `.sbars .sbar .fl(.g/.a)` | 涨幅/利率/计数 | `width = 值 / max × 100%` |
| 环形图 | `.ring` SVG | 概率/占比 | `r=40` 周长 `251.33`，`dashoffset = 251.33×(1-p)`，`rotate(-90 50 50)` |
| 投票方块 | `.votes` | 央行投票分歧 | 一票一方块 |
| 时间轴 | `.tl .tli` | 当日日程 | — |
| 阶梯折线 | `.stepsvg` | 路径预测 | — |
| 甘特图 | `svg` | 交易时段 | 行标放绘图区内，字号 ≥13（M005/M017） |

### S5 版本号（自动升级）
- 注册表约定：`<workspace>/.workbuddy/deck_version.json`，结构见下方 §版本表结构。
- 每次生成/修订：读 `reports[YYYYMMDD].minor` → **+1** → 写回；版本号写入三处并保持一致：
  ① `<title>` + `<meta name="deck-version">`　② 封面 `<h1>` 内 `.vchip`　③ 导航 `#ver`
- 可用 `scripts/bump_version.py` 自动 +1 并输出新版本号。

### S5.5 配色（语义化，禁止涨跌色滥用）
- **每页 `section` 加 `data-tone`**：`policy 金 #ffb74d`／`model 青绿 #2ee6c8`／`chip 橙 #ff8a65`／`capital 玫红 #ff5c8a`／`gov 紫红 #d16ee0`／`world 黄绿 #a8d84a`（全部避开 200–260 蓝色相）。骨架已内置，写内容时只填属性。
- **语义分色**：`.u 红 / .d 绿` **仅用于真实涨跌**；份额、热度、密度等中性量级一律用默认 tone 色（M024）。
- `--accent` 只留给封面、进度条、导航、版本徽章等**全局元素**；页面内强调走 `--tone`。

### S6 验证（交付前必做）
1. **几何校验（主手段）**：`scripts/verify_layout.html`（用法见文件头注释）→ 输出每页 `.zin` 区间、是否溢出/压眉标/压导航、偏心率；**异常必须为 0**，且在 ≥2 种视口（如 1366×768、2560×1080）回归。
2. **配色校验（必做，M023/M024）**：`scripts/check_color.html` → 确认「`:root` 已解析」且 `--bg` 非空（骨架结构损坏会让整块 `:root` 被吞，颜色全失效但布局看起来正常）、各 tone 渲染色可区分、无蓝色系、最弱对比度 ≥4.5:1。
3. **截图目检（若会话支持看图）**：`scripts/shot_pages.sh` 分批截图后逐张 Read。无法目检时以几何+配色校验为准（M014）。
3. 核对 `postcheck` 清单。

### S7 交付
- `present_files` 调用产物（deck 为主交付物，md 底稿 / 文档版 html 为辅）。
- 把新坑回写 `mistaken_data.json`。

## 📐 硬性规范（违反即不合格）

**版式**：深色高对比 —— 底 `#0b0b0d`／面板 `#151518`／字 `#f2f2f4`／强调琥珀金 `#ffb74d`；**全程无蓝色系**（M020，需要"蓝"时用紫 `#9d7bd8`）；**涨 `#ff5252`、跌 `#3ddc84`**（中国习惯）。单文件内联 CSS/JS。

**居中（v1.6 定稿方案）**
```css
html{font-size:19px}                              /* 固定值，禁用 vw（M001） */
#stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center}
#deck{width:1600px;height:900px;transform:scale(min(vw/1600,vh/900))}
.slide{padding:5.5rem 4.5rem}                     /* 上下严格对称（M016） */
.wrap{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center}
.zin{width:100%;flex:none;transform-origin:center center}   /* flex:none 必须（M008） */
.cover .zin{text-align:center}                    /* 封面水平居中（M015） */
td:first-child{white-space:nowrap}
```
```js
// 求 k（≤6 轮收敛，上限 data-cap 默认 1.24 / 封面 1.12，收尾再做溢出保险）
zin.style.width = (100/k) + '%';                  /* 宽度补偿，防放大溢出（M002） */
zin.style.transform = 'scale(' + k + ')';
// 测量一律 getBoundingClientRect（M006）；画布坐标换算必须两步（M007）：
//   画布X = (屏幕X − deckRect.left) ÷ (deckRect.height/900)
```
骨架 JS 已实现上述全部逻辑，**直接复用 assets/deck_skeleton.html，不要重写**。

**交互**：`←/→/空格/PageUp/Down/Home/End` 翻页、`O` 概览、`F` 全屏、`Esc` 关闭；点击/滑动翻页；`#页码` 深链；底部进度条 + 页码 + 前后按钮 + 版本徽标。
**指定页码跳转（2026-09-18 v1.7 起，骨架内置）**：
- 三种入口：① `G` 键打开跳页面板；② 点击底部页码 `#pg`；③ **直接按数字键**（如 `1` `2` → 屏幕中央显示 `12 / N`，1 秒无后续输入自动跳转，Enter 立即跳）。
- 面板内：居中大输入框 + 1..N 页码网格（当前页高亮、hover 实时预览目标页标题）+ 快捷键说明；`←→` 微调 ±1、`Enter` 跳、`Esc` 关、点背景关。
- 越界自动钳制到 [1,N]；打开面板时自动关概览、屏蔽舞台点击翻页；页码输入框聚焦时数字键不触发快输。
- 旧 deck 同步：`node scripts/patch_goto.js --deck <deck.html> --ver vX.Y`（从骨架 GOTO 标记提取三段注入，幂等可重跑，并自动更新底部提示条与版本号）。

## ⚠️ 工程纪律
- 同一文件**串行编辑**，改完 grep 复核（M003）。
- 批量脚本**不用 rm**，直接覆盖；凡"重新生成"必须 `stat` 核对 mtime（M004）。
- 长耗时截图/校验**分批 + 后台**（M012）；脚本放 ASCII 路径、路径加引号（M013）。

## 版本表结构（`.workbuddy/deck_version.json`）
```json
{ "_schema":"deck_version@1",
  "reports": { "YYYYMMDD": { "major":1, "minor":6, "version":"v1.6",
    "file":"xxx_YYYYMMDD_翻页版.html", "updated":"...", "history":["v1.0 …"] } } }
```

## 资源
- `assets/deck_skeleton.html` —— 起手骨架（CSS 166 行 + 自适应 JS，含封面/图表页/表格页三页范例）
- `scripts/check_color.html` —— 配色校验 harness：`:root` 是否解析、各 tone 渲染色、蓝色系、WCAG 对比度
- `scripts/verify_layout.html` —— 几何校验 harness（已修正坐标换算，M007）
- `scripts/shot_pages.sh` —— Chrome 无头分批截图
- `scripts/bump_version.py` —— 版本号自动 +1
  - 同一天产出多个不同主题 deck 时，key 用 `YYYYMMDD-主题`（如 `20260918-AI`）避免互相覆盖（M022）
- `scripts/patch_goto.js` —— 把骨架的「指定页码跳转」能力注入旧 deck（幂等）：`node scripts/patch_goto.js --deck <deck.html> --ver vX.Y`
- `mistaken_data.json` —— 错误库（Step 0 读 / Step 7 写）
