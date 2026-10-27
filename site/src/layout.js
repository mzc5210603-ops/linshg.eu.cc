'use strict';
const cfg = require('./config');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ICON = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  fire: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 3 1.5 4 1.5 4S12 9 12 3z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.9 6.1 21l1.2-6.5L2.5 9.9 9.1 9z"/></svg>'
};

function icon(name, cls) {
  return '<span class="ic ' + (cls || '') + '">' + (ICON[name] || '') + '</span>';
}

function head(o) {
  const canonical = cfg.domain + (o.path || '/');
  const ld = o.jsonld ? '<script type="application/ld+json">' + JSON.stringify(o.jsonld) + '</script>' : '';
  const og = o.ogImage ? '<meta property="og:image" content="' + esc(o.ogImage) + '">' : '';
  return '<!doctype html><html lang="zh-CN"><head>'
    + '<meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
    + '<title>' + esc(o.title) + '</title>'
    + '<meta name="description" content="' + esc(o.desc) + '">'
    + '<link rel="canonical" href="' + esc(canonical) + '">'
    + '<meta name="theme-color" content="#08070d">'
    + '<meta property="og:type" content="' + (o.ogType || 'website') + '">'
    + '<meta property="og:site_name" content="' + esc(cfg.brand + ' ' + cfg.brandEn) + '">'
    + '<meta property="og:title" content="' + esc(o.title) + '">'
    + '<meta property="og:description" content="' + esc(o.desc) + '">'
    + '<meta property="og:url" content="' + esc(canonical) + '">'
    + og
    + (o.noindex ? '<meta name="robots" content="noindex,follow">' : '')
    + '<link rel="icon" href="/favicon.svg" type="image/svg+xml">'
    + '<link rel="stylesheet" href="/css/style.css?v=' + global.BUILD_VER + '">'
    + ld
    + '</head><body data-page="' + esc(o.page || '') + '">';
}

function header(active) {
  const cats = cfg.mainCats.map(function (m) {
    const on = String(active) === String(m.id) ? ' class="on"' : '';
    return '<a href="/c/' + m.id + '/"' + on + '>' + m.name + '</a>';
  }).join('');
  return '<header class="hd" id="hd"><div class="wrap hd-in">'
    + '<a class="brand" href="/" aria-label="' + esc(cfg.brand) + '">'
    + '<span class="brand-mark"><i></i><i></i></span>'
    + '<span class="brand-t">' + esc(cfg.brand) + '</span>'
    + '<span class="brand-en">' + esc(cfg.brandEn) + '</span>'
    + '</a>'
    + '<nav class="nav" id="nav">' + cats + '<a href="/top">榜单</a></nav>'
    + '<div class="hd-act">'
    + '<button class="ibtn" id="btnSearch" aria-label="搜索">' + icon('search') + '</button>'
    + '<button class="ibtn only-m" id="btnMenu" aria-label="菜单">' + icon('menu') + '</button>'
    + '</div></div></header>';
}

function footer(data) {
  const cols = cfg.mainCats.map(function (m) {
    return '<a href="/c/' + m.id + '/">' + m.name + '</a>';
  }).join('');
  return '<footer class="ft"><div class="wrap ft-in">'
    + '<div class="ft-brand"><span class="brand-mark"><i></i><i></i></span>'
    + '<b>' + esc(cfg.brand) + '</b><em>' + esc(cfg.brandEn) + '</em></div>'
    + '<div class="ft-links">' + cols + '<a href="/top">榜单</a></div>'
    + '<a class="ft-top" href="#">回到顶部</a>'
    + '</div></footer>'
    + '<nav class="tabbar">'
    + '<a href="/">' + icon('home') + '<span>首页</span></a>'
    + '<a href="/c/1/">' + icon('grid') + '<span>分类</span></a>'
    + '<a href="/top.html">' + icon('fire') + '<span>榜单</span></a>'
    + '<a href="#" id="tabSearch">' + icon('search') + '<span>搜索</span></a>'
    + '</nav>';
}

function card(it, opt) {
  opt = opt || {};
  const pic = it.pic
    ? '<img src="' + esc(it.pic) + '" alt="' + esc(it.name) + '" loading="lazy" decoding="async" width="320" height="480">'
    : '<span class="noimg">' + esc(it.name.slice(0, 4)) + '</span>';
  const badge = it.remark
    ? '<span class="badge">' + esc(it.remark) + '</span>'
    : (it.total > 1 ? '<span class="badge">全' + it.total + '集</span>' : '');
  const score = it.score >= 1 ? '<span class="score">' + it.score.toFixed(1) + '</span>' : '';
  const meta = [it.year, it.area].filter(Boolean).join(' · ');
  return '<a class="card' + (opt.lg ? ' lg' : '') + '" href="/v/' + it.id + '" title="' + esc(it.name) + '">'
    + '<div class="poster">' + pic + badge + score + '<span class="ply">' + icon('play') + '</span></div>'
    + '<h3 class="ct">' + esc(it.name) + '</h3>'
    + '<p class="cm">' + esc(meta || it.tname) + '</p>'
    + '</a>';
}

function row(title, en, items, moreHref) {
  const cards = items.map(function (it) { return card(it); }).join('');
  const more = moreHref ? '<a class="more" href="' + moreHref + '">全部<span>→</span></a>' : '';
  return '<section class="sec"><div class="wrap">'
    + '<div class="sec-hd"><div class="sec-t"><h2>' + esc(title) + '</h2><span class="sec-en">' + esc(en) + '</span></div>' + more + '</div>'
    + '<div class="cards" data-scroller>' + cards + '</div>'
    + '</div></section>';
}

function searchModal() {
  return '<div class="sm" id="sm" hidden>'
    + '<div class="sm-in">'
    + '<div class="sm-bar">' + icon('search')
    + '<input id="smInput" type="search" placeholder="搜索片名、演员、类型" autocomplete="off" enterkeyhint="search">'
    + '<button class="ibtn" id="smClose" aria-label="关闭">' + icon('close') + '</button></div>'
    + '<div class="sm-hot" id="smHot"></div>'
    + '<div class="sm-res" id="smRes"></div>'
    + '</div></div>';
}

function scripts() {
  var v = '?v=' + global.BUILD_VER;
  return '<script src="/js/app.js' + v + '" defer></script>';
}

function page(o) {
  return head(o) + header(o.active) + o.body + footer() + searchModal() + (o.scripts || scripts()) + '</body></html>';
}

module.exports = { esc, icon, card, row, page, head };
