# Elektrikár do vrecka — architektúra

## 1. Princíp

Statická PWA bez buildu, bez servera, bez prihlasovania. Čisté ES moduly, ktoré
beží aj v prehliadači aj v Node (rovnaké súbory používajú testy). Žiadne
závislosti, žiadny npm install.

```
elektrikar-do-vrecka/
├── index.html                 shell aplikácie (jediná stránka)
├── manifest.webmanifest       PWA manifest
├── sw.js                      service worker, cache-first, verzovaný
├── css/styles.css             tmavý + svetlý režim, veľké terče pre rukavice
├── js/
│   ├── app.js                 router, shell, globálne vyhľadávanie
│   ├── store.js               localStorage: nastavenia, uložené výpočty, obľúbené, override dát
│   ├── share.js               export textu / tlač do PDF
│   ├── data/
│   │   ├── norms.js           ★ VŠETKY normové hodnoty, oddelené od výpočtov
│   │   ├── cables.js          typy káblov SK/DE, kde sa smú použiť
│   │   ├── reference.js       farby vodičov, IP/IK, zóny, značky, momenty
│   │   └── glossary.js        slovník SK–DE
│   ├── calc/                  ★ čisté funkcie, žiadny DOM, pokryté testami
│   │   ├── core.js            jednotky, rady prierezov, pomocné funkcie, typ Result
│   │   ├── voltdrop.js        úbytok napätia 1f/3f
│   │   ├── ampacity.js        Iz, korekcie na teplotu/zoskupenie/uloženie
│   │   ├── protection.js      Ib≤In≤Iz, I2≤1,45·Iz, Zs, Ik, čas odpojenia, k²S²
│   │   ├── design.js          režimy A/B/C/D + návrhy opráv
│   │   ├── motor.js           kW/kVA/A, rozbeh, stýkač, kompenzácia
│   │   ├── pv.js              reťazec, Uoc pri -10 °C, DC kábel, poistky
│   │   └── wallbox.js         3,7–22 kW, kábel, istenie, RCD, ohlásenie
│   └── ui/                    jedna obrazovka = jeden modul, vracia DOM
├── tests/run.mjs              vlastný runner, `node tests/run.mjs`
└── icons/                     192/512 PNG + SVG
```

## 2. Oddelenie dát od výpočtov

`js/data/norms.js` je jediný zdroj normových hodnôt. Každý dataset má hlavičku:

```js
{
  id: 'ampacity.pvc.cu',
  country: 'DE' | 'SK' | 'BOTH',
  standard: 'DIN VDE 0298-4',
  edition: '2013-06',
  table:  'Tab. 3, riadky 1–11',
  verified: false,          // ← stav Overené / Neoverené
  note: 'čo presne treba skontrolovať',
  data: { ... }
}
```

Výpočtové moduly dáta nikdy nemajú zadrôtované. Každú hodnotu si vyžiadajú cez
`lookup()`, ktoré vráti `{ value, ref }`, a `ref` putuje do výsledku. Preto každý
výsledok vie presne vymenovať, z ktorých tabuliek vznikol.

**Pravidlo farby výsledku** (`js/calc/core.js`, funkcia `grade`):

| situácia | farba |
|---|---|
| všetky kontroly OK a všetky použité dáta `verified: true` | 🟢 zelená |
| všetky kontroly OK, ale aspoň jedna hodnota `verified: false` | 🟠 oranžová |
| chýba vstup alebo tabuľková hodnota | 🟠 oranžová |
| niektorá kontrola nevyhovela | 🔴 červená |

Zelená teda **nemôže** vzniknúť z neoverenej hodnoty — je to tvrdé pravidlo vo
funkcii, nie konvencia v UI.

Užívateľské úpravy dát sa ukladajú do `localStorage` ako overlay
(`store.dataOverrides`), pôvodný súbor sa nemení. Obrazovka **Overenie dát**
ukáže každý dataset, dovolí hodnoty prepísať a prepnúť na „Overené“,
a celý overlay exportovať/importovať ako JSON.

## 3. Transparentnosť výpočtu

