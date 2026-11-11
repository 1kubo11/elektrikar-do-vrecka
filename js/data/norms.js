/**
 * NORMOVÉ DÁTA — jediný zdroj tabuľkových hodnôt.
 *
 * Tento súbor neobsahuje žiadne výpočty. Výpočtové moduly si hodnoty vyžiadajú
 * cez lookup() a dostanú spolu s hodnotou aj referenciu (krajina, norma,
 * vydanie, tabuľka, zdroj, stav overenia), ktorá putuje až do výsledku.
 *
 * STAV OVERENIA (prieskum 10.–11. 11. 2026)
 * Texty noriem sú platené a nemal som ich v ruke. verified:true znamená:
 * „každú hodnotu v tomto datasete som porovnal s verejným zdrojom, ktorý
 * normu cituje“ — zdroj je uvedený v `sources`. verified:false znamená, že
 * taký zdroj som nenašiel; hodnota je len orientačná a výsledok, ktorý sa
 * o ňu opiera, nikdy nebude zelený.
 */

export const DATA_VERSION = '2026.11.11';
export const CHECKED = '2026-11-11';

/* ───────────────────────── zdroje ───────────────────────── */

export const SOURCES = {
  abb: {
    name: 'ABB — Kabel- und Leitungsdimensionierung (2CDC400027D0104), tabuľky podľa DIN VDE 0298-4, DIN VDE 0100-430, DIN EN 60898-1',
    url: 'https://content.voltimum.com/de/118048/2cdc400027d0104_revd_02-2018_72dpi_0.pdf',
  },
  eigSizing: {
    name: 'Schneider Electric — Electrical Installation Guide: General method for cable sizing (IEC 60364-5-52, tab. B.52.4, B.52.14–B.52.18, E.52.1)',
    url: 'https://www.electrical-installation.org/enwiki/General_method_for_cable_sizing',
  },
  eigDrop: {
    name: 'Schneider Electric — Electrical Installation Guide: Maximum voltage drop limit (IEC 60364-5-52, tab. G.52.1)',
    url: 'https://www.electrical-installation.org/enwiki/Maximum_voltage_drop_limit',
  },
  eigK: {
    name: 'Schneider Electric — Electrical Installation Guide: withstand of cables under short-circuit (IEC 60364-4-43, tab. 43A)',
    url: 'https://www.electrical-installation.org/enwiki/Verification_of_the_withstand_capabilities_of_cables_under_short-circuit_conditions',
  },
  eigShock: {
    name: 'Schneider Electric — Electrical Installation Guide: maximum disconnecting times (IEC 60364-4-41)',
    url: 'https://www.electrical-installation.org/enwiki/Types_of_protection_against_electric_shock',
  },
  eigPe: {
    name: 'Schneider Electric — Electrical Installation Guide: Sizing of protective earthing conductor (IEC 60364-5-54)',
    url: 'https://www.electrical-installation.org/enwiki/Sizing_of_protective_earthing_conductor',
  },
  bnetza: {
    name: 'Bundesnetzagentur — otázky a odpovede k wallboxom (§ 19 NAV, § 14a EnWG)',
    url: 'https://www.bundesnetzagentur.de/DE/Vportal/Energie/E_Mobilitaet/_faq/Wallbox_table.html',
  },
  din0298: {
    name: 'DIN Media — DIN VDE 0298-4:2023-06 (záznam o norme)',
    url: 'https://www.dinmedia.de/en/standard/din-vde-0298-4/365464693',
  },
  normoff552: {
    name: 'ÚNMS SR — STN 33 2000-5-52 (záznam o norme a jej zmenách)',
    url: 'https://normy.normoff.gov.sk/norma/114149/',
  },
  spec: { name: 'Zadanie aplikácie (hodnota zvolená zadávateľom, nie normou)', url: '' },
};

/* ───────────────────── prehľad noriem a vydaní ───────────────────── */

/** found = vydanie som dohľadal vo verejnom zázname; inak ho treba overiť. */
export const STANDARDS = [
  { country: 'DE', id: 'DIN VDE 0298-4', edition: '2023-06 + Berichtigung 1:2023-10', found: true,
    topic: 'Koľko prúdu kábel unesie, spôsoby uloženia, prepočty na teplotu a zoskupenie',
    note: 'Nové vydanie doplnilo spôsoby uloženia v tabuľke 9 a prílohu C. Hodnoty tabuľky 3 som porovnal so zdrojom, ktorý cituje vydanie 2013-06.',
    url: 'https://www.dinmedia.de/en/standard/din-vde-0298-4/365464693' },
  { country: 'DE', id: 'DIN VDE 0100-410', edition: '2018-10', found: true,
    topic: 'Ochrana pred úrazom, časy odpojenia, chránič pri zásuvkách',
    note: 'Krátke časy odpojenia (0,4 s) platia pre zásuvkové obvody do 63 A a pevne pripojené spotrebiče do 32 A.',
    url: 'https://forum-verlag.com/blog-es/din-vde-0100-410-elektrischer-schlag' },
  { country: 'DE', id: 'DIN VDE 0100-430', edition: '2010-10', found: true,
    topic: 'Ochrana pri preťažení a skrate (Ib ≤ In ≤ Iz, I2 ≤ 1,45 · Iz)',
    note: 'Novšie vydanie som nenašiel.', url: '' },
  { country: 'DE', id: 'DIN VDE 0100-520', edition: '2023-06, Beiblatt 2:2023-10', found: true,
    topic: 'Káble a vedenia, úbytok napätia, najväčšie dĺžky vedení',
    note: 'Beiblatt 2 počíta najväčšie dĺžky s impedanciou siete 0,3 Ω.',
    url: 'https://www.dinmedia.de/en/standard/din-vde-0100-520/364929335' },
  { country: 'DE', id: 'DIN VDE 0100-540', edition: '2024-06', found: true,
    topic: 'Uzemnenie a ochranné vodiče (prierez PE)', note: 'Nahradila vydanie 2012-06.', url: '' },
  { country: 'DE', id: 'DIN 18015-1', edition: 'vydanie som nedohľadal', found: false,
    topic: 'Elektrické inštalácie v bytoch — úbytok napätia najviac 3 % za elektromerom', note: '', url: '' },
  { country: 'DE', id: 'DIN EN 60898-1 (VDE 0641-11)', edition: 'vydanie som nedohľadal', found: false,
    topic: 'Ističe B, C, D — kedy vypínajú', note: '', url: '' },
  { country: 'DE', id: '§ 19 NAV a § 14a EnWG', edition: 'stav 2026', found: true,
    topic: 'Hlásenie a schvaľovanie wallboxov',
    note: 'Wallbox sa hlási pred uvedením do prevádzky. Nad 12 kVA (asi 11 kW) treba súhlas prevádzkovateľa siete. Nad 4,2 kW platí riadenie podľa § 14a.',
    url: 'https://www.bundesnetzagentur.de/DE/Vportal/Energie/E_Mobilitaet/_faq/Wallbox_table.html' },

  { country: 'SK', id: 'STN 33 2000-5-52', edition: '04/2012 + Oprava 1 (07/14), Zmena A11 (05/18), Zmena A12 (11/23), Zmena A1 (11/25)', found: true,
    topic: 'Koľko prúdu kábel unesie, spôsoby uloženia, úbytok napätia',
    note: 'Zmena A12 je povinná od 25. 11. 2025. Čo presne zmeny A12 a A1 menia, som nezistil — ich texty sú platené.',
    url: 'https://normy.normoff.gov.sk/norma/114149/' },
  { country: 'SK', id: 'STN 33 2000-4-41', edition: '03/2019', found: true,
    topic: 'Ochrana pred zásahom elektrickým prúdom, časy odpojenia',
    note: 'Vydanie je citované v zázname ÚNMS; platnosť a zmeny som samostatne neoveroval.', url: '' },
  { country: 'SK', id: 'STN 33 2000-4-43', edition: 'vydanie som nedohľadal', found: false,
    topic: 'Ochrana pri nadprúde a skrate', note: '', url: '' },
  { country: 'SK', id: 'STN 33 2000-5-54', edition: '2012 + Zmena A11 (2018)', found: true,
    topic: 'Uzemnenie a ochranné vodiče (prierez PE)',
    note: 'Citované v zázname ÚNMS; platnosť som samostatne neoveroval.', url: '' },
  { country: 'SK', id: 'STN 33 2000-7-722', edition: '12/2019', found: true,
    topic: 'Napájanie elektrických vozidiel (wallbox)',
    note: 'Nahradila staršie vydanie. Podmienky distribútorov (ZSD, SSD, VSD) som nedohľadal.', url: '' },
];

