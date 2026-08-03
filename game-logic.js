// game-logic.js
// Pure, framework-free helper functions for Keyboard Hero gamification.
// Loaded via <script src="game-logic.js"> in both index.html and admin.html.
// Also runnable under Node for unit tests (see game-logic.test.js).

(function (root) {
  'use strict';

  var LEVEL_TITLES = [
    'Nováček', 'Začátečník', 'Talent', 'Šikovný hráč',
    'Mistr kláves', 'Virtuoz', 'Legenda'
  ];

  var STARS_PER_LEVEL = 10;

  function computeLevel(stars) {
    var safeStars = Math.max(0, stars || 0);
    var level = 1 + Math.floor(safeStars / STARS_PER_LEVEL);
    var titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1);
    var title = LEVEL_TITLES[titleIndex];
    if (level > LEVEL_TITLES.length) {
      title = LEVEL_TITLES[LEVEL_TITLES.length - 1] + ' +' + (level - LEVEL_TITLES.length);
    }
    var starsInLevel = safeStars % STARS_PER_LEVEL;
    return {
      level: level,
      title: title,
      starsInLevel: starsInLevel,
      starsToNext: STARS_PER_LEVEL - starsInLevel,
      progress: starsInLevel / STARS_PER_LEVEL
    };
  }

  var BADGES = [
    { id: 'novacek', icon: '🌱', label: 'Nováček', check: function (ctx) { return ctx.totalRecordings >= 1; } },
    { id: 'pravidelnost', icon: '🎯', label: 'Pravidelnost', check: function (ctx) { return ctx.streak >= 3; } },
    { id: 'tyden-v-ohni', icon: '🔥', label: 'Týden v ohni', check: function (ctx) { return ctx.streak >= 7; } },
    { id: 'mesic-discipliny', icon: '🔥🔥', label: 'Měsíc disciplíny', check: function (ctx) { return ctx.streak >= 30; } },
    { id: 'deset-melodii', icon: '🎵', label: 'Deset melodií', check: function (ctx) { return ctx.totalRecordings >= 10; } },
    { id: 'padesat-melodii', icon: '🎼', label: 'Padesát melodií', check: function (ctx) { return ctx.totalRecordings >= 50; } },
    { id: 'maly-virtuoz', icon: '⭐', label: 'Malý virtuoz', check: function (ctx) { return ctx.stars >= 10; } },
    { id: 'virtuoz', icon: '⭐⭐', label: 'Virtuoz', check: function (ctx) { return ctx.stars >= 50; } },
    { id: 'perfektni-tyden', icon: '📅', label: 'Perfektní týden', check: function (ctx) { return !!ctx.perfectWeek; } }
  ];

  function computeBadges(ctx) {
    var safeCtx = {
      stars: (ctx && ctx.stars) || 0,
      streak: (ctx && ctx.streak) || 0,
      totalRecordings: (ctx && ctx.totalRecordings) || 0,
      perfectWeek: !!(ctx && ctx.perfectWeek)
    };
    return BADGES.map(function (badge) {
      return {
        id: badge.id,
        icon: badge.icon,
        label: badge.label,
        unlocked: badge.check(safeCtx)
      };
    });
  }

  var KHGame = {
    LEVEL_TITLES: LEVEL_TITLES,
    STARS_PER_LEVEL: STARS_PER_LEVEL,
    computeLevel: computeLevel,
    BADGES: BADGES,
    computeBadges: computeBadges
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = KHGame;
  } else {
    root.KHGame = KHGame;
  }
})(typeof window !== 'undefined' ? window : globalThis);
