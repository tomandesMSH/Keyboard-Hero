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

test('computeBadges: negative stars/streak/totalRecordings are clamped to 0', () => {
  const badges = KHGame.computeBadges({ stars: -100, streak: -50, totalRecordings: -10 });
  assert.ok(badges.every(b => b.unlocked === false));
});

test('computeBadges: perfectWeek flag drives perfektni-tyden badge', () => {
  const withoutFlag = KHGame.computeBadges({ perfectWeek: false });
  const withFlag = KHGame.computeBadges({ perfectWeek: true });
  assert.equal(withoutFlag.find(b => b.id === 'perfektni-tyden').unlocked, false);
  assert.equal(withFlag.find(b => b.id === 'perfektni-tyden').unlocked, true);
});

test('toDateKey: formats as YYYY-MM-DD with zero-padding', () => {
  assert.equal(KHGame.toDateKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(KHGame.toDateKey(new Date(2026, 10, 21)), '2026-11-21');
});

test('isPerfectWeek: true when every day from Monday through today has an entry', () => {
  const today = new Date(2026, 7, 5);
  const dayOfWeek = (today.getDay() + 6) % 7;
  const played = [];
  for (let i = 0; i <= dayOfWeek; i++) {
    const d = new Date(2026, 7, 5 - (dayOfWeek - i));
    played.push(KHGame.toDateKey(d));
  }
  assert.equal(KHGame.isPerfectWeek(played, today), true);
});

test('isPerfectWeek: false when a day earlier in the week is missing', () => {
  const today = new Date(2026, 7, 5);
  const dayOfWeek = (today.getDay() + 6) % 7;
  if (dayOfWeek === 0) return; // today is Monday, nothing earlier to remove
  const played = [KHGame.toDateKey(today)]; // only today, missing earlier days
  assert.equal(KHGame.isPerfectWeek(played, today), false);
});

test('hasPlayedToday: true only if today key present', () => {
  const today = new Date(2026, 7, 5);
  assert.equal(KHGame.hasPlayedToday([KHGame.toDateKey(today)], today), true);
  assert.equal(KHGame.hasPlayedToday(['2026-08-04'], today), false);
});

test('computeBadges: locked badges include a progressLabel, unlocked ones do not', () => {
  const badges = KHGame.computeBadges({ stars: 0, streak: 5, totalRecordings: 0 });
  const pravidelnost = badges.find(b => b.id === 'pravidelnost'); // streak >= 3, unlocked
  const tydenVOhni = badges.find(b => b.id === 'tyden-v-ohni'); // streak >= 7, locked at streak 5
  assert.equal(pravidelnost.unlocked, true);
  assert.equal(pravidelnost.progressLabel, undefined);
  assert.equal(tydenVOhni.unlocked, false);
  assert.equal(tydenVOhni.progressLabel, '5/7');
});

test('computeBadges: progressLabel current is capped at target, never overshoots', () => {
  // Streak of 5 but totalRecordings of 0 keeps deset-melodii locked; progress should read 0/10, not negative or overshoot.
  const badges = KHGame.computeBadges({ stars: 0, streak: 0, totalRecordings: 0 });
  const desetMelodii = badges.find(b => b.id === 'deset-melodii');
  assert.equal(desetMelodii.progressLabel, '0/10');
});

test('computeBadges: stoleti-legenda unlocks at streak 100 but not 99', () => {
  const almost = KHGame.computeBadges({ streak: 99 });
  const there = KHGame.computeBadges({ streak: 100 });
  assert.equal(almost.find(b => b.id === 'stoleti-legenda').unlocked, false);
  assert.equal(almost.find(b => b.id === 'stoleti-legenda').progressLabel, '99/100');
  assert.equal(there.find(b => b.id === 'stoleti-legenda').unlocked, true);
});

test('computeBadges: tydenni-cil unlocks when weeklyCount reaches 3', () => {
  const below = KHGame.computeBadges({ weeklyCount: 2 });
  const at = KHGame.computeBadges({ weeklyCount: 3 });
  assert.equal(below.find(b => b.id === 'tydenni-cil').unlocked, false);
  assert.equal(below.find(b => b.id === 'tydenni-cil').progressLabel, '2/3');
  assert.equal(at.find(b => b.id === 'tydenni-cil').unlocked, true);
});

test('computeBadges: perfektni-tyden progress uses daysPlayedThisWeek out of 7', () => {
  const badges = KHGame.computeBadges({ perfectWeek: false, daysPlayedThisWeek: 4 });
  assert.equal(badges.find(b => b.id === 'perfektni-tyden').progressLabel, '4/7');
});

test('computeWeeklyLeague: sorts descending by weeklyCount and excludes zero-count students', () => {
  const league = KHGame.computeWeeklyLeague([
    { name: 'Anna', weeklyCount: 5 },
    { name: 'Bedřich', weeklyCount: 0 },
    { name: 'Cyril', weeklyCount: 8 }
  ]);
  assert.deepEqual(league.map(e => e.name), ['Cyril', 'Anna']);
  assert.equal(league[0].rank, 1);
  assert.equal(league[1].rank, 2);
});

test('computeWeeklyLeague: assigns gold/silver/bronze in thirds for larger groups', () => {
  const league = KHGame.computeWeeklyLeague([
    { name: 'A', weeklyCount: 9 },
    { name: 'B', weeklyCount: 8 },
    { name: 'C', weeklyCount: 7 },
    { name: 'D', weeklyCount: 6 },
    { name: 'E', weeklyCount: 5 },
    { name: 'F', weeklyCount: 4 }
  ]);
  assert.deepEqual(league.map(e => e.tier), ['gold', 'gold', 'silver', 'silver', 'bronze', 'bronze']);
});

test('computeWeeklyLeague: single active student gets gold, empty input returns empty array', () => {
  const solo = KHGame.computeWeeklyLeague([{ name: 'Solo', weeklyCount: 1 }]);
  assert.equal(solo[0].tier, 'gold');
  assert.deepEqual(KHGame.computeWeeklyLeague([]), []);
  assert.deepEqual(KHGame.computeWeeklyLeague(undefined), []);
});

test('computeUnlockedSkins: level 1 unlocks only the first skin, higher levels unlock more', () => {
  const atLevel1 = KHGame.computeUnlockedSkins(1);
  const atLevel3 = KHGame.computeUnlockedSkins(3);
  const atLevel10 = KHGame.computeUnlockedSkins(10);
  assert.deepEqual(atLevel1.map(s => s.id), ['noticka']);
  assert.deepEqual(atLevel3.map(s => s.id), ['noticka', 'kytara', 'bubny']);
  assert.equal(atLevel10.length, KHGame.MASCOT_SKINS.length);
});

test('computeUnlockedSkins: missing/invalid level falls back to level 1', () => {
  assert.deepEqual(KHGame.computeUnlockedSkins(undefined).map(s => s.id), ['noticka']);
  assert.deepEqual(KHGame.computeUnlockedSkins(0).map(s => s.id), ['noticka']);
});
