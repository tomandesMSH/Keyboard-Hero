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