Každá výpočtová funkcia vracia:

```js
{
  status: 'ok' | 'warn' | 'fail',
  value, unit,
  steps:    [{ label, formula, substituted, result, source }],
  refs:     [dataRef, ...],      // použité tabuľky vrátane stavu overenia
  notes:    [...],               // upozornenia
  defaults: [{ what, value, why }],   // každý predvolený údaj, ktorý sme dosadili
  fixes:    [{ label, result }]  // konkrétne možnosti opravy s prepočtom
}
```

`defaults` je povinné — aplikácia nikdy nedosadí ticho. Čo nezadáš, to uvidíš
pri výsledku ako „predvolené“.

## 4. Dáta, ktoré NEVIEM overiť

Toto je úplný zoznam. Všetko nižšie je v `norms.js` označené
`verified: false` a musí sa skontrolovať proti papierovej/platnej norme. Hodnoty
tam sú ako **štartovacia osnova s predpokladaným zdrojom**, nie ako citát normy.

### 4.1 Prúdová zaťažiteľnosť (najkritickejšie)
- `ampacity.*` — tabuľky Iz pre spôsoby uloženia A1, A2, B1, B2, C, D1, D2, E, F,
  pre PVC a XLPE, Cu a Al, 2 a 3 zaťažené žily.
  Predpokladaný zdroj: IEC 60364-5-52 tab. B.52.2–B.52.13 / DIN VDE 0298-4 tab. 3
  / STN 33 2000-5-52. **Hodnoty sa medzi vydaniami a medzi VDE a IEC líšia.**
- Chýbajúce kombinácie (napr. XLPE Al v A1/A2) sú v súbore vedome prázdne —
  aplikácia vtedy povie „chýba tabuľková hodnota“ a dá oranžový výsledok.

### 4.2 Korekčné súčinitele
- `derate.ambientAir`, `derate.ambientGround` — teplota okolia a zeme.
- `derate.grouping*` — zoskupenie, tri varianty podľa spôsobu uloženia.
- `derate.soilResistivity` — merný tepelný odpor zeme (nie je v UI, len dataset).

### 4.3 Istenie
- `breaker.magneticMultiple` — násobok Ia pre B/C/D. Používam horné hranice
  (B=5, C=10, D=20). Normové rozsahy sú intervaly, výrobca sa môže líšiť.
- `fuse.gG.time` — prúdy pre odpojenie gG poistky v 0,4 s a 5 s.
  **Toto je najmenej spoľahlivá tabuľka v celej aplikácii.** Je odhad z typických
  vypínacích charakteristík, nie opis konkrétneho výrobku. Vždy použi krivku
  výrobcu.
- `breaker.i2Factor` — I2/In pre ističe (1,45) a gG poistky (1,6).
- Menovité rady ističov a poistiek — bežná rada, ale neoverená proti IEC 60898-1
  a IEC 60269.

### 4.4 Skratová odolnosť a odpojenie
- `shortCircuit.k` — súčiniteľ k (Cu/PVC 115, Cu/XLPE 143, Al/PVC 76,
  Al/XLPE 94, Cu >300 mm² 103). Zdroj: IEC 60364-4-43 tab. 43A.
- `faultLoop.cFactor` — súčiniteľ c (0,95). Niektoré podklady používajú 0,8
  pre overenie, iné 1,0 pre dimenzovanie. **Rozdiel VDE / STN tu nezjednocujem.**
- `faultLoop.maxDisconnectTime` — 0,4 s / 0,2 s / 5 s podľa typu obvodu a siete.
- Minimálny čas vypnutia ističa pri magnetickom vypnutí (default 0,1 s) je
  inženierska konvencia, nie normová hodnota.

### 4.5 Prierezy a materiál
- `minCrossSection` — minimálne prierezy pre pevné uloženie, svetelné obvody
  a obmedzenia hliníka. **Obmedzenia Al sa medzi DE a SK líšia a líšia sa aj
  podľa prevádzkovateľa siete.** Aplikácia to pri Al povie a nespojí to.
