const test = require('node:test');
const assert = require('node:assert/strict');
const KHGame = require('./game-logic.js');

test('computeLevel: 0 stars is level 1 Nováček', () => {
  const result = KHGame.computeLevel(0);
  assert.equal(result.level, 1);
  assert.equal(result.title, 'Nováček');
  assert.equal(result.starsInLevel, 0);
  assert.equal(result.starsToNext, 10);
  assert.equal(result.progress, 0);
});

test('computeLevel: 25 stars is level 3, mid-progress', () => {
  const result = KHGame.computeLevel(25);
  assert.equal(result.level, 3);
  assert.equal(result.title, 'Talent');
  assert.equal(result.starsInLevel, 5);
  assert.equal(result.starsToNext, 5);
  assert.equal(result.progress, 0.5);
});

test('computeLevel: beyond named levels appends +N', () => {
  const result = KHGame.computeLevel(75); // level 8, only 7 named titles
  assert.equal(result.level, 8);
  assert.equal(result.title, 'Legenda +1');
});

test('computeLevel: negative/undefined stars treated as 0', () => {
  assert.equal(KHGame.computeLevel(-5).level, 1);
  assert.equal(KHGame.computeLevel(undefined).level, 1);
});

test('computeBadges: no activity unlocks nothing', () => {
  const badges = KHGame.computeBadges({ stars: 0, streak: 0, totalRecordings: 0 });
  assert.ok(badges.every(b => b.unlocked === false));
  assert.equal(badges.length, KHGame.BADGES.length);
});

test('computeBadges: first recording unlocks only Nováček', () => {
  const badges = KHGame.computeBadges({ stars: 0, streak: 0, totalRecordings: 1 });
  const unlocked = badges.filter(b => b.unlocked).map(b => b.id);
  assert.deepEqual(unlocked, ['novacek']);
});

test('computeBadges: streak of 7 unlocks pravidelnost and tyden-v-ohni but not mesic-discipliny', () => {
  const badges = KHGame.computeBadges({ stars: 0, streak: 7, totalRecordings: 0 });
  const unlocked = badges.filter(b => b.unlocked).map(b => b.id);
  assert.ok(unlocked.includes('pravidelnost'));
  assert.ok(unlocked.includes('tyden-v-ohni'));
  assert.ok(!unlocked.includes('mesic-discipliny'));
});

test('computeBadges: perfectWeek flag drives perfektni-tyden badge', () => {
  const withoutFlag = KHGame.computeBadges({ perfectWeek: false });
  const withFlag = KHGame.computeBadges({ perfectWeek: true });
  assert.equal(withoutFlag.find(b => b.id === 'perfektni-tyden').unlocked, false);
  assert.equal(withFlag.find(b => b.id === 'perfektni-tyden').unlocked, true);
});
