# Overenie noriem — záznam

Texty noriem sú platené a v ruke som ich nemal. Vydania sú dohľadané vo verejných
záznamoch (DIN Media, ÚNMS SR, Bundesnetzagentur), hodnoty porovnané s verejnými
zdrojmi, ktoré normy citujú. Aktuálny stav je v `js/data/norms.js` (verzia dát
2026.11.17) a v aplikácii pod **Viac → Normy v aplikácii**.

---

## Kontrola 17.–18. 11. 2026 (nezávislá od pôvodného prieskumu)

### Ako som kontroloval

Zdroje som stiahol znova a čísla z nich vytiahol programom (PDFKit pre PDF,
štruktúrované bunky tabuliek zo stránok Schneider), nie ručným prepisom. Kópiu
tabuliek zo stránky som overil kontrolným súčtom (súčet a počet všetkých čísel
v každej tabuľke sa zhoduje s tým, čo ukazuje prehliadač). Potom skript porovnal
každú číselnú hodnotu v aplikácii so všetkými zdrojmi, ktoré ju obsahujú.

Zdroje:
- **ABB Rev H 07/2026** — „nach DIN VDE 0298-4:2023-06“, stav polovica 2026 (nový, najdôležitejší)
- ABB Rev D 02/2018 — podľa DIN VDE 0298-4:2013-06
- ABB ElektroSpicker 2021 — výťah z tej istej príručky (krížová kontrola)
- Schneider Electrical Installation Guide — IEC 60364-5-52 tab. B.52.4, B.52.14, B.52.15,
  B.52.17, B.52.18, C.52.1, E.52.1, G.52.1; IEC 60364-4-43 tab. 43A; IEC 60364-4-41;
  IEC 60364-5-54; IEC 60364-7-722

### Výsledok porovnania hodnôt

| Dataset | Overený | Zhoda | Rozdiel | Bez zdroja |
|---|---|---|---|---|
| izPvcHD (zaťažiteľnosť PVC) | áno | 283 | 0 | 0 |
| izPvcDE (1,5 mm² v A1/A2, DE) | áno | 2 | 0 | 0 |
| derateAmbientAir / Ground | áno | 26 / 26 | 0 | 0 |
| derateGrouping | áno | 44 | 0 | 0 |
| shortCircuitK | áno | 8 | 0 | 0 |
| faultLoop | áno | 7 (+ c = 0,95 zo zadania) | 0 | 0 |
| breakerMagnetic, breakerI2Factor | áno | 2 + 2 | 0 | 0 |
| neutralSizing, peSizing, voltageDropLimits | áno | 4 + 1 + 6 | 0 | 0 |

**Žiadna hodnota označená ako overená sa nelíši od zdroja a žiadna nie je bez zdroja.**
Spolu porovnaných 841 hodnôt.

- **154 hodnôt** (meď, 2 aj 3 žily, A1–C, E, F do 120 mm²) je potvrdených priamo voči
  **DIN VDE 0298-4:2023-06** — príručka ABB 2026 má tabuľku číselne totožnú s vydaním,
  podľa ktorého som overoval minule. Tým odpadla hlavná neistota z 11. 11.
- **Slovensko, 2 zaťažené žily (94 hodnôt):** potvrdené nepriamo — z nemeckého prevzatia
  toho istého HD 60364-5-52. Podpora: nemecké 3-žilové hodnoty sa s IEC B.52.4 zhodujú vo
  všetkých 50 spoločných bunkách; zjednodušená IEC tabuľka C.52.1 sa pri uložení A1 zhoduje
  presne (aj 14,5 A pri 1,5 mm²) a pri C v 12 z 15 bunkách; žiadna slovenská hodnota nie je
  vyššia, než C.52.1 pripúšťa.
- 2 „rozdiely“ v `izPvcRest` sú zámerné: IEC/STN hodnoty 14,5 A a 14 A pri 1,5 mm² v A1/A2
  oproti nemeckým 15,5 A.

### Vydania — všetky overené priamo v záznamoch

| Norma | Vydanie | Poznámka |
|---|---|---|
| DIN VDE 0298-4 | 2023-06 + Ber. 1:2023-10 | nahradila 2013-06 (minulý súhrn vyhľadávača tvrdil 2003-08 — chyba) |
| DIN VDE 0100-410 | 2018-10 | platná |
| DIN VDE 0100-430 | 2010-10 | platná, návrh 2021-12 zatiaľ nevyšiel |
| DIN VDE 0100-520 | 2023-06 | prevzatie HD 60364-5-52:2011 **+ A12:2022** |
| DIN VDE 0100-540 | 2024-06 | nahradila 2012-06 |
| DIN 18015-1 | **2020-05** | nahradila 2013-09 (minule nedohľadané) |
| STN 33 2000-5-52 | 04/2012 + O1, A11, **A12 (11/23)**, **A1 (11/25)** | pozri nižšie |
| STN 33 2000-4-41 | 03/2019 + A11, A12, O1 | prevzatie IEC 60364-4-41:2005/AMD1:2017 (63 A) |
| STN 33 2000-4-43 | **07/2024** | IEC 60364-4-43:2023; vydanie 2010 sa smelo používať len do 23. 8. 2026 |
| STN 33 2000-5-54 | 08/2012 + O1, A11, **A1 (11/23)** | minule chýbala Zmena A1 |
| STN 33 2000-7-722 | 12/2019 | platná |

