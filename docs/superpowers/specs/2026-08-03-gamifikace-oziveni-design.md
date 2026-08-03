# Design: Oživení Keyboard Hero (gamifikace + vizuál)

## Cíl

Webová appka pro žáky ZUŠ Moravský Krumlov (`index.html` + `admin.html`, statické
HTML/CSS/JS, Supabase backend) funguje, ale vizuálně a herně působí staticky.
Cílem je appku "oživit" — hravější vizuál a nové motivační herní mechaniky —
tak, aby víc motivovala děti (cca 6–15 let) k pravidelnému domácímu cvičení.

## Rozsah

- Mění se pouze `index.html` a `admin.html` (žádné nové soubory, žádný build proces).
- **Žádné změny v Supabase** — žádné nové tabulky, sloupce ani migrace. Vše nové
  (levely, odznaky, denní připomínka) se počítá na klientovi z dat, která appka
  už dnes načítá: `profiles.stars`, `profiles.streak`, počet a data řádků
  v `practice_logs`.
- Důvod: bezpečnost (žádný ruční SQL krok, který by mohl appku rozbít) a
  konzistence (odvozené hodnoty nikdy nemůžou "vypadnout ze synchronizace"
  s pravdou v DB, protože se počítají vždy znovu).
- Žádné nové zvukové/obrazové assety — zvuky se generují přes Web Audio API,
  konfety a maskot jsou čisté CSS/DOM/emoji.

## 1. Levely a odznaky (odvozené z existujících dat)

### Levely

```
level = 1 + floor(stars / 10)
```

Tituly (cyklus, poslední se opakuje s `+N` příponou při přetečení):
Nováček → Začátečník → Talent → Šikovný hráč → Mistr kláves → Virtuoz → Legenda

V profilové kartě: název levelu + progress bar do dalšího levelu
(`stars % 10` / 10).

### Odznaky

Statická definice v JS jako pole objektů `{ id, icon, label, check(ctx) }`,
kde `ctx = { stars, streak, totalRecordings, playedDaysThisWeek }`:

| Ikona | Název | Podmínka |
|---|---|---|
| 🌱 | Nováček | totalRecordings ≥ 1 |
| 🎯 | Pravidelnost | streak ≥ 3 |
| 🔥 | Týden v ohni | streak ≥ 7 |
| 🔥🔥 | Měsíc disciplíny | streak ≥ 30 |
| 🎵 | Deset melodií | totalRecordings ≥ 10 |
| 🎼 | Padesát melodií | totalRecordings ≥ 50 |
| ⭐ | Malý virtuoz | stars ≥ 10 |
| ⭐⭐ | Virtuoz | stars ≥ 50 |
| 📅 | Perfektní týden | cvičil/a každý den od pondělí do dneška (aktuální týden) |

Zobrazení: horizontální "polička" odznaků v profilové kartě — odemčené
barevně s tooltipem (název), zamčené šedě/průhledně.

`totalRecordings` = počet řádků `practice_logs` (už se dnes načítá pro
`stat-sent`). `playedDaysThisWeek` se dopočítá z dat kalendáře (rozšířit
dotaz na logy tak, aby pokryl i aktuální týden, pokud přesahuje mimo
zobrazovaný měsíc — v běžném případě je součástí měsíčního dotazu).

### Denní připomínka

Banner v recorder kartě:
- Pokud dnešní datum není v `playedDays` (kalendářní data už appka načítá):
  zobrazí se výzva, např. "Dnes ještě nehrálo/a jsi! 🎯 Zahraj a udrž řadu."
- Pokud dnešek už je v `playedDays`: pochvalná hláška, např.
  "Dnes už máš splněno! 🎉 Zítra můžeš pokračovat v řadě."

Nejde o novou herní měnu ani odměnu — je to čistě informační/motivační prvek,
protože hvězdičky uděluje učitel ručně v adminu (současný model hodnocení
se nemění).

## 2. Oslavy a animace

