# Overenie noriem — záznam prieskumu (10.–11. 11. 2026)

Stav: **zapracované do `js/data/norms.js` 11. 11. 2026** (verzia dát 2026.11.11). Body 1–8 nižšie sú opravené a pokryté testami.
Texty noriem sú platené; hodnoty som porovnával s verejnými zdrojmi, ktoré ich citujú.

## Platné vydania (zistené)

| Norma | Stav | Zdroj |
|---|---|---|
| DIN VDE 0298-4 | platné vydanie **2023-06** + Berichtigung 1:2023-10 | din.de / dinmedia.de |
| DIN VDE 0100-410 | **2018-10** (0,4 s platí pre zásuvkové obvody do 63 A, pevné do 32 A) | forum-verlag.com, EIG wiki |
| DIN VDE 0100-430 | 2010-10 (Ib ≤ In ≤ Iz, I2 ≤ 1,45·Iz) | ABB príručka |
| DIN 18015-1 | úbytok najviac 3 % za elektromerom | ABB príručka |
| STN 33 2000-5-52 | vydanie 04/2012, platná; Oprava 1 (07/14), Zmena A11 (05/18), **Zmena A12 (11/23, povinná od 25. 11. 2025)**, Zmena A1 (11/25) | normy.normoff.gov.sk/norma/114149 |
| Wallbox DE | hlásenie pred uvedením do prevádzky (§19 ods. 2 NAV); **nad 12 kVA (≈11 kW) súhlas** VNB do 2 mesiacov; nad 4,2 kW a po 1. 1. 2024 riadenie podľa §14a EnWG | bundesnetzagentur.de |

Ďalšie dohľadané vydania: DIN VDE 0100-520:2023-06 (Beiblatt 2:2023-10), DIN VDE 0100-540:2024-06,
STN 33 2000-4-41:2019-03, STN 33 2000-5-54:2012 + A11:2018, STN 33 2000-7-722:2019-12.

Vydanie DIN VDE 0298-4:2023-06 podľa predhovoru odbornej knihy VDE Verlagu doplnilo tabuľku 9
(spôsoby uloženia 23 a 30–32) a prílohu C; o zmene hodnôt tabuľky 3 sa tam nepíše. Zdroj s hodnotami,
ktorý som prečítal, cituje vydanie 2013-06.

Nezistené: čo presne menia STN Zmena A12 a A1; vydanie DIN 18015-1 a STN 33 2000-4-43.

## Chyby nájdené v dátach aplikácie (treba opraviť)

Zdroj A = ABB „Kabel- und Leitungsdimensionierung" (DIN VDE 0298-4:2013-06, Tab. 3, 30 °C)
Zdroj B = Schneider Electrical Installation Guide (IEC 60364-5-52, tab. B.52.4, B.52.14–18, E.52.1, G.52.1; IEC 60364-4-43 tab. 43A; IEC 60364-4-41)

1. **`ampacityPvc` D2, 3 zaťažené žily — zlé hodnoty.**
   Správne podľa B (Cu 1,5–300): 19, 24, 33, 41, 54, 70, 92, 110, 130, 162, 193, 220, 246, 278, 320, 359.
   Al 16–300: 53, 69, 83, 99, 122, 148, 169, 189, 214, 250, 282.
   (V aplikácii sú tam hodnoty pre 2 žily v D1 — vychádza o 15–20 % viac, než kábel unesie.)
2. **`ampacityPvc` F — hodnoty 131, 162, 196… patria k 2 žilám, nie k 3.**
   Podľa A pre 3 žily: 25→110, 35→137, 50→167, 70→216, 95→264, 120→308 (dotýkajúce sa, trojuholník).
3. **Nemecko má pri 1,5 mm² iné hodnoty než IEC/STN:** A1 a A2, 2 žily = **15,5 A** (IEC 14,5 / 14).
   Treba rozdeliť tabuľku na DE a SK.
4. **`derateGrouping.bunched`:** pre 10 obvodov má byť 0,48 (v aplikácii 0,50); hodnoty pre 14 a 18 nie sú v IEC.
   IEC B.52.17: 1,00 0,80 0,70 0,65 0,60 0,57 0,54 0,52 0,50 (1–9), 12→0,45, 16→0,41, 20→0,38.
   VDE: 8→0,52, 10→0,48, 12→0,45, 14→0,43.
5. **`derateGrouping.buried` (D2, káble pri sebe):** 7→0,45, 8→0,43, 9→0,41, 12→0,36, 16→0,32, 20→0,29
   (v aplikácii 0,47 / 0,45 / 0,43 / 0,41). Pre D1 platí iná tabuľka (B.52.19) — nemám ju.
6. **`neutralSizing`:** podľa IEC E.52.1 — do 15 % súčiniteľ 1,0; 15–33 % 0,86; 33–45 % 0,86 z prúdu v N; nad 45 % 1,0 z prúdu v N.
7. **`faultLoop.maxTime`:** hranica koncového obvodu je 63 A pre zásuvky (nie 32 A).
8. **`wallboxRules.DE`:** doplniť §14a EnWG (nad 4,2 kW) a hranicu 12 kVA namiesto „12 kW".

## Čo sedí so zdrojmi (dá sa označiť ako skontrolované)

- `ampacityPvc` Cu, 2 a 3 žily, A1/A2/B1/B2/C/E, 1,5–120 mm² (zdroj A) — okrem bodu 3.
- `ampacityPvc` Cu aj Al, 3 žily, A1/A2/B1/B2/C/D1, 1,5–300 mm² (zdroj B).
- `derateAmbientAir`, `derateAmbientGround` — všetky hodnoty (A aj B).
- `shortCircuitK` 115 / 103 / 143 / 141, Al 76 / 94 / 93 (B); chýba Al PVC > 300 mm² = 68.
- `voltageDropLimits`: DE 3 % (A), SK/IEC 3 % svetlo, 5 % ostatné (B).
- časy odpojenia TN 0,4 s / 5 s, TT 0,2 s / 1 s (B); vypnutie ističa do 0,1 s; B = 5×In, C = 10×In (A).
- predvolená impedancia siete: ABB a Beiblatt 2 k VDE 0100-520 počítajú s 0,3 Ω (aplikácia 0,35 Ω).

## Čo sa mi overiť nepodarilo

- `ampacityPvc`: 2 žily nad 120 mm², D1/D2 pre 2 žily, hliník pre 2 žily.
- celé `ampacityXlpe`.
- `fuseDisconnectCurrent` (poistky gG), motory, FV, zóny v kúpeľni, pravidlá pre wallbox na Slovensku.
