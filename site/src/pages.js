'use strict';
const cfg = require('./config');
const L = require('./layout');
const esc = L.esc;

function metaLine(it) {
  return [it.year, it.area, it.tname, it.remark].filter(Boolean).join(' · ');
}

/* ---------------- 首页 ---------------- */
function home(D) {
  const hero = D.byHot[0];
  const top5 = D.byHot.slice(0, 5);

  const heroBg = hero && hero.pic
    ? '<div class="hero-bg" style="background-image:url(' + esc(hero.pic) + ')"></div>'
    : '<div class="hero-bg"></div>';

  const heroHtml = hero ? '<section class="hero">' + heroBg + '<div class="hero-veil"></div>'
    + '<div class="wrap hero-in">'
    + '<div class="hero-l">'
    + '<span class="hero-tag">今日主推</span>'
    + '<h1 class="hero-t">' + esc(hero.name) + '</h1>'
    + '<p class="hero-m">' + esc(metaLine(hero)) + (hero.score >= 1 ? ' <i class="dot"></i> <b>' + hero.score.toFixed(1) + '</b> 分' : '') + '</p>'
    + '<p class="hero-d">' + esc((hero.blurb || hero.content || '').slice(0, 120)) + '</p>'
    + '<div class="hero-btns"><a class="btn primary" href="/v/' + hero.id + '">' + L.icon('play') + ' 立即播放</a>'
    + '<a class="btn ghost" href="/c/' + hero.t1 + '/">同类型</a></div>'
    + '</div>'
    + '<ol class="hero-rank">' + top5.map(function (it, i) {
      return '<li><a href="/v/' + it.id + '.html"><i>' + String(i + 1).padStart(2, '0') + '</i>'
        + '<span class="hr-n">' + esc(it.name) + '</span>'
        + '<span class="hr-m">' + esc(it.year) + '</span></a></li>';
    }).join('') + '</ol>'
    + '</div></section>' : '';

  const newRow = L.row('新片速递', 'FRESH RELEASE', D.byNew.slice(0, cfg.homeRows), '/c/1/');
  const hotRow = L.row('热播榜单', 'TRENDING NOW', D.byHot.slice(0, cfg.homeRows), '/top');
  const scoreRow = L.row('高分精选', 'TOP RATED', D.byScore.slice(0, cfg.homeRows), '/top.html?tab=score');
  const seriesRow = D.byCat[2] ? L.row('剧集热播', 'SERIES', D.byCat[2].slice(0, cfg.homeRows), '/c/2/') : '';
  const movieRow = D.byCat[1] ? L.row('电影精选', 'MOVIES', D.byCat[1].slice(0, cfg.homeRows), '/c/1/') : '';
  const animeRow = D.byCat[4] ? L.row('动漫番剧', 'ANIME', D.byCat[4].slice(0, cfg.homeRows), '/c/4/') : '';
  const shortRow = D.byCat[6] ? L.row('短剧专区', 'SHORT PLAY', D.byCat[6].slice(0, cfg.homeRows), '/c/6/') : '';

  const body = heroHtml + newRow + hotRow + scoreRow + seriesRow + movieRow + animeRow + shortRow;
  return L.page({
    title: cfg.title,
    desc: cfg.desc,
    path: '/',
    page: 'home',
    body: body,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: cfg.brand + ' ' + cfg.brandEn,
      url: cfg.domain,
      potentialAction: {
        '@type': 'SearchAction',
        target: cfg.domain + '/search?q={q}',
        'query-input': 'required name=q'
      }
    }
  });
}