/* ───────────────────────── rady a konštanty ───────────────────────── */

/** Normalizovaný rad prierezov [mm²] */
export const CROSS_SECTIONS = [
  1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300,
];

export const DATASETS = {
  /* ═══════════════════ 1. VODIVOSŤ A REAKTANCIA ═══════════════════ */
  conductivity: {
    id: 'conductivity',
    title: 'vodivosť medi a hliníka',
    country: 'BOTH',
    standard: 'Zadanie / fyzikálna konštanta',
    edition: '—',
    table: 'κ pri ~20 °C',
    verified: true,
    sources: ['spec'],
    note:
      'κCu = 56, κAl = 35 m/(Ω·mm²) podľa zadania. Je to hodnota pri ~20 °C. ' +
      'Pri prevádzkovej teplote vodiča (70/90 °C) je vodivosť nižšia a reálny ' +
      'úbytok napätia väčší (cca +15 až +20 %).',
    data: { Cu: 56, Al: 35 },
  },

  reactance: {
    id: 'reactance',
    title: 'reaktancia kábla',
    country: 'BOTH',
    standard: 'Zadanie — zjednodušenie',
    edition: '—',
    table: 'X′ [Ω/m]',
    verified: true,
    sources: ['spec'],
    note:
      'Predvolene X′ = 0 podľa kontrolných príkladov v zadaní. Nie je to hodnota ' +
      'z normy, je to vedomé zjednodušenie a pri výsledku sa vždy vypíše. ' +
      'Reálne 0,07–0,09 mΩ/m; pri S ≥ 50 mm² ju zadaj ručne.',
    data: { default: 0, typical: 0.00008 },
  },

  /* ═══════════════════ 2. PRÚDOVÁ ZAŤAŽITEĽNOSŤ Iz ═══════════════════
   * Kľúč: spôsob uloženia → materiál → počet zaťažených žíl → { prierez: A }
   * Referenčná teplota: vzduch 30 °C, zem 20 °C.
   * Tabuľka je rozdelená do datasetov podľa toho, čo sa podarilo porovnať
   * so zdrojom. Poradie hľadania určuje IZ_CHAIN nižšie.
   */

  /** Spoločné hodnoty HD 60364-5-52 — platia pre DIN VDE 0298-4 aj STN 33 2000-5-52. */
  izPvcHD: {
    id: 'izPvcHD',
    title: 'zaťažiteľnosť káblov s PVC izoláciou',
    country: 'BOTH',
    standard: 'HD 60364-5-52:2011 (IEC 60364-5-52:2009) — DIN VDE 0298-4:2023-06 tab. 3 a STN 33 2000-5-52:2012',
    edition: 'DE 2023-06 / SK 04/2012',
    table: 'B.52.2, B.52.4, B.52.10 (PVC 70 °C)',
    verified: true,
    sources: ['abb', 'eigSizing', 'din0298', 'normoff552'],
    note:
      '3 zaťažené žily (Cu aj Al, A1–D2, 1,5–300 mm²) sú porovnané s tabuľkou B.52.4. ' +
      '2 zaťažené žily a uloženia E, F (Cu, do 120 mm²) sú porovnané s tabuľkou 3 ' +
      'DIN VDE 0298-4, ktorá je nemeckým prevzatím toho istého harmonizačného ' +
      'dokumentu ako STN. Zdroj s hodnotami cituje vydanie 2013-06; vydanie 2023-06 ' +
      'podľa vydavateľa menilo tabuľku 9 a prílohu C, nie hodnoty tabuľky 3.',
    data: {
      A1: {
        Cu: {
          2: { 2.5: 19.5, 4: 26, 6: 34, 10: 46, 16: 61, 25: 80, 35: 99, 50: 119, 70: 151, 95: 182, 120: 210 },
          3: { 1.5: 13.5, 2.5: 18, 4: 24, 6: 31, 10: 42, 16: 56, 25: 73, 35: 89, 50: 108, 70: 136, 95: 164, 120: 188, 150: 216, 185: 245, 240: 286, 300: 328 },
        },
        Al: { 3: { 16: 43, 25: 57, 35: 70, 50: 84, 70: 107, 95: 129, 120: 149, 150: 170, 185: 194, 240: 227, 300: 261 } },
      },
      A2: {
        Cu: {
          2: { 2.5: 18.5, 4: 25, 6: 32, 10: 43, 16: 57, 25: 75, 35: 92, 50: 110, 70: 139, 95: 167, 120: 192 },
          3: { 1.5: 13, 2.5: 17.5, 4: 23, 6: 29, 10: 39, 16: 52, 25: 68, 35: 83, 50: 99, 70: 125, 95: 150, 120: 172, 150: 196, 185: 223, 240: 261, 300: 298 },
        },
        Al: { 3: { 16: 41, 25: 53, 35: 65, 50: 78, 70: 98, 95: 118, 120: 135, 150: 155, 185: 176, 240: 207, 300: 237 } },
      },
      B1: {
        Cu: {
          2: { 1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 101, 35: 125, 50: 151, 70: 192, 95: 232, 120: 269 },
          3: { 1.5: 15.5, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 110, 50: 134, 70: 171, 95: 207, 120: 239, 150: 262, 185: 296, 240: 346, 300: 394 },
        },
        Al: { 3: { 16: 53, 25: 70, 35: 86, 50: 104, 70: 133, 95: 161, 120: 186, 150: 204, 185: 230, 240: 269, 300: 306 } },
      },
      B2: {
        Cu: {
          2: { 1.5: 16.5, 2.5: 23, 4: 30, 6: 38, 10: 52, 16: 69, 25: 90, 35: 111, 50: 133, 70: 168, 95: 201, 120: 232 },
          3: { 1.5: 15, 2.5: 20, 4: 27, 6: 34, 10: 46, 16: 62, 25: 80, 35: 99, 50: 118, 70: 149, 95: 179, 120: 206, 150: 225, 185: 255, 240: 297, 300: 339 },
        },
        Al: { 3: { 16: 48, 25: 62, 35: 77, 50: 92, 70: 116, 95: 139, 120: 160, 150: 176, 185: 199, 240: 232, 300: 265 } },
      },
      C: {
        Cu: {
          2: { 1.5: 19.5, 2.5: 27, 4: 36, 6: 46, 10: 63, 16: 85, 25: 112, 35: 138, 50: 168, 70: 213, 95: 258, 120: 299 },
          3: { 1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 96, 35: 119, 50: 144, 70: 184, 95: 223, 120: 259, 150: 299, 185: 341, 240: 403, 300: 464 },
        },
        Al: { 3: { 16: 59, 25: 73, 35: 90, 50: 110, 70: 140, 95: 170, 120: 197, 150: 227, 185: 259, 240: 305, 300: 351 } },
      },
      D1: {
        Cu: { 3: { 1.5: 18, 2.5: 24, 4: 30, 6: 38, 10: 50, 16: 64, 25: 82, 35: 98, 50: 116, 70: 143, 95: 169, 120: 192, 150: 217, 185: 243, 240: 280, 300: 316 } },
        Al: { 3: { 16: 50, 25: 64, 35: 77, 50: 91, 70: 112, 95: 132, 120: 150, 150: 169, 185: 190, 240: 218, 300: 247 } },
      },
      D2: {
        Cu: { 3: { 1.5: 19, 2.5: 24, 4: 33, 6: 41, 10: 54, 16: 70, 25: 92, 35: 110, 50: 130, 70: 162, 95: 193, 120: 220, 150: 246, 185: 278, 240: 320, 300: 359 } },
        Al: { 3: { 16: 53, 25: 69, 35: 83, 50: 99, 70: 122, 95: 148, 120: 169, 150: 189, 185: 214, 240: 250, 300: 282 } },
      },
      E: {
        Cu: {
          2: { 1.5: 22, 2.5: 30, 4: 40, 6: 51, 10: 70, 16: 94, 25: 119, 35: 148, 50: 180, 70: 232, 95: 282, 120: 328 },
          3: { 1.5: 18.5, 2.5: 25, 4: 34, 6: 43, 10: 60, 16: 80, 25: 101, 35: 126, 50: 153, 70: 196, 95: 238, 120: 276 },
        },
      },
      F: {
        Cu: {
          2: { 25: 131, 35: 162, 50: 196, 70: 251, 95: 304, 120: 352 },
          /* 3 žily: nižší z dvoch stĺpcov zdroja (114 / 110 pri 25 mm²) */
          3: { 25: 110, 35: 137, 50: 167, 70: 216, 95: 264, 120: 308 },
        },
      },
    },
  },

  /** Nemecká odchýlka od HD pri 1,5 mm² (poznámka 3 k tabuľke 3, príloha C.3.3). */
  izPvcDE: {
    id: 'izPvcDE',
    title: 'zaťažiteľnosť 1,5 mm² v zateplenej stene (Nemecko)',
    country: 'DE',
    standard: 'DIN VDE 0298-4:2023-06',
    edition: '2023-06',
    table: 'tab. 3, poznámka k 1,5 mm² (A1, A2 — 2 zaťažené žily)',
    verified: true,
    sources: ['abb', 'din0298'],
    note:
      'V Nemecku platí pre 1,5 mm² a 2 zaťažené žily v uloženiach A1 a A2 hodnota 15,5 A. ' +
      'Je to národná odchýlka — v IEC/STN je hodnota nižšia.',
    data: {
      A1: { Cu: { 2: { 1.5: 15.5 } } },
      A2: { Cu: { 2: { 1.5: 15.5 } } },
    },
  },

  /** Zvyšok tabuľky PVC — nenašiel som zdroj, s ktorým by sa dal porovnať. */
  izPvcRest: {
    id: 'izPvcRest',
    title: 'zaťažiteľnosť káblov s PVC — časť tabuľky bez overeného zdroja',
    country: 'BOTH',
    standard: 'IEC 60364-5-52 / DIN VDE 0298-4 / STN 33 2000-5-52',
    edition: 'neoverené',
    table: 'B.52.2, B.52.10, B.52.11 (2 zaťažené žily nad 120 mm², zem, hliník, E a F nad 120 mm²)',
    verified: false,
    sources: [],
    note:
      'Hodnoty, ktoré sa mi nepodarilo porovnať s verejným zdrojom: 2 zaťažené žily ' +
      'nad 120 mm², 2 žily v zemi (D1, D2), hliník pri 2 žilách, 1,5 mm² v A1/A2 podľa ' +
      'IEC/STN, uloženia E a F nad 120 mm². Pre hliník v zemi pri 2 žilách hodnoty ' +
      'vedome chýbajú. Pred použitím ich skontroluj v norme.',
    data: {
      A1: {
        Cu: { 2: { 1.5: 14.5, 150: 240, 185: 273, 240: 321, 300: 367 } },
        Al: { 2: { 16: 47, 25: 61, 35: 75, 50: 91, 70: 116, 95: 139, 120: 160, 150: 183, 185: 208, 240: 245, 300: 280 } },
      },
      A2: {
        Cu: { 2: { 1.5: 14, 150: 219, 185: 248, 240: 291, 300: 334 } },
        Al: { 2: { 16: 44, 25: 58, 35: 71, 50: 86, 70: 108, 95: 130, 120: 150, 150: 172, 185: 195, 240: 229, 300: 263 } },
      },
      B1: {
        Cu: { 2: { 150: 300, 185: 341, 240: 400, 300: 458 } },
        Al: { 2: { 16: 59, 25: 78, 35: 97, 50: 118, 70: 150, 95: 181, 120: 210, 150: 234, 185: 266, 240: 312, 300: 358 } },
      },
      B2: {
        Cu: { 2: { 150: 258, 185: 294, 240: 344, 300: 394 } },
        Al: { 2: { 16: 54, 25: 71, 35: 86, 50: 104, 70: 131, 95: 157, 120: 181, 150: 201, 185: 230, 240: 269, 300: 308 } },
      },
      C: {
        Cu: { 2: { 150: 344, 185: 392, 240: 461, 300: 530 } },
        Al: { 2: { 16: 66, 25: 83, 35: 103, 50: 125, 70: 160, 95: 195, 120: 226, 150: 261, 185: 298, 240: 352, 300: 406 } },
      },
      D1: {
        Cu: { 2: { 1.5: 22, 2.5: 29, 4: 38, 6: 47, 10: 63, 16: 81, 25: 104, 35: 125, 50: 148, 70: 183, 95: 216, 120: 246, 150: 278, 185: 312, 240: 361, 300: 408 } },
        Al: {},
      },
      D2: {
        Cu: { 2: { 1.5: 22, 2.5: 28, 4: 38, 6: 48, 10: 64, 16: 83, 25: 110, 35: 132, 50: 156, 70: 192, 95: 230, 120: 261, 150: 293, 185: 331, 240: 382, 300: 427 } },
        Al: {},
      },
      E: {
        Cu: {
          2: { 150: 379, 185: 434, 240: 514, 300: 593 },
          3: { 150: 319, 185: 364, 240: 430, 300: 497 },
        },
        Al: {
          2: { 16: 73, 25: 89, 35: 111, 50: 135, 70: 173, 95: 210, 120: 244, 150: 282, 185: 322, 240: 380, 300: 439 },
          3: { 16: 61, 25: 78, 35: 96, 50: 117, 70: 150, 95: 183, 120: 212, 150: 245, 185: 280, 240: 330, 300: 381 },
        },
      },
      F: {
        Cu: {
          2: { 150: 406, 185: 463, 240: 546, 300: 629 },
          3: { 150: 356, 185: 409, 240: 485, 300: 561 },
        },
        Al: {
          2: { 25: 98, 35: 122, 50: 149, 70: 192, 95: 235, 120: 273, 150: 316, 185: 363, 240: 430, 300: 497 },
          3: { 25: 84, 35: 105, 50: 128, 70: 166, 95: 203, 120: 237, 150: 274, 185: 315, 240: 375, 300: 434 },
        },
      },
    },
  },

  izXlpe: {
    id: 'izXlpe',
    title: 'zaťažiteľnosť káblov s XLPE izoláciou',
    country: 'BOTH',
    standard: 'IEC 60364-5-52 / DIN VDE 0298-4 / STN 33 2000-5-52',
    edition: 'neoverené',
    table: 'B.52.3, B.52.5, B.52.12, B.52.13 (XLPE 90 °C)',
    verified: false,
    sources: [],
    note:
      'Pre XLPE (90 °C) som nenašiel verejný zdroj, s ktorým by sa hodnoty dali ' +
      'porovnať. Uloženia A1, A2, D1 a D2 vedome chýbajú — aplikácia povie ' +
      '„chýba tabuľková hodnota“ namiesto odhadu. V budovách sa navyše aj XLPE káble ' +
      'zaťažujú len do 70 °C, lebo na to sú stavané svorky a prístroje.',
    data: {
      B1: {
        Cu: {
          2: { 1.5: 23, 2.5: 31, 4: 42, 6: 54, 10: 75, 16: 100, 25: 133, 35: 164, 50: 198, 70: 253, 95: 306, 120: 354, 150: 393, 185: 449, 240: 528, 300: 603 },
          3: { 1.5: 20, 2.5: 28, 4: 37, 6: 48, 10: 66, 16: 88, 25: 117, 35: 144, 50: 175, 70: 222, 95: 269, 120: 312, 150: 342, 185: 384, 240: 450, 300: 514 },
        },
        Al: {
          2: { 16: 78, 25: 104, 35: 129, 50: 155, 70: 198, 95: 241, 120: 280, 150: 311, 185: 356, 240: 419, 300: 480 },
          3: { 16: 69, 25: 92, 35: 113, 50: 137, 70: 175, 95: 213, 120: 247, 150: 271, 185: 305, 240: 358, 300: 409 },
        },
      },
      B2: {
        Cu: {
          2: { 1.5: 22, 2.5: 30, 4: 40, 6: 51, 10: 69, 16: 91, 25: 119, 35: 146, 50: 175, 70: 221, 95: 265, 120: 305, 150: 334, 185: 384, 240: 459, 300: 532 },
          3: { 1.5: 19.5, 2.5: 26, 4: 35, 6: 44, 10: 60, 16: 80, 25: 105, 35: 128, 50: 154, 70: 194, 95: 233, 120: 268, 150: 300, 185: 340, 240: 398, 300: 455 },
        },
        Al: {
          2: { 16: 73, 25: 95, 35: 115, 50: 138, 70: 175, 95: 210, 120: 242, 150: 265, 185: 305, 240: 359, 300: 415 },
          3: { 16: 63, 25: 82, 35: 101, 50: 122, 70: 153, 95: 184, 120: 212, 150: 233, 185: 266, 240: 312, 300: 358 },
        },
      },
      C: {
        Cu: {
          2: { 1.5: 24, 2.5: 33, 4: 45, 6: 58, 10: 80, 16: 107, 25: 138, 35: 171, 50: 209, 70: 269, 95: 328, 120: 382, 150: 441, 185: 506, 240: 599, 300: 693 },
          3: { 1.5: 22, 2.5: 30, 4: 40, 6: 52, 10: 71, 16: 96, 25: 119, 35: 147, 50: 179, 70: 229, 95: 278, 120: 322, 150: 371, 185: 424, 240: 500, 300: 576 },
        },
        Al: {
          2: { 16: 84, 25: 107, 35: 133, 50: 163, 70: 202, 95: 247, 120: 287, 150: 330, 185: 377, 240: 445, 300: 514 },
          3: { 16: 73, 25: 89, 35: 111, 50: 135, 70: 173, 95: 210, 120: 244, 150: 282, 185: 322, 240: 380, 300: 439 },
        },
      },
      E: {
        Cu: {
          2: { 1.5: 26, 2.5: 36, 4: 49, 6: 63, 10: 86, 16: 115, 25: 149, 35: 185, 50: 225, 70: 289, 95: 352, 120: 410, 150: 473, 185: 542, 240: 641, 300: 741 },
          3: { 1.5: 23, 2.5: 32, 4: 42, 6: 54, 10: 75, 16: 100, 25: 127, 35: 158, 50: 192, 70: 246, 95: 298, 120: 346, 150: 399, 185: 456, 240: 538, 300: 621 },
        },
        Al: {
          2: { 16: 91, 25: 112, 35: 139, 50: 169, 70: 217, 95: 265, 120: 308, 150: 356, 185: 407, 240: 482, 300: 557 },
          3: { 16: 77, 25: 97, 35: 120, 50: 146, 70: 187, 95: 227, 120: 263, 150: 304, 185: 347, 240: 409, 300: 471 },
        },
      },
      F: {
        Cu: {
          2: { 25: 161, 35: 200, 50: 242, 70: 310, 95: 377, 120: 437, 150: 504, 185: 575, 240: 679, 300: 783 },
          3: { 25: 135, 35: 169, 50: 207, 70: 268, 95: 328, 120: 383, 150: 444, 185: 510, 240: 607, 300: 703 },
        },
        Al: {
          2: { 25: 121, 35: 150, 50: 184, 70: 237, 95: 289, 120: 337, 150: 389, 185: 447, 240: 530, 300: 613 },
          3: { 25: 103, 35: 129, 50: 159, 70: 206, 95: 253, 120: 296, 150: 343, 185: 395, 240: 471, 300: 547 },
        },
      },
      A1: { Cu: {}, Al: {} },
      A2: { Cu: {}, Al: {} },
      D1: { Cu: {}, Al: {} },
      D2: { Cu: {}, Al: {} },
    },
  },

  /* ═══════════════════ 3. KOREKČNÉ SÚČINITELE ═══════════════════ */
  derateAmbientAir: {
    id: 'derateAmbientAir',
    title: 'prepočet na teplotu vzduchu',
    country: 'BOTH',
    standard: 'IEC 60364-5-52 / DIN VDE 0298-4:2023-06 / STN 33 2000-5-52',
    edition: 'DE 2023-06 / SK 04/2012',
    table: 'B.52.14 (vzduch, ref. 30 °C)',
    verified: true,
    sources: ['eigSizing', 'abb'],
    note: 'Prepočet na teplotu okolitého vzduchu. Referencia 30 °C. Hodnoty sa zhodujú v oboch zdrojoch.',
    data: {
      PVC: { 10: 1.22, 15: 1.17, 20: 1.12, 25: 1.06, 30: 1.0, 35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71, 55: 0.61, 60: 0.5 },
      XLPE: { 10: 1.15, 15: 1.12, 20: 1.08, 25: 1.04, 30: 1.0, 35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82, 55: 0.76, 60: 0.71, 65: 0.65, 70: 0.58, 75: 0.5, 80: 0.41 },
    },
  },

  derateAmbientGround: {
    id: 'derateAmbientGround',
    title: 'prepočet na teplotu zeme',
    country: 'BOTH',
    standard: 'IEC 60364-5-52 / STN 33 2000-5-52',
    edition: 'IEC 2009 / SK 04/2012',
    table: 'B.52.15 (zem, ref. 20 °C)',
    verified: true,
    sources: ['eigSizing'],
    note: 'Prepočet na teplotu zeme. Referencia 20 °C. Platí pre D1, D2.',
    data: {
      PVC: { 10: 1.1, 15: 1.05, 20: 1.0, 25: 0.95, 30: 0.89, 35: 0.84, 40: 0.77, 45: 0.71, 50: 0.63, 55: 0.55, 60: 0.45 },
      XLPE: { 10: 1.07, 15: 1.04, 20: 1.0, 25: 0.96, 30: 0.93, 35: 0.89, 40: 0.85, 45: 0.8, 50: 0.76, 55: 0.71, 60: 0.65, 65: 0.6, 70: 0.53, 75: 0.46, 80: 0.38 },
    },
  },

  derateGrouping: {
    id: 'derateGrouping',
    title: 'zníženie pri viacerých kábloch pri sebe',
    country: 'BOTH',
    standard: 'IEC 60364-5-52 / DIN VDE 0298-4:2023-06 / STN 33 2000-5-52',
    edition: 'DE 2023-06 / SK 04/2012',
    table: 'B.52.17 (vzduch, stena, rošt) a B.52.18 (priamo v zemi)',
    verified: true,
    sources: ['eigSizing', 'abb'],
    note:
      '"bunched" = zviazané alebo v trubke či lište, "singleLayer" = jedna vrstva na ' +
      'stene alebo plnom rošte, "perforatedTray" = jedna vrstva na dierovanom rošte, ' +
      '"buried" = priamo v zemi, káble sa dotýkajú. Keď presný počet nie je v tabuľke, ' +
      'použije sa najbližší vyšší (prísnejší).',
    data: {
      bunched: { 1: 1.0, 2: 0.8, 3: 0.7, 4: 0.65, 5: 0.6, 6: 0.57, 7: 0.54, 8: 0.52, 9: 0.5, 10: 0.48, 12: 0.45, 14: 0.43, 16: 0.41, 20: 0.38 },
      singleLayer: { 1: 1.0, 2: 0.85, 3: 0.79, 4: 0.75, 5: 0.73, 6: 0.72, 7: 0.72, 8: 0.71, 9: 0.7 },
      perforatedTray: { 1: 1.0, 2: 0.88, 3: 0.82, 4: 0.77, 5: 0.75, 6: 0.73, 7: 0.73, 8: 0.72, 9: 0.72 },
      buried: { 1: 1.0, 2: 0.75, 3: 0.65, 4: 0.6, 5: 0.55, 6: 0.5, 7: 0.45, 8: 0.43, 9: 0.41, 12: 0.36, 16: 0.32, 20: 0.29 },
    },
  },

  derateGroupingDucts: {
    id: 'derateGroupingDucts',
    title: 'zníženie pri viacerých chráničkách v zemi',
    country: 'BOTH',
    standard: 'IEC 60364-5-52',
    edition: 'neoverené',
    table: 'B.52.19 (káble v chráničkách v zemi)',
    verified: false,
    sources: [],
    note: 'Pre káble v chráničkách v zemi (D1) platí iná tabuľka než pre káble priamo v zemi. Nenašiel som zdroj na porovnanie.',
    data: {
      buriedDucts: { 1: 1.0, 2: 0.85, 3: 0.75, 4: 0.7, 5: 0.65, 6: 0.6 },
    },
  },

  /** Ktorý typ zoskupenia patrí ku ktorému spôsobu uloženia. */
  groupingByMethod: {
    id: 'groupingByMethod',
    title: 'aké zoskupenie patrí k uloženiu',
    country: 'BOTH',
    standard: 'IEC 60364-5-52',
    edition: 'IEC 2009',
    table: 'B.52.17, stĺpec „Reference methods“',
    verified: true,
    sources: ['eigSizing'],
    note:
      'Priradenie riadku tabuľky k spôsobu uloženia. Pri uložení C počítam s jednou ' +
      'vrstvou káblov vedľa seba; keď sú zviazané do zväzku, platí prísnejší riadok.',
    data: { A1: 'bunched', A2: 'bunched', B1: 'bunched', B2: 'bunched', C: 'singleLayer', D1: 'buriedDucts', D2: 'buried', E: 'perforatedTray', F: 'perforatedTray' },
  },

  /* ═══════════════════ 4. SPÔSOBY ULOŽENIA (popis) ═══════════════════ */
  installMethods: {
    id: 'installMethods',
    title: 'popisy spôsobov uloženia',
    country: 'BOTH',
    standard: 'IEC 60364-5-52 tab. A.52.3 / DIN VDE 0298-4 tab. 9',
    edition: '—',
    table: 'popisy spôsobov uloženia',
    verified: true,
    sources: ['eigSizing', 'abb'],
    note: 'Popisy sú zjednodušené pre prácu na stavbe, nie presné citácie.',
    data: {
      A1: { sk: 'Jednotlivé vodiče v trubke v tepelne izolovanej stene', de: 'Einzelne Adern im Rohr in wärmegedämmter Wand', hint: 'Najhoršie chladenie. Trubka v sadrokartóne s vatou.' },
      A2: { sk: 'Viacžilový kábel v trubke v tepelne izolovanej stene', de: 'Mehradriges Kabel im Rohr in wärmegedämmter Wand', hint: 'Celý kábel v trubke v izolovanej stene.' },
      B1: { sk: 'Jednotlivé vodiče v trubke na stene / v lište', de: 'Einzelne Adern im Rohr auf der Wand', hint: 'Klasická trubka v murive alebo na povrchu. H07V-K.' },
      B2: { sk: 'Viacžilový kábel v trubke na stene / v lište', de: 'Mehradriges Kabel im Rohr auf der Wand', hint: 'NYM v chráničke pod omietkou — najčastejší prípad v byte.' },
      C: { sk: 'Kábel priamo na stene, strope alebo v plnom rošte', de: 'Kabel direkt auf der Wand / Decke', hint: 'NYM/CYKY priskrutkovaný na povrch alebo priamo v omietke. Dobré chladenie.' },
      D1: { sk: 'Kábel v chráničke v zemi', de: 'Kabel im Rohr in der Erde', hint: 'Zemný kábel v KOPOFLEX chráničke.' },
      D2: { sk: 'Kábel priamo v zemi', de: 'Kabel direkt in der Erde', hint: 'NYY/CYKY uložený do pieskového lôžka.' },
      E: { sk: 'Viacžilový kábel voľne vo vzduchu / dierovaný rošt', de: 'Mehradriges Kabel frei in Luft / Lochkanal', hint: 'Na dierovanom rošte, vzduch zo všetkých strán.' },
      F: { sk: 'Jednožilové káble voľne vo vzduchu, dotýkajúce sa', de: 'Einadrige Kabel frei in Luft, sich berührend', hint: 'Veľké prierezy, prívody do rozvádzačov.' },
    },
  },

  /* ═══════════════════ 5. ISTENIE ═══════════════════ */
  breakerRatings: {
    id: 'breakerRatings',
    title: 'vyrábané veľkosti ističov a poistiek',
    country: 'BOTH',
    standard: 'Výrobný rad (nie normová tabuľka)',
    edition: '—',
    table: 'menovité prúdy',
    verified: true,
    sources: ['abb'],
    note: 'Bežne vyrábané veľkosti. Nie je to hodnota z normy, len zoznam, z ktorého sa vyberá.',
    data: {
      mcb: [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125],
      gG: [2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400],
      nh: [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630],
    },
  },

  breakerMagnetic: {
    id: 'breakerMagnetic',
    title: 'pri akom prúde istič B a C vypne okamžite',
    country: 'BOTH',
    standard: 'DIN EN 60898-1 (VDE 0641-11) / IEC 60898-1',
    edition: 'vydanie nedohľadané',
    table: 'pásmo okamžitého vypnutia',
    verified: true,
    sources: ['abb'],
    note:
      'Počítam s HORNOU hranicou pásma, pri ktorej istič vypne do 0,1 s: ' +
      'B = 5×In (pásmo 3–5), C = 10×In (pásmo 5–10).',
    data: {
      B: { multiple: 5, range: '3–5×In' },
      C: { multiple: 10, range: '5–10×In' },
    },
  },

  breakerMagneticD: {
    id: 'breakerMagneticD',
    title: 'pri akom prúde vypne istič D',
    country: 'BOTH',
    standard: 'IEC 60898-1',
    edition: 'neoverené',
    table: 'pásmo okamžitého vypnutia, charakteristika D',
    verified: false,
    sources: [],
    note: 'Pre charakteristiku D (10–20×In) som nenašiel zdroj na porovnanie. Počítam s 20×In.',
    data: {
      D: { multiple: 20, range: '10–20×In' },
    },
  },

  breakerI2Factor: {
    id: 'breakerI2Factor',
    title: 'pri akom preťažení istič B a C určite vypne',
    country: 'BOTH',
    standard: 'DIN EN 60898-1 (VDE 0641-11) / DIN VDE 0100-430:2010-10',
    edition: '0100-430: 2010-10',
    table: 'dohodnutý vypínací prúd I2',
    verified: true,
    sources: ['abb'],
    note:
      'Istič B a C má I2 = 1,45·In. Podmienka I2 ≤ 1,45·Iz je preto splnená vždy, keď In ≤ Iz.',
    data: { B: 1.45, C: 1.45 },
  },

  breakerI2FactorOther: {
    id: 'breakerI2FactorOther',
    title: 'pri akom preťažení vypne poistka, istič D a istič motora',
    country: 'BOTH',
    standard: 'IEC 60269-1 / IEC 60898-1 / IEC 60947-2',
    edition: 'neoverené',
    table: 'dohodnutý vypínací prúd I2',
    verified: false,
    sources: [],
    note:
      'Poistka gG: I2 = 1,6·In, preto treba In ≤ 0,906·Iz. Pre poistky, istič D a istič ' +
      'motora som nenašiel zdroj na porovnanie.',
    data: { D: 1.45, gG: 1.6, nh: 1.6, motor: 1.45 },
  },

  fuseDisconnectCurrent: {
    id: 'fuseDisconnectCurrent',
    title: 'pri akom prúde poistka vypne včas',
    country: 'BOTH',
    standard: 'Odhad z typických charakteristík — nie norma',
    edition: '—',
    table: 'prúd pre odpojenie v 0,4 s a 5 s [A]',
    verified: false,
    sources: [],
    note:
      'NAJMENEJ SPOĽAHLIVÁ TABUĽKA V APLIKÁCII. Nie je to opis konkrétneho ' +
      'výrobku ani citát normy. Pre poistky VŽDY použi vypínaciu krivku výrobcu.',
    data: {
      gG: {
        0.4: { 16: 85, 20: 110, 25: 130, 32: 170, 40: 220, 50: 280, 63: 350, 80: 450, 100: 580, 125: 750, 160: 930, 200: 1200 },
        5: { 16: 59, 20: 78, 25: 95, 32: 125, 40: 160, 50: 200, 63: 250, 80: 320, 100: 400, 125: 500, 160: 630, 200: 800 },
      },
    },
  },

  rcdTypes: {
    id: 'rcdTypes',
    title: 'typy prúdových chráničov',
    country: 'BOTH',
    standard: 'IEC 62423 / DIN VDE 0664',
    edition: 'neoverené',
    table: 'typy RCD',
    verified: false,
    sources: [],
    note: 'Prehľad typov chráničov a kde sa používajú. Orientačné.',
    data: {
      AC: { sk: 'Typ AC — len striedavý reziduálny prúd', de: 'Typ AC', use: 'V DE sa pre nové inštalácie bežne nepoužíva.' },
      A: { sk: 'Typ A — striedavý + pulzujúci jednosmerný', de: 'Typ A', use: 'Štandard pre zásuvkové a svetelné obvody.' },
      F: { sk: 'Typ F — ako A + zmiešané frekvencie', de: 'Typ F', use: 'Pračky, sušičky, 1f frekvenčné meniče.' },
      B: { sk: 'Typ B — ako F + hladký jednosmerný prúd', de: 'Typ B', use: 'FV striedače bez oddeľovacieho trafa, 3f meniče.' },
      Bplus: { sk: 'Typ B+ — ako B, citlivý do vyššej frekvencie', de: 'Typ B+', use: 'Niektoré wallboxy a špeciálne aplikácie.' },
    },
  },

  /* ═══════════════════ 6. SKRAT A ODPOJENIE ═══════════════════ */
  shortCircuitK: {
    id: 'shortCircuitK',
    title: 'koľko tepla kábel znesie pri skrate',
    country: 'BOTH',
    standard: 'IEC 60364-4-43 / DIN VDE 0100-430:2010-10, 0100-540:2024-06',
    edition: 'IEC / DE 2010-10',
    table: 'tab. 43A (súčiniteľ k)',
    verified: true,
    sources: ['eigK', 'abb'],
    note:
      'Súčiniteľ k pre k²·S² ≥ I²·t. Platí pre vodiče, ktoré sa pri skrate ' +
      'ohrejú z prevádzkovej na dovolenú teplotu.',
    data: {
      Cu: { PVC: 115, XLPE: 143, rubber: 141, PVC_over300: 103 },
      Al: { PVC: 76, XLPE: 94, rubber: 93, PVC_over300: 68 },
    },
  },

  faultLoop: {
    id: 'faultLoop',
    title: 'časy odpojenia pri poruche (siete TN a TT)',
    country: 'BOTH',
    standard: 'IEC 60364-4-41 / DIN VDE 0100-410:2018-10 / STN 33 2000-4-41:2019',
    edition: 'DE 2018-10 / SK 03/2019',
    table: 'tab. 41.1 — najdlhšie časy odpojenia pri U0 = 230 V',
    verified: true,
    sources: ['eigShock', 'abb', 'spec'],
    note:
      'TN: 0,4 s, TT: 0,2 s — pre zásuvkové obvody do 63 A a pevne pripojené spotrebiče ' +
      'do 32 A. Ostatné obvody: TN 5 s, TT 1 s. Aplikácia berie krátky čas pre všetko ' +
      'do 63 A (prísnejšia strana). Istič pri magnetickom vypnutí vypne do 0,1 s. ' +
      'Súčiniteľ c = 0,95 je hodnota zo zadania, nie z normy: IEC pozná aj konvenčnú ' +
      'metódu s 0,8 a DIN VDE 0100-600 pri meraní s 2/3. Predvolená impedancia siete ' +
      '0,3 Ω je hodnota, s ktorou počíta Beiblatt 2 k DIN VDE 0100-520 — je to odhad, ' +
      'skutočnú treba zmerať.',
    data: {
      cFactor: 0.95,
      defaultZe: 0.3,
      finalCircuitMaxA: 63,
      maxTime: {
        TN: { final: 0.4, distribution: 5 },
        TT: { final: 0.2, distribution: 1 },
      },
      instantTripTime: 0.1,
    },
  },

  faultLoopIT: {
    id: 'faultLoopIT',
    title: 'časy odpojenia v sieti IT',
    country: 'BOTH',
    standard: 'IEC 60364-4-41',
    edition: 'neoverené',
    table: 'sieť IT — druhá porucha',
    verified: false,
    sources: [],
    note: 'V sieti IT sa odpojenie posudzuje až pri druhej poruche a inak. Hodnoty sú len orientačné.',
    data: {
      maxTime: { IT: { final: 0.4, distribution: 5 } },
    },
  },

  netTypes: {
    id: 'netTypes',
    title: 'typy sietí',
    country: 'BOTH',
    standard: 'IEC 60364-1',
    edition: 'neoverené',
    table: 'typy sietí',
    verified: false,
    sources: [],
    note: 'Popisy sietí, zjednodušené.',
    data: {
      'TN-C': { sk: 'PEN vodič — ochranný a nulový spojený v celej sieti', de: 'TN-C (PEN)', warn: 'V novej inštalácii v DE aj SK sa nepoužíva. Nedá sa použiť RCD za PEN.' },
      'TN-S': { sk: 'PE a N oddelené od zdroja', de: 'TN-S', warn: '' },
      'TN-C-S': { sk: 'PEN do bodu rozdelenia, potom PE a N oddelene', de: 'TN-C-S', warn: 'Najčastejší prípad. Bod rozdelenia musí byť uzemnený.' },
      'TT': { sk: 'Vlastný zemnič, PE nie je od zdroja', de: 'TT', warn: 'Ochrana samočinným odpojením takmer vždy vyžaduje RCD.' },
      'IT': { sk: 'Izolovaný zdroj alebo uzemnený cez impedanciu', de: 'IT', warn: 'Priemysel, nemocnice. Vyžaduje hlásič izolačného stavu.' },
    },
  },

  /* ═══════════════════ 7. PRIEREZY A MATERIÁL ═══════════════════ */
  minCrossSection: {
    id: 'minCrossSection',
    title: 'najmenšie dovolené prierezy a pravidlá pre hliník',
    country: 'BOTH',
    standard: 'IEC 60364-5-52 tab. 52.2 / DIN VDE 0100-520:2023-06 / STN 33 2000-5-52',
    edition: 'neoverené',
    table: 'minimálne prierezy',
    verified: false,
    sources: [],
    note:
      'Minimálne prierezy pre pevné uloženie. Obmedzenia hliníka sa medzi DE a SK ' +
      'LÍŠIA a navyše závisia od prevádzkovateľa siete. Nenašiel som zdroj na porovnanie.',
    data: {
      DE: { powerCu: 1.5, lightingCu: 1.5, minAl: 16, alNote: 'V Nemecku sa Al v bytových rozvodoch bežne nepoužíva. Pre prívody sa používa NAYY od 16 mm². Svorky musia byť schválené pre Al (Al/Cu), s uťahovacím momentom od výrobcu.' },
      SK: { powerCu: 1.5, lightingCu: 1.5, minAl: 16, alNote: 'Na Slovensku je AYKY pre prívody bežné. Minimálny prierez Al a podmienky použitia si over v STN 33 2000-5-52 a u distribútora.' },
    },
  },

  peSizing: {
    id: 'peSizing',
    title: 'prierez ochranného vodiča',
    country: 'BOTH',
    standard: 'IEC 60364-5-54 / DIN VDE 0100-540:2024-06 / STN 33 2000-5-54:2012',
    edition: 'DE 2024-06 / SK 2012 + A11',
    table: 'tab. 54.2 (zjednodušená metóda)',
    verified: true,
    sources: ['eigPe'],
    note: 'Prierez PE podľa fázového vodiča, rovnaký materiál: do 16 mm² rovnaký, 16–35 mm² 16 mm², nad 35 mm² polovica.',
    data: { rules: [{ upTo: 16, pe: 'S' }, { upTo: 35, pe: '16' }, { upTo: Infinity, pe: 'S/2' }] },
  },

  neutralSizing: {
    id: 'neutralSizing',
    title: 'vplyv 3. harmonickej na štvor- a päťžilový kábel',
    country: 'BOTH',
    standard: 'IEC 60364-5-52 / STN 33 2000-5-52',
    edition: 'IEC 2009 / SK 04/2012',
    table: 'tab. E.52.1',
    verified: true,
    sources: ['eigSizing'],
    note:
      'Pri LED, spínaných zdrojoch a meničoch tečie v N 3. harmonická. Nad 33 % je ' +
      'prúd v N väčší než vo fáze a kábel sa vyberá podľa N.',
    data: {
      thresholds: [
        { thdMax: 15, factor: 1.0, text: 'Kábel vyber podľa fázového prúdu, bez zníženia.' },
        { thdMax: 33, factor: 0.86, text: 'Kábel vyber podľa fázového prúdu, ale jeho únosnosť zníž na 0,86.' },
        { thdMax: 45, factor: 0.86, text: 'Kábel vyber podľa prúdu v N a jeho únosnosť zníž na 0,86. N sa nesmie zmenšovať.' },
        { thdMax: 100, factor: 1.0, text: 'Kábel vyber podľa prúdu v N (je väčší než fázový). N sa nesmie zmenšovať.' },
      ],
    },
  },

  /* ═══════════════════ 8. ÚBYTOK NAPÄTIA ═══════════════════ */
  voltageDropLimits: {
    id: 'voltageDropLimits',
    title: 'povolený úbytok napätia',
    country: 'BOTH',
    standard: 'DE: DIN 18015-1 · SK: STN 33 2000-5-52 príl. G (IEC tab. G.52.1)',
    edition: 'DE vydanie nedohľadané / SK 04/2012',
    table: 'povolený úbytok napätia [%]',
    verified: true,
    sources: ['abb', 'eigDrop'],
    note:
      'Nemecko: spolu najviac 3 % za elektromerom až po spotrebič (DIN 18015-1). ' +
      'Slovensko podľa IEC: 3 % svetelné obvody, 5 % ostatné, od začiatku inštalácie. ' +
      'Wallbox je silový obvod. Prevádzkovateľ siete alebo projekt môžu žiadať menej.',
    data: {
      DE: { lighting: 3, power: 3, wallbox: 3 },
      SK: { lighting: 3, power: 5, wallbox: 5 },
    },
  },

  voltageDropOther: {
    id: 'voltageDropOther',
    title: 'povolený úbytok pre motory a fotovoltiku',
    country: 'BOTH',
    standard: 'Zaužívané návrhové hodnoty — nie norma',
    edition: '—',
    table: 'povolený úbytok napätia [%]',
    verified: false,
    sources: [],
    note: 'Hodnoty pre chod a rozbeh motora a pre striedač FV sú zaužívané návrhové hodnoty, nie citát normy.',
    data: {
      DE: { motorRun: 5, motorStart: 10, pvAc: 1 },
      SK: { motorRun: 5, motorStart: 10, pvAc: 1 },
    },
  },

  /* ═══════════════════ 9. MOTORY ═══════════════════ */
  motorStart: {
    id: 'motorStart',
    title: 'rozbehový prúd motora',
    country: 'BOTH',
    standard: 'Typické rozsahy — nie norma',
    edition: '—',
    table: 'Ia/In podľa spôsobu rozbehu',
    verified: false,
    sources: [],
    note: 'Rozsahy, nie presné hodnoty. Vždy z typového štítku a datasheetu motora.',
    data: {
      direct: { multiple: 7, range: '6–8×In', sk: 'Priamy štart (DOL)', de: 'Direktstart' },
      stardelta: { multiple: 2.5, range: '2–3×In', sk: 'Hviezda-trojuholník', de: 'Stern-Dreieck' },
      softstart: { multiple: 3, range: '2–4×In (nastaviteľné)', sk: 'Softštart', de: 'Sanftanlauf' },
      vfd: { multiple: 1.1, range: '1–1,5×In', sk: 'Frekvenčný menič', de: 'Frequenzumrichter' },
    },
  },

  motorEfficiency: {
    id: 'motorEfficiency',
    title: 'odhad účinnosti motora',
    country: 'BOTH',
    standard: 'Orientačne trieda IE3 — nie norma',
    edition: '—',
    table: 'účinnosť podľa výkonu',
    verified: false,
    sources: [],
    note: 'Predvolená účinnosť, keď nie je na štítku. Vždy radšej zadaj zo štítku.',
    data: { 0.37: 0.7, 0.75: 0.79, 1.5: 0.825, 2.2: 0.845, 4: 0.875, 5.5: 0.885, 7.5: 0.9, 11: 0.91, 15: 0.915, 18.5: 0.92, 22: 0.925, 30: 0.93, 45: 0.94, 75: 0.95 },
  },

  motorCosPhi: {
    id: 'motorCosPhi',
    title: 'odhad cos φ motora',
    country: 'BOTH',
    standard: 'Orientačné hodnoty — nie norma',
    edition: '—',
    table: 'cos φ podľa výkonu',
    verified: false,
    sources: [],
    note: 'Predvolený cos φ asynchrónneho motora. Vždy radšej zo štítku.',
    data: { 0.37: 0.72, 0.75: 0.79, 1.5: 0.81, 2.2: 0.82, 4: 0.83, 5.5: 0.84, 7.5: 0.85, 11: 0.86, 15: 0.86, 18.5: 0.87, 22: 0.87, 30: 0.88, 45: 0.88, 75: 0.89 },
  },

  contactorAC3: {
    id: 'contactorAC3',
    title: 'veľkosť stýkača',
    country: 'BOTH',
    standard: 'IEC 60947-4-1, kategória AC-3 — orientačne',
    edition: '—',
    table: 'stýkač podľa výkonu pri 400 V',
    verified: false,
    sources: [],
    note:
      'Veľmi závisí od výrobcu a typu rady. Je to len orientácia na veľkosť — ' +
      'konkrétny typ vyber z katalógu podľa Ie v AC-3 pri 400 V.',
    data: { 4: 9, 5.5: 12, 7.5: 18, 11: 25, 15: 32, 18.5: 40, 22: 50, 30: 65, 37: 80, 45: 95, 55: 115, 75: 150 },
  },

  /* ═══════════════════ 10. FOTOVOLTIKA ═══════════════════ */
  pvDesign: {
    id: 'pvDesign',
    title: 'návrhové hodnoty pre fotovoltiku',
    country: 'BOTH',
    standard: 'IEC 62548 / VDE-AR-N 4105 — neoverené',
    edition: '—',
    table: 'návrhové parametre FV',
    verified: false,
    sources: [],
    note:
      'Teplotný súčiniteľ VŽDY z datasheetu panelu. Minimálna návrhová ' +
      'teplota je predpoklad, nie norma.',
    data: {
      minTemp: { DE: -10, SK: -15 },
      tempCoeffUoc: -0.003,
      tempCoeffRange: '−0,25 až −0,35 %/K',
      stcTemp: 25,
      iscSafetyFactor: 1.25,
      dcVoltageDropLimit: 1,
    },
  },

  /* ═══════════════════ 11. WALLBOXY ═══════════════════ */
  wallboxPower: {
    id: 'wallboxPower',
    title: 'výkonové stupne wallboxov',
    country: 'BOTH',
    standard: 'Prepočet výkonu na prúd',
    edition: '—',
    table: 'výkonové stupne a prúdy',
    verified: true,
    sources: ['spec'],
    note: 'Čistý prepočet: 16 A × 230 V = 3,7 kW, 32 A × 230 V = 7,4 kW, 3 × 16 A = 11 kW, 3 × 32 A = 22 kW.',
    data: {
      3.7: { phases: 1, current: 16, label: '3,7 kW — 1f/16 A' },
      7.4: { phases: 1, current: 32, label: '7,4 kW — 1f/32 A' },
      11: { phases: 3, current: 16, label: '11 kW — 3f/16 A' },
      22: { phases: 3, current: 32, label: '22 kW — 3f/32 A' },
    },
  },

  wallboxRulesDE: {
    id: 'wallboxRulesDE',
    title: 'hlásenie wallboxu v Nemecku',
    country: 'DE',
    standard: '§ 19 ods. 2 NAV · § 14a EnWG',
    edition: 'stav 11/2026',
    table: 'hlásenie, súhlas a riadenie',
    verified: true,
    sources: ['bnetza'],
    note: 'Podľa stránky Bundesnetzagentur. Podmienky konkrétneho prevádzkovateľa siete (TAB) sa môžu líšiť v detailoch.',
    data: {
      approvalAboveKva: 12,
      controllableAboveKw: 4.2,
      rcd: 'Chránič typ A (30 mA) spolu s ochranou proti hladkému jednosmernému prúdu 6 mA. Ak ju wallbox nemá zabudovanú, treba chránič typ B.',
      reporting: [
        'Wallbox ohlás prevádzkovateľovi siete ešte pred uvedením do prevádzky (§ 19 ods. 2 NAV).',
        'Nad 12 kVA (asi 11 kW) potrebuješ jeho súhlas. Musí sa vyjadriť do dvoch mesiacov.',
        'Wallbox nad 4,2 kW uvedený do prevádzky po 1. 1. 2024 spadá pod § 14a EnWG: treba dohodu o riadení zo strany siete a k tomu meranie a ovládanie.',
        'Sieť smie pri preťažení výkon znížiť, ale nie úplne vypnúť.',
        '11 kW wallbox stačí ohlásiť, 22 kW treba dať schváliť.',
      ],
      extra: 'Wallbox daj na samostatný obvod. Elektromobil sa nemá trvalo nabíjať z bežnej zásuvky.',
    },
  },

  wallboxRulesSK: {
    id: 'wallboxRulesSK',
    title: 'hlásenie wallboxu na Slovensku',
    country: 'SK',
    standard: 'STN 33 2000-7-722:2019 · podmienky distribútora',
    edition: 'neoverené',
    table: 'hlásenie a pripojenie',
    verified: false,
    sources: [],
    note: 'Podmienky slovenských distribútorov (ZSD, SSD, VSD) som nedohľadal. Over ich pred montážou.',
    data: {
      rcd: 'Chránič typ A (30 mA) spolu s ochranou proti hladkému jednosmernému prúdu 6 mA. Ak ju wallbox nemá zabudovanú, treba chránič typ B.',
      reporting: [
        'Pripojenie ohlás distribútorovi (ZSD / SSD / VSD) podľa jeho podmienok.',
        'Pri väčšom výkone môže byť potrebné navýšenie rezervovanej kapacity.',
        'Aktuálne technické podmienky si over priamo u distribútora.',
      ],
      extra: 'Wallbox daj na samostatný obvod.',
    },
  },
};

