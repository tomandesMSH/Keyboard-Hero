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
    { id: 'novacek', icon: '🌱', label: 'Nováček', check: function (ctx) { return ctx.totalRecordings >= 1; }, progress: function (ctx) { return { current: ctx.totalRecordings, target: 1 }; } },
    { id: 'pravidelnost', icon: '🎯', label: 'Pravidelnost', check: function (ctx) { return ctx.streak >= 3; }, progress: function (ctx) { return { current: ctx.streak, target: 3 }; } },
    { id: 'tyden-v-ohni', icon: '🔥', label: 'Týden v ohni', check: function (ctx) { return ctx.streak >= 7; }, progress: function (ctx) { return { current: ctx.streak, target: 7 }; } },
    { id: 'mesic-discipliny', icon: '🔥🔥', label: 'Měsíc disciplíny', check: function (ctx) { return ctx.streak >= 30; }, progress: function (ctx) { return { current: ctx.streak, target: 30 }; } },
    { id: 'stoleti-legenda', icon: '🔥🔥🔥', label: 'Stoletá legenda', check: function (ctx) { return ctx.streak >= 100; }, progress: function (ctx) { return { current: ctx.streak, target: 100 }; } },
    { id: 'deset-melodii', icon: '🎵', label: 'Deset melodií', check: function (ctx) { return ctx.totalRecordings >= 10; }, progress: function (ctx) { return { current: ctx.totalRecordings, target: 10 }; } },
    { id: 'padesat-melodii', icon: '🎼', label: 'Padesát melodií', check: function (ctx) { return ctx.totalRecordings >= 50; }, progress: function (ctx) { return { current: ctx.totalRecordings, target: 50 }; } },
    { id: 'maly-virtuoz', icon: '⭐', label: 'Malý virtuoz', check: function (ctx) { return ctx.stars >= 10; }, progress: function (ctx) { return { current: ctx.stars, target: 10 }; } },
    { id: 'virtuoz', icon: '⭐⭐', label: 'Virtuoz', check: function (ctx) { return ctx.stars >= 50; }, progress: function (ctx) { return { current: ctx.stars, target: 50 }; } },
    { id: 'perfektni-tyden', icon: '📅', label: 'Perfektní týden', check: function (ctx) { return !!ctx.perfectWeek; }, progress: function (ctx) { return { current: ctx.daysPlayedThisWeek, target: 7 }; } },
    { id: 'tydenni-cil', icon: '🏁', label: 'Týdenní cíl', check: function (ctx) { return ctx.weeklyCount >= 3; }, progress: function (ctx) { return { current: ctx.weeklyCount, target: 3 }; } }
  ];

  function computeBadges(ctx) {
    var safeCtx = {
      stars: Math.max(0, (ctx && ctx.stars) || 0),
      streak: Math.max(0, (ctx && ctx.streak) || 0),
      totalRecordings: Math.max(0, (ctx && ctx.totalRecordings) || 0),
      perfectWeek: !!(ctx && ctx.perfectWeek),
      daysPlayedThisWeek: Math.max(0, (ctx && ctx.daysPlayedThisWeek) || 0),
      weeklyCount: Math.max(0, (ctx && ctx.weeklyCount) || 0)
    };
    return BADGES.map(function (badge) {
      var unlocked = badge.check(safeCtx);
      var result = {
        id: badge.id,
        icon: badge.icon,
        label: badge.label,
        unlocked: unlocked
      };
      if (!unlocked) {
        var p = badge.progress(safeCtx);
        var current = Math.min(p.current, p.target);
        result.progressLabel = current + '/' + p.target;
      }
      return result;
    });
  }

  // entries: [{ name: string, weeklyCount: number }]. Students with weeklyCount 0 are excluded
  // (a league only makes sense among people who actually practiced this week).
  function computeWeeklyLeague(entries) {
    var active = (entries || []).filter(function (e) { return e && e.weeklyCount > 0; });
    active.sort(function (a, b) { return b.weeklyCount - a.weeklyCount; });
    var n = active.length;
    return active.map(function (e, idx) {
      var tier;
      if (n <= 2) {
        tier = idx === 0 ? 'gold' : 'silver';
      } else {
        var third = Math.ceil(n / 3);
        if (idx < third) tier = 'gold';
        else if (idx < third * 2) tier = 'silver';
        else tier = 'bronze';
      }
      return { name: e.name, weeklyCount: e.weeklyCount, tier: tier, rank: idx + 1 };
    });
  }

  var MASCOT_SKINS = [
    { id: 'noticka', icon: '🎵', label: 'Nota', unlockLevel: 1 },
    { id: 'kytara', icon: '🎸', label: 'Kytara', unlockLevel: 2 },
    { id: 'bubny', icon: '🥁', label: 'Bubny', unlockLevel: 3 },
    { id: 'klavir', icon: '🎹', label: 'Klávesy', unlockLevel: 4 },
    { id: 'mikrofon', icon: '🎤', label: 'Mikrofon', unlockLevel: 5 }
  ];

  function computeUnlockedSkins(level) {
    var safeLevel = Math.max(1, level || 1);
    return MASCOT_SKINS.filter(function (skin) { return skin.unlockLevel <= safeLevel; });
  }

  function toDateKey(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  // playedDateKeys: array of 'YYYY-MM-DD' strings for days the student practiced.
  // today: a Date object (injectable so tests don't depend on the real clock).
  function isPerfectWeek(playedDateKeys, today) {
    var playedSet = {};
    playedDateKeys.forEach(function (key) { playedSet[key] = true; });

    var dayOfWeek = (today.getDay() + 6) % 7; // 0 = Monday
    for (var i = 0; i <= dayOfWeek; i++) {
      var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (dayOfWeek - i));
      if (!playedSet[toDateKey(d)]) return false;
    }
    return true;
  }

  function hasPlayedToday(playedDateKeys, today) {
    return playedDateKeys.indexOf(toDateKey(today)) !== -1;
  }

  var KHGame = {
    LEVEL_TITLES: LEVEL_TITLES,
    STARS_PER_LEVEL: STARS_PER_LEVEL,
    computeLevel: computeLevel,
    BADGES: BADGES,
    computeBadges: computeBadges,
    computeWeeklyLeague: computeWeeklyLeague,
    MASCOT_SKINS: MASCOT_SKINS,
    computeUnlockedSkins: computeUnlockedSkins,
    toDateKey: toDateKey,
    isPerfectWeek: isPerfectWeek,
    hasPlayedToday: hasPlayedToday
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = KHGame;
  } else {
    root.KHGame = KHGame;
  }
})(typeof window !== 'undefined' ? window : globalThis);