/* ---------------- 分类页 ---------------- */
function catPage(D, mainId, page, route) {
  const main = cfg.mainCats.find(function (m) { return m.id === Number(mainId); });
  const all = (D.byCat[mainId] || []).slice();
  const subs = D.subOfMain[mainId] || [];
  const per = cfg.perPage;
  const pages = Math.max(1, Math.ceil(all.length / per));
  const cur = Math.min(Math.max(1, page), pages);
  const slice = all.slice((cur - 1) * per, cur * per);

  const subChips = '<a class="chip on" href="/c/' + mainId + '/">全部</a>'
    + subs.map(function (s) {
      return '<a class="chip" href="/c/' + mainId + '/?s=' + s.id + '">' + esc(s.name) + '</a>';
    }).join('');

  const pager = [];
  if (pages > 1) {
    const mk = function (p, label, cls) {
      const href = p === 1 ? '/c/' + mainId + '/' : '/c/' + mainId + '/p' + p;
      return '<a class="pg ' + (cls || '') + '" href="' + href + '">' + label + '</a>';
    };
    if (cur > 1) pager.push(mk(cur - 1, '上一页'));
    const start = Math.max(1, cur - 2), end = Math.min(pages, cur + 2);
    if (start > 1) pager.push(mk(1, '1'));
    if (start > 2) pager.push('<span class="pg gap">…</span>');
    for (let p = start; p <= end; p++) pager.push(mk(p, String(p), p === cur ? 'on' : ''));
    if (end < pages - 1) pager.push('<span class="pg gap">…</span>');
    if (end < pages) pager.push(mk(pages, String(pages)));
    if (cur < pages) pager.push(mk(cur + 1, '下一页'));
  }

  const path = cur === 1 ? '/c/' + mainId + '/' : '/c/' + mainId + '/p' + cur;
  const body = '<div class="wrap main">'
    + '<div class="crumb"><a href="/">首页</a><span>/</span><b>' + esc(main ? main.name : '') + '</b></div>'
    + '<div class="cat-hd"><h1>' + esc(main ? main.name : '分类') + '<span class="cat-en">' + esc(main ? main.en : '') + '</span></h1>'
    + '<p class="cat-n">共 <b>' + all.length + '</b> 部</p></div>'
    + '<div class="chips">' + subChips + '</div>'
    + '<div class="grid">' + slice.map(function (it) { return L.card(it); }).join('') + '</div>'
    + '<div class="pager">' + pager.join('') + '</div>'
    + '</div>';

  return L.page({
    title: (main ? main.name : '分类') + ' - ' + cfg.brand + ' ' + cfg.brandEn,
    desc: (main ? main.name : '') + '在线观看，' + cfg.desc,
    path: path,
    page: 'cat',
    active: mainId,
    body: body
  });
}