/* ═══════════════════ SMEROVANIE NA DATASETY ═══════════════════
 * Len výber, v ktorom datasete hodnota leží — žiadne výpočty.
 */

/** Poradie datasetov pre zaťažiteľnosť: prvý, ktorý hodnotu má, vyhráva. */
export const IZ_CHAIN = {
  PVC: { DE: ['izPvcDE', 'izPvcHD', 'izPvcRest'], SK: ['izPvcHD', 'izPvcRest'] },
  XLPE: { DE: ['izXlpe'], SK: ['izXlpe'] },
};

export const dsMagnetic = (device) => (device === 'D' ? 'breakerMagneticD' : 'breakerMagnetic');
export const dsI2 = (device) => (device === 'B' || device === 'C' ? 'breakerI2Factor' : 'breakerI2FactorOther');
export const dsDropLimit = (kind) => (['lighting', 'power', 'wallbox'].includes(kind) ? 'voltageDropLimits' : 'voltageDropOther');
export const dsDisconnectTime = (family) => (family === 'IT' ? 'faultLoopIT' : 'faultLoop');
export const dsGrouping = (type) => (type === 'buriedDucts' ? 'derateGroupingDucts' : 'derateGrouping');
export const dsWallboxRules = (country) => (country === 'SK' ? 'wallboxRulesSK' : 'wallboxRulesDE');

