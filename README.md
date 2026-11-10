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

## 2. Čo je NEOVERENÉ

**27 z 28 datasetov je označených ako neoverených.** Jediný overený je
`conductivity` (κCu = 56, κAl = 35) — a aj ten len preto, že je to matematický
vstup priamo zo zadania, nie citát normy.

Normové tabuľky som **nemal z overiteľného zdroja**, takže som ich nevydával za
citát normy. To, čo je v `js/data/norms.js`, je **štartovacia osnova na
kontrolu** — každá hodnota má uvedený predpokladaný zdroj a je označená
`verified: false`.

Úplný rozpis je v [ARCHITEKTURA.md](ARCHITEKTURA.md), kapitola 4. Skrátene:

| Dataset | Čo to je | Riziko |
|---|---|---|
| `ampacityPvc`, `ampacityXlpe` | Iz pre A1–F, PVC/XLPE, Cu/Al | **najvyššie** — od toho závisí celý návrh |
| `fuseDisconnectCurrent` | prúdy odpojenia gG v 0,4 a 5 s | **najvyššie** — je to odhad, nie krivka výrobcu |
| `derateAmbientAir/Ground`, `derateGrouping` | korekčné súčinitele | vysoké |
| `breakerMagnetic` | B = 5×In, C = 10×In, D = 20×In | stredné (použité horné hranice) |
| `shortCircuitK` | k = 115 / 143 / 76 / 94 | stredné |
| `faultLoop` | c = 0,95, časy 0,4 / 0,2 / 5 s, t_inst 0,1 s | stredné |
| `voltageDropLimits` | 3 % DE / 3–5 % SK | **v DE si limit určuje VNB v TAB** |
| `minCrossSection`, `peSizing`, `neutralSizing` | prierezy a Al | stredné, DE ≠ SK |
| `motorStart`, `motorEfficiency`, `motorCosPhi`, `contactorAC3` | orientačné motorové hodnoty | nízke (vždy zo štítku) |
| `pvDesign` | β Uoc, −10/−15 °C, 1,25 | vždy z datasheetu panelu |
| `wallboxRules` | ochrana a ohlásenie | **mení sa najčastejšie** |
| `installMethods`, `netTypes`, `rcdTypes`, `breakerRatings`, `breakerI2Factor`, `groupingByMethod` | popisy a rady | nízke |

Neoverené sú aj všetky referenčné tabuľky (`js/data/reference.js`): farby a staré
značenia, IP/IK, zóny v kúpeľni, schematické značky, svorky, uťahovacie momenty —
a preklad typov káblov SK ↔ DE (`js/data/cables.js`), ktorý nie je 1:1.

## 3. Čo musíš skontrolovať podľa noriem

Poradie podľa toho, čo najviac ovplyvní výsledok:

1. **Tabuľky Iz** (`ampacityPvc`, `ampacityXlpe`) proti DIN VDE 0298-4 tab. 3 /
   STN 33 2000-5-52 / IEC 60364-5-52 tab. B.52.x. Skontroluj, **ktoré vydanie**
   platí pre tvoju zákazku — hodnoty sa medzi vydaniami líšia. Doplň aj
   kombinácie, ktoré sú vedome prázdne (XLPE v A1, A2, D1).
2. **Prúdy odpojenia poistiek gG** (`fuseDisconnectCurrent`). Toto nepoužívaj
   tak, ako to je — nahraď hodnotami z vypínacej krivky konkrétneho výrobcu.
3. **Korekčné súčinitele** na teplotu, zeminu a zoskupenie — a aj to, ktorý typ
   zoskupenia patrí ku ktorému spôsobu uloženia (`groupingByMethod`).
4. **Povolený úbytok napätia** (`voltageDropLimits`). V Nemecku si limit často
   určuje prevádzkovateľ siete v TAB — over ho u konkrétneho VNB. Na Slovensku
   over STN 33 2000-5-52 prílohu G.
5. **Súčiniteľ c a časy odpojenia** (`faultLoop`). Rozhodni sa, či používaš
   c = 0,95, 0,8 alebo 1,0 — podľa toho, čo požaduje projektant alebo revízny
   technik. Aplikácia hodnoty nezjednocuje.
6. **Pásma magnetického vypnutia ističov** (`breakerMagnetic`) v katalógu
   výrobcu, ktorý montuješ.
7. **Súčiniteľ k** (`shortCircuitK`) proti IEC 60364-4-43.
8. **Minimálne prierezy a podmienky použitia hliníka** — zvlášť pre DE a zvlášť
   pre SK, a navyše u konkrétneho distribútora.
9. **Ohlasovacie povinnosti pre wallbox a FV** — hranica 12 kW v DE,
   Marktstammdatenregister, podmienky ZSD/SSD/VSD na SK. Toto sa mení
   najčastejšie z celej aplikácie.
10. **Zóny v kúpeľni** podľa platného vydania DIN VDE 0100-701 / STN 33 2000-7-701
    — pravidlá pre zásuvky v zónach sa menili.
11. **Uťahovacie momenty** — vždy majú prednosť údaje výrobcu svorky.

Keď dataset skontroluješ, označ ho v **Overenie dát** ako „Overené". Vtedy a len
vtedy začne aplikácia dávať zelené výsledky. Úpravy si môžeš exportovať a preniesť
do iného telefónu.

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
