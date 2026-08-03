# 🎹 Keyboard Hero

Webová aplikace pro žáky základní umělecké školy Moravský Krumlov, jejímž cílem je motivovat děti k pravidelnému domácímu cvičení na hudební nástroj hravou formou.

Žáci nahrávají svá cvičení přímo z prohlížeče, sbírají "hvězdy", udržují si cvičební "řadu", a vidí svůj postup v kalendáři. 
Učitel má samostatný administrátorský panel, kde nahrávky poslouchá, hodnotí je a může spravovat skóre žáků.

> ⚠️ Uživatelské jméno by mělo obsahovat pouze znaky bez diakritiky (např. `jannovak`), jinak může selhat validace e-mailu na straně Supabase Auth.

    .recorder-card { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .mic-btn:active { transform: scale(0.95); }
    .mic-btn.recording { animation: pulse 1.2s infinite; background: #c0392b; }