/* ═══════════════════ VYHĽADÁVANIE V DÁTACH ═══════════════════ */

/**
 * Referencia na použitú hodnotu — putuje do výsledku výpočtu.
 */
export function refOf(dataset, path = '') {
  return {
    datasetId: dataset.id,
    title: dataset.title || dataset.id,
    standard: dataset.standard,
    edition: dataset.edition,
    table: dataset.table,
    country: dataset.country,
    verified: dataset.verified,
    sources: (dataset.sources || []).map((k) => SOURCES[k]).filter(Boolean),
    note: dataset.note,
    path,
  };
}

/**
 * Prístup k dátam s overlay-om používateľských úprav.
 * Overlay má tvar { 'datasetId.cesta.k.hodnote': číslo, 'datasetId.__verified': true }
 */
export function createLookup(overrides = {}) {
  const verifiedOverride = (id) => overrides[`${id}.__verified`];

  function dataset(id) {
    const base = DATASETS[id];
    if (!base) throw new Error(`Neznámy dataset: ${id}`);
    const vo = verifiedOverride(id);
    return vo === undefined ? base : { ...base, verified: !!vo };
  }

  function get(id, path = []) {
    const ds = dataset(id);
    const key = [id, ...path].join('.');
    const ref = refOf(ds, path.join('.'));
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      return { value: overrides[key], ref: { ...ref, overridden: true }, missing: false };
    }
    let cur = ds.data;
    for (const p of path) {
      if (cur == null || typeof cur !== 'object' || !(p in cur)) {
        return { value: undefined, ref, missing: true };
      }
      cur = cur[p];
    }
    if (cur === undefined) return { value: undefined, ref, missing: true };
    return { value: cur, ref, missing: false };
  }

  return { get, dataset, overrides };
}

/** Lookup bez používateľských úprav — používajú testy. */
export const plainLookup = createLookup({});
