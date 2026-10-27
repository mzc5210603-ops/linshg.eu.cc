/* 半帧 HALFFRAME 前端交互（无依赖） */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 顶栏滚动 ---------- */
  var hd = $('#hd');
  function onScroll() {
    if (!hd) return;
    hd.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端菜单 ---------- */
  var nav = $('#nav'), btnMenu = $('#btnMenu');
  if (btnMenu && nav) {
    btnMenu.addEventListener('click', function (e) {
      e.stopPropagation();
      nav.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && e.target !== btnMenu) nav.classList.remove('open');
    });
  }

  /* ---------- 横向滚轮 ---------- */
  $$('[data-scroller]').forEach(function (sc) {
    sc.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        sc.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
  });

  /* ---------- 简介展开 ---------- */
  var plotMore = $('#plotMore'), plotBody = $('#plotBody');
  if (plotMore && plotBody) {
    plotMore.addEventListener('click', function () {
      plotBody.classList.toggle('open');
      plotMore.textContent = plotBody.classList.contains('open') ? '收起' : '展开全部';
    });
  }

  /* ---------- 搜索索引 ---------- */
  var idxPromise = null;
  function getIndex() {
    if (!idxPromise) {
      idxPromise = fetch('/data/search.json').then(function (r) { return r.json(); })
        .catch(function () { return []; });
    }
    return idxPromise;
  }

  function search(list, q, limit) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    var keys = q.split(/\s+/).filter(Boolean);
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      var hay = (it[1] + ' ' + it[3] + ' ' + it[5] + ' ' + it[2]).toLowerCase();
      var ok = true;
      for (var k = 0; k < keys.length; k++) {
        if (hay.indexOf(keys[k]) < 0) { ok = false; break; }
      }
      if (!ok) continue;
      var name = String(it[1]).toLowerCase();
      var score = name === q ? 100 : (name.indexOf(q) === 0 ? 60 : (name.indexOf(q) > -1 ? 40 : 10));
      score += Math.min(Number(it[6]) || 0, 10);
      out.push({ it: it, s: score });
      if (out.length > 900) break;
    }
    out.sort(function (a, b) { return b.s - a.s; });
    return out.slice(0, limit || 24).map(function (x) { return x.it; });
  }

  /* ---------- 搜索弹层 ---------- */
  var sm = $('#sm'), smInput = $('#smInput'), smRes = $('#smRes'), smHot = $('#smHot');
  var HOT = ['电影', '剧集', '动漫', '短剧', '2024', '国产', '高分', '纪录'];

  function openSM() {
    if (!sm) return;
    sm.hidden = false;
    document.body.style.overflow = 'hidden';
    if (smHot && !smHot.dataset.filled) {
      smHot.innerHTML = HOT.map(function (t) { return '<button type="button">' + t + '</button>'; }).join('');
      smHot.dataset.filled = '1';
      $$('button', smHot).forEach(function (b) {
        b.addEventListener('click', function () {
          smInput.value = b.textContent;
          smInput.dispatchEvent(new Event('input'));
        });
      });
    }
    setTimeout(function () { smInput.focus(); }, 40);
  }
  function closeSM() {
    if (!sm) return;
    sm.hidden = true;
    document.body.style.overflow = '';
  }

  var lastResults = [];
  var timer = null;
  if (smInput) {
    smInput.addEventListener('input', function () {
      var q = smInput.value.trim();
      clearTimeout(timer);
      if (!q) {
        smRes.innerHTML = '';
        if (smHot) smHot.hidden = false;
        return;
      }
      if (smHot) smHot.hidden = true;
      timer = setTimeout(function () {
        getIndex().then(function (list) {
          lastResults = search(list, q, 30);
          if (!lastResults.length) {
            smRes.innerHTML = '<div class="sm-empty">没有找到「' + q.replace(/[<>&]/g, '') + '」</div>';
            return;
          }
          smRes.innerHTML = lastResults.map(function (it) {
            var pic = it[7] ? '<img src="' + it[7] + '" alt="" loading="lazy">' : '';
            return '<a class="sm-item" href="/v/' + it[0] + '">' + pic
              + '<span class="si-n">' + esc(it[1]) + '</span>'
              + '<span class="si-m">' + (it[2] || '') + ' · ' + esc(it[5]) + '</span></a>';
          }).join('');
        });
      }, 110);
    });
    smInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (lastResults.length) location.href = '/v/' + lastResults[0][0];
      } else if (e.key === 'Escape') closeSM();
    });
  }
  if (sm) {
    sm.addEventListener('click', function (e) { if (e.target === sm) closeSM(); });
    var smClose = $('#smClose'); if (smClose) smClose.addEventListener('click', closeSM);
  }
  var btnSearch = $('#btnSearch'); if (btnSearch) btnSearch.addEventListener('click', openSM);
  var tabSearch = $('#tabSearch');
  if (tabSearch) tabSearch.addEventListener('click', function (e) { e.preventDefault(); openSM(); });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSM(); }
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); openSM(); }
  });

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- 搜索页 ---------- */
  var sInput = $('#sInput'), sRes = $('#sRes');
  if (sInput) {
    var q0 = new URLSearchParams(location.search).get('q') || '';
    sInput.value = q0;
    var run = function () {
      var q = sInput.value.trim();
      if (!q) { sRes.innerHTML = ''; return; }
      getIndex().then(function (list) {
        var r = search(list, q, 120);
        sRes.innerHTML = r.length ? r.map(function (it) {
          return cardHtml(it);
        }).join('') : '<div class="sm-empty">没有找到相关影片</div>';
      });
    };
    sInput.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(run, 160);
    });
    sInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
    var sGo = $('#sGo'); if (sGo) sGo.addEventListener('click', run);
    if (q0) run();
  }

  function cardHtml(it) {
    var pic = it[7]
      ? '<img src="' + it[7] + '" alt="' + esc(it[1]) + '" loading="lazy" width="320" height="480">'
      : '<span class="noimg">' + esc(String(it[1]).slice(0, 4)) + '</span>';
    return '<a class="card" href="/v/' + it[0] + '">'
      + '<div class="poster">' + pic + '</div>'
      + '<h3 class="ct">' + esc(it[1]) + '</h3>'
      + '<p class="cm">' + esc([it[2], it[3]].filter(Boolean).join(' · ')) + '</p></a>';
  }

  /* ---------- 片单 ---------- */
  var KEY = 'hf_bookmarks';
  function bookmarks() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }
  var btnBookmark = $('#btnBookmark');
  if (btnBookmark) {
    var page = document.body.dataset.page;
    var id = Number((location.pathname.match(/\/v\/(\d+)/) || [])[1] || 0);
    var refresh = function () {
      var has = bookmarks().indexOf(id) > -1;
      btnBookmark.textContent = has ? '已加入片单' : '加入片单';
      btnBookmark.classList.toggle('ghost', !has);
    };
    refresh();
    btnBookmark.addEventListener('click', function () {
      var list = bookmarks();
      var i = list.indexOf(id);
      if (i > -1) list.splice(i, 1); else list.unshift(id);
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
      refresh();
    });
  }
})();
