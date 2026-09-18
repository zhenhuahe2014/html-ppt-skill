#!/usr/bin/env node
/**
 * deck 组装器：把【内容片段】注入【骨架模板】，产出最终 deck。
 *
 * 为什么需要它（见 mistaken_data M021）：
 *   骨架含 166 行 CSS + 105 行 JS，手工复制粘贴极易漏改 / 改错 / 与骨架升级脱节。
 *   正确做法：内容单独写在一个片段文件里，用脚本注入，骨架始终保持单一来源。
 *
 * 用法:
 *   node assemble_deck.js --slides <内容片段.html> --out <输出.html> \
 *        --ver v1.0 --time "2026-09-18 05:33 +08:00" --title "演示标题" --pages 15
 *
 * 内容片段格式：纯 <section class="slide">…</section> 序列（可含 HTML 注释分隔），
 *   不要包含 <html>/<head>/<style>/<script>/#nav。
 *
 * 可选参数:
 *   --skeleton <path>  指定骨架（默认技能自带 assets/deck_skeleton.html）
 *   --pages <n>        同步底部导航的 "1 / n"（默认自动统计 section 数量）
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const SKEL_DEFAULT = path.join(__dirname, '..', 'assets', 'deck_skeleton.html');
const skeleton = arg('skeleton', SKEL_DEFAULT);
const slidesFile = arg('slides');
const out = arg('out');
const ver = arg('ver', 'v1.0');
const time = arg('time', new Date().toISOString().slice(0, 16).replace('T', ' '));
const title = arg('title', '演示 deck');

if (!slidesFile || !out) {
  console.error('缺少 --slides 或 --out'); process.exit(1);
}

let s = fs.readFileSync(skeleton, 'utf8');
const slides = fs.readFileSync(slidesFile, 'utf8');

const START = '<div id="deck">';
const END = '</div>\n<div id="nav">';
const i = s.indexOf(START), j = s.indexOf(END);
if (i < 0 || j < 0 || j < i) { console.error('骨架标记未找到（应为 <div id="deck"> … </div>\\n<div id="nav">）'); process.exit(1); }

s = s.slice(0, i + START.length) + '\n' + slides + '\n' + s.slice(j);
s = s.split('__VER__').join(ver).split('__TIME__').join(time);

// 版本号三处一致性由骨架保证（title/meta、封面 vchip、#ver），此处仅修正页码
const pages = parseInt(arg('pages', String((s.match(/class="slide/g) || []).length)), 10);
s = s.replace(/<div id="pg">[^<]*<\/div>/, '<div id="pg">1 / ' + pages + '</div>');
s = s.replace(/<title>[^<]*<\/title>/, '<title>' + title + '（图文演示版 ' + ver + '）</title>');

fs.writeFileSync(out, s, 'utf8');
console.log('输出:', out);
console.log('页数:', pages, '| 版本标记:', (s.match(new RegExp(ver.replace('.', '\\.'), 'g')) || []).length, '处');

// 交付前自检：页数、无图页、蓝色系（postcheck 节选）
const bad = [];
const body = s.split(START)[1].split('<div id="nav">')[0];
const secs = body.split('<section class="slide').slice(1);
secs.forEach((p, idx) => {
  const n = (p.match(/class="(bars|sbars|ring|votes|tl|stepsvg|card)/g) || []).length;
  if (n === 0 && idx !== 0) bad.push('P' + (idx + 1) + ' 无图');   // 封面豁免
});
const blues = (s.match(/#[0-9a-f]{2}[0-9a-f]{2}[cdef]{2}\b/gi) || []);
if (blues.length) bad.push('疑似蓝色系: ' + blues.join(','));
console.log(bad.length ? '⚠ 自检告警: ' + bad.join(' | ') : '✓ 自检通过（每页有图 / 无蓝色系）');