/* ---------------- 详情页 ---------------- */
function detail(D, it) {
  const related = (D.byCat[it.t1] || []).filter(function (x) { return x.id !== it.id; }).slice(0, 12);
  const tags = (it.tag || '').split(/[,，]/).filter(Boolean).slice(0, 8);
  const plot = it.content || it.blurb || '';
  const firstEp = it.sources[0] && it.sources[0].eps[0];
  const pic = it.pic || '/img/placeholder.svg';

  const body = '<div class="wrap main">'
    + '<div class="crumb"><a href="/">首页</a><span>/</span><a href="/c/' + it.t1 + '/">' + esc(it.t1name) + '</a>'
    + (it.tname && it.tname !== it.t1name ? '<span>/</span><a href="/c/' + it.t1 + '/">' + esc(it.tname) + '</a>' : '')
    + '<span>/</span><b>' + esc(it.name) + '</b></div>'

    + '<article class="detail">'
    + '<div class="d-poster"><img src="' + esc(pic) + '" alt="' + esc(it.name) + ' 海报" width="320" height="480">'
    + (it.score >= 1 ? '<span class="d-score">' + it.score.toFixed(1) + '</span>' : '') + '</div>'
    + '<div class="d-info">'
    + '<h1 class="d-t">' + esc(it.name) + '</h1>'
    + (it.sub && it.sub !== it.name ? '<p class="d-sub">' + esc(it.sub) + '</p>' : '')
    + '<div class="d-meta">'
    + (it.year ? '<span>' + esc(it.year) + '</span>' : '')
    + (it.area ? '<span>' + esc(it.area) + '</span>' : '')
    + (it.tname ? '<span>' + esc(it.tname) + '</span>' : '')
    + (it.lang ? '<span>' + esc(it.lang) + '</span>' : '')
    + (it.remark ? '<span class="hl">' + esc(it.remark) + '</span>' : '')
    + '</div>'
    + '<dl class="d-dl">'
    + (it.director ? '<div><dt>导演</dt><dd>' + esc(it.director) + '</dd></div>' : '')
    + (it.actor ? '<div><dt>主演</dt><dd>' + esc(it.actor) + '</dd></div>' : '')
    + (it.total ? '<div><dt>集数</dt><dd>' + it.total + ' 集' + (it.isend ? '（已完结）' : '（更新中）') + '</dd></div>' : '')
    + (it.time ? '<div><dt>更新</dt><dd>' + new Date(it.time * 1000).toISOString().slice(0, 10) + '</dd></div>' : '')
    + '</dl>'
    + (tags.length ? '<div class="d-tags">' + tags.map(function (t) { return '<a href="/search.html?q=' + encodeURIComponent(t) + '">' + esc(t) + '</a>'; }).join('') + '</div>' : '')
    + '<div class="d-btns"><button class="btn primary" id="btnPlay">' + L.icon('play') + ' 立即播放</button>'
    + '<button class="btn ghost" id="btnBookmark">加入片单</button></div>'
    + '</div></article>'

    + '<section class="player-wrap" id="playerWrap">'
    + '<div class="player" id="player">'
    + '<video id="video" playsinline webkit-playsinline preload="none" poster="' + esc(pic) + '"></video>'
    + '<div class="p-cover" id="pCover"><button class="p-big" id="pBig" aria-label="播放">' + L.icon('play') + '</button></div>'
    + '<div class="p-ctrl" id="pCtrl">'
    + '<div class="p-bar"><div class="p-prog" id="pProg"><i id="pBuff"></i><b id="pPlayed"><s></s></b></div></div>'
    + '<div class="p-row">'
    + '<button class="p-btn" id="pToggle" aria-label="播放/暂停">' + L.icon('play') + '</button>'
    + '<span class="p-time"><b id="pCur">00:00</b> / <span id="pDur">00:00</span></span>'
    + '<div class="p-sp"></div>'
    + '<button class="p-btn p-rate" id="pRate">1.0×</button>'
    + '<button class="p-btn" id="pMute" aria-label="静音">' + '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>' + '</button>'
    + '<button class="p-btn" id="pFull" aria-label="全屏">' + '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5"/></svg>' + '</button>'
    + '</div></div></div>'
    + '<div class="p-loading" id="pLoading" hidden><i></i></div>'
    + '</section>'

    + '<section class="eps-sec"><div class="eps-hd"><h2>选集</h2><span id="epsCount"></span></div>'
    + '<div class="src-tabs" id="srcTabs"></div>'
    + '<div class="eps" id="eps"></div></section>'

    + (plot ? '<section class="plot"><h2>剧情简介</h2><div class="plot-body" id="plotBody">' + esc(plot) + '</div>'
      + (plot.length > 220 ? '<button class="plot-more" id="plotMore">展开全部</button>' : '') + '</section>' : '')

    + (related.length ? '<section class="rel"><div class="sec-hd"><div class="sec-t"><h2>相关推荐</h2><span class="sec-en">MORE LIKE THIS</span></div></div>'
      + '<div class="cards" data-scroller>' + related.map(function (x) { return L.card(x); }).join('') + '</div></section>' : '')
    + '</div>';

  const data = { id: it.id, name: it.name, sources: it.sources.map(function (s) {
    return { key: s.key, name: s.name, hls: s.hls, eps: s.eps };
  }) };

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: it.name,
    url: cfg.domain + '/v/' + it.id,
    image: it.pic ? cfg.domain + it.pic : undefined,
    description: (plot || '').slice(0, 200),
    datePublished: it.year || undefined,
    genre: it.tname || undefined,
    countryOfOrigin: it.area || undefined,
    actor: it.actor ? it.actor.split(/[,，]/).filter(Boolean).slice(0, 8).map(function (a) {
      return { '@type': 'Person', name: a.trim() };
    }) : undefined,
    director: it.director ? { '@type': 'Person', name: it.director.split(/[,，]/)[0].trim() } : undefined,
    aggregateRating: it.score >= 1 ? { '@type': 'AggregateRating', ratingValue: it.score, bestRating: 10, ratingCount: Math.max(1, it.hits) } : undefined
  };

  return L.page({
    title: it.name + (it.year ? '（' + it.year + '）' : '') + ' 在线观看 - ' + cfg.brand,
    desc: ('《' + it.name + '》' + (it.year ? it.year + '年' : '') + (it.area || '') + (it.tname || '') + '，'
      + (it.actor ? '主演：' + it.actor.slice(0, 40) + '。' : '') + (plot || '').slice(0, 90)).replace(/\s+/g, ' ').slice(0, 155),
    path: '/v/' + it.id,
    page: 'detail',
    ogType: 'video.movie',
    ogImage: it.pic ? cfg.domain + it.pic : '',
    body: body,
    jsonld: jsonld,
    scripts: '<script type="application/json" id="srcData">' + JSON.stringify(data).replace(/</g, '\\u003c') + '</script>'
      + '<script src="/js/hls.min.js" defer></script>'
      + '<script src="/js/player.js" defer></script>'
      + '<script src="/js/app.js" defer></script>'
  });
}

