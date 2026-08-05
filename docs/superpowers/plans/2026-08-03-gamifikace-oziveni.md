# Oživení Keyboard Hero (gamifikace + vizuál) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add levels, badges, daily reminders, celebration animations, and a
playful visual restyle to Keyboard Hero (`index.html` + `admin.html`),
motivating ZUŠ students to practice regularly — all derived from existing
Supabase data, no schema changes.

**Architecture:** A new pure-logic file `game-logic.js` computes levels,
badges, and calendar-derived flags (no DOM, no network) and is loaded via
`<script>` tag in both `index.html` and `admin.html`, so both pages share one
source of truth and the logic can be unit-tested with Node's built-in test
runner. All rendering/animation/UI code stays inline in the two existing
HTML files, following the project's current single-file-per-page pattern.

**Tech Stack:** Vanilla JS, HTML, CSS. Supabase JS client (already used).
Node.js built-in test runner (`node --test`) for the pure-logic file only —
no new dependencies, no build step.

## Global Constraints

- No new Supabase tables, columns, or migrations — every new value is
  computed client-side from `profiles.stars`, `profiles.streak`, and
  `practice_logs` rows that the app already queries.
- No new external libraries or CDN scripts beyond the existing
  `@supabase/supabase-js` include (confetti and sound are hand-rolled).
- No new binary assets (images/audio files) — sounds are synthesized with
  the Web Audio API, confetti is drawn on a `<canvas>`.
- Only three files change: new `game-logic.js`, modified `index.html`,
  modified `admin.html`. New test file: `game-logic.test.js`.
- All failure modes (no `localStorage`, no Web Audio, no confetti) must
  degrade silently — never throw and break the rest of the page.
- UI-facing tasks are verified manually in a browser (this repo has no
  browser test framework); only the pure logic in `game-logic.js` gets
  automated Node tests.

---

## Task 1: `game-logic.js` — level computation

**Files:**
- Create: `game-logic.js`
- Create: `game-logic.test.js`

**Interfaces:**
- Produces: `KHGame.LEVEL_TITLES` (array of 7 strings), `KHGame.STARS_PER_LEVEL`
  (number, `10`), `KHGame.computeLevel(stars: number) => { level: number,
  title: string, starsInLevel: number, starsToNext: number, progress: number }`

- [ ] **Step 1: Write the failing test**

Create `game-logic.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test game-logic.test.js`
Expected: FAIL — `Cannot find module './game-logic.js'`

- [ ] **Step 3: Write minimal implementation**

Create `game-logic.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test game-logic.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add game-logic.js game-logic.test.js
git commit -m "feat: add level computation logic with tests"
```

---

## Task 2: `game-logic.js` — badge computation

**Files:**
- Modify: `game-logic.js`
- Modify: `game-logic.test.js`

**Interfaces:**
- Consumes: nothing from Task 1 (independent pure function)
- Produces: `KHGame.BADGES` (array of `{ id: string, icon: string, label:
  string, check: (ctx) => boolean }`), `KHGame.computeBadges(ctx: { stars?:
  number, streak?: number, totalRecordings?: number, perfectWeek?: boolean })
  => Array<{ id: string, icon: string, label: string, unlocked: boolean }>`

- [ ] **Step 1: Write the failing test**

Append to `game-logic.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test game-logic.test.js`
Expected: FAIL — `KHGame.computeBadges is not a function`

- [ ] **Step 3: Write minimal implementation**

In `game-logic.js`, add before the `var KHGame = {` block:

```js
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
```

And extend the `KHGame` export object:

```js
  var KHGame = {
    LEVEL_TITLES: LEVEL_TITLES,
    STARS_PER_LEVEL: STARS_PER_LEVEL,
    computeLevel: computeLevel,
    BADGES: BADGES,
    computeBadges: computeBadges
  };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test game-logic.test.js`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add game-logic.js game-logic.test.js