- **Po úspěšném odeslání nahrávky** (`mediaRecorder.onstop` handler, po
  úspěšném uploadu): spustí se konfety (vlastní ~30řádková vanilla JS/CSS
  implementace, žádná externí knihovna), krátká generovaná fanfára
  (Web Audio API — 2–3 tóny), a maskot/emoji postavička v recorder kartě
  na chvíli "zatančí" (CSS animace).
- **Detekce nových odznaků/levelu**: při každém `initApp()` (přihlášení i po
  odeslání nahrávky) appka spočítá aktuální level a seznam odznaků a porovná
  je s tím, co má uložené v `localStorage` pod klíčem specifickým pro
  uživatele (např. `kh_seen_<user.id>`). Cokoliv nového (i to, co odemkl
  učitel ručním přidáním hvězdiček v adminu) spustí toast "Nový odznak!"
  nebo výraznější "LEVEL UP!" overlay s konfetami a fanfárou.
- **Ztlumení zvuku**: ikona reproduktoru (mute/unmute) u recorder karty,
  stav persistovaný v `localStorage` (`kh_muted`), default zapnuto.

## 3. Vizuální styl

- Google Font "Fredoka" nebo "Baloo 2" (přes `<link>` na Google Fonts) pro
  nadpisy a tlačítka — kulatý, hravý styl písma.
- Sytější barevná paleta, jemný gradient pozadí místo plochého `--bg-color`,
  větší `border-radius`, měkčí stíny, větší tlačítka/tap targety.
- Jednoduchý maskot: emoji-based postavička (žádný externí obrázek), která
  mění "náladu" podle stavu (klid / nahrávání / oslava) pomocí CSS animací.
- Mikrointerakce: hover/press scale efekty na tlačítkách, plynulý nástup
  karet (fade/slide) při načtení, "pop" efekt na políčku kalendáře při
  označení odehraného dne.

## 4. Admin panel (`admin.html`)

- Nové sloupce v tabulce žáků: "Level" (název + číslo) a "Odznaky" (řádek
  malých ikon) — čistě zobrazovací, dopočítané ze stejných dat, které admin
  už načítá (`profiles.stars`, `profiles.streak`) plus jeden dodatečný dotaz
  na počet `practice_logs` per žák. Učitel tyto hodnoty needituje přímo —
  needituje se level/odznaky, jen dál streak/stars jako dosud.
- Jemné sjednocení vizuálního stylu (font, barvy) s appkou pro žáky, ale
  admin zůstává funkčnější/přehlednější, ne "dětský".

## Chybová stavy a okrajové případy

- Žák bez `profile.stars`/`streak` (null/0): level 1 "Nováček", žádné odznaky
  odemčené — zobrazuje se normálně, bez chyb.
- `localStorage` nedostupný (privátní režim / zákaz): appka nespadne —
  detekce nových odznaků/levelu se prostě neaktivuje (žádný toast), zbytek
  appky funguje beze změny.
- Web Audio API nedostupné/blokované prohlížečem: konfety a vizuální
  animace proběhnou i bez zvuku (zvuk se accepts-fail tichým fallbackem).
- Odznaky/level v adminu: pokud žák nemá žádné `practice_logs`, sloupec
  "Odznaky" zobrazí jen zamčené ikony / pomlčku, ne chybu.

## Testování

Ruční test v prohlížeči (appka je bez build kroku a bez testovacího
frameworku):
- Nový žák: registrace → appka zobrazí level 1, žádné odznaky, denní
  připomínku "ještě nehráno".
- Odeslání nahrávky: konfety + fanfára + maskot animace, denní připomínka
  se změní na "splněno".
- Učitel v adminu přidá hvězdičky/streak přes práh (např. na 10 hvězdiček):
  žák se znovu přihlásí → zobrazí se "LEVEL UP!" / nový odznak.
- Ztlumení zvuku přetrvá po refresh stránky.
- Admin tabulka zobrazuje level a odznaky u žáka se staršími daty (zpětná
  kompatibilita se stávajícími řádky v `profiles`/`practice_logs`).