/* ---------------- 榜单 ---------------- */
function topPage(D) {
  const hot = D.byHot.slice(0, 100);
  const body = '<div class="wrap main">'
    + '<div class="crumb"><a href="/">首页</a><span>/</span><b>榜单</b></div>'
    + '<div class="cat-hd"><h1>热播榜<span class="cat-en">TOP 100</span></h1>'
    + '<p class="cat-n">按累计播放热度排序</p></div>'
    + '<ol class="rank-list">' + hot.map(function (it, i) {
      return '<li class="rank-item"><span class="rk' + (i < 3 ? ' top' : '') + '">' + String(i + 1).padStart(2, '0') + '</span>'
        + '<a class="rk-poster" href="/v/' + it.id + '.html"><img src="' + esc(it.pic || '/img/placeholder.svg') + '" alt="' + esc(it.name) + '" loading="lazy" width="80" height="120"></a>'
        + '<div class="rk-info"><h3><a href="/v/' + it.id + '.html">' + esc(it.name) + '</a></h3>'
        + '<p>' + esc(metaLine(it)) + '</p></div>'
        + '<span class="rk-hits">' + (it.hits > 9999 ? (it.hits / 10000).toFixed(1) + '万' : it.hits) + ' 次</span>'
        + '</li>';
    }).join('') + '</ol></div>';
  return L.page({
    title: '热播榜单 - ' + cfg.brand + ' ' + cfg.brandEn,
    desc: '热门影视 TOP 100 排行榜，' + cfg.desc,
    path: '/top',
    page: 'top',
    body: body
  });
}

/* ---------------- 搜索页 / 404 ---------------- */
function searchPage() {
  const body = '<div class="wrap main">'
    + '<div class="cat-hd"><h1>搜索<span class="cat-en">SEARCH</span></h1></div>'
    + '<div class="sbox"><input id="sInput" type="search" placeholder="输入片名、演员或类型" autocomplete="off">'
    + '<button id="sGo">搜索</button></div>'
    + '<div id="sRes" class="grid"></div></div>';
  return L.page({
    title: '搜索 - ' + cfg.brand,
    desc: '搜索影视资源，' + cfg.desc,
    path: '/search',
    page: 'search',
    body: body,
    noindex: true
  });
}

function notFound() {
  const body = '<div class="wrap main nf"><h1>404</h1><p>这一帧不存在</p><a class="btn primary" href="/">回到首页</a></div>';
  return L.page({
    title: '页面不存在 - ' + cfg.brand,
    desc: '页面不存在',
    path: '/404.html',
    page: '404',
    body: body,
    noindex: true
  });
}

module.exports = { home, catPage, detail, topPage, searchPage, notFound };
