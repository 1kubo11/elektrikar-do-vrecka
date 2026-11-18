# Elektrikár do vrecka

Offline PWA pomôcka pre elektrikára pracujúceho v Nemecku a na Slovensku.
Bez servera, bez prihlasovania, bez buildu. Všetko je v zariadení.

## Spustenie

Stačí statický server v priečinku projektu (service worker nefunguje cez `file://`):

```bash
cd /Users/jakubhricisin/Desktop/elektrikar-do-vrecka && node dev-server.mjs
```

Alebo bez Node:

```bash
cd /Users/jakubhricisin/Desktop/elektrikar-do-vrecka && python3 -m http.server 8777
```

Potom otvor `http://localhost:8777` v telefóne alebo prehliadači a daj „Pridať na
plochu". Po prvom načítaní funguje aplikácia offline.

Testy:

```bash
cd /Users/jakubhricisin/Desktop/elektrikar-do-vrecka && node tests/run.mjs
```

Architektúra a zoznam neoveriteľných dát: [ARCHITEKTURA.md](ARCHITEKTURA.md)

## Jednoduchý a podrobný režim

Aplikácia sa otvára v **jednoduchom režime**: pár otázok bežnou rečou (čo zapájaš,
aký dlhý kábel, kde bude uložený) a jedna jasná odpoveď — kábel a istič. Kontroly
sú vypísané vetami („Kábel unesie 23 A — istič má 16 A“), vzorce, normy a všetky
medzivýsledky sú schované pod **Podrobnosti výpočtu**.

Jednoduchý režim počíta len s tým, čo je na obrazovke: izolácia PVC, sieť TN,
istič B alebo C, uloženie B2 / A2 / C / D2. Čo si nezadal, vypíše pod výsledkom
(„Počítal som s tým, že…“).

**Podrobný režim** (Viac → Nastavenia, alebo odkaz pod kalkulačkou) ukáže všetky
vstupy: cos φ, súčasnosť, Ze/Zs, typ siete, všetkých 9 spôsobov uloženia, poistky,
harmonické, selektivitu a plný rozpis výsledku.

Pravidlo farby platí v oboch režimoch rovnako — výsledok opretý o neoverené
tabuľky nie je zelený, v jednoduchom režime sa volá „Vyhovuje — orientačne“.

---

# ZÁVEREČNÉ ZHRNUTIE

## 1. Čo funguje a je overené testami

**85 automatických testov prechádza.** Overené sú tieto veci:

### Kontrolné hodnoty zo zadania — všetky sedia
| Kontrola | Čakané | Vypočítané |
|---|---|---|
| 1f 230 V, 16 A, 30 m, Cu 2,5 mm² | 6,86 V (2,98 %) | 6,857 V (2,98 %) |
| 3f 400 V, 32 A, 50 m, Cu 6 mm² | 8,25 V (2,06 %) | 8,247 V (2,06 %) |
| 3f 400 V, 63 A, 40 m, Al 16 mm² | 7,79 V (1,95 %) | 7,794 V (1,95 %) |
| Motor 7,5 kW, cos φ 0,85, η 0,9 | 14,15 A | 14,15 A |
| B16, Ia = 80 A, U0 230 V, c 0,95 | Zs max 2,73 Ω | 2,7312 Ω |
| Cu 2,5 mm² PVC, k 115, Ik 1000 A | t max 0,083 s | 0,0827 s |

### Výpočtové jadro
- Úbytok napätia 1f aj 3f vrátane reaktancie a cos φ.
- Iz = tabuľka × korekcia na teplotu × korekcia na zoskupenie.
- Ib ≤ In ≤ Iz a I2 ≤ 1,45 × Iz, vrátane rozdielu istič (I2 = 1,45·In) vs.
  poistka gG (I2 = 1,6·In — tam In ≤ Iz nestačí).
- Slučková impedancia Zs, skratový prúd Ik, Zs max = c·U0/Ia, čas odpojenia.
- Skratová odolnosť k²·S² ≥ I²·t a minimálny prierez S = Ik·√t / k.
- Prierez PE (S / 16 / S÷2), upozornenie na harmonické prúdy v N.
- Režimy A, B, C, D. Režim C ukazuje **tri samostatné dĺžky** a pomenuje, ktorá
  z nich dĺžku obmedzuje.
- Konkrétne návrhy opráv s prepočtom (väčší prierez, iná charakteristika, RCD,
  iné uloženie, kratšia trasa, prechod na 3f) — aj keď návrh vyhovuje.
- Motory: prúd, kVA, rozbeh (DOL / Y-D / softštart / menič), stýkač AC-3,
  kompenzácia Q = P·(tan φ₁ − tan φ₂), úbytok pri rozbehu.
- FV: Uoc pri najnižšej teplote, max. panelov v reťazci, kontrola MPP, Isc×1,25,
  poistka reťazca, DC kábel (2×L), AC kábel striedača.
- Wallbox: 3,7 / 7,4 / 11 / 22 kW, kábel a istenie ako trvalá záťaž (bez
  súčasnosti), RCD a DC 6 mA, ohlasovacie povinnosti zvlášť pre DE a SK.

