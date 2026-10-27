'use strict';
/**
 * 半帧 HALFFRAME 静态站构建
 * node site/build.js
 */
const fs = require('fs');
const path = require('path');
const cfg = require('./src/config');
const dataLib = require('./src/data');
const pages = require('./src/pages');

const SITE = __dirname;
const OUT = path.join(SITE, '..', 'public');
const STATIC = path.join(SITE, 'static');

const t0 = Date.now();
let fileCount = 0;
let htmlCount = 0;

function ensure(dir) { fs.mkdirSync(dir, { recursive: true }); }
function writeFile(rel, content) {
  const p = path.join(OUT, rel);
  ensure(path.dirname(p));
  fs.writeFileSync(p, content);
  fileCount++;
  if (rel.endsWith('.html')) htmlCount++;
}

function copyDir(src, dst) {
  ensure(dst);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else {
      const buf = fs.readFileSync(s);
      fs.writeFileSync(d, buf);
      fileCount++;
    }
  }
}

/* ---------- 清空输出 ---------- */
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
ensure(OUT);

/* ---------- 数据 ---------- */
const D = dataLib.load();
console.log('载入影片 %d 条', D.total);

/* ---------- 首页 ---------- */
writeFile('index.html', pages.home(D));

/* ---------- 分类页 ---------- */
let catPages = 0;
cfg.mainCats.forEach(function (m) {
  const list = D.byCat[m.id] || [];
  const pagesN = Math.max(1, Math.ceil(list.length / cfg.perPage));
  for (let p = 1; p <= pagesN; p++) {
    const rel = p === 1 ? 'c/' + m.id + '/index.html' : 'c/' + m.id + '/p' + p + '.html';
    writeFile(rel, pages.catPage(D, m.id, p));
    catPages++;
  }
});

/* ---------- 详情页 ---------- */
let detailPages = 0;
for (const it of D.items) {
  writeFile('v/' + it.id + '.html', pages.detail(D, it));
  detailPages++;
}

/* ---------- 榜单 / 搜索 / 404 ---------- */
writeFile('top.html', pages.topPage(D));
writeFile('search.html', pages.searchPage());
writeFile('404.html', pages.notFound());

/* ---------- 搜索索引 ---------- */
const idx = D.items.map(function (it) {
  return [it.id, it.name, it.year, it.area, it.t1, it.t1name, it.score, it.pic];
});
writeFile('data/search.json', JSON.stringify(idx));

/* ---------- sitemap ---------- */
function url(u, pri, freq) {
  return '<url><loc>' + cfg.domain + u + '</loc><changefreq>' + freq + '</changefreq><priority>' + pri + '</priority></url>';
}
let sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
sm += url('/', '1.0', 'daily');
sm += url('/top.html', '0.8', 'daily');
cfg.mainCats.forEach(function (m) { sm += url('/c/' + m.id + '/', '0.9', 'daily'); });
D.byNew.forEach(function (it) {
  sm += '<url><loc>' + cfg.domain + '/v/' + it.id + '.html</loc>'
    + '<lastmod>' + new Date(it.time * 1000).toISOString().slice(0, 10) + '</lastmod>'
    + '<changefreq>weekly</changefreq><priority>0.7</priority></url>';
});
sm += '</urlset>';
writeFile('sitemap.xml', sm);

writeFile('robots.txt', 'User-agent: *\nAllow: /\nDisallow: /search.html\n\nSitemap: ' + cfg.domain + '/sitemap.xml\n');

/* ---------- Pages 配置 ---------- */
writeFile('_headers', [
  '/img/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '/css/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '/js/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '/data/*',
  '  Cache-Control: public, max-age=3600',
  '/*.html',
  '  Cache-Control: public, max-age=0, must-revalidate',
  '  X-Content-Type-Options: nosniff',
  ''
].join('\n'));

// /v/123 这类无扩展访问改写到静态文件
writeFile('_redirects', [
  '/v/:id /v/:id.html 200',
  '/c/:cat/p:page /c/:cat/p:page.html 200',
  ''
].join('\n'));

/* ---------- 图标 ---------- */
writeFile('favicon.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
  + '<rect width="64" height="64" rx="14" fill="#08070d"/>'
  + '<rect x="16" y="14" width="7" height="36" rx="3.5" fill="#8b7cf6"/>'
  + '<rect x="30" y="14" width="7" height="22" rx="3.5" fill="#8b7cf6" opacity=".55"/>'
  + '<circle cx="45" cy="41" r="5" fill="#ff5c7a"/></svg>');
writeFile('img/placeholder.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 480">'
  + '<rect width="320" height="480" fill="#12101c"/>'
  + '<text x="160" y="250" font-size="20" fill="#4b4660" text-anchor="middle" font-family="sans-serif">HALFFRAME</text></svg>');

/* ---------- 静态资源 ---------- */
copyDir(path.join(STATIC, 'css'), path.join(OUT, 'css'));
copyDir(path.join(STATIC, 'js'), path.join(OUT, 'js'));
if (fs.existsSync(path.join(STATIC, 'img'))) {
  copyDir(path.join(STATIC, 'img'), path.join(OUT, 'img'));
}

const sizeMB = (function () {
  let total = 0;
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else total += fs.statSync(p).size;
    }
  })(OUT);
  return total / 1048576;
})();

console.log('分类页 %d，详情页 %d，HTML 共 %d，文件共 %d，产物 %s MB，耗时 %ss',
  catPages, detailPages, htmlCount, fileCount, sizeMB.toFixed(1), ((Date.now() - t0) / 1000).toFixed(1));