git commit -m "feat: add badge computation logic with tests"
```

---

## Task 3: `game-logic.js` — calendar helpers (perfect week, daily reminder)

**Files:**
- Modify: `game-logic.js`
- Modify: `game-logic.test.js`

**Interfaces:**
- Consumes: nothing from Tasks 1-2 (independent pure functions)
- Produces: `KHGame.toDateKey(date: Date) => string` (format `'YYYY-MM-DD'`),
  `KHGame.isPerfectWeek(playedDateKeys: string[], today: Date) => boolean`,
  `KHGame.hasPlayedToday(playedDateKeys: string[], today: Date) => boolean`

- [ ] **Step 1: Write the failing test**

Append to `game-logic.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test game-logic.test.js`
Expected: FAIL — `KHGame.toDateKey is not a function`

- [ ] **Step 3: Write minimal implementation**

In `game-logic.js`, add before the `var KHGame = {` block:

```js
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
```

And extend the `KHGame` export object:

```js
  var KHGame = {
    LEVEL_TITLES: LEVEL_TITLES,
    STARS_PER_LEVEL: STARS_PER_LEVEL,
    computeLevel: computeLevel,
    BADGES: BADGES,
    computeBadges: computeBadges,
    toDateKey: toDateKey,
    isPerfectWeek: isPerfectWeek,
    hasPlayedToday: hasPlayedToday
  };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test game-logic.test.js`
Expected: PASS (12 tests)

- [ ] **Step 5: Commit**

```bash
git add game-logic.js game-logic.test.js
git commit -m "feat: add calendar helpers (perfect week, daily reminder) with tests"
```

---

## Task 4: `index.html` — level, progress bar, and badge shelf in profile card

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `KHGame.computeLevel`, `KHGame.computeBadges` from Tasks 1-2
- Produces: `renderLevelAndBadges(profile, totalRecordings, perfectWeek)` —
  called by Task 5 (with `perfectWeek`) and internally by `loadUserProfile()`

- [ ] **Step 1: Add the script include**

In `index.html`, right after the Supabase CDN script tag (around line 7),
add:

```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="game-logic.js"></script>
```

- [ ] **Step 2: Add CSS for the level bar and badge shelf**

In the `<style>` block, after the `.leader-item` rules, add:

```css
    .level-progress-track { width: 100%; height: 10px; background: #e2e8f0; border-radius: 6px; margin-top: 6px; overflow: hidden; }
    .level-progress-fill { height: 100%; background: linear-gradient(90deg, #ff9f43, #2ecc71); border-radius: 6px; transition: width 0.4s ease; }
    .badge-shelf { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .badge-chip { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; background: #f1f5f9; opacity: 0.35; filter: grayscale(1); }
    .badge-chip.unlocked { opacity: 1; filter: none; background: #fff7ed; box-shadow: 0 0 0 2px #ff9f43 inset; }
```

- [ ] **Step 3: Add HTML markup in the profile card**

Replace the profile card body:

```html
        <div class="card">
          <h3>👤 Profil žáka</h3>
          <p style="margin-top: 8px; font-size: 0.9rem;"><strong>Jméno:</strong> <span id="profile-name">-</span></p>
          <button class="btn btn-danger" style="margin-top: 12px; padding: 6px;" onclick="logout()">Odhlásit se</button>
        </div>
```

with:

```html
        <div class="card">
          <h3>👤 Profil žáka</h3>
          <p style="margin-top: 8px; font-size: 0.9rem;"><strong>Jméno:</strong> <span id="profile-name">-</span></p>

          <div class="level-block" style="margin-top: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: bold;">
              <span id="level-title">Level 1 · Nováček</span>
              <span id="level-stars-to-next">10 ⭐ do dalšího levelu</span>
            </div>
            <div class="level-progress-track">
              <div id="level-progress-fill" class="level-progress-fill" style="width: 0%;"></div>
            </div>
          </div>

          <div id="badge-shelf" class="badge-shelf"></div>

          <button class="btn btn-danger" style="margin-top: 12px; padding: 6px;" onclick="logout()">Odhlásit se</button>
        </div>
```

- [ ] **Step 4: Wire the render function into `loadUserProfile`**

Replace:

```js
    async function loadUserProfile() {
      const { data: profile } = await db.from('profiles').select('*').eq('id', currentUser.id).single();
      if (profile) {
        document.getElementById('profile-name').innerText = profile.full_name || 'Žák';
        document.getElementById('stat-streak').innerText = profile.streak || 0;
        document.getElementById('stat-stars').innerText = profile.stars || 0;
      }
      const { count } = await db.from('practice_logs').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id);
      document.getElementById('stat-sent').innerText = count || 0;
    }
```

with:

```js
    async function loadUserProfile() {
      const { data: profile } = await db.from('profiles').select('*').eq('id', currentUser.id).single();
      if (profile) {
        document.getElementById('profile-name').innerText = profile.full_name || 'Žák';
        document.getElementById('stat-streak').innerText = profile.streak || 0;
        document.getElementById('stat-stars').innerText = profile.stars || 0;
      }
      const { count } = await db.from('practice_logs').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id);
      document.getElementById('stat-sent').innerText = count || 0;

      renderLevelAndBadges(profile, count || 0, isCurrentWeekPerfect());
    }

    function renderLevelAndBadges(profile, totalRecordings, perfectWeek) {
      const stars = (profile && profile.stars) || 0;
      const streak = (profile && profile.streak) || 0;
      const levelInfo = KHGame.computeLevel(stars);

      document.getElementById('level-title').innerText = `Level ${levelInfo.level} · ${levelInfo.title}`;
      document.getElementById('level-stars-to-next').innerText = `${levelInfo.starsToNext} ⭐ do dalšího levelu`;
      document.getElementById('level-progress-fill').style.width = `${Math.round(levelInfo.progress * 100)}%`;

      const badges = KHGame.computeBadges({ stars, streak, totalRecordings, perfectWeek });
      const shelf = document.getElementById('badge-shelf');
      shelf.innerHTML = '';
      badges.forEach(badge => {
        const chip = document.createElement('div');
        chip.className = 'badge-chip' + (badge.unlocked ? ' unlocked' : '');
        chip.title = badge.label;
        chip.innerText = badge.icon;
        shelf.appendChild(chip);
      });
    }

    // Placeholder until Task 5 wires real calendar data in; keeps this task
    // runnable and testable on its own.
    function isCurrentWeekPerfect() {
      return false;
    }
```

- [ ] **Step 5: Manual test**

Serve the folder locally (`python -m http.server 8080` from the project
root) and open `http://localhost:8080/index.html` in a browser. Log in as
any student. Confirm:
- The profile card shows "Level 1 · Nováček" (or the correct level for that
  student's current stars) with a progress bar and a row of 9 badge circles
  (grayed out unless the student's stars/streak/recordings already clear a
  threshold).
- No console errors.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: render level, progress bar, and badge shelf in profile card"
```

---

## Task 5: `index.html` — daily reminder banner + perfect-week wiring

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `KHGame.toDateKey`, `KHGame.isPerfectWeek`, `KHGame.hasPlayedToday`
  from Task 3; `renderLevelAndBadges` from Task 4
- Produces: module-level `currentPlayedDateKeys` array, real
  `isCurrentWeekPerfect()` (replaces the Task 4 placeholder),
  `updateDailyReminder(playedDateKeys)`

- [ ] **Step 1: Add CSS for the reminder banner**

In the `<style>` block, after `.badge-chip.unlocked`, add:

```css
    .daily-reminder { margin-top: 10px; padding: 8px 12px; border-radius: 10px; font-size: 0.85rem; font-weight: bold; text-align: center; }
    .daily-reminder.pending { background: #fff7ed; color: #c2410c; }
    .daily-reminder.done { background: #ecfdf5; color: #047857; }
```

- [ ] **Step 2: Add the banner element in the recorder card**

In `index.html`, right after the `#status-text` div in `.recorder-card`, add:

```html
          <div id="status-text" style="font-size: 0.85rem; font-weight: bold;">Stiskni a začni hrát</div>
          <div id="daily-reminder" class="daily-reminder pending"></div>
```

(the `#status-text` line already exists — only the `#daily-reminder` line is
new, inserted immediately after it)

- [ ] **Step 3: Add module-level state and helper functions**

Near the top of the `<script>` block, after `let isSignUpMode = false;`, add:

```js
    let currentPlayedDateKeys = [];

    function isCurrentWeekPerfect() {
      return KHGame.isPerfectWeek(currentPlayedDateKeys, new Date());
    }

    function updateDailyReminder(playedDateKeys) {
      const banner = document.getElementById('daily-reminder');
      const today = new Date();
      if (KHGame.hasPlayedToday(playedDateKeys, today)) {
        banner.className = 'daily-reminder done';
        banner.innerText = '🎉 Dnes už máš splněno! Zítra můžeš pokračovat v řadě.';
      } else {
        banner.className = 'daily-reminder pending';
        banner.innerText = '🎯 Dnes ještě nehrálo/a jsi! Zahraj a udrž řadu.';
      }
    }
```

Remove the Task 4 placeholder function (the one that just `return false;`)
since it's now superseded by the real implementation above — search for and
delete:

```js
    // Placeholder until Task 5 wires real calendar data in; keeps this task
    // runnable and testable on its own.
    function isCurrentWeekPerfect() {
      return false;
    }
```

- [ ] **Step 4: Populate `currentPlayedDateKeys` and call the reminder update from `renderCalendar`**

Replace:

```js
      const { data: logs } = await db.from('practice_logs').select('created_at').eq('user_id', currentUser.id).gte('created_at', startOfMonth).lte('created_at', endOfMonth);

      const playedDays = new Set();
      if (logs) logs.forEach(log => playedDays.add(new Date(log.created_at).getDate()));
```

with:

```js
      const { data: logs } = await db.from('practice_logs').select('created_at').eq('user_id', currentUser.id).gte('created_at', startOfMonth).lte('created_at', endOfMonth);

      const playedDays = new Set();
      const playedDateKeys = [];
      if (logs) logs.forEach(log => {
        const d = new Date(log.created_at);
        playedDays.add(d.getDate());
        playedDateKeys.push(KHGame.toDateKey(d));
      });
      currentPlayedDateKeys = playedDateKeys;
```

Then, at the end of `renderCalendar()` (after the day-cell rendering loop),
add:

```js
      updateDailyReminder(playedDateKeys);
```

- [ ] **Step 5: Reorder `initApp` so calendar data exists before badges render**

Replace:

```js
      await loadUserProfile();
      await renderCalendar();
      await loadLeaderboard();
```

with:

```js
      await renderCalendar();
      await loadUserProfile();
      await loadLeaderboard();
```

(this ensures `currentPlayedDateKeys` is populated before
`renderLevelAndBadges` reads it via `isCurrentWeekPerfect()`)

- [ ] **Step 6: Reorder the same way in the upload-success handler**

In `setupAudioRecording()`'s `mediaRecorder.onstop` handler, replace:

```js
            await loadUserProfile();
            await renderCalendar();
            await loadLeaderboard();
```

with:

```js
            await renderCalendar();
            await loadUserProfile();
            await loadLeaderboard();
```

- [ ] **Step 7: Manual test**

Reload `index.html` in the browser (served locally as in Task 4) and log in.
Confirm:
- If the student hasn't practiced today, the orange "Dnes ještě nehrálo/a
  jsi!" banner shows under the status text.
- Record and send a short practice clip. After it uploads, the banner turns
  green: "Dnes už máš splněno!"
- No console errors during either state.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: add daily reminder banner and wire perfect-week badge data"
```

---

## Task 6: `index.html` — new-badge/level-up detection with toast and overlay

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `renderLevelAndBadges` internals from Task 4 (levelInfo, badges)
- Produces: `checkForNewUnlocks(levelInfo, badges)`, `showBadgeToast(badge)`,
  `showLevelUpCelebration(levelInfo)` — `showLevelUpCelebration` is extended
  in Task 7 to add confetti/sound

- [ ] **Step 1: Add CSS for the toast and overlay**

In the `<style>` block, after `.daily-reminder.done`, add:

```css
    .kh-toast { position: fixed; top: 20px; right: 20px; background: white; border-radius: 10px; padding: 12px 18px; box-shadow: 0 8px 20px rgba(0,0,0,0.15); animation: kh-toast-in 0.3s ease; z-index: 1000; }
    @keyframes kh-toast-in { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    .kh-levelup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1001; cursor: pointer; }
    .kh-levelup-card { background: white; padding: 30px 40px; border-radius: 16px; font-size: 1.4rem; font-weight: bold; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3); animation: kh-pop 0.4s ease; }
    @keyframes kh-pop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
```

- [ ] **Step 2: Add the detection and celebration functions**

After the `updateDailyReminder` function added in Task 5, add:

```js
    function getUnlockStorageKey() {
      return 'kh_seen_' + currentUser.id;
    }

    function readSeenState() {
      try {
        const raw = localStorage.getItem(getUnlockStorageKey());
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        return null;
      }
    }

    function writeSeenState(state) {
      try {
        localStorage.setItem(getUnlockStorageKey(), JSON.stringify(state));
      } catch (err) {
        // localStorage unavailable (private mode etc.) — celebrations just won't persist across sessions.
      }
    }

    function checkForNewUnlocks(levelInfo, badges) {
      const seen = readSeenState();
      const unlockedIds = badges.filter(b => b.unlocked).map(b => b.id);

      if (seen) {
        if (levelInfo.level > seen.level) {
          showLevelUpCelebration(levelInfo);
        }
        const newBadges = badges.filter(b => b.unlocked && !seen.badgeIds.includes(b.id));
        newBadges.forEach(showBadgeToast);
      }

      writeSeenState({ level: levelInfo.level, badgeIds: unlockedIds });
    }

    function showBadgeToast(badge) {
      const toast = document.createElement('div');
      toast.className = 'kh-toast';
      toast.innerHTML = `<strong>${badge.icon} Nový odznak!</strong><div>${badge.label}</div>`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }

    function showLevelUpCelebration(levelInfo) {
      const overlay = document.createElement('div');
      overlay.className = 'kh-levelup-overlay';
      overlay.innerHTML = `<div class="kh-levelup-card">🎉 LEVEL UP! 🎉<br>Level ${levelInfo.level} · ${levelInfo.title}</div>`;
      overlay.onclick = () => overlay.remove();
      document.body.appendChild(overlay);
      setTimeout(() => overlay.remove(), 3500);
    }
```

Note: on a student's very first load after this feature ships, `seen` is
`null`, so `checkForNewUnlocks` silently records the current state without
celebrating — this avoids every existing student getting a flood of
"new" badge toasts for progress they made before the feature existed.

- [ ] **Step 3: Call `checkForNewUnlocks` from `renderLevelAndBadges`**

At the end of the `renderLevelAndBadges` function body (added in Task 4),
after the `badges.forEach(...)` block, add:

```js

      checkForNewUnlocks(levelInfo, badges);
```

- [ ] **Step 4: Manual test**

Serve and reload `index.html`, log in as a student. Confirm no toast/overlay
appears on first load (expected — it's the baseline). In the Supabase table
editor (or via the admin panel, once Task 9 lands), raise that student's
`stars` past a badge/level threshold (e.g. from 5 to 15). Reload the page:
confirm a "Nový odznak!" toast and/or a "LEVEL UP!" overlay appears, and
clicking the overlay dismisses it. Reload again: confirm it does NOT
reappear (state is now recorded in `localStorage`).

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: detect new badges/level-ups via localStorage and show toast/overlay"
```

---

## Task 7: `index.html` — confetti, Web Audio fanfare, and mute toggle

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `showLevelUpCelebration` from Task 6 (extended here); upload
  success branch in `setupAudioRecording()`
- Produces: `fireConfetti()`, `playFanfare()`, `isMuted()`, `toggleMute()`,
  `initMuteToggle()`

- [ ] **Step 1: Add the mute button next to the mic button**

Replace:

```html
          <button id="record-btn" class="mic-btn" onclick="toggleRecording()">🎤</button>
```

with:

```html
          <button id="record-btn" class="mic-btn" onclick="toggleRecording()">🎤</button>
          <button id="mute-toggle" class="mute-btn" onclick="toggleMute()" title="Ztlumit/zapnout zvuky">🔊</button>
```

- [ ] **Step 2: Add CSS for the mute button**

In the `<style>` block, after `.kh-pop`, add:

```css
    .mute-btn { border: none; background: transparent; font-size: 1.3rem; cursor: pointer; margin-top: 6px; }
```

- [ ] **Step 3: Add confetti, fanfare, and mute functions**

After the `showLevelUpCelebration` function (Task 6), add:

```js
    function isMuted() {
      try {
        return localStorage.getItem('kh_muted') === 'true';
      } catch (err) {
        return false;
      }
    }

    function toggleMute() {
      const btn = document.getElementById('mute-toggle');
      const nowMuted = !isMuted();
      try {
        localStorage.setItem('kh_muted', String(nowMuted));
      } catch (err) {
        // localStorage unavailable — mute state just won't persist across reloads.
      }
      btn.innerText = nowMuted ? '🔇' : '🔊';
    }

    function initMuteToggle() {
      document.getElementById('mute-toggle').innerText = isMuted() ? '🔇' : '🔊';
    }

    function playFanfare() {
      if (isMuted()) return;
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.frequency.value = freq;
          osc.type = 'triangle';
          const startTime = audioCtx.currentTime + i * 0.12;
          gain.gain.setValueAtTime(0.2, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.3);
        });
      } catch (err) {
        // Web Audio unavailable/blocked — celebration continues visually only.
      }
    }

    function fireConfetti() {
      if (document.getElementById('kh-confetti-canvas')) return;
      const canvas = document.createElement('canvas');
      canvas.id = 'kh-confetti-canvas';
      canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1002;';
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      const colors = ['#ff3b30', '#2ecc71', '#3498db', '#ff9f43', '#8e44ad'];
      const particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.3,
        size: 4 + Math.random() * 6,
        speedY: 2 + Math.random() * 3,
        speedX: -2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360
      }));

      let frame = 0;
      function tick() {
        frame++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          p.y += p.speedY;
          p.x += p.speedX;
          p.rotation += 6;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation * Math.PI / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        });
        if (frame < 90) {
          requestAnimationFrame(tick);
        } else {
          canvas.remove();
        }
      }
      tick();
    }
```

- [ ] **Step 4: Wire confetti + fanfare into the level-up celebration**

Replace the `showLevelUpCelebration` function body added in Task 6:

```js
    function showLevelUpCelebration(levelInfo) {
      const overlay = document.createElement('div');
      overlay.className = 'kh-levelup-overlay';
      overlay.innerHTML = `<div class="kh-levelup-card">🎉 LEVEL UP! 🎉<br>Level ${levelInfo.level} · ${levelInfo.title}</div>`;
      overlay.onclick = () => overlay.remove();
      document.body.appendChild(overlay);
      setTimeout(() => overlay.remove(), 3500);
    }
```

with:

```js
    function showLevelUpCelebration(levelInfo) {
      const overlay = document.createElement('div');
      overlay.className = 'kh-levelup-overlay';
      overlay.innerHTML = `<div class="kh-levelup-card">🎉 LEVEL UP! 🎉<br>Level ${levelInfo.level} · ${levelInfo.title}</div>`;
      overlay.onclick = () => overlay.remove();
      document.body.appendChild(overlay);
      fireConfetti();
      playFanfare();
      setTimeout(() => overlay.remove(), 3500);
    }
```

- [ ] **Step 5: Wire confetti + fanfare into successful recording upload**

In the `mediaRecorder.onstop` handler, replace:

```js
            // Zobrazíme zelený text a změníme mikrofon na stav 3 (zelený - .sent)
            statusText.innerText = "Nahrávka odeslána učiteli!";
            statusText.style.color = "#2ecc71";
            recBtn.classList.add('sent');
```

with:

```js
            // Zobrazíme zelený text a změníme mikrofon na stav 3 (zelený - .sent)
            statusText.innerText = "Nahrávka odeslána učiteli!";
            statusText.style.color = "#2ecc71";
            recBtn.classList.add('sent');
            fireConfetti();
            playFanfare();
```

- [ ] **Step 6: Initialize the mute button on app load**

In `initApp()`, add `initMuteToggle();` as the last line:

```js
      await renderCalendar();
      await loadUserProfile();
      await loadLeaderboard();
      await loadMyComments();
      await setupAudioRecording();
      initMuteToggle();
```

- [ ] **Step 7: Manual test**

Serve and reload `index.html`, log in, record and send a short clip.
Confirm confetti falls across the screen and a short 3-note fanfare plays.
Click the 🔊 button to mute (icon changes to 🔇), send another recording,
and confirm confetti still appears but no sound plays. Reload the page and
confirm the mute state persisted.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: add confetti, Web Audio fanfare, and mute toggle for celebrations"
```

---

## Task 8: `index.html` — visual restyle (fonts, palette, microinteractions, mascot)

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `toggleRecording()`, `mediaRecorder.onstop` handler (both
  modified in place)
- Produces: `#mascot` element with `recording`/`celebrating` CSS-driven states

- [ ] **Step 1: Add the Fredoka font and update the color palette**

Replace:

```css
    :root {
      --bg-color: #f4f7f6;
      --card-bg: #ffffff;
      --primary-color: #2ecc71;
      --danger-color: #ff3b30;
      --primary-blue: #3498db;
      --text-color: #2c3e50;
      --border-color: #e2e8f0;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    body { background-color: var(--bg-color); color: var(--text-color); padding: 20px; display: flex; justify-content: center; min-height: 100vh; }
```

with:

```css
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&display=swap');

    :root {
      --bg-color: #fef6e4;
      --card-bg: #ffffff;
      --primary-color: #2ecc71;
      --danger-color: #ff3b30;
      --primary-blue: #3498db;
      --text-color: #2c3e50;
      --border-color: #e2e8f0;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    body { background: linear-gradient(160deg, #fef6e4 0%, #e0f7fa 100%); color: var(--text-color); padding: 20px; display: flex; justify-content: center; min-height: 100vh; }
    h1, h3, h4, .btn { font-family: 'Fredoka', 'Segoe UI', sans-serif; }
```

- [ ] **Step 2: Round out cards and add button microinteractions**

Replace:

```css
    .card { background: var(--card-bg); padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid var(--border-color); }
```

with:

```css
    .card { background: var(--card-bg); padding: 20px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid var(--border-color); }
```

Replace:

```css
    .btn { width: 100%; padding: 10px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; }
```

with:

```css
    .btn { width: 100%; padding: 10px; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .btn:active { transform: translateY(0) scale(0.97); }
```

- [ ] **Step 3: Add the mascot and calendar-pop CSS**

In the `<style>` block, after `.mute-btn`, add:

```css
    .mascot { font-size: 2.5rem; margin-bottom: 6px; display: inline-block; }
    .mascot.recording { animation: kh-mascot-bounce 0.6s infinite; }
    .mascot.celebrating { animation: kh-mascot-spin 0.6s ease; }
    @keyframes kh-mascot-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes kh-mascot-spin { from { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.3); } to { transform: rotate(360deg) scale(1); } }
```

Replace:

```css
    .cal-day.played { background: linear-gradient(135deg, #ff9f43, #ff3b30); color: white; font-weight: bold; position: relative; }
```

with:

```css
    .cal-day.played { background: linear-gradient(135deg, #ff9f43, #ff3b30); color: white; font-weight: bold; position: relative; animation: kh-day-pop 0.35s ease; }
    @keyframes kh-day-pop { 0% { transform: scale(0.6); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
```

- [ ] **Step 4: Add the mascot element to the recorder card**

Replace:

```html
          <h3>Nahrávání Cvičení</h3>
          <button id="record-btn" class="mic-btn" onclick="toggleRecording()">🎤</button>
```

with:

```html
          <h3>Nahrávání Cvičení</h3>
          <div id="mascot" class="mascot">🎵</div>
          <button id="record-btn" class="mic-btn" onclick="toggleRecording()">🎤</button>
```

- [ ] **Step 5: Toggle the mascot's recording state**

Replace the body of `toggleRecording()`:

```js
    function toggleRecording() {
      if (!mediaRecorder) return alert('Mikrofon není připraven!');
      const btn = document.getElementById('record-btn');
      const statusText = document.getElementById('status-text');

      if (!isRecording) {
        audioChunks = [];
        mediaRecorder.start();
        isRecording = true;
        
        // Resetujeme stav odesláno a aktivujeme nahrávání
        btn.classList.remove('sent');
        btn.classList.add('recording');
        
        statusText.innerText = "Nahrávám...";
        statusText.style.color = "#ff3b30";
      } else {
        mediaRecorder.stop();
        isRecording = false;
        btn.classList.remove('recording');
      }
    }
```

with:

```js
    function toggleRecording() {
      if (!mediaRecorder) return alert('Mikrofon není připraven!');
      const btn = document.getElementById('record-btn');
      const statusText = document.getElementById('status-text');
      const mascot = document.getElementById('mascot');

      if (!isRecording) {
        audioChunks = [];
        mediaRecorder.start();
        isRecording = true;
        
        // Resetujeme stav odesláno a aktivujeme nahrávání
        btn.classList.remove('sent');
        btn.classList.add('recording');
        mascot.classList.add('recording');
        
        statusText.innerText = "Nahrávám...";
        statusText.style.color = "#ff3b30";
      } else {
        mediaRecorder.stop();
        isRecording = false;
        btn.classList.remove('recording');
        mascot.classList.remove('recording');
      }
    }
```

- [ ] **Step 6: Trigger the mascot's celebration state on upload success**

In the `mediaRecorder.onstop` handler, replace:

```js
            recBtn.classList.add('sent');
            fireConfetti();
            playFanfare();
```

with:

```js
            recBtn.classList.add('sent');
            document.getElementById('mascot').classList.add('celebrating');
            setTimeout(() => document.getElementById('mascot').classList.remove('celebrating'), 700);
            fireConfetti();
            playFanfare();
```

- [ ] **Step 7: Manual test**

Serve and reload `index.html`. Confirm: playful rounded font renders on
headings/buttons, background has a soft gradient, buttons lift slightly on
hover. Click the mic button — the 🎵 mascot bounces continuously while
recording, stops bouncing when you stop. Send a recording — the mascot
briefly spins/scales as a celebration, then returns to idle. Open the
calendar card — today's cell (once practiced) pops in with a small scale
animation on render.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: restyle index.html with playful fonts, palette, and mascot animations"
```

---

## Task 9: `admin.html` — Level and Odznaky columns

**Files:**
- Modify: `admin.html`

**Interfaces:**
- Consumes: `KHGame.computeLevel`, `KHGame.computeBadges` from Tasks 1-2

- [ ] **Step 1: Add the script include**

Replace:

```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

with:

```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="game-logic.js"></script>
```

- [ ] **Step 2: Add table header columns**

Replace:

```html
            <tr>
              <th>Uživatel</th>
              <th>Jméno</th>
              <th>🔥 Streak</th>
              <th>⭐ Koncert</th>
              <th>Akce</th>
            </tr>
```

with:

```html
            <tr>
              <th>Uživatel</th>
              <th>Jméno</th>
              <th>🔥 Streak</th>
              <th>⭐ Koncert</th>
              <th>Level</th>
              <th>Odznaky</th>
              <th>Akce</th>
            </tr>
```

- [ ] **Step 3: Fetch per-student recording counts and compute level/badges**

Replace the body of `loadStudents()`:

```js
    async function loadStudents() {
      const tbody = document.getElementById('students-table-body');
      tbody.innerHTML = '<tr><td colspan="5">Načítám žáky...</td></tr>';

      const { data: students, error } = await db.from('profiles').select('*').eq('role', 'student');

      if (error || !students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Žádní žáci nebyli nalezeni.</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      students.forEach(student => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><code>${student.username || '—'}</code></td>
          <td><strong>${student.full_name || 'Bez jména'}</strong></td>
          <td>
            <div class="counter-control">
              <button class="btn-step" onclick="changeVal('${student.id}', 'streak', -1)">-</button>
              <input type="number" id="streak-${student.id}" class="input-val" value="${student.streak || 0}">
              <button class="btn-step" onclick="changeVal('${student.id}', 'streak', 1)">+</button>
            </div>
          </td>
          <td>
            <div class="counter-control">
              <button class="btn-step" onclick="changeVal('${student.id}', 'stars', -1)">-</button>
              <input type="number" id="stars-${student.id}" class="input-val" value="${student.stars || 0}">
              <button class="btn-step" onclick="changeVal('${student.id}', 'stars', 1)">+</button>
            </div>
          </td>
          <td>
            <button class="btn-save" onclick="saveStudent('${student.id}')">Uložit</button>
            <button class="btn-audio" onclick="toggleRecordings('${student.id}')">Nahrávky</button>
          </td>
        `;

        const recTr = document.createElement('tr');
        recTr.id = `rec-row-${student.id}`;
        recTr.className = 'hidden';
        recTr.innerHTML = `
          <td colspan="5">
            <div class="recordings-box" id="rec-box-${student.id}">
              Načítám nahrávky...
            </div>
          </td>
        `;

        tbody.appendChild(tr);
        tbody.appendChild(recTr);
      });
    }
```

with:

```js
    async function loadStudents() {
      const tbody = document.getElementById('students-table-body');
      tbody.innerHTML = '<tr><td colspan="7">Načítám žáky...</td></tr>';

      const { data: students, error } = await db.from('profiles').select('*').eq('role', 'student');

      if (error || !students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Žádní žáci nebyli nalezeni.</td></tr>';
        return;
      }

      const counts = await Promise.all(students.map(s =>
        db.from('practice_logs').select('*', { count: 'exact', head: true }).eq('user_id', s.id)
      ));

      tbody.innerHTML = '';
      students.forEach((student, idx) => {
        const totalRecordings = counts[idx].count || 0;
        const levelInfo = KHGame.computeLevel(student.stars || 0);
        const badges = KHGame.computeBadges({
          stars: student.stars || 0,
          streak: student.streak || 0,
          totalRecordings: totalRecordings
        });
        const badgeIcons = badges.filter(b => b.unlocked).map(b => b.icon).join(' ') || '—';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><code>${student.username || '—'}</code></td>
          <td><strong>${student.full_name || 'Bez jména'}</strong></td>
          <td>
            <div class="counter-control">
              <button class="btn-step" onclick="changeVal('${student.id}', 'streak', -1)">-</button>
              <input type="number" id="streak-${student.id}" class="input-val" value="${student.streak || 0}">
              <button class="btn-step" onclick="changeVal('${student.id}', 'streak', 1)">+</button>
            </div>
          </td>
          <td>
            <div class="counter-control">
              <button class="btn-step" onclick="changeVal('${student.id}', 'stars', -1)">-</button>
              <input type="number" id="stars-${student.id}" class="input-val" value="${student.stars || 0}">
              <button class="btn-step" onclick="changeVal('${student.id}', 'stars', 1)">+</button>
            </div>
          </td>
          <td>Level ${levelInfo.level} · ${levelInfo.title}</td>
          <td style="font-size: 1.1rem;">${badgeIcons}</td>
          <td>
            <button class="btn-save" onclick="saveStudent('${student.id}')">Uložit</button>
            <button class="btn-audio" onclick="toggleRecordings('${student.id}')">Nahrávky</button>
          </td>
        `;

        const recTr = document.createElement('tr');
        recTr.id = `rec-row-${student.id}`;
        recTr.className = 'hidden';
        recTr.innerHTML = `
          <td colspan="7">
            <div class="recordings-box" id="rec-box-${student.id}">
              Načítám nahrávky...
            </div>
          </td>
        `;

        tbody.appendChild(tr);
        tbody.appendChild(recTr);
      });
    }
```

- [ ] **Step 4: Manual test**

Serve and reload `admin.html`, log in as an admin. Confirm the table shows
"Level" and "Odznaky" columns for every student, matching what that same
student sees in `index.html`'s profile card. Confirm students with zero
recordings show "—" in the Odznaky column instead of an error, and the
"Nahrávky" expand/collapse still works (colspan is now 7).

- [ ] **Step 5: Commit**

```bash
git add admin.html
git commit -m "feat: show computed level and badges per student in admin table"
```

---

## Task 10: `admin.html` — light visual sync

**Files:**
- Modify: `admin.html`

- [ ] **Step 1: Add the Fredoka font and lightly warm the palette**

Replace:

```css
    :root {
      --bg-color: #f8f9fa;
      --card-bg: #ffffff;
      --primary-red: #ff3b30;
      --primary-green: #2ecc71;
      --primary-blue: #3498db;
      --text-color: #2c3e50;
      --border-color: #e2e8f0;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
```

with:

```css
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&display=swap');

    :root {
      --bg-color: #f8f9fa;
      --card-bg: #ffffff;
      --primary-red: #ff3b30;
      --primary-green: #2ecc71;
      --primary-blue: #3498db;
      --text-color: #2c3e50;
      --border-color: #e2e8f0;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    h1, h2, .btn-primary, .btn-logout { font-family: 'Fredoka', 'Segoe UI', sans-serif; }
```

- [ ] **Step 2: Round out cards slightly to match the student app**

Replace:

```css
    .table-card { background: var(--card-bg); border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid var(--border-color); overflow-x: auto; }
```

with:

```css
    .table-card { background: var(--card-bg); border-radius: 18px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid var(--border-color); overflow-x: auto; }
```

- [ ] **Step 3: Manual test**

Reload `admin.html`. Confirm headings and primary buttons use the Fredoka
font, the table card has slightly rounder corners, and the page still reads
as a functional admin tool (not overly playful) — this is a light-touch
pass, not a full redesign.

- [ ] **Step 4: Commit**

```bash
git add admin.html
git commit -m "style: lightly sync admin.html visual language with the student app"
```

---

## Post-Implementation Verification

Run the full pure-logic test suite once more to confirm nothing regressed:

```bash
node --test game-logic.test.js
```

Expected: all tests pass (level, badges, calendar helpers — ~16 tests total).

Then do one full manual pass in the browser covering: student registration
→ login → recording a practice clip → seeing the daily reminder flip →
seeing confetti/fanfare/mascot celebration → an admin raising that
student's stars in `admin.html` → the student reloading and seeing a
LEVEL UP overlay or new badge toast → the admin table showing the same
level/badges the student sees.
