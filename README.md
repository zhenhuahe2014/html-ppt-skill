# html-ppt-skill

**让 AI 一次性产出「可翻页、图文并茂、双向居中、配色不出错」的单文件 HTML 幻灯片。**
**Turn any Markdown report into a single-file, page-flipping HTML slide deck — with charts, auto-centering, semantic colors and a self-correcting mistake library.**

[中文](#中文) · [English](#english) · [示例 / Example](examples/china-ai-news-deck.html)

---

<a id="中文"></a>

## 中文

### 这是什么

`html-ppt-skill` 是一套**面向 AI 编程助手的幻灯片生成技能**。它解决的不是「能不能生成 HTML」，而是**生成结果能不能直接用**：

| 常见翻车现场 | 本 skill 的处理 |
|---|---|
| 给了长文档滚动页，不是翻页 deck | 强制全屏 16:9 一屏一页（M018） |
| 视口不是 16:9 就出现大片空白 | 固定 1600×900 画布 + 整体等比缩放（M001） |
| 内容放大后左右被裁切 | `transform:scale` + 宽度补偿（M002） |
| 内容偏上偏下、左右不齐 | 上下 padding 严格对称 + flex 双轴居中（M016） |
| 通篇文字没有图 | 每页 ≥1 图，纯 SVG/CSS 手写，禁止外部库（M019） |
| 配色丑、涨跌色用反、出现蓝色系 | 深色高对比色板 + `data-tone` 六板块色 + 涨红跌绿（M020/M024） |
| 改了骨架，旧 deck 没同步 | 脚本化组装 + 标记化 patch 注入（M021/M026） |
| 骨架 CSS 结构损坏，`var()` 全部失效 | 交付前跑配色校验，确认 `:root` 真的被解析（M023） |

核心是**递归改进闭环**：每次调用前先读错误库，交付后把新踩的坑写回错误库。目前沉淀 **26 条**真实踩坑记录（M001–M026）。

### 效果示例

仓库内 `examples/china-ai-news-deck.html` 是用本 skill 生成的真实产物——**15 页中国人工智能要闻汇报**（v1.2，单文件 47 KB，双击即可打开，无任何外部依赖）。

```
打开后可用：← → 翻页 ｜ G 跳页 ｜ O 概览 ｜ F 全屏 ｜ 直接按数字键跳页 ｜ #页码 深链
```

### 快速开始

```bash
# 1) 把技能放进你的 skills 目录（Claude Code / WorkBuddy / Cursor 等均可）
git clone https://github.com/zhenhuahe/html-ppt-skill.git ~/.workbuddy/skills/html-ppt-skill

# 2) 写内容片段（只写 <section class="slide"> 序列，不要写 html/head/style/script）
#    参考 assets/deck_skeleton.html 里的三页范例

# 3) 脚本化组装
node scripts/assemble_deck.js \
  --slides my_slides.html \
  --out    my_deck.html \
  --ver    v1.0 \
  --title  "我的汇报" \
  --pages  15

# 4) 交付前校验（几何 + 配色）
#    把 my_deck.html 复制为同一目录下的 deck_raw.html，再用 Chrome 无头跑：
chrome --headless=new --disable-gpu --no-sandbox --allow-file-access-from-files \
  --window-size=1600,900 --virtual-time-budget=9000 --dump-dom \
  "file:///…/scripts/verify_layout.html"
chrome --headless=new --disable-gpu --no-sandbox --allow-file-access-from-files \
  --window-size=1600,900 --virtual-time-budget=9000 --dump-dom \
  "file:///…/scripts/check_color.html"
# 判定：异常必须为 0，且配色校验须报告「:root 已解析」
```

### 目录结构

```
html-ppt-skill/
├─ SKILL.md                    # 技能主文件：工作流 + 硬性规范 + 工程纪律
├─ mistaken_data.json          # 错误库（26 条）：preflight / mistakes / postcheck
├─ assets/
│  └─ deck_skeleton.html       # 起手骨架（全部 CSS + 自适应 JS + 3 页范例）
├─ scripts/
│  ├─ assemble_deck.js         # 内容片段 → 成品 deck（注入骨架、替换版本、自检）
│  ├─ patch_goto.js            # 把「指定页码跳转」能力幂等注入旧 deck
│  ├─ verify_layout.html       # 几何校验：溢出 / 压眉标 / 压导航 / 偏心率
│  ├─ check_color.html         # 配色校验：:root 解析 / tone 色 / 蓝色系 / WCAG 对比度
│  ├─ bump_version.py          # 版本号自动 +1（GMT+8 时间戳）
│  └─ shot_pages.sh            # Chrome 无头分批截图
└─ examples/
   └─ china-ai-news-deck.html  # 真实产物：15 页中国 AI 要闻汇报
```

### 递归改进闭环

```
Step 0  读错误库   → mistaken_data.json（preflight + 全部 mistakes）
Step 1-5 生成 deck  → 逐条规避 mistakes
Step 6  验证       → 几何校验 + 配色校验 + 截图目检
Step 7  回写       → 新踩的坑追加进 mistaken_data.json
```

### 硬性规范（摘）

**版式**：底 `#0b0b0d` / 面板 `#151518` / 字 `#f2f2f4` / 强调琥珀金 `#ffb74d`；**全程无蓝色系**；涨 `#ff5252` 跌 `#3ddc84`（中国习惯）。

**居中（v1.6 定稿）**
```css
html{font-size:19px}                             /* 固定值，禁用 vw */
#deck{width:1600px;height:900px;transform:scale(min(vw/1600,vh/900))}
.slide{padding:5.5rem 4.5rem}                    /* 上下严格对称 */
.wrap{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center}
.zin{width:100%;flex:none;transform-origin:center center}   /* flex:none 必须 */
```
```js
zin.style.width = (100/k) + '%';   // 宽度补偿，防放大后横向溢出
zin.style.transform = 'scale(' + k + ')';
```

**配色语义**：`.u 红 / .d 绿` **只用于真实涨跌**；份额、热度、密度等中性量级用板块色 `--tone`（`policy 金 / model 青绿 / chip 橙 / capital 玫红 / gov 紫红 / world 黄绿`）。

**图表组件**（纯 SVG + CSS，禁止外部库）

| 组件 | 类名 | 用途 |
|---|---|---|
| 双向条形图 | `.bars` | 涨跌对比（零轴居中，涨右红跌左绿） |
| 单向条形图 | `.sbars` | 量级 / 占比（默认 tone 色） |
| 环形图 | `.ring` | 概率 / 占比 |
| 投票方块 | `.votes` | 投票分歧 |
| 时间轴 | `.tl .tli` | 日程 |
| 阶梯折线 | `.stepsvg` | 路径预测 |

**交互**：`←/→/空格/PageUp/Down/Home/End` 翻页、`O` 概览、`F` 全屏、`Esc` 关闭；点击/滑动翻页；`#页码` 深链；`G` 或点击底部页码打开跳页面板；**直接按数字键**可快输页码（如 `1` `2` → 1 秒后自动跳到第 12 页）。

### 版本管理

版本注册表约定在 `<workspace>/.workbuddy/deck_version.json`，每次生成/修订自动 +1，并写入 deck 的三处（`<title>` + `<meta name="deck-version">`、封面 `.vchip`、底部导航 `#ver`）。同一天多个主题时用 `YYYYMMDD-主题` 作为 key，避免串号。

### 参与贡献

最欢迎的贡献是**把新踩的坑写进 `mistaken_data.json`**——它是这个 skill 真正的资产。字段：`symptom`（现象）/ `root_cause`（根因）/ `fix`（修法）/ `check`（怎么验证）。旧方案被取代时移入 `superseded`，不要删历史。

### 许可证

MIT © Zhenhua He

---

<a id="english"></a>

## English

### What it is

`html-ppt-skill` is a **slide-deck generation skill for AI coding assistants**. It does not solve "can an LLM write HTML" — it solves **"is the output actually presentable"**:

| Typical failure | How this skill handles it |
|---|---|
| A scrolling long-form page instead of a deck | Full-screen 16:9, one slide per screen (M018) |
| Huge blank margins on non-16:9 viewports | Fixed 1600×900 canvas + uniform scale (M001) |
| Content clipped left/right when scaled up | `transform:scale` + width compensation (M002) |
| Content off-center vertically / horizontally | Symmetric vertical padding + flex centering on both axes (M016) |
| Wall of text, no visuals | ≥1 chart per slide, hand-written SVG/CSS, no external libs (M019) |
| Ugly palette, reversed up/down colors, blue theme | Dark high-contrast palette + `data-tone` section colors + red-up/green-down (M020/M024) |
| Skeleton upgraded but old decks not synced | Scripted assembly + marker-based idempotent patching (M021/M026) |
| Broken skeleton CSS silently kills every `var()` | Run the color check and verify `:root` really parsed (M023) |

The heart of the skill is a **recursive improvement loop**: read the mistake library before every run, write newly discovered pitfalls back after delivery. It currently holds **26 real recorded pitfalls** (M001–M026).

### Example

`examples/china-ai-news-deck.html` is a real artifact produced with this skill — a **15-page briefing on AI news in China** (v1.2, single file, 47 KB, no external dependencies; just open it in a browser).

```
Keys: ← → navigate ｜ G go-to-page ｜ O overview ｜ F fullscreen ｜ type digits to jump ｜ #page deep link
```

### Quick start

```bash
# 1) Drop the skill into your skills directory (Claude Code / WorkBuddy / Cursor …)
git clone https://github.com/zhenhuahe/html-ppt-skill.git ~/.workbuddy/skills/html-ppt-skill

# 2) Write a content fragment: just a sequence of <section class="slide"> blocks
#    (no html/head/style/script). See the 3 sample slides in assets/deck_skeleton.html

# 3) Assemble
node scripts/assemble_deck.js \
  --slides my_slides.html \
  --out    my_deck.html \
  --ver    v1.0 \
  --title  "My Deck" \
  --pages  15

# 4) Verify before shipping (geometry + color)
#    Copy my_deck.html to deck_raw.html next to the scripts, then:
chrome --headless=new --disable-gpu --no-sandbox --allow-file-access-from-files \
  --window-size=1600,900 --virtual-time-budget=9000 --dump-dom \
  "file:///…/scripts/verify_layout.html"
chrome --headless=new --disable-gpu --no-sandbox --allow-file-access-from-files \
  --window-size=1600,900 --virtual-time-budget=9000 --dump-dom \
  "file:///…/scripts/check_color.html"
# Gate: 0 anomalies, and the color check must report ":root parsed"
```

### Layout

```
html-ppt-skill/
├─ SKILL.md                    # Main skill file: workflow + hard rules + engineering discipline
├─ mistaken_data.json          # Mistake library (26 entries): preflight / mistakes / postcheck
├─ assets/
│  └─ deck_skeleton.html       # Starting skeleton (all CSS + adaptive JS + 3 sample slides)
├─ scripts/
│  ├─ assemble_deck.js         # Fragment → finished deck (inject skeleton, set version, self-check)
│  ├─ patch_goto.js            # Idempotently inject "jump to page" into older decks
│  ├─ verify_layout.html       # Geometry check: overflow / overlap / eccentricity
│  ├─ check_color.html         # Color check: :root parsed / tone colors / blue hues / WCAG contrast
│  ├─ bump_version.py          # Auto version bump (GMT+8 timestamps)
│  └─ shot_pages.sh            # Batched Chrome headless screenshots
└─ examples/
   └─ china-ai-news-deck.html  # Real artifact: 15-page China AI news briefing
```

### The recursive loop

```
Step 0  Read the mistake library → mistaken_data.json (preflight + all mistakes)
Step 1-5 Generate the deck      → avoid every recorded mistake
Step 6  Verify                  → geometry + color + screenshot review
Step 7  Write back              → append newly discovered pitfalls
```

### Hard rules (excerpt)

**Theme**: bg `#0b0b0d` / panel `#151518` / text `#f2f2f4` / accent amber `#ffb74d`; **no blue hues anywhere**; up `#ff5252`, down `#3ddc84` (Chinese market convention).

**Centering (v1.6 final)**
```css
html{font-size:19px}                             /* fixed value, never vw */
#deck{width:1600px;height:900px;transform:scale(min(vw/1600,vh/900))}
.slide{padding:5.5rem 4.5rem}                    /* strictly symmetric vertically */
.wrap{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center}
.zin{width:100%;flex:none;transform-origin:center center}   /* flex:none is mandatory */
```
```js
zin.style.width = (100/k) + '%';   // width compensation prevents horizontal overflow
zin.style.transform = 'scale(' + k + ')';
```

**Semantic color**: `.u red / .d green` are **for real price moves only**. Neutral magnitudes (share, heat, density) use the section tone (`policy amber / model teal / chip orange / capital rose / gov magenta / world lime`).

**Chart components** (pure SVG + CSS, no external libraries)

| Component | Class | Use |
|---|---|---|
| Diverging bars | `.bars` | Gains vs losses (zero axis centered, red right / green left) |
| Single bars | `.sbars` | Magnitudes / shares (tone color by default) |
| Donut | `.ring` | Probabilities / shares |
| Vote grid | `.votes` | Vote splits |
| Timeline | `.tl .tli` | Schedules |
| Step line | `.stepsvg` | Path forecasts |

**Interaction**: `←/→/Space/PageUp/PageDown/Home/End` navigate, `O` overview, `F` fullscreen, `Esc` close; click/swipe to advance; `#page` deep links; `G` or clicking the page counter opens the go-to-page panel; **typing digits** jumps directly (e.g. `1` `2` auto-jumps to slide 12 after 1s).

### Versioning

Versions live in `<workspace>/.workbuddy/deck_version.json`. Each build bumps the minor version and writes it to three places in the deck (`<title>` + `<meta name="deck-version">`, cover `.vchip`, footer `#ver`). Use `YYYYMMDD-topic` keys when several decks share a day, so they don't clobber each other.

### Contributing

The most valuable contribution is **adding new pitfalls to `mistaken_data.json`** — it is the real asset here. Fields: `symptom` / `root_cause` / `fix` / `check`. When a fix is superseded, move the old approach into `superseded`; never delete history.

### License

MIT © Zhenhua He
