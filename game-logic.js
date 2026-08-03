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

  var KHGame = {
    LEVEL_TITLES: LEVEL_TITLES,
    STARS_PER_LEVEL: STARS_PER_LEVEL,
    computeLevel: computeLevel
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = KHGame;
  } else {
    root.KHGame = KHGame;
  }
})(typeof window !== 'undefined' ? window : globalThis);