**Čo menia slovenské zmeny k STN 33 2000-5-52** (z náhľadov na ÚNMS):
- **Zmena A12** (= HD 60364-5-52:2011/A12:2022, povinná od 25. 11. 2025): požiarne triedy
  káblov podľa nariadenia CPR (EN 13501-6), článok 527, národné prílohy ZA, ZB, ZC.
  **Nemení zaťažiteľnosť ani úbytok napätia.**
- **Zmena A1** (= IEC 60364-5-52:2009/AMD1:2024): v náhľade je len predhovor a nový odkaz
  na IEC 60364-4-43:2023. Obsah zmeny som nevidel; tabuľky B.52.2 až B.52.21 v obsahu
  zostali. **Bez tejto zmeny sa STN smie používať do 31. 1. 2028.**

Pozor na dva súhrny vyhľadávača, ktoré tvrdili, že A12 alebo A1 mení povolený úbytok
napätia (článok 525). Overil som v texte IEC: je to opis zmien vydania **2009 oproti 2001**,
nie týchto zmien.

### Opravené pri kontrole

1. **3. harmonická sa nezapočítavala.** Aplikácia vypísala „zníž únosnosť na 0,86“, ale návrh
   kábla s tým nepočítal. Teraz sa súčiniteľ podľa IEC E.52.1 aplikuje (nad 33 % podľa prúdu v N).
2. **Zoskupenie pri uložení C, E, F** používalo miernejší riadok „jedna vrstva“, hoci otázka
   v aplikácii hovorí o zväzku. Teraz sa predvolene berie riadok „zväzok“ (podľa B.52.17 platí
   pre A až F) a pri výsledku sa vypíše.
3. **Rad poistiek** bol označený ako overený bez zdroja a chýbalo v ňom 35 A. Oddelený do
   neovereného datasetu `fuseRatings`, 35 A doplnené.
4. **Wallbox v Nemecku:** text o chrániči (typ B alebo typ A/F + RDC-DD) teraz cituje
   IEC 60364-7-722, nie Bundesnetzagentur, ktorá o chráničoch nepíše.
5. Vydania a odkazy v prehľade noriem doplnené podľa tabuľky vyššie.

### Čo ostáva neoverené

- Obsah zmeny A1 k STN 33 2000-5-52 (IEC AMD1:2024).
- XLPE tabuľky, PVC 2 žily nad 120 mm² a v zemi, hliník pri 2 žilách, zem D1 v chráničkách
  (B.52.19), poistky gG/NH a ich vypínacie prúdy, istič D, sieť IT, motory, FV, wallbox SK.
- Pre zemné káble v Nemecku sa často používa DIN VDE 0276-603 s miernejšími predpokladmi;
  aplikácia počíta podľa IEC (na strane bezpečnosti).

---

## Pôvodný prieskum 10.–11. 11. 2026 (história)

Chyby nájdené vtedy v dátach a opravené 11. 11.:
1. D2, 3 žily — hodnoty boli o 15–20 % vyššie (boli tam 2-žilové hodnoty pre D1).
2. F — pri 3 žilách boli hodnoty pre 2 žily.
3. Nemecko má pri 1,5 mm² v A1/A2 (2 žily) 15,5 A, IEC/STN 14,5 / 14 A — tabuľka rozdelená.
4. Zoskupenie 10 káblov vo zväzku = 0,48 (bolo 0,50).
5. Zoskupenie v zemi pre 7 a viac káblov — opravené podľa B.52.18.
6. Harmonické podľa IEC E.52.1.
7. Krátky čas odpojenia platí do 63 A (bolo 32 A).
8. Wallbox DE — § 14a EnWG nad 4,2 kW, súhlas nad 12 kVA.

Tvrdenie z 11. 11., že nové vydanie DIN VDE 0298-4 podľa predhovoru knihy VDE Verlagu menilo
len tabuľku 9 a prílohu C, pochádzalo zo súhrnu vyhľadávača; predhovor sa mi otvoriť
nepodarilo. Nahradilo ho priame porovnanie s príručkou ABB 2026.
