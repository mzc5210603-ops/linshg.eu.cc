'use strict';

module.exports = {
  brand: '在线影视观看',
  brandEn: '',
  // 部署到自定义域名后改这里（影响 canonical / sitemap）
  domain: 'https://halframe.pages.dev',
  title: '在线影视观看 · 免费高清电影剧集',
  desc: '在线影视观看，免费收录电影、剧集、综艺、动漫、纪录片与短剧，高清在线播放，每日更新。',
  perPage: 60,
  // 首页各区块展示数量
  homeRows: 18,
  // 主分类顺序与展示名
  mainCats: [
    { id: 1, name: '电影', en: 'MOVIE' },
    { id: 2, name: '剧集', en: 'SERIES' },
    { id: 3, name: '综艺', en: 'VARIETY' },
    { id: 4, name: '动漫', en: 'ANIME' },
    { id: 5, name: '纪录', en: 'DOCS' },
    { id: 6, name: '短剧', en: 'SHORT' },
    { id: 7, name: '体育', en: 'SPORT' }
  ],
  sourceLabel: {
    bfzym3u8: '暴风',
    jinyingm3u8: '金鹰',
    jinyingyun: '金鹰'
  }
};