- `peSizing` — pravidlo S / 16 / S/2 pre PE.
- `conductivity` — κCu = 56, κAl = 35 m/(Ω·mm²). Toto je zadané v špecifikácii,
  je to hodnota pri ~20 °C. Pri prevádzkovej teplote je vodivosť nižšia, takže
  reálny úbytok je väčší. Označené `verified: true` ako **matematický vstup
  podľa zadania**, nie ako citát normy — a pri každom výsledku je o tom nóta.

### 4.6 Úbytok napätia
- `voltageDropLimits` — povolené percentá pre DE a SK, podľa typu obvodu.
  Predpokladaný zdroj: DIN 18015-1 (3 % od merania), TAB prevádzkovateľa,
  STN 33 2000-5-52 príloha G (3 % svetlo / 5 % ostatné).
  **Toto si prevádzkovateľ siete v Nemecku často určuje sám (TAB).** Hodnoty sú
  v nastaveniach editovateľné.
- `reactance` — X′ reaktancia kábla. Default je **0** (podľa kontrolných hodnôt
  v zadaní) a aplikácia to vždy vypíše ako predvolený údaj. Reálne 0,07–0,09
  mΩ/m pri väčších prierezoch; pri S ≥ 50 mm² aplikácia odporučí X′ zadať.

### 4.7 Motory
- `motor.contactorAC3` — priradenie stýkača k výkonu podľa AC-3. Veľmi závisí
  od výrobcu, je to len orientácia.
- `motor.startCurrentMultiple` — Ia/In pre priamy štart (6–8), Y/D (2–3),
  softštart, menič. Rozsahy, nie presné hodnoty.
- `motor.efficiencyDefault` — účinnosť podľa výkonu (IE3 orientačne).

### 4.8 Fotovoltika a wallbox
- `pv.tempCoefficient` — teplotný súčiniteľ Uoc (−0,25 až −0,35 %/K). Vždy
  z datasheetu panelu.
- `pv.minTemperature` — návrhová minimálna teplota (DE −10 °C, SK −15 °C).
  Predpoklad, nie norma.
- `pv.safetyFactor` — koeficient 1,25 pre Isc pri dimenzovaní.
- `wallbox.reportingRules` — ohlasovacie povinnosti. **Toto sa mení najčastejšie
  z celej aplikácie** (Nemecko: §19 NAV / Marktstammdatenregister, nad 12 kW
  schválenie VNB; Slovensko: ohlásenie distribútorovi). Texty sú orientačné
  a datované. Vždy si over aktuálne TAB a podmienky distribútora.
- `wallbox.rcdRequirement` — typ RCD a DC detekcia 6 mA. Závisí od toho, čo má
  wallbox zabudované.

### 4.9 Referenčné tabuľky
- Farby vodičov a staré značenia, zóny v kúpeľni, IP/IK, uťahovacie momenty,
  svorky stýkačov — všetko neoverené, momenty majú vždy prednosť od výrobcu.
- Preklad typov káblov SK ↔ DE (CYKY ↔ NYY/NYM a pod.) nie je 1:1. Aplikácia
  píše „blízky ekvivalent“, nie „to isté“.

### 4.10 Čo NIE JE neoverené
Overené sú len veci, ktoré si viem odvodiť matematicky a ktoré overujú testy:
vzorce úbytku napätia, prepočty kW/kVA/A, Ohmov zákon pre Zs a Ik,
k²S² ≥ I²t, geometrické rady prierezov, a kontrolné hodnoty zo zadania.

## 5. Offline

`sw.js` cachuje celý zoznam súborov (`PRECACHE`) pri inštalácii, potom beží
cache-first. Verzia cache je v konstante `CACHE` — pri zmene súborov ju treba
zvýšiť, inak telefón drží starú verziu. Dáta používateľa sú v `localStorage`,
service worker sa ich nikdy nedotkne.

## 6. Testy

```
node tests/run.mjs
```

Pokrývajú kontrolné hodnoty zo zadania, nulové a záporné vstupy, chýbajúce
údaje, nezmyselné kombinácie a pravidlo „neoverené ≠ zelená“.
