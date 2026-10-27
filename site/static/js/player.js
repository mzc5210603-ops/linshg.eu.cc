/* 半帧 HALFFRAME 播放器（hls.js，自绘控件） */
(function () {
  'use strict';

  var box = document.getElementById('srcData');
  if (!box) return;

  var DATA;
  try { DATA = JSON.parse(box.textContent); } catch (e) { return; }
  if (!DATA || !DATA.sources || !DATA.sources.length) return;

  var $ = function (s) { return document.querySelector(s); };
  var video = $('#video');
  var player = $('#player');
  var cover = $('#pCover');
  var loading = $('#pLoading');
  var btnPlay = $('#btnPlay');
  var pBig = $('#pBig');
  var pToggle = $('#pToggle');
  var prog = $('#pProg');
  var played = $('#pPlayed');
  var buff = $('#pBuff');
  var tCur = $('#pCur');
  var tDur = $('#pDur');
  var srcTabs = $('#srcTabs');
  var epsWrap = $('#eps');
  var epsCount = $('#epsCount');
  var rateBtn = $('#pRate');
  var muteBtn = $('#pMute');
  var fullBtn = $('#pFull');

  var hls = null;
  var netRetry = 0;
  var curSrc = 0;
  var curEp = 0;
  var rates = [1, 1.25, 1.5, 2, 0.75];
  var rateIdx = 0;
  var started = false;

  function fmt(s) {
    if (!isFinite(s) || s < 0) s = 0;
    s = Math.floor(s);
    var m = Math.floor(s / 60), ss = s % 60;
    var h = Math.floor(m / 60);
    m = m % 60;
    return (h > 0 ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(ss).padStart(2, '0');
  }

  function setLoading(on) {
    if (loading) loading.hidden = !on;
  }

  var loadingTimer = null;
  /* 短暂缓冲不闪转圈：waiting 后延迟 600ms 仍未恢复才显示 */
  function showLoadingSoon() {
    if (loadingTimer) return;
    loadingTimer = setTimeout(function () {
      loadingTimer = null;
      setLoading(true);
    }, 600);
  }
  function hideLoading() {
    if (loadingTimer) { clearTimeout(loadingTimer); loadingTimer = null; }
    setLoading(false);
  }

  function destroyHls() {
    if (hls) { try { hls.destroy(); } catch (e) { } hls = null; }
  }

  function playUrl(url) {
    setLoading(true);
    netRetry = 0;
    destroyHls();
    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true,
        lowLatencyMode: false,
        xhrSetup: function (xhr) { xhr.withCredentials = false; }
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        video.play().catch(function () { setLoading(false); });
      });
      hls.on(window.Hls.Events.ERROR, function (e, data) {
        if (!data || !data.fatal) return;
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          netRetry++;
          if (netRetry > 2) {
            // 网络持续失败（如源站 CORS 拒绝），切换下一个播放源
            nextSource();
          } else {
            hls.startLoad();
          }
        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          setLoading(false);
          destroyHls();
          nextSource();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(function () { setLoading(false); });
    } else {
      setLoading(false);
    }
  }

  function nextSource() {
    for (var i = 1; i <= DATA.sources.length; i++) {
      var n = (curSrc + i) % DATA.sources.length;
      var s = DATA.sources[n];
      if (s.hls && s.eps.length) {
        curSrc = n;
        curEp = 0;
        renderSrc();
        renderEps();
        start();
        return;
      }
    }
  }

  function start() {
    var s = DATA.sources[curSrc];
    if (!s || !s.eps.length) return;
    var ep = s.eps[curEp];
    started = true;
    if (cover) cover.style.display = 'none';
    player.classList.add('paused');
    playUrl(ep.u);
    renderEps();
    // 记录
    try {
      localStorage.setItem('hf_last', JSON.stringify({ id: DATA.id, src: curSrc, ep: curEp }));
    } catch (e) { }
  }

  function renderSrc() {
    if (!srcTabs) return;
    srcTabs.innerHTML = DATA.sources.map(function (s, i) {
      return '<button type="button" data-i="' + i + '" class="' + (i === curSrc ? 'on' : '') + '">'
        + s.name + (s.hls ? ' HLS' : ' 页面') + '</button>';
    }).join('');
    Array.prototype.forEach.call(srcTabs.children, function (b) {
      b.addEventListener('click', function () {
        curSrc = Number(b.dataset.i);
        curEp = 0;
        renderSrc();
        renderEps();
        start();
      });
    });
  }

  function renderEps() {
    var s = DATA.sources[curSrc];
    if (!epsWrap || !s) return;
    if (epsCount) epsCount.textContent = '共 ' + s.eps.length + ' 集';
    epsWrap.innerHTML = s.eps.map(function (ep, i) {
      return '<button type="button" class="ep ' + (i === curEp && started ? 'on' : '') + '" data-i="' + i + '" title="' + ep.n + '">'
        + ep.n + '</button>';
    }).join('');
    Array.prototype.forEach.call(epsWrap.children, function (b) {
      b.addEventListener('click', function () {
        curEp = Number(b.dataset.i);
        start();
        var on = epsWrap.querySelector('.ep.on');
        if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    });
  }

  /* ---------- 控件 ---------- */
  if (pBig) pBig.addEventListener('click', start);
  if (cover) cover.addEventListener('click', start);
  if (btnPlay) btnPlay.addEventListener('click', function () {
    start();
    var r = $('#playerWrap');
    if (r) r.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  if (pToggle) pToggle.addEventListener('click', function () {
    if (video.paused) video.play(); else video.pause();
  });

  video.addEventListener('play', function () {
    player.classList.remove('paused');
    pToggle.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5h3v14H8zM14 5h3v14h-3z"/></svg>';
  });
  video.addEventListener('pause', function () {
    player.classList.add('paused');
    pToggle.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';
  });
  video.addEventListener('waiting', showLoadingSoon);
  video.addEventListener('playing', hideLoading);
  video.addEventListener('canplay', hideLoading);
  video.addEventListener('loadedmetadata', function () {
    setLoading(false);
    if (tDur) tDur.textContent = fmt(video.duration);
  });
  video.addEventListener('timeupdate', function () {
    // 兜底：画面在正常前进（有缓冲数据）时强制隐藏 loading，
    // 避免 waiting 事件后未再触发 playing 导致转圈一直显示
    if (started && !video.paused && video.readyState >= 3) hideLoading();
    if (!video.duration) return;
    var p = video.currentTime / video.duration * 100;
    if (played) played.style.width = p + '%';
    if (tCur) tCur.textContent = fmt(video.currentTime);
  });
  video.addEventListener('progress', function () {
    if (!video.buffered.length || !video.duration) return;
    var end = video.buffered.end(video.buffered.length - 1);
    if (buff) buff.style.width = (end / video.duration * 100) + '%';
  });
  video.addEventListener('ended', function () {
    var s = DATA.sources[curSrc];
    if (s && curEp < s.eps.length - 1) {
      curEp++;
      start();
    }
  });
  video.addEventListener('error', function () { setLoading(false); });

  if (prog) prog.addEventListener('click', function (e) {
    var r = prog.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    if (video.duration) video.currentTime = p * video.duration;
  });

  if (rateBtn) rateBtn.addEventListener('click', function () {
    rateIdx = (rateIdx + 1) % rates.length;
    video.playbackRate = rates[rateIdx];
    rateBtn.textContent = rates[rateIdx].toFixed(rates[rateIdx] % 1 ? 2 : 1).replace(/0$/, '') + '×';
  });
  if (muteBtn) muteBtn.addEventListener('click', function () {
    video.muted = !video.muted;
    muteBtn.style.opacity = video.muted ? .45 : 1;
  });
  if (fullBtn) fullBtn.addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (player.requestFullscreen) player.requestFullscreen();
  });

  document.addEventListener('keydown', function (e) {
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); if (video.paused) video.play(); else video.pause(); }
    if (e.code === 'ArrowRight') video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
    if (e.code === 'ArrowLeft') video.currentTime = Math.max(0, video.currentTime - 10);
    if (e.key === 'f') { if (document.fullscreenElement) document.exitFullscreen(); else player.requestFullscreen(); }
  });

  /* 点击视频区域显隐控件 */
  player.addEventListener('click', function (e) {
    if (e.target.closest('.p-ctrl') || e.target.closest('.p-cover')) return;
    player.classList.toggle('show-ctrl');
  });

  /* 续播 */
  try {
    var last = JSON.parse(localStorage.getItem('hf_last') || 'null');
    if (last && last.id === DATA.id && last.src < DATA.sources.length) {
      curSrc = last.src;
      curEp = Math.min(last.ep, DATA.sources[curSrc].eps.length - 1);
    }
  } catch (e) { }

  renderSrc();
  renderEps();
})();
