#!/usr/bin/env node
/**
 * 把骨架里的「指定页码跳转（GOTO）」能力注入已有 deck。
 * 单一来源：CSS/HTML/JS 三段全部从 assets/deck_skeleton.html 的 GOTO 标记中提取，
 * 保证骨架升级后旧 deck 可一键同步（见 mistaken_data M021）。
 *
 * 用法:
 *   node patch_goto.js --deck <deck.html> --ver v1.7
 */
const fs = require('fs');
const path = require('path');

function arg(n, d) { const i = process.argv.indexOf('--' + n); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d; }

const SKEL = arg('skeleton', path.join(__dirname, '..', 'assets', 'deck_skeleton.html'));
const deckPath = arg('deck');
const newVer = arg('ver');
if (!deckPath) { console.error('缺少 --deck'); process.exit(1); }

const skel = fs.readFileSync(SKEL, 'utf8');
function marked(open, close) {
  const a = skel.indexOf(open), b = skel.indexOf(close);
  if (a < 0 || b < 0) { console.error('骨架缺少标记: ' + open); process.exit(1); }
  return skel.slice(a, b + close.length);
}
const css = marked('/* GOTO:CSS 起', '/* GOTO:CSS 止 */');
const html = marked('<!-- GOTO:HTML 起 -->', '<!-- GOTO:HTML 止 -->');
const js = marked('/* GOTO:JS 起', '/* GOTO:JS 止 */');

let s = fs.readFileSync(deckPath, 'utf8');
const before = s.length;

// 幂等：已注入则先剥离
if (s.indexOf('id="goto"') > -1) {
  s = s.replace(/\/\* GOTO:CSS 起[\s\S]*?\/\* GOTO:CSS 止 \*\/\n?/, '');
  s = s.replace(/\n?<!-- GOTO:HTML 起 -->[\s\S]*?<!-- GOTO:HTML 止 -->\n?/, '\n');
  s = s.replace(/[ \t]*\/\* GOTO:JS 起[\s\S]*?\/\* GOTO:JS 止 \*\/[ \t]*\n?\n?/, '');
  console.log('· 检测到旧版 GOTO，已剥离后重新注入');
}

// 1) CSS 注入（</style> 前）
const ci = s.lastIndexOf('</style>');
if (ci < 0) { console.error('未找到 </style>'); process.exit(1); }
s = s.slice(0, ci) + css + '\n</style>' + s.slice(ci + '</style>'.length);

// 2) HTML 注入（#ovl 之后）
const hi = s.indexOf('<div id="ovl"></div>');
if (hi < 0) { console.error('未找到 <div id="ovl"></div>'); process.exit(1); }
s = s.slice(0, hi + '<div id="ovl"></div>'.length) + '\n' + html + s.slice(hi + '<div id="ovl"></div>'.length);

// 3) JS 注入（keydown 监听之前）
const ji = s.indexOf('  document.addEventListener(\'keydown\',function(e){');
if (ji < 0) { console.error('未找到 keydown 监听锚点'); process.exit(1); }
s = s.slice(0, ji) + js + '\n\n' + s.slice(ji);

// 4) 键盘处理：接管 goto / 数字键；stage 点击跳过
s = s.replace(
  "  document.addEventListener('keydown',function(e){\n    if(e.key==='ArrowRight'",
  "  document.addEventListener('keydown',function(e){\n" +
  "    if(gto.classList.contains('on')){\n" +
  "      if(e.key==='Escape'){e.preventDefault();toggleGoto(false);}\n" +
  "      else if(e.key==='Enter'){e.preventDefault();var gv=parseInt(gin.value,10);if(!isNaN(gv)){go(gv-1);toggleGoto(false);}}\n" +
  "      else if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();gin.value=String(Math.min(n,i+2));preview(i+2);}\n" +
  "      else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();gin.value=String(Math.max(1,i));preview(i);}\n" +
  "      return;\n    }\n" +
  "    if(/^[0-9]$/.test(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();quickPush(e.key);return;}\n" +
  "    if(e.key==='g'||e.key==='G'){e.preventDefault();toggleGoto(true);return;}\n" +
  "    if(e.key==='ArrowRight'");
s = s.replace("else if(e.key==='o'||e.key==='O'){toggleOvl();}",
              "else if(e.key==='o'||e.key==='O'){toggleGoto(false);toggleOvl();}");
s = s.replace("if(ovl.classList.contains('on'))return;",
              "if(ovl.classList.contains('on')||gto.classList.contains('on'))return;");

// 5) 底部提示条补 G
s = s.replace(/<div id="hint">([^<]*)<\/div>/, function (m, t) {
  return t.indexOf('G') > -1 ? m : '<div id="hint">' + t.replace(/\s*$/, '') + ' ｜ G 跳页</div>';
});

// 6) 版本号
if (newVer) {
  const old = s.match(/v1\.\d+/);
  if (old) s = s.split(old[0]).join(newVer);
}

// 幂等收尾：注入/剥离会在标记边界留下多余空行，统一折叠为最多两个换行
s = s.replace(/\n{3,}/g, '\n\n');

fs.writeFileSync(deckPath, s, 'utf8');
console.log('✓ 已注入 GOTO：', deckPath);
console.log('  体积', before, '→', s.length, '| 版本', newVer || '(未改)');
const chk = ['id="goto"', 'id="gin"', 'id="gquick"', "e.key==='g'", 'quickPush'];
console.log('  自检:', chk.map(function (c) { return (s.indexOf(c) > -1 ? '✓' : '✗') + c; }).join('  '));
