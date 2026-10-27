'use strict';
const fs = require('fs');
const path = require('path');
const cfg = require('./config');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'data', 'raw');
const IMG_DIR = path.join(ROOT, 'site', 'static', 'img');

const SRC_NAME = { bfzym3u8: '暴风', jinyingm3u8: '金鹰', jinyingyun: '金鹰线路' };

function parseSources(from, urls) {
  if (!from || !urls) return [];
  const fk = from.split('$$$');
  const uk = urls.split('$$$');
  const out = [];
  for (let i = 0; i < fk.length; i++) {
    const key = fk[i].trim();
    const body = (uk[i] || '').trim();
    if (!key || !body) continue;
    const eps = body.split('#').map(function (seg) {
      const p = seg.indexOf('$');
      const n = p > -1 ? seg.slice(0, p) : '';
      const u = p > -1 ? seg.slice(p + 1) : seg;
      if (!/^https?:\/\//i.test(u) && !/^\/\//.test(u)) return null;
      return { n: n || '正片', u: u };
    }).filter(Boolean);
    if (!eps.length) continue;
    const isHls = /m3u8/i.test(key) || eps.some(function (e) { return /\.m3u8(\?|$)/i.test(e.u); });
    out.push({
      key: key,
      name: SRC_NAME[key] || key,
      hls: isHls,
      eps: eps
    });
  }
  // 暴风（bfzym3u8）优先
  out.sort(function (a, b) {
    const rank = function (k) { return k === 'bfzym3u8' ? 0 : (k === 'jinyingm3u8' ? 1 : 2); };
    return rank(a.key) - rank(b.key);
  });
  return out;
}

function load() {
  const lines = fs.readFileSync(path.join(SRC, 'vod.ndjson'), 'utf8').split('\n');
  const types = JSON.parse(fs.readFileSync(path.join(SRC, 'types.json'), 'utf8'));
  const typeMap = {};
  types.forEach(function (t) { typeMap[t.type_id] = t; });

  const subOfMain = {};
  types.forEach(function (t) {
    if (cfg.mainCats.some(function (m) { return m.id === Number(t.type_pid); })) {
      const k = Number(t.type_pid);
      (subOfMain[k] = subOfMain[k] || []).push({ id: Number(t.type_id), name: t.type_name });
    }
  });

  const hasImg = {};
  try {
    fs.readdirSync(IMG_DIR).forEach(function (f) {
      const m = /^(\d+)\.webp$/.exec(f);
      if (m) hasImg[m[1]] = 1;
    });
  } catch (e) { /* 图片目录可能还没生成 */ }

  const items = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    let r;
    try { r = JSON.parse(line); } catch (e) { continue; }
    if (!r.name) continue;
    const t1 = Number(r.t1) || Number(typeMap[r.t] && typeMap[r.t].type_pid) || 0;
    if (!t1) continue;

    const sources = parseSources(r.from, r.url);
    if (!sources.length) continue;

    items.push({
      id: r.id,
      name: r.name,
      sub: r.sub || '',
      en: r.en || '',
      pic: hasImg[r.id] ? '/img/' + r.id + '.webp' : '',
      year: r.year || '',
      area: r.area || '',
      lang: r.lang || '',
      remark: r.remark || '',
      score: Number(r.score) || 0,
      hits: Number(r.hits) || 0,
      time: Number(r.time) || 0,
      actor: r.actor || '',
      director: r.director || '',
      total: Number(r.total) || 0,
      isend: Number(r.isend) || 0,
      dur: r.dur || '',
      blurb: r.blurb || '',
      content: r.content || '',
      tag: r.tag || '',
      t1: t1,
      t: Number(r.t) || 0,
      tname: (typeMap[r.t] && typeMap[r.t].type_name) || '',
      t1name: (typeMap[t1] && typeMap[t1].type_name) || '',
      sources: sources
    });
  }

  // 各种排序
  const byNew = items.slice().sort(function (a, b) { return b.time - a.time || b.id - a.id; });
  const byHot = items.slice().sort(function (a, b) { return b.hits - a.hits || b.id - a.id; });
  const byScore = items.slice().sort(function (a, b) {
    return (b.score - a.score) || (b.hits - a.hits);
  });

  const byCat = {};
  items.forEach(function (it) {
    (byCat[it.t1] = byCat[it.t1] || []).push(it);
  });
  Object.keys(byCat).forEach(function (k) {
    byCat[k].sort(function (a, b) { return b.time - a.time || b.id - a.id; });
  });

  return {
    items: items,
    byNew: byNew,
    byHot: byHot,
    byScore: byScore,
    byCat: byCat,
    typeMap: typeMap,
    subOfMain: subOfMain,
    total: items.length
  };
}

module.exports = { load: load };