### Správanie pri zlých vstupoch (otestované)
Nula, záporné číslo, chýbajúci údaj, text namiesto čísla, cos φ = 0 aj 1,3,
nezmyselne veľký výkon, neznámy materiál / spôsob uloženia / typ istenia,
Al pod 16 mm², XLPE v spôsobe A1 (dáta vedome chýbajú). Nikde nevznikne NaN,
Infinity ani pád — vždy príde jasná správa alebo „chýba údaj".

### Pravidlo farby (otestované)
Zelená vznikne **len** vtedy, keď prejdú všetky kontroly **a** všetky použité
tabuľkové hodnoty sú označené ako overené. Overené v prehliadači: pri
východiskových dátach je výsledok oranžový („Vyhovuje — ale na neoverených
dátach"), po zaškrtnutí datasetov v **Overenie dát** sa ten istý výpočet zmení
na zelený. Ručná úprava hodnoty sa okamžite prejaví vo výsledku a je pri
referencii označená ako „ručne upravené".

### Rozhranie (overené na 375 × 812 px)
Tmavý aj svetlý režim, terče minimálne 46–52 px, prepínač normy DE/STN je stále
v hlavičke, trvalé upozornenie nad obsahom, rozbaľovací postup s vzorcami a
dosadenými hodnotami pri každom výsledku, globálne vyhľadávanie, uložené a
posledné výpočty, obľúbené, export/import (otestovaný round-trip), zdieľanie
textu a tlač do PDF.

## 2. Stav noriem a dát (kontrola 17.–18. 11. 2026)

Podrobný záznam je v [NORMY-OVERENIE.md](NORMY-OVERENIE.md), v aplikácii pod
**Viac → Normy v aplikácii**.

Texty noriem sú platené. Vydania sú overené priamo v záznamoch DIN Media a ÚNMS SR,
hodnoty porovnané programom so zdrojmi, ktoré normy citujú — vrátane príručky ABB
z roku 2026 postavenej na **DIN VDE 0298-4:2023-06**.

- **19 z 37 datasetov je porovnaných so zdrojom**, 841 hodnôt prešlo porovnaním:
  žiadna overená hodnota sa nelíši od zdroja a žiadna nie je bez zdroja.
- Pre Slovensko sú hodnoty pre 2 zaťažené žily overené nepriamo (cez nemecké prevzatie
  toho istého HD 60364-5-52) — podrobne v zázname.
- **Zmena A12 k STN 33 2000-5-52** sa týka požiarnych tried káblov, nie zaťažiteľnosti;
  **Zmena A1** (IEC AMD1:2024) — obsah som nevidel, STN sa bez nej smie používať do 31. 1. 2028.

## 3. Čo ešte treba skontrolovať podľa normy

1. Čo presne mení **Zmena A1 k STN 33 2000-5-52** (IEC 60364-5-52:2009/AMD1:2024) — bez nej sa STN smie používať do 31. 1. 2028.
2. **Prúdy odpojenia poistiek gG** — v aplikácii je len odhad, treba krivku výrobcu.
3. **XLPE tabuľky** a zvyšok PVC tabuľky (2 žily nad 120 mm², v zemi, hliník).
4. **Podmienky slovenských distribútorov** pre wallbox a FV.
5. **Zóny v kúpeľni**, uťahovacie momenty a ostatné referenčné tabuľky.

## 4. Čo som nemohol overiť v tomto prostredí

- **Registráciu service workera.** Súbor `sw.js` sa syntakticky načíta v poriadku
  a všetkých 34 ciest v `PRECACHE` existuje (overené fetchom, 0 chýb), ale
  náhľadový panel v tomto prostredí registráciu service workera blokuje
  („An unknown error occurred when fetching the script"). **Offline režim a
  inštaláciu na plochu si over v reálnom prehliadači v telefóne** — spusti
  statický server podľa návodu vyššie a načítaj stránku cez `http://`
  (cez `file://` service worker nikdy nefunguje).
- **Čítanie nahlas** v slovníku používa Web Speech API — závisí od zariadenia.
  Keď ho telefón nepodporuje, aplikácia to povie a nespadne.

## 5. Dôležité rozhodnutie, ktoré som urobil inak, než znelo zadanie

Zadanie chcelo v režime C „maximálnu dĺžku podľa skratovej odolnosti".
Fyzikálne platí, že **skratová odolnosť je najkritickejšia na začiatku obvodu**,
nie na konci — čím je kábel dlhší, tým je skratový prúd menší a tepelné
namáhanie menšie. Pri ističi preto skratová odolnosť väčšinou dĺžku neobmedzuje;
aplikácia to v takom prípade napíše („neobmedzuje samostatne — rozhoduje
odpojenie poruchy") namiesto vymyslenej hodnoty. Naopak upozorní na **príliš
krátke** trasy a na prípad, keď kábel pri danom istení neodolá skratu pri žiadnej
dĺžke. Pri poistkách, kde čas vypnutia s klesajúcim prúdom rastie, je limit
skutočný a aplikácia ho ukáže.
