/**
 * NORMOVÉ DÁTA — jediný zdroj tabuľkových hodnôt.
 *
 * Tento súbor neobsahuje žiadne výpočty. Výpočtové moduly si hodnoty vyžiadajú
 * cez lookup() a dostanú spolu s hodnotou aj referenciu (krajina, norma,
 * vydanie, tabuľka, stav overenia), ktorá putuje až do výsledku.
 *
 * ⚠ DÔLEŽITÉ: verified:false znamená "túto hodnotu som nemal z overiteľného
 * zdroja". Je to osnova na kontrolu, NIE citát normy. Výsledok, ktorý sa opiera
 * o takúto hodnotu, nikdy nebude zelený.
 */

export const DATA_VERSION = '2026.11.08';

/* ───────────────────────── rady a konštanty ───────────────────────── */

/** Normalizovaný rad prierezov [mm²] */
export const CROSS_SECTIONS = [
  1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300,
];

export const DATASETS = {
  /* ═══════════════════ 1. VODIVOSŤ ═══════════════════ */
  conductivity: {
    id: 'conductivity',
    country: 'BOTH',
    standard: 'Zadanie / fyzikálna konštanta',
    edition: '—',
    table: 'κ pri ~20 °C',
    verified: true,
    note:
      'κCu = 56, κAl = 35 m/(Ω·mm²) podľa zadania. Je to hodnota pri ~20 °C. ' +
      'Pri prevádzkovej teplote vodiča (70/90 °C) je vodivosť nižšia a reálny ' +
      'úbytok napätia väčší (cca +15 až +20 %). Označené ako overené preto, že ' +
      'je to matematický vstup podľa zadania, nie tvrdenie o norme.',
    data: { Cu: 56, Al: 35 },
  },

  /** Reaktancia vodiča — default 0 podľa kontrolných hodnôt v zadaní. */
  reactance: {
    id: 'reactance',
    country: 'BOTH',
    standard: 'Neoverené — orientačné hodnoty',
    edition: '—',
    table: 'X′ [Ω/m]',
    verified: false,
    note:
      'Default X′ = 0 podľa kontrolných príkladov v zadaní. Reálne 0,07–0,09 ' +
      'mΩ/m. Pri S ≥ 50 mm² reaktanciu nezanedbávaj — zadaj ju ručne.',
    data: { default: 0, typical: 0.00008 },
  },

  /* ═══════════════════ 2. PRÚDOVÁ ZAŤAŽITEĽNOSŤ Iz ═══════════════════
   * Kľúč: metoda → materiál → počet zaťažených žíl → { prierez: A }
   * Referenčná teplota: vzduch 30 °C, zem 20 °C.
   */
  ampacityPvc: {
    id: 'ampacityPvc',
    country: 'BOTH',
    standard: 'IEC 60364-5-52 / DIN VDE 0298-4 / STN 33 2000-5-52',
    edition: 'NEOVERENÉ VYDANIE',
    table: 'predpokl. B.52.2–B.52.5 (PVC 70 °C)',
    verified: false,
    note:
      'Iz pre PVC izoláciu (70 °C), vzduch 30 °C / zem 20 °C. Tabuľky sa medzi ' +
      'IEC a VDE vydaniami líšia. SKONTROLUJ CELÚ TABUĽKU proti platnej norme.',
    data: {
      A1: {
        Cu: {
          2: { 1.5: 14.5, 2.5: 19.5, 4: 26, 6: 34, 10: 46, 16: 61, 25: 80, 35: 99, 50: 119, 70: 151, 95: 182, 120: 210, 150: 240, 185: 273, 240: 321, 300: 367 },
          3: { 1.5: 13.5, 2.5: 18, 4: 24, 6: 31, 10: 42, 16: 56, 25: 73, 35: 89, 50: 108, 70: 136, 95: 164, 120: 188, 150: 216, 185: 245, 240: 286, 300: 328 },
        },
        Al: {
          2: { 16: 47, 25: 61, 35: 75, 50: 91, 70: 116, 95: 139, 120: 160, 150: 183, 185: 208, 240: 245, 300: 280 },
          3: { 16: 43, 25: 57, 35: 70, 50: 84, 70: 107, 95: 129, 120: 149, 150: 170, 185: 194, 240: 227, 300: 261 },
        },
      },
      A2: {
        Cu: {
          2: { 1.5: 14, 2.5: 18.5, 4: 25, 6: 32, 10: 43, 16: 57, 25: 75, 35: 92, 50: 110, 70: 139, 95: 167, 120: 192, 150: 219, 185: 248, 240: 291, 300: 334 },
          3: { 1.5: 13, 2.5: 17.5, 4: 23, 6: 29, 10: 39, 16: 52, 25: 68, 35: 83, 50: 99, 70: 125, 95: 150, 120: 172, 150: 196, 185: 223, 240: 261, 300: 298 },
        },
        Al: {
          2: { 16: 44, 25: 58, 35: 71, 50: 86, 70: 108, 95: 130, 120: 150, 150: 172, 185: 195, 240: 229, 300: 263 },
          3: { 16: 41, 25: 53, 35: 65, 50: 78, 70: 98, 95: 118, 120: 135, 150: 155, 185: 176, 240: 207, 300: 237 },
        },
      },
      B1: {
        Cu: {
          2: { 1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 101, 35: 125, 50: 151, 70: 192, 95: 232, 120: 269, 150: 300, 185: 341, 240: 400, 300: 458 },
          3: { 1.5: 15.5, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 110, 50: 134, 70: 171, 95: 207, 120: 239, 150: 262, 185: 296, 240: 346, 300: 394 },
        },
        Al: {
          2: { 16: 59, 25: 78, 35: 97, 50: 118, 70: 150, 95: 181, 120: 210, 150: 234, 185: 266, 240: 312, 300: 358 },
          3: { 16: 53, 25: 70, 35: 86, 50: 104, 70: 133, 95: 161, 120: 186, 150: 204, 185: 230, 240: 269, 300: 306 },
        },
      },
      B2: {
        Cu: {
          2: { 1.5: 16.5, 2.5: 23, 4: 30, 6: 38, 10: 52, 16: 69, 25: 90, 35: 111, 50: 133, 70: 168, 95: 201, 120: 232, 150: 258, 185: 294, 240: 344, 300: 394 },
          3: { 1.5: 15, 2.5: 20, 4: 27, 6: 34, 10: 46, 16: 62, 25: 80, 35: 99, 50: 118, 70: 149, 95: 179, 120: 206, 150: 225, 185: 255, 240: 297, 300: 339 },
        },
        Al: {
          2: { 16: 54, 25: 71, 35: 86, 50: 104, 70: 131, 95: 157, 120: 181, 150: 201, 185: 230, 240: 269, 300: 308 },
          3: { 16: 48, 25: 62, 35: 77, 50: 92, 70: 116, 95: 139, 120: 160, 150: 176, 185: 199, 240: 232, 300: 265 },
        },
      },
      C: {
        Cu: {
          2: { 1.5: 19.5, 2.5: 27, 4: 36, 6: 46, 10: 63, 16: 85, 25: 112, 35: 138, 50: 168, 70: 213, 95: 258, 120: 299, 150: 344, 185: 392, 240: 461, 300: 530 },
          3: { 1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 96, 35: 119, 50: 144, 70: 184, 95: 223, 120: 259, 150: 299, 185: 341, 240: 403, 300: 464 },
        },
        Al: {
          2: { 16: 66, 25: 83, 35: 103, 50: 125, 70: 160, 95: 195, 120: 226, 150: 261, 185: 298, 240: 352, 300: 406 },
          3: { 16: 59, 25: 73, 35: 90, 50: 110, 70: 140, 95: 170, 120: 197, 150: 227, 185: 259, 240: 305, 300: 351 },
        },
      },
      D1: {
        Cu: {
          2: { 1.5: 22, 2.5: 29, 4: 38, 6: 47, 10: 63, 16: 81, 25: 104, 35: 125, 50: 148, 70: 183, 95: 216, 120: 246, 150: 278, 185: 312, 240: 361, 300: 408 },
          3: { 1.5: 18, 2.5: 24, 4: 30, 6: 38, 10: 50, 16: 64, 25: 82, 35: 98, 50: 116, 70: 143, 95: 169, 120: 192, 150: 217, 185: 243, 240: 280, 300: 316 },
        },
        Al: {
          2: { 16: 63, 25: 82, 35: 98, 50: 117, 70: 145, 95: 173, 120: 200, 150: 224, 185: 255, 240: 298, 300: 336 },
          3: { 16: 50, 25: 64, 35: 77, 50: 91, 70: 112, 95: 132, 120: 150, 150: 169, 185: 190, 240: 218, 300: 247 },
        },
      },
      D2: {
        Cu: {
          2: { 1.5: 27, 2.5: 35, 4: 46, 6: 58, 10: 77, 16: 100, 25: 129, 35: 155, 50: 183, 70: 225, 95: 270, 120: 306, 150: 343, 185: 387, 240: 448, 300: 502 },
          3: { 1.5: 22, 2.5: 29, 4: 38, 6: 47, 10: 63, 16: 81, 25: 104, 35: 125, 50: 148, 70: 183, 95: 216, 120: 246, 150: 278, 185: 312, 240: 361, 300: 408 },
        },
        Al: {
          2: { 16: 78, 25: 100, 35: 120, 50: 141, 70: 174, 95: 208, 120: 236, 150: 264, 185: 298, 240: 344, 300: 386 },
          3: { 16: 63, 25: 81, 35: 97, 50: 114, 70: 141, 95: 167, 120: 190, 150: 214, 185: 240, 240: 277, 300: 313 },
        },
      },
      E: {
        Cu: {
          2: { 1.5: 22, 2.5: 30, 4: 40, 6: 51, 10: 70, 16: 94, 25: 119, 35: 148, 50: 180, 70: 232, 95: 282, 120: 328, 150: 379, 185: 434, 240: 514, 300: 593 },
          3: { 1.5: 18.5, 2.5: 25, 4: 34, 6: 43, 10: 60, 16: 80, 25: 101, 35: 126, 50: 153, 70: 196, 95: 238, 120: 276, 150: 319, 185: 364, 240: 430, 300: 497 },
        },
        Al: {
          2: { 16: 73, 25: 89, 35: 111, 50: 135, 70: 173, 95: 210, 120: 244, 150: 282, 185: 322, 240: 380, 300: 439 },
          3: { 16: 61, 25: 78, 35: 96, 50: 117, 70: 150, 95: 183, 120: 212, 150: 245, 185: 280, 240: 330, 300: 381 },
        },
      },
      F: {
        Cu: {
          3: { 25: 131, 35: 162, 50: 196, 70: 251, 95: 304, 120: 352, 150: 406, 185: 463, 240: 546, 300: 629 },
        },
        Al: {
          3: { 25: 98, 35: 122, 50: 149, 70: 192, 95: 235, 120: 273, 150: 316, 185: 363, 240: 430, 300: 497 },
        },
      },
    },
  },

  ampacityXlpe: {
    id: 'ampacityXlpe',
    country: 'BOTH',
    standard: 'IEC 60364-5-52 / DIN VDE 0298-4',
    edition: 'NEOVERENÉ VYDANIE',
    table: 'predpokl. B.52.6–B.52.9 (XLPE 90 °C)',
    verified: false,
    note:
      'Iz pre XLPE / sieťovaný PE (90 °C). Chýbajúce kombinácie sú vedome ' +
      'prázdne — aplikácia povie "chýba tabuľková hodnota" namiesto odhadu. ' +
      'SKONTROLUJ CELÚ TABUĽKU.',
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
      D2: {
        Cu: {
          2: { 1.5: 33, 2.5: 43, 4: 56, 6: 70, 10: 92, 16: 120, 25: 154, 35: 184, 50: 217, 70: 267, 95: 320, 120: 364, 150: 410, 185: 463, 240: 538, 300: 604 },
          3: { 1.5: 27, 2.5: 35, 4: 46, 6: 58, 10: 77, 16: 100, 25: 129, 35: 155, 50: 183, 70: 225, 95: 270, 120: 306, 150: 343, 185: 387, 240: 448, 300: 502 },
        },
        Al: {
          2: { 16: 92, 25: 118, 35: 142, 50: 168, 70: 207, 95: 247, 120: 281, 150: 316, 185: 358, 240: 415, 300: 466 },
          3: { 16: 78, 25: 100, 35: 120, 50: 141, 70: 174, 95: 208, 120: 236, 150: 264, 185: 298, 240: 344, 300: 386 },
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
          3: { 25: 161, 35: 200, 50: 242, 70: 310, 95: 377, 120: 437, 150: 504, 185: 575, 240: 679, 300: 783 },
        },
        Al: {
          3: { 25: 121, 35: 150, 50: 184, 70: 237, 95: 289, 120: 337, 150: 389, 185: 447, 240: 530, 300: 613 },
        },
      },
      /* A1, A2, D1 pre XLPE vedome prázdne — nemám ich z overiteľného zdroja. */
      A1: { Cu: {}, Al: {} },
      A2: { Cu: {}, Al: {} },
      D1: { Cu: {}, Al: {} },
    },
  },

  /* ═══════════════════ 3. KOREKČNÉ SÚČINITELE ═══════════════════ */
  derateAmbientAir: {
    id: 'derateAmbientAir',
    country: 'BOTH',
    standard: 'IEC 60364-5-52',
    edition: 'NEOVERENÉ',
    table: 'predpokl. B.52.14 (vzduch, ref. 30 °C)',
    verified: false,
    note: 'Prepočet na teplotu okolitého vzduchu. Referencia 30 °C.',
    data: {
      PVC: { 10: 1.22, 15: 1.17, 20: 1.12, 25: 1.06, 30: 1.0, 35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71, 55: 0.61, 60: 0.5 },
      XLPE: { 10: 1.15, 15: 1.12, 20: 1.08, 25: 1.04, 30: 1.0, 35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82, 55: 0.76, 60: 0.71, 65: 0.65, 70: 0.58, 75: 0.5, 80: 0.41 },
    },
  },

  derateAmbientGround: {
    id: 'derateAmbientGround',
    country: 'BOTH',
    standard: 'IEC 60364-5-52',
    edition: 'NEOVERENÉ',
    table: 'predpokl. B.52.15 (zem, ref. 20 °C)',
    verified: false,
    note: 'Prepočet na teplotu zeme. Referencia 20 °C. Platí pre D1, D2.',
    data: {
      PVC: { 10: 1.1, 15: 1.05, 20: 1.0, 25: 0.95, 30: 0.89, 35: 0.84, 40: 0.77, 45: 0.71, 50: 0.63, 55: 0.55, 60: 0.45 },
      XLPE: { 10: 1.07, 15: 1.04, 20: 1.0, 25: 0.96, 30: 0.93, 35: 0.89, 40: 0.85, 45: 0.8, 50: 0.76, 55: 0.71, 60: 0.65, 65: 0.6, 70: 0.53, 75: 0.46, 80: 0.38 },
    },
  },

  derateGrouping: {
    id: 'derateGrouping',
    country: 'BOTH',
    standard: 'IEC 60364-5-52',
    edition: 'NEOVERENÉ',
    table: 'predpokl. B.52.17 / B.52.18 / B.52.19',
    verified: false,
    note:
      'Zoskupenie súbežných obvodov. "bunched" = v trubke/lište/zviazané, ' +
      '"singleLayer" = jedna vrstva na stene alebo rošte, "buried" = v zemi.',
    data: {
      bunched: { 1: 1.0, 2: 0.8, 3: 0.7, 4: 0.65, 5: 0.6, 6: 0.57, 7: 0.54, 8: 0.52, 9: 0.5, 10: 0.5, 12: 0.45, 14: 0.43, 16: 0.41, 18: 0.39, 20: 0.38 },
      singleLayer: { 1: 1.0, 2: 0.85, 3: 0.79, 4: 0.75, 5: 0.73, 6: 0.72, 7: 0.72, 8: 0.71, 9: 0.7, 10: 0.7, 12: 0.7, 16: 0.7, 20: 0.7 },
      buried: { 1: 1.0, 2: 0.75, 3: 0.65, 4: 0.6, 5: 0.55, 6: 0.5, 7: 0.47, 8: 0.45, 9: 0.43, 10: 0.41 },
    },
  },

  /** Ktorý typ zoskupenia patrí ku ktorému spôsobu uloženia. */
  groupingByMethod: {
    id: 'groupingByMethod',
    country: 'BOTH',
    standard: 'Odvodené z IEC 60364-5-52',
    edition: 'NEOVERENÉ',
    table: '—',
    verified: false,
    note: 'Priradenie typu zoskupenia k spôsobu uloženia. Inženierska konvencia.',
    data: { A1: 'bunched', A2: 'bunched', B1: 'bunched', B2: 'bunched', C: 'singleLayer', D1: 'buried', D2: 'buried', E: 'singleLayer', F: 'singleLayer' },
  },

  /* ═══════════════════ 4. SPÔSOBY ULOŽENIA (popis) ═══════════════════ */
  installMethods: {
    id: 'installMethods',
    country: 'BOTH',
    standard: 'IEC 60364-5-52 tab. A.52.3',
    edition: 'NEOVERENÉ',
    table: 'popisy spôsobov uloženia',
    verified: false,
    note: 'Popisy sú zjednodušené pre prácu na stavbe, nie presné citácie.',
    data: {
      A1: { sk: 'Jednotlivé vodiče v trubke v tepelne izolovanej stene', de: 'Einzelne Adern im Rohr in wärmegedämmter Wand', hint: 'Najhoršie chladenie. Trubka v sadrokartóne s vatou.' },
      A2: { sk: 'Viacžilový kábel v trubke v tepelne izolovanej stene', de: 'Mehradriges Kabel im Rohr in wärmegedämmter Wand', hint: 'Celý kábel v trubke v izolovanej stene.' },
      B1: { sk: 'Jednotlivé vodiče v trubke na stene / v lište', de: 'Einzelne Adern im Rohr auf der Wand', hint: 'Klasická trubka v murive alebo na povrchu. H07V-K.' },
      B2: { sk: 'Viacžilový kábel v trubke na stene / v lište', de: 'Mehradriges Kabel im Rohr auf der Wand', hint: 'NYM v chráničke pod omietkou — najčastejší prípad v byte.' },
      C: { sk: 'Kábel priamo na stene, strope alebo v plnom rošte', de: 'Kabel direkt auf der Wand / Decke', hint: 'NYM/CYKY priskrutkovaný na povrch. Dobré chladenie.' },
      D1: { sk: 'Kábel v chráničke v zemi', de: 'Kabel im Rohr in der Erde', hint: 'Zemný kábel v KOPOFLEX chráničke.' },
      D2: { sk: 'Kábel priamo v zemi', de: 'Kabel direkt in der Erde', hint: 'NYY/CYKY uložený do pieskového lôžka.' },
      E: { sk: 'Viacžilový kábel voľne vo vzduchu / dierovaný rošt', de: 'Mehradriges Kabel frei in Luft / Lochkanal', hint: 'Na dierovanom rošte, vzduch zo všetkých strán.' },
      F: { sk: 'Jednožilové káble voľne vo vzduchu, dotýkajúce sa', de: 'Einadrige Kabel frei in Luft, sich berührend', hint: 'Veľké prierezy, prívody do rozvádzačov.' },
    },
  },

  /* ═══════════════════ 5. ISTENIE ═══════════════════ */
  breakerRatings: {
    id: 'breakerRatings',
    country: 'BOTH',
    standard: 'IEC 60898-1 / IEC 60269',
    edition: 'NEOVERENÉ',
    table: 'menovité rady',
    verified: false,
    note: 'Bežne dostupné menovité hodnoty. Neoverené proti norme.',
    data: {
      mcb: [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125],
      gG: [2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400],
      nh: [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630],
    },
  },

  breakerMagnetic: {
    id: 'breakerMagnetic',
    country: 'BOTH',
    standard: 'IEC 60898-1',
    edition: 'NEOVERENÉ',
    table: 'pásmo okamžitého vypnutia',
    verified: false,
    note:
      'Používam HORNÚ hranicu pásma (bezpečnejšie pre overenie odpojenia): ' +
      'B = 5×In (pásmo 3–5), C = 10×In (5–10), D = 20×In (10–20). ' +
      'Konkrétny istič sa môže líšiť — over v katalógu výrobcu.',
    data: {
      B: { multiple: 5, range: '3–5×In' },
      C: { multiple: 10, range: '5–10×In' },
      D: { multiple: 20, range: '10–20×In' },
    },
  },

  breakerI2Factor: {
    id: 'breakerI2Factor',
    country: 'BOTH',
    standard: 'IEC 60898-1 / IEC 60269-1',
    edition: 'NEOVERENÉ',
    table: 'konvenčný vypínací prúd I2',
    verified: false,
    note:
      'I2/In. Istič 1,45 → podmienka I2 ≤ 1,45·Iz je splnená automaticky, keď ' +
      'In ≤ Iz. Poistka gG 1,6 → vyžaduje In ≤ 0,906·Iz.',
    data: { B: 1.45, C: 1.45, D: 1.45, gG: 1.6, nh: 1.6, motor: 1.45 },
  },

  fuseDisconnectCurrent: {
    id: 'fuseDisconnectCurrent',
    country: 'BOTH',
    standard: 'NEOVERENÉ — odhad z typických charakteristík',
    edition: '—',
    table: 'prúd pre odpojenie v 0,4 s a 5 s [A]',
    verified: false,
    note:
      '⚠ NAJMENEJ SPOĽAHLIVÁ TABUĽKA V APLIKÁCII. Nie je to opis konkrétneho ' +
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
    country: 'BOTH',
    standard: 'IEC 62423 / DIN VDE 0664',
    edition: 'NEOVERENÉ',
    table: 'typy RCD',
    verified: false,
    note: 'Prehľad typov RCD a kde sa používajú. Orientačné.',
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
    country: 'BOTH',
    standard: 'IEC 60364-4-43',
    edition: 'NEOVERENÉ',
    table: 'predpokl. tab. 43A (súčiniteľ k)',
    verified: false,
    note:
      'Súčiniteľ k pre k²·S² ≥ I²·t. Platí pre vodiče, ktoré sa pri skrate ' +
      'ohrejú z prevádzkovej na dovolenú teplotu.',
    data: {
      Cu: { PVC: 115, XLPE: 143, rubber: 141, PVC_over300: 103 },
      Al: { PVC: 76, XLPE: 94, rubber: 93 },
    },
  },

  faultLoop: {
    id: 'faultLoop',
    country: 'BOTH',
    standard: 'IEC 60364-4-41 / DIN VDE 0100-410',
    edition: 'NEOVERENÉ',
    table: 'súčiniteľ c a časy odpojenia',
    verified: false,
    note:
      'Súčiniteľ c = 0,95 (pokles napätia pri poruche). Niektoré podklady ' +
      'používajú 0,8 pri overovaní meraním, iné 1,0 pri dimenzovaní. ' +
      'Rozdiel VDE / STN tu nezjednocujem — hodnotu si nastav podľa toho, ' +
      'čo používa tvoj projektant alebo revízny technik.',
    data: {
      cFactor: 0.95,
      /** Max. čas odpojenia [s]: typ siete → typ obvodu */
      maxTime: {
        'TN': { final32: 0.4, distribution: 5 },
        'TT': { final32: 0.2, distribution: 1 },
        'IT': { final32: 0.4, distribution: 5 },
      },
      /** Default čas pri magnetickom vypnutí ističa [s] — inženierska konvencia */
      instantTripTime: 0.1,
    },
  },

  netTypes: {
    id: 'netTypes',
    country: 'BOTH',
    standard: 'IEC 60364-1',
    edition: 'NEOVERENÉ',
    table: 'typy sietí',
    verified: false,
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
    country: 'BOTH',
    standard: 'IEC 60364-5-52 / DIN VDE 0100-520 / STN 33 2000-5-52',
    edition: 'NEOVERENÉ',
    table: 'minimálne prierezy',
    verified: false,
    note:
      'Minimálne prierezy pre pevné uloženie. Obmedzenia Al sa medzi DE a SK ' +
      'LÍŠIA a navyše závisia od prevádzkovateľa siete. Aplikácia ich ' +
      'nezjednocuje — pri Al vždy vypíše upozornenie.',
    data: {
      DE: { powerCu: 1.5, lightingCu: 1.5, minAl: 16, alNote: 'V Nemecku sa Al v bytových rozvodoch bežne nepoužíva. Pre prívody sa používa NAYY od 16 mm². Svorky musia byť schválené pre Al (Al/Cu), s uťahovacím momentom od výrobcu.' },
      SK: { powerCu: 1.5, lightingCu: 1.5, minAl: 16, alNote: 'Na Slovensku je AYKY pre prívody bežné. Minimálny prierez Al a podmienky použitia si over v STN 33 2000-5-52 a u distribútora.' },
    },
  },

  peSizing: {
    id: 'peSizing',
    country: 'BOTH',
    standard: 'IEC 60364-5-54',
    edition: 'NEOVERENÉ',
    table: 'predpokl. tab. 54.2',
    verified: false,
    note: 'Prierez PE podľa fázového vodiča, rovnaký materiál.',
    data: { rules: [{ upTo: 16, pe: 'S' }, { upTo: 35, pe: '16' }, { upTo: Infinity, pe: 'S/2' }] },
  },

  neutralSizing: {
    id: 'neutralSizing',
    country: 'BOTH',
    standard: 'IEC 60364-5-52 / DIN VDE 0100-520',
    edition: 'NEOVERENÉ',
    table: 'prierez N a harmonické',
    verified: false,
    note:
      'Pri 3f obvodoch s vysokým podielom 3. harmonickej (LED, spínané zdroje, ' +
      'meniče) môže byť prúd v N väčší ako vo fáze.',
    data: {
      thresholds: [
        { thdMax: 15, factor: 1.0, text: 'N môže mať rovnaký prierez ako fáza, pri S > 16 mm² sa môže zmenšiť.' },
        { thdMax: 33, factor: 1.0, text: 'N musí mať rovnaký prierez ako fáza a nesmie sa zmenšovať.' },
        { thdMax: 45, factor: 1.15, text: 'Kábel dimenzuj na prúd v N (cca 1,15× fázový). Zníž Iz.' },
        { thdMax: 100, factor: 1.45, text: 'Kábel dimenzuj na prúd v N (až 1,45× fázový). Zváž samostatný N.' },
      ],
    },
  },

  /* ═══════════════════ 8. ÚBYTOK NAPÄTIA ═══════════════════ */
  voltageDropLimits: {
    id: 'voltageDropLimits',
    country: 'BOTH',
    standard: 'DIN 18015-1 + TAB (DE) / STN 33 2000-5-52 príl. G (SK)',
    edition: 'NEOVERENÉ',
    table: 'povolený úbytok napätia [%]',
    verified: false,
    note:
      'V Nemecku si limit často určuje prevádzkovateľ siete v TAB — over ho ' +
      'u konkrétneho VNB. Hodnoty sú v nastaveniach editovateľné.',
    data: {
      DE: { lighting: 3, power: 3, motorRun: 5, motorStart: 10, pvAc: 1, pvDc: 1, wallbox: 3, fromMeter: 3, note: 'DIN 18015-1: 3 % od meracieho miesta k spotrebiču. Pred meraním si limit určuje VNB (často 0,5 %).' },
      SK: { lighting: 3, power: 5, motorRun: 5, motorStart: 10, pvAc: 1, pvDc: 1, wallbox: 5, fromMeter: 4, note: 'STN 33 2000-5-52 príl. G: 3 % svetelné, 5 % ostatné, od začiatku inštalácie.' },
    },
  },

  /* ═══════════════════ 9. MOTORY ═══════════════════ */
  motorStart: {
    id: 'motorStart',
    country: 'BOTH',
    standard: 'NEOVERENÉ — typické rozsahy',
    edition: '—',
    table: 'Ia/In podľa spôsobu rozbehu',
    verified: false,
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
    country: 'BOTH',
    standard: 'NEOVERENÉ — orientačne IE3',
    edition: '—',
    table: 'účinnosť podľa výkonu',
    verified: false,
    note: 'Predvolená účinnosť, keď nie je na štítku. Vždy radšej zadaj zo štítku.',
    data: { 0.37: 0.7, 0.75: 0.79, 1.5: 0.825, 2.2: 0.845, 4: 0.875, 5.5: 0.885, 7.5: 0.9, 11: 0.91, 15: 0.915, 18.5: 0.92, 22: 0.925, 30: 0.93, 45: 0.94, 75: 0.95 },
  },

  motorCosPhi: {
    id: 'motorCosPhi',
    country: 'BOTH',
    standard: 'NEOVERENÉ — orientačne',
    edition: '—',
    table: 'cos φ podľa výkonu',
    verified: false,
    note: 'Predvolený cos φ asynchrónneho motora. Vždy radšej zo štítku.',
    data: { 0.37: 0.72, 0.75: 0.79, 1.5: 0.81, 2.2: 0.82, 4: 0.83, 5.5: 0.84, 7.5: 0.85, 11: 0.86, 15: 0.86, 18.5: 0.87, 22: 0.87, 30: 0.88, 45: 0.88, 75: 0.89 },
  },

  contactorAC3: {
    id: 'contactorAC3',
    country: 'BOTH',
    standard: 'NEOVERENÉ — IEC 60947-4-1 AC-3, orientačne',
    edition: '—',
    table: 'stýkač podľa výkonu pri 400 V',
    verified: false,
    note:
      'Veľmi závisí od výrobcu a typu rady. Je to len orientácia na veľkosť — ' +
      'konkrétny typ vyber z katalógu podľa Ie v AC-3 pri 400 V.',
    data: { 4: 9, 5.5: 12, 7.5: 18, 11: 25, 15: 32, 18.5: 40, 22: 50, 30: 65, 37: 80, 45: 95, 55: 115, 75: 150 },
  },

  /* ═══════════════════ 10. FOTOVOLTIKA ═══════════════════ */
  pvDesign: {
    id: 'pvDesign',
    country: 'BOTH',
    standard: 'IEC 62548 / VDE-AR-N 4105 / NEOVERENÉ',
    edition: '—',
    table: 'návrhové parametre FV',
    verified: false,
    note:
      'Teplotný súčiniteľ VŽDY z datasheetu panelu. Minimálna návrhová ' +
      'teplota je predpoklad, nie norma.',
    data: {
      minTemp: { DE: -10, SK: -15 },
      tempCoeffUoc: -0.003, // −0,30 %/K, typické kremíkové panely
      tempCoeffRange: '−0,25 až −0,35 %/K',
      stcTemp: 25,
      iscSafetyFactor: 1.25,
      dcVoltageDropLimit: 1,
    },
  },

  /* ═══════════════════ 11. WALLBOXY ═══════════════════ */
  wallboxPower: {
    id: 'wallboxPower',
    country: 'BOTH',
    standard: 'NEOVERENÉ',
    edition: '—',
    table: 'výkonové stupne a prúdy',
    verified: false,
    note: 'Prúd je menovitý trvalý prúd nabíjania. Istenie sa dimenzuje na trvalú záťaž.',
    data: {
      3.7: { phases: 1, current: 16, label: '3,7 kW — 1f/16 A' },
      7.4: { phases: 1, current: 32, label: '7,4 kW — 1f/32 A' },
      11: { phases: 3, current: 16, label: '11 kW — 3f/16 A' },
      22: { phases: 3, current: 32, label: '22 kW — 3f/32 A' },
    },
  },

  wallboxRules: {
    id: 'wallboxRules',
    country: 'BOTH',
    standard: 'NEOVERENÉ — stav k 2026-11, mení sa najčastejšie',
    edition: '—',
    table: 'ochrana a ohlasovacie povinnosti',
    verified: false,
    note:
      '⚠ Ohlasovacie povinnosti a limity sa menia často a závisia od ' +
      'prevádzkovateľa siete. Texty sú orientačné a datované. Vždy si over ' +
      'aktuálne TAB / podmienky distribútora pred montážou.',
    data: {
      DE: {
        rcd: 'RCD typ A pre obvod + ochrana proti hladkému DC poruchovému prúdu 6 mA. Ak ju wallbox nemá zabudovanú (RDC-DD), treba RCD typ B.',
        reporting: [
          'Každý nabíjací bod ohlás prevádzkovateľovi siete (VNB) — §19 NAV.',
          'Nad 12 kW nabíjací výkon je potrebné SCHVÁLENIE VNB, nielen ohlásenie.',
          '11 kW wallbox sa preto bežne volí namiesto 22 kW — ohlásenie stačí.',
          '22 kW sa často schváli len s obmedzením výkonu alebo riadením.',
          'Over aktuálne pravidlá u konkrétneho VNB — líšia sa.',
        ],
        extra: 'Pre nabíjanie v DE sa odporúča samostatný obvod, bez zásuviek. Prepäťová ochrana podľa inštalácie.',
      },
      SK: {
        rcd: 'RCD typ A + ochrana proti hladkému DC 6 mA (v wallboxe), inak RCD typ B.',
        reporting: [
          'Ohlás pripojenie distribútorovi (ZSD / SSD / VSD) podľa ich podmienok.',
          'Pri väčšom výkone môže byť potrebné navýšenie maximálnej rezervovanej kapacity.',
          'Over aktuálne technické podmienky distribútora pre tvoju oblasť.',
        ],
        extra: 'Samostatný obvod, prepäťová ochrana podľa inštalácie.',
      },
    },
  },
};

/* ═══════════════════ VYHĽADÁVANIE V DÁTACH ═══════════════════ */

/**
 * Referencia na použitú hodnotu — putuje do výsledku výpočtu.
 * @typedef {{datasetId:string, standard:string, edition:string, table:string,
 *            country:string, verified:boolean, note:string, path:string}} DataRef
 */

/** @returns {DataRef} */
export function refOf(dataset, path = '') {
  return {
    datasetId: dataset.id,
    standard: dataset.standard,
    edition: dataset.edition,
    table: dataset.table,
    country: dataset.country,
    verified: dataset.verified,
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

  /**
   * @param {string} id dataset
   * @param {Array<string|number>} path cesta v data
   * @returns {{value:any, ref:DataRef, missing:boolean}}
   */
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
